const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { User, Instructor, Membership, Organization } = require('../models');
const auth = require('../middleware/auth');
const { getHighestRole } = require('../services/authz.service');

const router = express.Router();

const signToken = (userId) =>
  jwt.sign({ userId, id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });

const formatUser = async (user) => {
  const memberships = await Membership.find({ userId: user._id })
    .populate('orgId', 'name slug')
    .populate('orgUnitId', 'name type slug settings')
    .lean();

  return {
    id: user._id,
    email: user.email,
    name: user.name,
    isSuperAdmin: user.isSuperAdmin,
    memberships: memberships.map((m) => ({
      id: m._id,
      role: m.role,
      org: m.orgId,
      orgUnit: m.orgUnitId,
    })),
    primaryRole: user.isSuperAdmin ? 'super_admin' : getHighestRole(memberships),
  };
};

router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('name').trim().notEmpty(),
  ],
  async (req, res) => {
    if (process.env.NODE_ENV === 'production' && process.env.ALLOW_OPEN_REGISTER !== 'true') {
      return res.status(403).json({ message: 'Registration is invite-only. Contact your administrator.' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password, name } = req.body;
    const existing = await User.findOne({ email }) || await Instructor.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already registered' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, passwordHash, name });
    const token = signToken(user._id);

    res.status(201).json({
      token,
      user: await formatUser(user),
      instructor: { id: user._id, email: user.email, name: user.name },
    });
  }
);

router.post(
  '/login',
  [body('email').isEmail().normalizeEmail(), body('password').notEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;
    let user = await User.findOne({ email });

    if (!user) {
      const instructor = await Instructor.findOne({ email });
      if (instructor) {
        const valid = await bcrypt.compare(password, instructor.passwordHash);
        if (!valid) return res.status(401).json({ message: 'Invalid credentials' });
        user = await User.findOne({ legacyInstructorId: instructor._id });
        if (!user) {
          const token = jwt.sign({ id: instructor._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
          return res.json({
            token,
            user: {
              id: instructor._id,
              email: instructor.email,
              name: instructor.name,
              isSuperAdmin: false,
              memberships: [],
              primaryRole: 'instructor',
              isLegacy: true,
            },
            instructor: { id: instructor._id, email: instructor.email, name: instructor.name },
          });
        }
      }
    }

    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ message: 'Invalid credentials' });

    const token = signToken(user._id);
    const formatted = await formatUser(user);

    res.json({
      token,
      user: formatted,
      instructor: { id: user._id, email: user.email, name: user.name },
    });
  }
);

router.get('/me', auth, async (req, res) => {
  if (req.user?.isLegacy) {
    return res.json({
      user: {
        id: req.user._id,
        email: req.user.email,
        name: req.user.name,
        isSuperAdmin: false,
        memberships: [],
        primaryRole: 'instructor',
        isLegacy: true,
      },
      instructor: req.instructor,
    });
  }

  const formatted = await formatUser(req.user);
  res.json({ user: formatted, instructor: { id: req.user._id, email: req.user.email, name: req.user.name } });
});

module.exports = router;
