const { OrgUnit, Membership, Classroom } = require('../models');

const ROLE_RANK = { org_admin: 3, unit_admin: 2, instructor: 1 };

const getSubtreeUnitIds = async (orgId, rootUnitId) => {
  if (!rootUnitId) {
    const units = await OrgUnit.find({ orgId }).select('_id').lean();
    return units.map((u) => String(u._id));
  }

  const all = await OrgUnit.find({ orgId }).select('_id parentId').lean();
  const byParent = {};
  for (const u of all) {
    const key = u.parentId ? String(u.parentId) : 'root';
    if (!byParent[key]) byParent[key] = [];
    byParent[key].push(String(u._id));
  }

  const result = [String(rootUnitId)];
  const queue = [String(rootUnitId)];
  while (queue.length) {
    const id = queue.shift();
    for (const child of byParent[id] || []) {
      result.push(child);
      queue.push(child);
    }
  }
  return result;
};

const getMembershipsForOrg = async (userId, orgId) =>
  Membership.find({ userId, orgId }).lean();

const getHighestRole = (memberships) => {
  if (!memberships?.length) return null;
  return memberships.reduce((best, m) =>
    ROLE_RANK[m.role] > ROLE_RANK[best.role] ? m : best
  ).role;
};

const canInviteRole = (inviterMemberships, targetRole) => {
  const highest = getHighestRole(inviterMemberships);
  if (!highest) return false;
  if (highest === 'org_admin') return ['org_admin', 'unit_admin', 'instructor'].includes(targetRole);
  if (highest === 'unit_admin') return targetRole === 'instructor';
  return false;
};

const isOrgWideAdmin = (membership) =>
  membership.role === 'org_admin' && !membership.orgUnitId;

const getAdminScopeUnitIds = async (memberships, orgId) => {
  const adminMemberships = memberships.filter((m) => m.role === 'org_admin');
  if (!adminMemberships.length) return [];

  const orgWide = adminMemberships.some((m) => !m.orgUnitId);
  if (orgWide) return getSubtreeUnitIds(orgId, null);

  const ids = new Set();
  for (const m of adminMemberships) {
    if (m.orgUnitId) {
      const subtree = await getSubtreeUnitIds(orgId, m.orgUnitId);
      subtree.forEach((id) => ids.add(id));
    }
  }
  return [...ids];
};

const getUnitAdminScopeUnitIds = async (memberships, orgId) => {
  const unitAdmins = memberships.filter((m) => m.role === 'unit_admin' && m.orgUnitId);
  const ids = new Set();
  for (const m of unitAdmins) {
    ids.add(String(m.orgUnitId));
  }
  return [...ids];
};

const getInstructorDepartmentIds = (memberships) =>
  memberships
    .filter((m) => m.role === 'instructor' && m.orgUnitId)
    .map((m) => String(m.orgUnitId));

const canManageOrgUnit = async (memberships, orgId, orgUnitId) => {
  const scope = await getAdminScopeUnitIds(memberships, orgId);
  if (scope.length && scope.includes(String(orgUnitId))) return true;

  const unitScope = await getUnitAdminScopeUnitIds(memberships, orgId);
  return unitScope.includes(String(orgUnitId));
};

const canAccessClassroom = async (userId, classroom, memberships) => {
  if (!classroom) return false;

  if (classroom.orgId && memberships?.length) {
    const orgId = String(classroom.orgId);

    const adminScope = await getAdminScopeUnitIds(
      memberships.filter((m) => String(m.orgId) === orgId),
      orgId
    );
    if (adminScope.length) {
      if (!classroom.orgUnitId) return true;
      if (adminScope.includes(String(classroom.orgUnitId))) return true;
    }

    const unitScope = await getUnitAdminScopeUnitIds(
      memberships.filter((m) => String(m.orgId) === orgId),
      orgId
    );
    if (classroom.orgUnitId && unitScope.includes(String(classroom.orgUnitId))) return true;

    const instructorDepts = getInstructorDepartmentIds(
      memberships.filter((m) => String(m.orgId) === orgId)
    );
    if (classroom.orgUnitId && instructorDepts.includes(String(classroom.orgUnitId))) {
      const unit = await OrgUnit.findById(classroom.orgUnitId).lean();
      const visibility = unit?.settings?.instructorVisibility || 'own';
      if (visibility === 'unit_shared') return true;
      if (String(classroom.createdBy) === String(userId)) return true;
      return false;
    }
  }

  if (classroom.instructorId) {
    return String(classroom.instructorId) === String(userId);
  }

  return false;
};

