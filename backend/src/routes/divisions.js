const express = require('express');
const { body, validationResult } = require('express-validator');
const { Classroom, Division } = require('../models');
const auth = require('../middleware/auth');
const { loadClassroom, ensureClassroomAccess } = require('../middleware/classroomAccess');
const { slugify } = require('../utils/slugify');

const router = express.Router();
router.use(auth);

const ensureClassroomOwner = [loadClassroom, ensureClassroomAccess];

router.get('/:classroomId', ...ensureClassroomOwner, async (req, res) => {
  const divisions = await Division.find({ classroomId: req.classroom._id }).sort('sortOrder');
  res.json(divisions);
});

router.post(
  '/:classroomId',
  ...ensureClassroomOwner,
  [body('name').trim().notEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const slug = slugify(req.body.slug || req.body.name);
    const division = await Division.create({
      classroomId: req.classroom._id,
      name: req.body.name,
      slug,
      sortOrder: req.body.sortOrder || 0,
    });
    res.status(201).json(division);
  }
);

router.put('/:classroomId/:id', ...ensureClassroomOwner, async (req, res) => {
  const division = await Division.findOne({ _id: req.params.id, classroomId: req.classroom._id });
  if (!division) return res.status(404).json({ message: 'Division not found' });
  if (req.body.name) division.name = req.body.name;
  if (req.body.sortOrder !== undefined) division.sortOrder = req.body.sortOrder;
  await division.save();
  res.json(division);
});

router.delete('/:classroomId/:id', ...ensureClassroomOwner, async (req, res) => {
  const division = await Division.findOne({ _id: req.params.id, classroomId: req.classroom._id });
  if (!division) return res.status(404).json({ message: 'Division not found' });
  if (division.slug === 'default') {
    return res.status(400).json({ message: 'Cannot delete default division' });
  }
  await division.deleteOne();
  res.json({ message: 'Division deleted' });
});

module.exports = router;
