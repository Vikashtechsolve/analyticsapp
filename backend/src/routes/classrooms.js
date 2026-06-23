const express = require('express');
const { body, validationResult } = require('express-validator');
const { Classroom, Division, OrgUnit, Student } = require('../models');
const auth = require('../middleware/auth');
const { loadClassroom, ensureClassroomAccess } = require('../middleware/classroomAccess');
const { slugify } = require('../utils/slugify');
const { syncClassroom, syncClassroomBatch } = require('../services/sync.service');
const { getClassroomTeacherDashboard } = require('../services/analytics.service');
const { filterStudentsForTeacher } = require('../services/teacher-filter.service');
const {
  getAccessibleClassroomFilter,
  canCreateClassroomInUnit,
} = require('../services/authz.service');

const router = express.Router();
router.use(auth);

router.get('/', async (req, res) => {
  const baseFilter = await getAccessibleClassroomFilter(req.user._id, req.memberships);
  const andFilters = [baseFilter];
  if (req.query.orgId) andFilters.push({ orgId: req.query.orgId });
  if (req.query.orgUnitId) andFilters.push({ orgUnitId: req.query.orgUnitId });
  if (req.query.createdBy) andFilters.push({ createdBy: req.query.createdBy });
  if (req.query.q) andFilters.push({ name: { $regex: req.query.q, $options: 'i' } });

  const filter = andFilters.length === 1 ? andFilters[0] : { $and: andFilters };
  const classrooms = await Classroom.find(filter)
    .populate('orgUnitId', 'name type parentId')
    .populate('createdBy', 'name email')
    .sort('-createdAt')
    .lean();

  const classroomIds = classrooms.map((c) => c._id);
  const studentAgg =
    classroomIds.length > 0
      ? await Student.aggregate([
          { $match: { classroomId: { $in: classroomIds }, status: 'active' } },
          { $group: { _id: '$classroomId', activeStudents: { $sum: 1 } } },
        ])
      : [];
  const studentByClassroom = Object.fromEntries(
    studentAgg.map((row) => [String(row._id), row.activeStudents])
  );

  res.json(
    classrooms.map((c) => ({
      ...c,
      stats: {
        activeStudents: studentByClassroom[String(c._id)] || 0,
      },
    }))
  );
});

router.post(
  '/',
  [
    body('name').trim().notEmpty(),
    body('description').optional().trim(),
    body('orgId').optional(),
    body('orgUnitId').optional(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, description, orgId, orgUnitId, joinCode } = req.body;

    let classroomData = {
      name,
      description: description || '',
      joinCode: joinCode || '',
      createdBy: req.user._id,
      instructorId: req.user.isLegacy ? req.user._id : undefined,
    };

    if (orgId && orgUnitId) {
      const canCreate = await canCreateClassroomInUnit(req.memberships, orgId, orgUnitId);
      if (!canCreate && !req.user.isSuperAdmin) {
        return res.status(403).json({ message: 'You cannot create classrooms in this department' });
      }
      const unit = await OrgUnit.findOne({ _id: orgUnitId, orgId, type: 'department' });
      if (!unit) return res.status(400).json({ message: 'Classroom must belong to a department' });

      classroomData.orgId = orgId;
      classroomData.orgUnitId = orgUnitId;
    } else if (!req.user.isLegacy && req.memberships.length) {
      return res.status(400).json({
        message: 'Select a department for this classroom',
      });
    } else {
      classroomData.instructorId = req.user._id;
    }

    let slug = slugify(req.body.slug || name);
    const existing = await Classroom.findOne({ slug });
    if (existing) slug = `${slug}-${Date.now().toString(36)}`;

    classroomData.slug = slug;

    const classroom = await Classroom.create(classroomData);

    await Division.create({
      classroomId: classroom._id,
      name: 'Default',
      slug: 'default',
      sortOrder: 0,
    });

    res.status(201).json(classroom);
  }
);

router.get('/:id', loadClassroom, ensureClassroomAccess, async (req, res) => {
  const divisions = await Division.find({ classroomId: req.classroom._id }).sort('sortOrder');
  res.json({ classroom: req.classroom, divisions });
});

router.put('/:id', loadClassroom, ensureClassroomAccess, async (req, res) => {
  const { name, description, joinCode, settings } = req.body;
  if (name) req.classroom.name = name;
  if (description !== undefined) req.classroom.description = description;
  if (joinCode !== undefined) req.classroom.joinCode = joinCode;
  if (settings) req.classroom.settings = { ...req.classroom.settings, ...settings };
  await req.classroom.save();
  res.json(req.classroom);
});

router.delete('/:id', loadClassroom, ensureClassroomAccess, async (req, res) => {
  await Classroom.findByIdAndDelete(req.classroom._id);
  res.json({ message: 'Classroom deleted' });
});

router.post('/:id/sync', loadClassroom, ensureClassroomAccess, async (req, res) => {
  const result = await syncClassroom(req.classroom._id);
  res.json(result);
});

router.post('/:id/sync-batch', loadClassroom, ensureClassroomAccess, async (req, res) => {
  const offset = Math.max(0, Number(req.body?.offset) || 0);
  const limit = Math.min(15, Math.max(1, Number(req.body?.limit) || 8));
  const result = await syncClassroomBatch(req.classroom._id, { offset, limit });
  res.json(result);
});

router.post('/:id/sync-complete', loadClassroom, ensureClassroomAccess, async (req, res) => {
  req.classroom.lastSyncedAt = new Date();
  await req.classroom.save();
  res.json({ lastSyncedAt: req.classroom.lastSyncedAt });
});

router.get('/:id/teacher-dashboard', loadClassroom, ensureClassroomAccess, async (req, res) => {
  const divisionId = req.query.divisionId || null;
  const dashboard = await getClassroomTeacherDashboard(req.classroom._id, divisionId);
  res.json({
    classroom: {
      _id: req.classroom._id,
      name: req.classroom.name,
      slug: req.classroom.slug,
      lastSyncedAt: req.classroom.lastSyncedAt,
    },
    ...dashboard,
  });
});

router.post('/:id/student-filters', loadClassroom, ensureClassroomAccess, async (req, res) => {
  const { divisionId, matchMode, filters, search } = req.body || {};
  const result = await filterStudentsForTeacher(req.classroom._id, {
    divisionId: divisionId || null,
    matchMode: matchMode === 'any' ? 'any' : 'all',
    filters: filters || {},
    search: search || '',
  });
  res.json({
    classroom: {
      _id: req.classroom._id,
      name: req.classroom.name,
      slug: req.classroom.slug,
    },
    ...result,
  });
});

module.exports = router;
