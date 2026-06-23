const express = require('express');
const { body, validationResult } = require('express-validator');
const { Classroom, Division, Student, StudentSnapshot } = require('../models');
const auth = require('../middleware/auth');
const { loadClassroom, ensureClassroomAccess } = require('../middleware/classroomAccess');
const { parseLeetCodeUsername, slugify } = require('../utils/slugify');
const { syncStudent } = require('../services/sync.service');
const { fetchUserData } = require('../services/leetcode.service');

const router = express.Router();
router.use(auth);

const ensureClassroomOwner = [loadClassroom, ensureClassroomAccess];

router.get('/:classroomId', ...ensureClassroomOwner, async (req, res) => {
  const filter = { classroomId: req.classroom._id };
  if (req.query.status) filter.status = req.query.status;
  if (req.query.divisionId) filter.divisionId = req.query.divisionId;
  const students = await Student.find(filter)
    .populate('divisionId', 'name slug')
    .sort('-createdAt')
    .lean();

  const enriched = await Promise.all(
    students.map(async (s) => {
      if (!s.latestSnapshotId) return { ...s, snapshot: null };
      const snapshot = await StudentSnapshot.findById(s.latestSnapshotId)
        .select('totalSolved streak acceptanceRate syncError syncedAt easy medium hard')
        .lean();
      return { ...s, snapshot };
    })
  );

  res.json(enriched);
});

router.post(
  '/:classroomId',
  ...ensureClassroomOwner,
  [
    body('displayName').trim().notEmpty(),
    body('leetcodeUsername').trim().notEmpty(),
    body('divisionId').notEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const username = parseLeetCodeUsername(req.body.leetcodeUsername);
    const division = await Division.findOne({
      _id: req.body.divisionId,
      classroomId: req.classroom._id,
    });
    if (!division) return res.status(400).json({ message: 'Invalid division' });

    try {
      await fetchUserData(username);
    } catch {
      return res.status(400).json({ message: `LeetCode user "${username}" not found` });
    }

    const existing = await Student.findOne({
      classroomId: req.classroom._id,
      leetcodeUsername: username,
    });
    if (existing) return res.status(400).json({ message: 'Student already in classroom' });

    const student = await Student.create(
      buildStudentPayload(req.classroom._id, division, req.body, username)
    );

    syncStudent(student._id).catch(() => {});
    res.status(201).json(student);
  }
);

const getRowDivisionLabel = (row) => {
  const raw = row.division ?? row.section ?? row.Division ?? '';
  const label = String(raw).trim();
  return label || null;
};

const resolveBulkDivision = async (row, divisions, classroomId, defaultDivisionId) => {
  const byId = Object.fromEntries(divisions.map((d) => [String(d._id), d]));
  const bySlug = Object.fromEntries(divisions.map((d) => [d.slug.toLowerCase(), d]));
  const byName = Object.fromEntries(divisions.map((d) => [d.name.toLowerCase(), d]));

  const divisionLabel = getRowDivisionLabel(row);
  if (divisionLabel) {
    const key = divisionLabel.toLowerCase();
    const existing = bySlug[key] || byName[key];
    if (existing) return existing;

    const slug = slugify(divisionLabel);
    const created = await Division.create({
      classroomId,
      name: divisionLabel,
      slug,
      sortOrder: divisions.length,
    });
    divisions.push(created);
    byId[String(created._id)] = created;
    bySlug[slug] = created;
    byName[divisionLabel.toLowerCase()] = created;
    return created;
  }

  if (row.divisionId && byId[row.divisionId]) return byId[row.divisionId];
  if (defaultDivisionId && byId[defaultDivisionId]) return byId[defaultDivisionId];
  return divisions[0] || null;
};

const buildStudentPayload = (classroomId, division, row, username) => {
  const payload = {
    classroomId,
    divisionId: division._id,
    displayName: row.displayName || row.name || username,
    leetcodeUsername: username,
    institute: row.institute || '',
    academicDepartment: row.academicDepartment || row.department || '',
    enrollmentNumber: row.enrollmentNumber || '',
    email: row.email || '',
    mobile: row.mobile || '',
    status: 'active',
    source: 'instructor',
  };
  if (row.graduationYear != null && row.graduationYear !== '') {
    payload.graduationYear = Number(row.graduationYear);
  }
  return payload;
};

