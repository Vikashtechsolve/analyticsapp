const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { User, Instructor, Organization, OrgUnit, Membership, Classroom, Student, StudentSnapshot } = require('../models');
const auth = require('../middleware/auth');
const { slugify } = require('../utils/slugify');
const { getAdminScopeUnitIds, getUnitAdminScopeUnitIds } = require('../services/authz.service');

const router = express.Router();
router.use(auth);

router.get('/orgs', async (req, res) => {
  if (req.user.isSuperAdmin) {
    const orgs = await Organization.find().sort('-createdAt').lean();
    return res.json(orgs);
  }

  const orgIds = [...new Set(req.memberships.map((m) => String(m.orgId)))];
  const orgs = await Organization.find({ _id: { $in: orgIds } }).sort('name').lean();
  res.json(orgs);
});

const { requireSuperAdmin } = require('../middleware/auth');

router.post(
  '/orgs',
  requireSuperAdmin,
  [
    body('name').trim().notEmpty(),
    body('adminEmail').isEmail(),
    body('adminName').trim().notEmpty(),
    body('adminPassword').isLength({ min: 6 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, adminEmail, adminName, adminPassword } = req.body;
    let slug = slugify(req.body.slug || name);
    const existing = await Organization.findOne({ slug });
    if (existing) slug = `${slug}-${Date.now().toString(36)}`;

    const org = await Organization.create({ name, slug });

    await OrgUnit.create({
      orgId: org._id,
      parentId: null,
      type: 'root',
      name: name,
      slug: 'root',
    });

    const existingUser = await User.findOne({ email: adminEmail.toLowerCase() });
    if (existingUser) {
      await Organization.findByIdAndDelete(org._id);
      await OrgUnit.deleteMany({ orgId: org._id });
      return res.status(400).json({ message: 'A user with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(adminPassword, 10);
    const adminUser = await User.create({
      email: adminEmail.toLowerCase(),
      passwordHash,
      name: adminName,
    });

    await Membership.create({
      userId: adminUser._id,
      orgId: org._id,
      orgUnitId: null,
      role: 'org_admin',
      invitedBy: req.user._id,
    });

    res.status(201).json({
      org,
      admin: { id: adminUser._id, email: adminUser.email, name: adminUser.name },
      credentials: { email: adminUser.email, password: adminPassword },
      message: `University created. Share login credentials with the org admin: ${adminUser.email}`,
    });
  }
);

router.get('/orgs/:orgId', async (req, res) => {
  const org = await Organization.findById(req.params.orgId);
  if (!org) return res.status(404).json({ message: 'Organization not found' });

  if (!req.user.isSuperAdmin) {
    const member = req.memberships.find((m) => String(m.orgId) === String(org._id));
    if (!member) return res.status(403).json({ message: 'Access denied' });
  }

  const units = await OrgUnit.find({ orgId: org._id }).sort('type name').lean();

  const orgMemberships = req.memberships.filter((m) => String(m.orgId) === String(org._id));
  const { getVisibleMembersQuery } = require('../services/authz.service');
  const memberFilter = req.user.isSuperAdmin
    ? { orgId: org._id }
    : await getVisibleMembersQuery(req.user, orgMemberships, org._id);

  const members = memberFilter
    ? await Membership.find(memberFilter)
        .populate('userId', 'name email')
        .populate('orgUnitId', 'name type slug')
        .lean()
    : [];

  res.json({ org, units, members });
});

router.get('/orgs/:orgId/analytics', async (req, res) => {
  const org = await Organization.findById(req.params.orgId);
  if (!org) return res.status(404).json({ message: 'Organization not found' });

  const orgMemberships = req.memberships.filter((m) => String(m.orgId) === String(org._id));
  if (!req.user.isSuperAdmin && !orgMemberships.length) {
    return res.status(403).json({ message: 'Access denied' });
  }

  const { buildOrgAnalytics } = require('../services/org-analytics.service');
  const data = await buildOrgAnalytics({
    org,
    user: req.user,
    orgMemberships,
    query: req.query,
  });
  res.json(data);
});

router.post(
  '/orgs/:orgId/units',
  [body('name').trim().notEmpty(), body('type').isIn(['faculty', 'department'])],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const org = await Organization.findById(req.params.orgId);
    if (!org) return res.status(404).json({ message: 'Organization not found' });

    const orgMemberships = req.memberships.filter((m) => String(m.orgId) === String(org._id));
    const { getAdminScopeUnitIds } = require('../services/authz.service');

    const isSuper = req.user.isSuperAdmin;
    const isOrgAdmin = orgMemberships.some((m) => m.role === 'org_admin');

    if (!isSuper && !isOrgAdmin) {
      return res.status(403).json({ message: 'Only org admins can create units' });
    }

    const { name, type, parentId } = req.body;
    let slug = slugify(req.body.slug || name);

    const parent = parentId
      ? await OrgUnit.findOne({ _id: parentId, orgId: org._id })
      : await OrgUnit.findOne({ orgId: org._id, type: 'root' });

    if (!parent) return res.status(400).json({ message: 'Invalid parent unit' });

    if (!isSuper) {
      const scope = await getAdminScopeUnitIds(orgMemberships, org._id);
      if (!scope.includes(String(parent._id))) {
        return res.status(403).json({ message: 'You cannot create units under this parent' });
      }
    }

    if (type === 'faculty' && parent.type !== 'root') {
      return res.status(400).json({ message: 'Faculty units must be under the university root' });
    }
    if (type === 'department' && parent.type !== 'faculty') {
      return res.status(400).json({ message: 'Departments must be under a faculty (Dean) unit' });
    }

    const dupe = await OrgUnit.findOne({ orgId: org._id, slug });
    if (dupe) slug = `${slug}-${Date.now().toString(36)}`;

    const unit = await OrgUnit.create({
      orgId: org._id,
      parentId: parent._id,
      type,
      name,
      slug,
      settings: type === 'department' ? { instructorVisibility: 'own' } : undefined,
    });

    res.status(201).json(unit);
  }
);

router.patch('/orgs/:orgId/units/:unitId', async (req, res) => {
  const unit = await OrgUnit.findOne({ _id: req.params.unitId, orgId: req.params.orgId });
  if (!unit) return res.status(404).json({ message: 'Unit not found' });

  const orgMemberships = req.memberships.filter((m) => String(m.orgId) === String(req.params.orgId));
  const { canManageOrgUnit } = require('../services/authz.service');

  const canManage =
    req.user.isSuperAdmin ||
    (await canManageOrgUnit(orgMemberships, req.params.orgId, unit._id));

  if (!canManage) return res.status(403).json({ message: 'Access denied' });

  if (req.body.name) unit.name = req.body.name;
  if (req.body.settings?.instructorVisibility && unit.type === 'department') {
    unit.settings = unit.settings || {};
    unit.settings.instructorVisibility = req.body.settings.instructorVisibility;
  }
  await unit.save();
  res.json(unit);
});

module.exports = router;
