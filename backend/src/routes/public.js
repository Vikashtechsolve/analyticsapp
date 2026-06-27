const express = require('express');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const { Classroom, Division, Student } = require('../models');
const { parseLeetCodeUsername } = require('../utils/slugify');
const {
  getClassroomAnalytics,
  getStudentDetail,
  getStudentsWithSnapshots,
  buildDivisionComparison,
} = require('../services/analytics.service');
const {
  getStudentPeers,
  getStudentPeerComparison,
  getStudentComparison,
} = require('../services/student-analytics.service');

const router = express.Router();

const joinLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { message: 'Too many join requests, please try again later' },
});

const getClassroomBySlug = async (slug) => {
  const classroom = await Classroom.findOne({ slug, isPublic: true });
  return classroom;
};

router.get('/classrooms/:slug', async (req, res) => {
  const classroom = await getClassroomBySlug(req.params.slug);
  if (!classroom) return res.status(404).json({ message: 'Classroom not found' });

  const divisions = await Division.find({ classroomId: classroom._id }).sort('sortOrder');
  res.json({
    classroom: {
      _id: classroom._id,
      name: classroom.name,
      slug: classroom.slug,
      description: classroom.description,
      lastSyncedAt: classroom.lastSyncedAt,
      shareUrl: `/c/${classroom.slug}`,
    },
    divisions,
  });
});

router.get('/classrooms/:slug/analytics', async (req, res) => {
  const classroom = await getClassroomBySlug(req.params.slug);
  if (!classroom) return res.status(404).json({ message: 'Classroom not found' });

  let divisionId = null;
  if (req.query.division) {
    const div = await Division.findOne({ classroomId: classroom._id, slug: req.query.division });
    if (div) divisionId = div._id;
  }

  const [allStudents, divisions] = await Promise.all([
    getStudentsWithSnapshots(classroom._id, null),
    Division.find({ classroomId: classroom._id }).sort('sortOrder').lean(),
  ]);

  const analytics = await getClassroomAnalytics(classroom._id, divisionId, { allStudents });
  const divisionComparison = buildDivisionComparison(allStudents, divisions);

  res.json({
    classroom: {
      name: classroom.name,
      slug: classroom.slug,
      lastSyncedAt: classroom.lastSyncedAt,
    },
    ...analytics,
    divisionComparison,
  });
});

router.get('/classrooms/:slug/divisions/:divSlug', async (req, res) => {
  const classroom = await getClassroomBySlug(req.params.slug);
  if (!classroom) return res.status(404).json({ message: 'Classroom not found' });

  const division = await Division.findOne({
    classroomId: classroom._id,
    slug: req.params.divSlug,
  });
  if (!division) return res.status(404).json({ message: 'Division not found' });

  const analytics = await getClassroomAnalytics(classroom._id, division._id);
  res.json({ classroom, division, ...analytics });
});

router.get('/classrooms/:slug/students/:studentId', async (req, res) => {
  const classroom = await getClassroomBySlug(req.params.slug);
  if (!classroom) return res.status(404).json({ message: 'Classroom not found' });

  const student = await Student.findOne({
    _id: req.params.studentId,
    classroomId: classroom._id,
    status: 'active',
  });
  if (!student) return res.status(404).json({ message: 'Student not found' });

  const detail = await getStudentDetail(student._id);
  res.json(detail);
});

router.get('/classrooms/:slug/students/:studentId/comparison', async (req, res) => {
  const classroom = await getClassroomBySlug(req.params.slug);
  if (!classroom) return res.status(404).json({ message: 'Classroom not found' });

  const student = await Student.findOne({
    _id: req.params.studentId,
    classroomId: classroom._id,
    status: 'active',
  });
  if (!student) return res.status(404).json({ message: 'Student not found' });

  const comparison = await getStudentComparison(student._id, classroom._id);
  if (!comparison) {
    return res.status(404).json({ message: 'Comparison not available — sync data may be missing' });
  }

  res.json(comparison);
});

router.get('/classrooms/:slug/students/:studentId/peers', async (req, res) => {
  const classroom = await getClassroomBySlug(req.params.slug);
  if (!classroom) return res.status(404).json({ message: 'Classroom not found' });

  const student = await Student.findOne({
    _id: req.params.studentId,
    classroomId: classroom._id,
    status: 'active',
  });
  if (!student) return res.status(404).json({ message: 'Student not found' });

  const peers = await getStudentPeers(classroom._id, student._id);
  res.json(peers);
});

router.get('/classrooms/:slug/students/:studentId/compare/:peerId', async (req, res) => {
  const classroom = await getClassroomBySlug(req.params.slug);
  if (!classroom) return res.status(404).json({ message: 'Classroom not found' });

  const student = await Student.findOne({
    _id: req.params.studentId,
    classroomId: classroom._id,
    status: 'active',
  });
  if (!student) return res.status(404).json({ message: 'Student not found' });

  const peer = await Student.findOne({
    _id: req.params.peerId,
    classroomId: classroom._id,
    status: 'active',
  });
  if (!peer) return res.status(404).json({ message: 'Peer student not found' });

  const comparison = await getStudentPeerComparison(student._id, peer._id, classroom._id);
  if (!comparison) {
    return res.status(400).json({ message: 'Comparison not available — sync data may be missing' });
  }

  res.json(comparison);
});

router.post(
  '/classrooms/:slug/join',
  joinLimiter,
  [
    body('displayName').trim().notEmpty(),
    body('leetcodeUsername').trim().notEmpty(),
    body('divisionId').notEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const classroom = await getClassroomBySlug(req.params.slug);
    if (!classroom) return res.status(404).json({ message: 'Classroom not found' });

    if (classroom.joinCode && classroom.joinCode !== req.body.joinCode) {
      return res.status(403).json({ message: 'Invalid join code' });
    }

    const username = parseLeetCodeUsername(req.body.leetcodeUsername);
    const division = await Division.findOne({
      _id: req.body.divisionId,
      classroomId: classroom._id,
    });
    if (!division) return res.status(400).json({ message: 'Invalid division' });

    const existing = await Student.findOne({
      classroomId: classroom._id,
      leetcodeUsername: username,
    });
    if (existing) {
      return res.status(400).json({ message: 'You have already joined this classroom' });
    }

    const student = await Student.create({
      classroomId: classroom._id,
      divisionId: division._id,
      displayName: req.body.displayName,
      leetcodeUsername: username,
      status: 'pending',
      source: 'self',
    });

    res.status(201).json({
      message: 'Join request submitted. Awaiting instructor approval.',
      studentId: student._id,
    });
  }
);

module.exports = router;