const getAccessibleClassroomFilter = async (userId, memberships, orgId = null) => {
  if (!memberships?.length) {
    return { instructorId: userId };
  }

  const orgIds = orgId ? [orgId] : [...new Set(memberships.map((m) => String(m.orgId)))];
  const orClauses = [];

  for (const oid of orgIds) {
    const orgMemberships = memberships.filter((m) => String(m.orgId) === oid);

    const adminScope = await getAdminScopeUnitIds(orgMemberships, oid);
    if (adminScope.length) {
      orClauses.push({ orgId: oid, orgUnitId: { $in: adminScope } });
      orClauses.push({ orgId: oid, orgUnitId: { $exists: false } });
      orClauses.push({ orgId: oid, orgUnitId: null });
    }

    const unitScope = await getUnitAdminScopeUnitIds(orgMemberships, oid);
    if (unitScope.length) {
      orClauses.push({ orgId: oid, orgUnitId: { $in: unitScope } });
    }

    const instructorDepts = getInstructorDepartmentIds(orgMemberships);
    for (const deptId of instructorDepts) {
      const unit = await OrgUnit.findById(deptId).lean();
      const visibility = unit?.settings?.instructorVisibility || 'own';
      if (visibility === 'unit_shared') {
        orClauses.push({ orgId: oid, orgUnitId: deptId });
      } else {
        orClauses.push({ orgId: oid, orgUnitId: deptId, createdBy: userId });
      }
    }
  }

  orClauses.push({ instructorId: userId });

  if (!orClauses.length) return { instructorId: userId };
  return { $or: orClauses };
};

const canCreateClassroomInUnit = async (memberships, orgId, orgUnitId) => {
  const unit = await OrgUnit.findOne({ _id: orgUnitId, orgId }).lean();
  if (!unit || unit.type !== 'department') return false;

  if (await canManageOrgUnit(memberships, orgId, orgUnitId)) return true;

  return memberships.some(
    (m) =>
      String(m.orgId) === String(orgId) &&
      m.role === 'instructor' &&
      m.orgUnitId &&
      String(m.orgUnitId) === String(orgUnitId)
  );
};

const getInvitableRoles = (memberships) => {
  const highest = getHighestRole(memberships);
  if (highest === 'org_admin') return ['org_admin', 'unit_admin', 'instructor'];
  if (highest === 'unit_admin') return ['instructor'];
  return [];
};

/** Mongo filter: members visible to the viewer (only roles/units below them). */
const getVisibleMembersQuery = async (user, orgMemberships, orgId) => {
  if (user.isSuperAdmin) {
    return { orgId };
  }

  const highest = getHighestRole(orgMemberships);
  if (!highest || highest === 'instructor') return null;

  if (highest === 'org_admin') {
    if (orgMemberships.some(isOrgWideAdmin)) {
      return { orgId };
    }

    const adminScope = await getAdminScopeUnitIds(orgMemberships, orgId);
    const units = await OrgUnit.find({ orgId }).select('_id type').lean();
    const deptIds = units
      .filter((u) => u.type === 'department' && adminScope.includes(String(u._id)))
      .map((u) => u._id);

    if (!deptIds.length) return { orgId, _id: null };

    return {
      orgId,
      role: { $in: ['unit_admin', 'instructor'] },
      orgUnitId: { $in: deptIds },
    };
  }

  if (highest === 'unit_admin') {
    const deptIds = await getUnitAdminScopeUnitIds(orgMemberships, orgId);
    if (!deptIds.length) return { orgId, _id: null };

    return {
      orgId,
      role: 'instructor',
      orgUnitId: { $in: deptIds },
    };
  }

  return null;
};

const getMembersScopeLabel = (user, orgMemberships) => {
  if (user.isSuperAdmin) return 'All members in this organization';
  const highest = getHighestRole(orgMemberships);
  if (highest === 'org_admin' && orgMemberships.some(isOrgWideAdmin)) {
    return 'All deans, HODs, and instructors in this university';
  }
  if (highest === 'org_admin') return 'HODs and instructors under your faculty';
  if (highest === 'unit_admin') return 'Instructors in your department(s)';
  return 'Members in your scope';
};

module.exports = {
  ROLE_RANK,
  getSubtreeUnitIds,
  getMembershipsForOrg,
  getHighestRole,
  canInviteRole,
  isOrgWideAdmin,
  getAdminScopeUnitIds,
  getUnitAdminScopeUnitIds,
  canManageOrgUnit,
  canAccessClassroom,
  getAccessibleClassroomFilter,
  canCreateClassroomInUnit,
  getInvitableRoles,
  getVisibleMembersQuery,
  getMembersScopeLabel,
};
