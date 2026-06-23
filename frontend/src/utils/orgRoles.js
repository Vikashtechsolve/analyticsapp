const ROLE_LABELS = {
  org_admin: 'Dean / Org Admin',
  unit_admin: 'HOD',
  instructor: 'Instructor',
};

const roleLabel = (role, orgUnit) => {
  if (role === 'org_admin' && !orgUnit) return 'University Admin';
  if (role === 'org_admin' && orgUnit?.type === 'faculty') return `Dean — ${orgUnit.name}`;
  if (role === 'unit_admin') return `HOD — ${orgUnit?.name || ''}`;
  if (role === 'instructor') return `Instructor — ${orgUnit?.name || ''}`;
  return ROLE_LABELS[role] || role;
};

const highestRoleInOrg = (memberships, orgId) => {
  const rank = { org_admin: 3, unit_admin: 2, instructor: 1 };
  const orgKey = String(orgId || '');
  const inOrg = memberships.filter(
    (m) => String(m.org?._id || m.org || '') === orgKey
  );
  if (!inOrg.length) return null;
  return inOrg.reduce((best, m) => (rank[m.role] > rank[best.role] ? m : best)).role;
};

const canManageStructure = (role) => role === 'org_admin';
const canCreateMembers = (role) => ['org_admin', 'unit_admin'].includes(role);
const canCreateClassroom = (role) => ['org_admin', 'unit_admin', 'instructor'].includes(role);
const isInstructorRole = (role) => role === 'instructor';
const isOrgLeaderRole = (role) => ['org_admin', 'unit_admin'].includes(role);

export {
  ROLE_LABELS,
  roleLabel,
  highestRoleInOrg,
  canManageStructure,
  canCreateMembers,
  canCreateMembers as canInvite,
  canCreateClassroom,
  isInstructorRole,
  isOrgLeaderRole,
};
