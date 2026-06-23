const express = require('express');
const { body, validationResult } = require('express-validator');
const { Membership } = require('../models');
const auth = require('../middleware/auth');
const { createOrgMember } = require('../services/member.service');
const { getInvitableRoles, getVisibleMembersQuery } = require('../services/authz.service');

const router = express.Router({ mergeParams: true });
router.use(auth);

const getOrgMemberships = (req, orgId) =>
  req.memberships.filter((m) => String(m.orgId) === String(orgId));

const requireOrgMember = (req, res, next) => {
  if (req.user.isSuperAdmin) return next();
  const member = getOrgMemberships(req, req.params.orgId);
  if (!member.length) return res.status(403).json({ message: 'Access denied' });
  next();
};

router.use(requireOrgMember);

router.get('/members', async (req, res) => {
  const orgMemberships = getOrgMemberships(req, req.params.orgId);
  const filter = req.user.isSuperAdmin
    ? { orgId: req.params.orgId }
    : await getVisibleMembersQuery(req.user, orgMemberships, req.params.orgId);

  if (!filter) {
    return res.json({ members: [] });
  }

  const members = await Membership.find(filter)
    .populate('userId', 'name email')
    .populate('orgUnitId', 'name type slug')
    .sort('role')
    .lean();

  res.json({ members });
});

router.post(
  '/members',
  [
    body('email').isEmail().normalizeEmail(),
    body('name').trim().notEmpty(),
    body('password').optional().isLength({ min: 6 }),
    body('role').isIn(['org_admin', 'unit_admin', 'instructor']),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const orgMemberships = getOrgMemberships(req, req.params.orgId);
    const { email, name, password, role, orgUnitId } = req.body;

    try {
      const result = await createOrgMember({
        email,
        name,
        password,
        role,
        orgId: req.params.orgId,
        orgUnitId: orgUnitId || null,
        createdBy: req.user._id,
        creatorMemberships: orgMemberships,
        isSuperAdmin: req.user.isSuperAdmin,
      });

      res.status(201).json({
        member: result.user,
        role,
        orgUnitId: orgUnitId || null,
        isNewUser: result.isNewUser,
        message: result.isNewUser
          ? `Account created for ${result.user.email}. Share these login credentials with the user.`
          : `Existing user ${result.user.email} was added to this organization.`,
        credentials: result.isNewUser ? { email: result.user.email, password } : undefined,
      });
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }
);

router.get('/creatable-roles', (req, res) => {
  const orgMemberships = getOrgMemberships(req, req.params.orgId);
  const creatorMemberships = req.user.isSuperAdmin
    ? [{ role: 'org_admin', orgId: req.params.orgId }]
    : orgMemberships;
  res.json({ roles: getInvitableRoles(creatorMemberships) });
});

module.exports = router;
