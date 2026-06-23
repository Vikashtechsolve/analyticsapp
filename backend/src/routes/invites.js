const express = require('express');
const { body, validationResult } = require('express-validator');
const { Invite } = require('../models');
const { acceptInvite } = require('../services/invite.service');
const jwt = require('jsonwebtoken');

const router = express.Router();

router.get('/:token', async (req, res) => {
  const invite = await Invite.findOne({ token: req.params.token })
    .populate('orgId', 'name slug')
    .populate('orgUnitId', 'name type')
    .lean();

  if (!invite) return res.status(404).json({ message: 'Invite not found' });
  if (invite.acceptedAt) return res.status(400).json({ message: 'Invite already used' });
  if (invite.expiresAt < new Date()) return res.status(400).json({ message: 'Invite expired' });

  res.json({
    email: invite.email,
    name: invite.name,
    role: invite.role,
    org: invite.orgId,
    orgUnit: invite.orgUnitId,
    expiresAt: invite.expiresAt,
  });
});

router.post(
  '/:token/accept',
  [body('password').isLength({ min: 6 }), body('name').optional().trim()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const { user, invite } = await acceptInvite({
        token: req.params.token,
        password: req.body.password,
        name: req.body.name,
      });

      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
      res.json({
        token,
        user: { id: user._id, email: user.email, name: user.name, isSuperAdmin: user.isSuperAdmin },
        orgId: invite.orgId,
        message: 'Account ready. Sign in to access your organization.',
      });
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }
);

module.exports = router;