const applyStudentMetadata = (student, row, username, division) => {
  student.displayName = row.displayName || row.name || username;
  student.institute = row.institute || '';
  student.academicDepartment = row.academicDepartment || row.department || '';
  if (row.graduationYear != null && row.graduationYear !== '') {
    student.graduationYear = Number(row.graduationYear);
  }
  student.enrollmentNumber = row.enrollmentNumber || '';
  student.email = row.email || '';
  student.mobile = row.mobile || '';
  if (division) student.divisionId = division._id;
};

router.post('/:classroomId/bulk', ...ensureClassroomOwner, async (req, res) => {
  const { students: rows, divisionId: defaultDivisionId } = req.body;
  if (!Array.isArray(rows) || rows.length === 0) {
    return res.status(400).json({ message: 'students array is required' });
  }

  const divisions = await Division.find({ classroomId: req.classroom._id });
  if (!divisions.length) {
    return res.status(400).json({ message: 'No divisions in classroom' });
  }

  const results = [];
  for (const row of rows) {
    const username = parseLeetCodeUsername(row.leetcodeUsername || row.username);
    const displayName = row.displayName || row.name || username;
    const divisionLabel = getRowDivisionLabel(row);
    const division = await resolveBulkDivision(
      row,
      divisions,
      req.classroom._id,
      defaultDivisionId
    );

    if (!username) {
      results.push({ displayName, success: false, error: 'Missing LeetCode username' });
      continue;
    }
    if (!division) {
      results.push({
        displayName,
        leetcodeUsername: username,
        success: false,
        error: 'Invalid or missing division',
      });
      continue;
    }
    try {
      const existing = await Student.findOne({
        classroomId: req.classroom._id,
        leetcodeUsername: username,
      });
      if (existing) {
        applyStudentMetadata(existing, row, username, division);
        await existing.save();
        results.push({
          displayName: existing.displayName,
          leetcodeUsername: username,
          enrollmentNumber: existing.enrollmentNumber || undefined,
          institute: existing.institute || undefined,
          division: division.name,
          divisionSource: divisionLabel ? 'csv' : 'default',
          success: true,
          updated: true,
          studentId: existing._id,
        });
        continue;
      }
      if (row.enrollmentNumber) {
        const dupEnrollment = await Student.findOne({
          classroomId: req.classroom._id,
          enrollmentNumber: row.enrollmentNumber,
        });
        if (dupEnrollment) {
          results.push({
            displayName,
            leetcodeUsername: username,
            enrollmentNumber: row.enrollmentNumber,
            success: false,
            error: 'Enrollment number already used',
          });
          continue;
        }
      }
      const student = await Student.create(
        buildStudentPayload(req.classroom._id, division, row, username)
      );
      syncStudent(student._id).catch(() => {});
      results.push({
        displayName: student.displayName,
        leetcodeUsername: username,
        enrollmentNumber: student.enrollmentNumber || undefined,
        institute: student.institute || undefined,
        division: division.name,
        divisionSource: divisionLabel ? 'csv' : 'default',
        success: true,
        studentId: student._id,
      });
    } catch (err) {
      results.push({
        displayName,
        leetcodeUsername: username,
        success: false,
        error: err.message,
      });
    }
  }

  const added = results.filter((r) => r.success && !r.updated).length;
  const updated = results.filter((r) => r.success && r.updated).length;
  res.json({
    results,
    summary: { total: rows.length, added, updated, failed: rows.length - added - updated },
  });
});

