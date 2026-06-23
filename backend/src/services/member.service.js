const bcrypt = require('bcryptjs');
const { User, Membership, OrgUnit } = require('../models');
const { getInvitableRoles, canManageOrgUnit } = require('./authz.service');

const validateMemberAssignment = async ({ orgId, role, orgUnitId }) => {
  if (role === 'org_admin') {
    if (!orgUnitId) {
      return { ok: false, message: 'Deans (org_admin) must be assigned to a faculty unit' };
    }
    const unit = await OrgUnit.findOne({ _id: orgUnitId, orgId });
    if (!unit || unit.type !== 'faculty') {
      return { ok: false, message: 'Deans must be assigned to a faculty unit' };
    }
  }

  if (role === 'unit_admin' || role === 'instructor') {
    if (!orgUnitId) {
      return { ok: false, message: `${role === 'unit_admin' ? 'HOD' : 'Instructor'} must be assigned to a department` };
    }
    const unit = await OrgUnit.findOne({ _id: orgUnitId, orgId });
    if (!unit || unit.type !== 'department') {
      return { ok: false, message: 'Must be assigned to a department unit' };
    }
  }

  return { ok: true };
};

const createOrgMember = async ({
  email,
  name,
  password,
  role,
  orgId,
  orgUnitId,
  createdBy,
  creatorMemberships,
  isSuperAdmin = false,
}) => {
  const inviterMemberships = isSuperAdmin ? [{ role: 'org_admin', orgId }] : creatorMemberships;
  const allowed = getInvitableRoles(inviterMemberships);
  if (!allowed.includes(role)) {
    throw new Error('You cannot create accounts for this role');
  }

  const assignment = await validateMemberAssignment({ orgId, role, orgUnitId: orgUnitId || null });
  if (!assignment.ok) throw new Error(assignment.message);

  if (!isSuperAdmin && orgUnitId) {
    const canManage = await canManageOrgUnit(creatorMemberships, orgId, orgUnitId);
    if (!canManage) throw new Error('You cannot add members to this unit');
  }

  const normalizedEmail = email.toLowerCase().trim();
  let user = await User.findOne({ email: normalizedEmail });
  const isNewUser = !user;

  if (isNewUser) {
    if (!password || password.length < 6) {
      throw new Error('Password is required (min 6 characters) for new accounts');
    }
    const passwordHash = await bcrypt.hash(password, 10);
    user = await User.create({
      email: normalizedEmail,
      passwordHash,
      name: name.trim(),
    });
  } else {
    if (!name?.trim()) throw new Error('Name is required');
    const duplicate = await Membership.findOne({
      userId: user._id,
      orgId,
      orgUnitId: orgUnitId || null,
      role,
    });
    if (duplicate) throw new Error('This user already has this role in the organization');

    if (password) {
      if (password.length < 6) throw new Error('Password must be at least 6 characters');
      user.passwordHash = await bcrypt.hash(password, 10);
    }
    user.name = name.trim();
    await user.save();
  }

  const membership = await Membership.create({
    userId: user._id,
    orgId,
    orgUnitId: orgUnitId || null,
    role,
    invitedBy: createdBy,
  });

  return {
    user: { id: user._id, email: user.email, name: user.name },
    membership,
    isNewUser,
    credentials: isNewUser || password
      ? { email: user.email, password: password || '(unchanged)' }
      : null,
  };
};

module.exports = { createOrgMember, validateMemberAssignment };