router.patch('/:classroomId/:id/approve', ...ensureClassroomOwner, async (req, res) => {
  const student = await Student.findOne({ _id: req.params.id, classroomId: req.classroom._id });
  if (!student) return res.status(404).json({ message: 'Student not found' });

  const { action } = req.body;
  if (action === 'reject') {
    student.status = 'rejected';
    await student.save();
    return res.json(student);
  }

  try {
    await fetchUserData(student.leetcodeUsername);
  } catch {
    return res.status(400).json({ message: 'LeetCode profile not found' });
  }

  student.status = 'active';
  await student.save();
  syncStudent(student._id).catch(() => {});
  res.json(student);
});

router.put('/:classroomId/:id', ...ensureClassroomOwner, async (req, res) => {
  const student = await Student.findOne({ _id: req.params.id, classroomId: req.classroom._id });
  if (!student) return res.status(404).json({ message: 'Student not found' });

  const {
    displayName,
    leetcodeUsername,
    institute,
    academicDepartment,
    graduationYear,
    enrollmentNumber,
    email,
    mobile,
    divisionId,
  } = req.body;

  if (displayName != null && String(displayName).trim()) {
    student.displayName = String(displayName).trim();
  }

  if (leetcodeUsername != null && String(leetcodeUsername).trim()) {
    const username = parseLeetCodeUsername(leetcodeUsername);
    if (!username) {
      return res.status(400).json({ message: 'Invalid LeetCode username' });
    }
    if (username !== student.leetcodeUsername) {
      const dupUser = await Student.findOne({
        classroomId: req.classroom._id,
        leetcodeUsername: username,
        _id: { $ne: student._id },
      });
      if (dupUser) {
        return res.status(400).json({ message: 'Another student already uses this LeetCode username' });
      }
      try {
        await fetchUserData(username);
      } catch {
        return res.status(400).json({ message: `LeetCode user "${username}" not found` });
      }
      student.leetcodeUsername = username;
    }
  }

  if (institute != null) student.institute = String(institute).trim();
  if (academicDepartment != null) student.academicDepartment = String(academicDepartment).trim();

  if (graduationYear !== undefined) {
    if (graduationYear === '' || graduationYear === null) {
      student.graduationYear = undefined;
    } else {
      const year = Number(graduationYear);
      if (!Number.isFinite(year) || year < 2000 || year > 2100) {
        return res.status(400).json({ message: 'Invalid graduation year' });
      }
      student.graduationYear = year;
    }
  }

  if (enrollmentNumber != null) {
    const enroll = String(enrollmentNumber).trim();
    if (enroll) {
      const dupEnrollment = await Student.findOne({
        classroomId: req.classroom._id,
        enrollmentNumber: enroll,
        _id: { $ne: student._id },
      });
      if (dupEnrollment) {
        return res.status(400).json({ message: 'Enrollment number already used in this classroom' });
      }
    }
    student.enrollmentNumber = enroll;
  }

  if (email != null) student.email = String(email).trim().toLowerCase();
  if (mobile != null) student.mobile = String(mobile).trim();

  if (divisionId) {
    const division = await Division.findOne({
      _id: divisionId,
      classroomId: req.classroom._id,
    });
    if (!division) return res.status(400).json({ message: 'Invalid division' });
    student.divisionId = division._id;
  }

  await student.save();
  const updated = await Student.findById(student._id).populate('divisionId', 'name slug');
  res.json(updated);
});

router.post('/:classroomId/:id/sync', ...ensureClassroomOwner, async (req, res) => {
  const student = await Student.findOne({
    _id: req.params.id,
    classroomId: req.classroom._id,
    status: 'active',
  });
  if (!student) return res.status(404).json({ message: 'Student not found' });

  const snapshot = await syncStudent(student._id);
  res.json({
    studentId: student._id,
    displayName: student.displayName,
    leetcodeUsername: student.leetcodeUsername,
    success: !snapshot?.syncError,
    error: snapshot?.syncError || null,
  });
});

router.delete('/:classroomId/:id', ...ensureClassroomOwner, async (req, res) => {
  const student = await Student.findOneAndDelete({
    _id: req.params.id,
    classroomId: req.classroom._id,
  });
  if (!student) return res.status(404).json({ message: 'Student not found' });
  res.json({ message: 'Student removed' });
});

module.exports = router;
