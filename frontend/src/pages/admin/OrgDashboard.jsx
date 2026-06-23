import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { authApi, classroomApi, orgApi, platformApi } from '../../api/client';
import AdminShell from '../../components/admin/AdminShell';
import AdminSection from '../../components/admin/AdminSection';
import AdminTabs from '../../components/admin/AdminTabs';
import AdminStatCard from '../../components/admin/AdminStatCard';
import ClassroomCard from '../../components/admin/ClassroomCard';
import OrgAnalyticsView from '../../components/admin/OrgAnalyticsView';
import {
  roleLabel,
  highestRoleInOrg,
  canManageStructure,
  canCreateMembers,
  canCreateClassroom,
  isOrgLeaderRole,
} from '../../utils/orgRoles';

export default function OrgDashboard({ user: initialUser }) {
  const { orgId: routeOrgId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(initialUser);
  const orgId = routeOrgId || initialUser?.memberships?.[0]?.org?._id;
  const [org, setOrg] = useState(null);
  const [units, setUnits] = useState([]);
  const [members, setMembers] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [tab, setTab] = useState('classrooms');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const [unitForm, setUnitForm] = useState({ name: '', type: 'faculty', parentId: '' });
  const [memberForm, setMemberForm] = useState({
    email: '',
    name: '',
    password: '',
    role: 'instructor',
    orgUnitId: '',
  });
  const [classForm, setClassForm] = useState({ name: '', description: '', orgUnitId: '', joinCode: '' });
  const [creatableRoles, setCreatableRoles] = useState([]);
  const [createdCredentials, setCreatedCredentials] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsFilters, setAnalyticsFilters] = useState({
    facultyId: '',
    departmentId: '',
    instructorId: '',
    search: '',
  });
  const [classroomFilters, setClassroomFilters] = useState({
    facultyId: '',
    departmentId: '',
    instructorId: '',
    search: '',
  });

  const myRole = useMemo(() => highestRoleInOrg(user?.memberships || [], orgId), [user, orgId]);
  const faculties = units.filter((u) => u.type === 'faculty');
  const departments = units.filter((u) => u.type === 'department');

  const orgMembershipsInOrg = useMemo(
    () => (user?.memberships || []).filter((m) => String(m.org?._id || m.org) === String(orgId)),
    [user, orgId]
  );

  const isUniversityAdmin = orgMembershipsInOrg.some((m) => m.role === 'org_admin' && !m.orgUnit);
  const deanFacultyIds = orgMembershipsInOrg
    .filter((m) => m.role === 'org_admin' && m.orgUnit?._id)
    .map((m) => String(m.orgUnit._id));

  const myDepartments = useMemo(() => {
    if (myRole === 'org_admin') return departments;
    if (myRole === 'unit_admin') {
      const ids = orgMembershipsInOrg
        .filter((m) => m.role === 'unit_admin')
        .map((m) => String(m.orgUnit?._id));
      return departments.filter((d) => ids.includes(String(d._id)));
    }
    return departments;
  }, [myRole, departments, orgMembershipsInOrg]);

  const tabs = useMemo(() => {
    const items = [{ id: 'classrooms', label: 'Classrooms' }];
    const isSuper = user?.isSuperAdmin;
    if (isSuper || isOrgLeaderRole(myRole)) {
      items.push({ id: 'analytics', label: 'Analytics' });
    }
    if (isSuper || canManageStructure(myRole) || myRole === 'unit_admin') {
      items.push({ id: 'structure', label: 'Structure' });
    }
    if (isSuper || canCreateMembers(myRole)) {
      items.push({ id: 'members', label: 'Members' });
    }
    return items;
  }, [myRole, user?.isSuperAdmin]);

  const assignableUnits = useMemo(() => {
    const role = memberForm.role;
    if (role === 'org_admin') {
      if (myRole !== 'org_admin') return [];
      return isUniversityAdmin
        ? faculties
        : faculties.filter((f) => deanFacultyIds.includes(String(f._id)));
    }
    if (role === 'unit_admin' || role === 'instructor') {
      if (myRole === 'unit_admin') {
        const hodDeptIds = orgMembershipsInOrg
          .filter((m) => m.role === 'unit_admin')
          .map((m) => String(m.orgUnit?._id));
        return departments.filter((d) => hodDeptIds.includes(String(d._id)));
      }
      if (myRole === 'org_admin') {
        if (isUniversityAdmin) return departments;
        return departments.filter((d) => deanFacultyIds.includes(String(d.parentId)));
      }
    }
    return [];
  }, [
    memberForm.role,
    myRole,
    faculties,
    departments,
    isUniversityAdmin,
    deanFacultyIds,
    orgMembershipsInOrg,
  ]);

  const departmentById = useMemo(
    () => Object.fromEntries(departments.map((d) => [String(d._id), d])),
    [departments]
  );

  const instructorsInScope = useMemo(
    () =>
      members
        .filter((m) => m.role === 'instructor')
        .filter((m) => {
          const deptId = String(m.orgUnitId?._id || m.orgUnitId || '');
          return myDepartments.some((d) => String(d._id) === deptId);
        }),
    [members, myDepartments]
  );

  const visibleUnits = useMemo(() => {
    if (myRole === 'org_admin' && isUniversityAdmin) return units.filter((u) => u.type !== 'root');
    if (myRole === 'org_admin') {
      const deptIds = new Set(
        departments
          .filter((d) => deanFacultyIds.includes(String(d.parentId)))
          .map((d) => String(d._id))
      );
      return units.filter((u) => {
        if (u.type === 'faculty') return deanFacultyIds.includes(String(u._id));
        if (u.type === 'department') return deptIds.has(String(u._id));
        return false;
      });
    }
    if (myRole === 'unit_admin') {
      const myDeptIds = new Set(
        orgMembershipsInOrg
          .filter((m) => m.role === 'unit_admin')
          .map((m) => String(m.orgUnit?._id || m.orgUnit))
      );
      return units.filter((u) => u.type === 'department' && myDeptIds.has(String(u._id)));
    }
    return [];
  }, [myRole, isUniversityAdmin, units, departments, deanFacultyIds, orgMembershipsInOrg]);

  const filteredClassrooms = useMemo(() => {
    const q = classroomFilters.search.trim().toLowerCase();
    return classrooms.filter((c) => {
      const deptId = String(c.orgUnitId?._id || c.orgUnitId || '');
      const dept = departmentById[deptId];
      const facultyId = dept ? String(dept.parentId || '') : '';
      const creatorId = String(c.createdBy?._id || c.createdBy || '');
      if (classroomFilters.departmentId && deptId !== classroomFilters.departmentId) return false;
      if (classroomFilters.facultyId && facultyId !== classroomFilters.facultyId) return false;
      if (classroomFilters.instructorId && creatorId !== classroomFilters.instructorId) return false;
      if (
        q &&
        !(
          c.name?.toLowerCase().includes(q) ||
          c.slug?.toLowerCase().includes(q) ||
          c.orgUnitId?.name?.toLowerCase().includes(q) ||
          c.createdBy?.name?.toLowerCase().includes(q)
        )
      ) {
        return false;
      }
      return true;
    });
  }, [classrooms, classroomFilters, departmentById]);

  const classroomStats = useMemo(() => {
    const totalStudents = filteredClassrooms.reduce((sum, c) => sum + (c.stats?.activeStudents || 0), 0);
    const uniqueInstructors = new Set(
      filteredClassrooms.map((c) => String(c.createdBy?._id || c.createdBy || ''))
    );
    const byDept = {};
    for (const c of filteredClassrooms) {
      const deptId = String(c.orgUnitId?._id || c.orgUnitId || '');
      const deptName = c.orgUnitId?.name || departmentById[deptId]?.name || 'Unknown';
      if (!byDept[deptId]) byDept[deptId] = { deptName, classrooms: 0, students: 0 };
      byDept[deptId].classrooms += 1;
      byDept[deptId].students += c.stats?.activeStudents || 0;
    }
    return {
      totalStudents,
      instructorCount: [...uniqueInstructors].filter(Boolean).length,
      departmentRows: Object.values(byDept).sort((a, b) => b.students - a.students),
    };
  }, [filteredClassrooms, departmentById]);

  const primaryMembership = user?.memberships?.find((m) => String(m.org?._id) === String(orgId));
  const membersScopeLabel = useMemo(() => {
    if (user?.isSuperAdmin) return 'All members in this organization';
    if (myRole === 'org_admin' && isUniversityAdmin) {
      return 'All deans, HODs, and instructors in this university';
    }
    if (myRole === 'org_admin') return 'HODs and instructors under your faculty';
    if (myRole === 'unit_admin') return 'Instructors in your department(s)';
    return 'Members in your scope';
  }, [user?.isSuperAdmin, myRole, isUniversityAdmin]);
  const roleSubtitle = myRole ? roleLabel(myRole, primaryMembership?.orgUnit) : 'Member';
  const rootUnit = units.find((u) => u.type === 'root');

  const load = async () => {
    if (!orgId) return;
    try {
      const [meRes, orgRes, roomsRes, membersRes, rolesRes] = await Promise.all([
        authApi.me(),
        platformApi.getOrg(orgId),
        classroomApi.list(),
        orgApi.members(orgId),
        orgApi.creatableRoles(orgId).catch(() => ({ data: { roles: [] } })),
      ]);
      setUser(meRes.data.user);
      setOrg(orgRes.data.org);
      setUnits(orgRes.data.units || []);
      setMembers(membersRes.data.members || []);
      setCreatableRoles(rolesRes.data.roles || []);
      setClassrooms(roomsRes.data.filter((c) => String(c.orgId) === String(orgId)));
    } catch {
      setMessage('Failed to load organization');
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async (customFilters = analyticsFilters) => {
    if (!orgId) return;
    setAnalyticsLoading(true);
    try {
      const res = await platformApi.orgAnalytics(orgId, customFilters);
      setAnalytics(res.data);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to load analytics');
    } finally {
      setAnalyticsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [orgId]);

  useEffect(() => {
    if (tab === 'analytics') loadAnalytics();
  }, [tab, orgId, analyticsFilters.facultyId, analyticsFilters.departmentId, analyticsFilters.instructorId]);

  useEffect(() => {
    if (creatableRoles.length && !creatableRoles.includes(memberForm.role)) {
      setMemberForm((f) => ({ ...f, role: creatableRoles[0], orgUnitId: '' }));
    }
  }, [creatableRoles]);

  useEffect(() => {
    if (assignableUnits.length === 1) {
      const onlyId = String(assignableUnits[0]._id);
      if (memberForm.orgUnitId !== onlyId) {
        setMemberForm((f) => ({ ...f, orgUnitId: onlyId }));
      }
    }
  }, [assignableUnits, memberForm.role]);

  useEffect(() => {
    if (!rootUnit) return;
    setUnitForm((f) => {
      if (f.type === 'faculty' && !f.parentId) {
        return { ...f, parentId: String(rootUnit._id) };
      }
      if (f.type === 'department' && !f.parentId && faculties.length === 1) {
        return { ...f, parentId: String(faculties[0]._id) };
      }
      return f;
    });
  }, [rootUnit, faculties.length, unitForm.type]);

  useEffect(() => {
    if (!tabs.some((t) => t.id === tab)) {
      setTab(tabs[0]?.id || 'classrooms');
    }
  }, [tabs, tab]);

  const handleCreateUnit = async (e) => {
    e.preventDefault();
    try {
      await platformApi.createUnit(orgId, unitForm);
      setUnitForm({ name: '', type: 'faculty', parentId: '' });
      setMessage('Unit created');
      load();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to create unit');
    }
  };

  const handleVisibility = async (unitId, visibility) => {
    try {
      await platformApi.updateUnit(orgId, unitId, { settings: { instructorVisibility: visibility } });
      setMessage(
        visibility === 'own'
          ? 'Instructors see only their own classrooms'
          : 'Instructors share visibility within department'
      );
      load();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to update setting');
    }
  };

  const handleCreateMember = async (e) => {
    e.preventDefault();
    setCreatedCredentials(null);
    try {
      const res = await orgApi.createMember(orgId, memberForm);
      setMessage(res.data.message);
      if (res.data.credentials) setCreatedCredentials(res.data.credentials);
      setMemberForm({ email: '', name: '', password: '', role: memberForm.role, orgUnitId: '' });
      load();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to create account');
    }
  };

  const handleCreateClassroom = async (e) => {
    e.preventDefault();
    try {
      await classroomApi.create({ ...classForm, orgId });
      setClassForm({ name: '', description: '', orgUnitId: classForm.orgUnitId, joinCode: '' });
      setShowCreate(false);
      setMessage('Classroom created');
      load();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to create classroom');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    navigate('/admin/login');
  };

  if (!orgId) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-600">No organization assigned to your account.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500 animate-pulse">Loading organization…</p>
      </div>
    );
  }

  const dashboardTitle =
    myRole === 'org_admin'
      ? isUniversityAdmin
        ? org?.name || 'University'
        : `Dean — ${primaryMembership?.orgUnit?.name || org?.name}`
      : myRole === 'unit_admin'
        ? `HOD — ${primaryMembership?.orgUnit?.name || org?.name}`
        : org?.name || 'Organization';

  return (
    <AdminShell
      title={dashboardTitle}
      subtitle={`Signed in as ${roleSubtitle}`}
      backTo={user?.isSuperAdmin ? '/admin' : undefined}
      backLabel="← Platform"
      actions={
        <div className="flex items-center gap-2">
          {canCreateClassroom(myRole) && tab === 'classrooms' && (
            <button type="button" onClick={() => setShowCreate(!showCreate)} className="btn-primary text-sm">
              {showCreate ? 'Cancel' : '+ Classroom'}
            </button>
          )}
          <button type="button" onClick={logout} className="btn-secondary text-sm">
            Logout
          </button>
        </div>
      }
    >
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
        <AdminStatCard label="Classrooms" value={filteredClassrooms.length} accent="brand" compact />
        <AdminStatCard label="Students" value={classroomStats.totalStudents} accent="emerald" compact delay={0.03} />
        {myRole === 'org_admin' ? (
          <AdminStatCard label="Faculties" value={faculties.length} accent="violet" compact delay={0.06} />
        ) : (
          <AdminStatCard label="Departments" value={myDepartments.length} accent="violet" compact delay={0.06} />
        )}
        <AdminStatCard
          label="Instructors"
          value={classroomStats.instructorCount}
          accent="sky"
          compact
          delay={0.09}
        />
      </div>

      {message && (
        <div className="mb-4 px-4 py-2.5 rounded-xl bg-brand-50 border border-brand-100 text-sm text-brand-800 break-all">
          {message}
        </div>
      )}

      <AdminTabs tabs={tabs} active={tab} onChange={setTab} label="Organization dashboard" />

      {tab === 'classrooms' && (
        <div className="space-y-4">
          {showCreate && canCreateClassroom(myRole) && (
            <AdminSection eyebrow="Create" title="New classroom" accent="brand">
              <form onSubmit={handleCreateClassroom} className="space-y-3">
                <div className="grid sm:grid-cols-2 gap-3">
                  <input
                    className="input"
                    placeholder="Classroom name *"
                    value={classForm.name}
                    onChange={(e) => setClassForm({ ...classForm, name: e.target.value })}
                    required
                  />
                  <select
                    className="input"
                    value={classForm.orgUnitId}
                    onChange={(e) => setClassForm({ ...classForm, orgUnitId: e.target.value })}
                    required
                  >
                    <option value="">Select department *</option>
                    {myDepartments.map((d) => (
                      <option key={d._id} value={d._id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
                <input
                  className="input"
                  placeholder="Description (optional)"
                  value={classForm.description}
                  onChange={(e) => setClassForm({ ...classForm, description: e.target.value })}
                />
                <button type="submit" className="btn-primary text-sm">
                  Create Classroom
                </button>
              </form>
            </AdminSection>
          )}

          <AdminSection
            eyebrow={myRole === 'org_admin' ? 'Organization' : 'Department scope'}
            title={`Classrooms (${filteredClassrooms.length})`}
            subtitle={
              myRole === 'org_admin'
                ? 'All classrooms under your authority — filter by faculty, department, or instructor.'
                : 'Classrooms in departments you manage.'
            }
            accent="violet"
            noPadding
            headerAction={
              <input
                className="input text-sm max-w-[200px] py-2"
                placeholder="Search…"
                value={classroomFilters.search}
                onChange={(e) => setClassroomFilters((f) => ({ ...f, search: e.target.value }))}
              />
            }
          >
            <div className="px-4 sm:px-6 py-3 border-b border-slate-100 flex flex-wrap gap-2">
              {myRole === 'org_admin' && (
                <select
                  className="input text-sm py-2 max-w-[160px]"
                  value={classroomFilters.facultyId}
                  onChange={(e) =>
                    setClassroomFilters((f) => ({ ...f, facultyId: e.target.value, departmentId: '' }))
                  }
                >
                  <option value="">All faculties</option>
                  {faculties.map((f) => (
                    <option key={f._id} value={String(f._id)}>
                      {f.name}
                    </option>
                  ))}
                </select>
              )}
              <select
                className="input text-sm py-2 max-w-[160px]"
                value={classroomFilters.departmentId}
                onChange={(e) => setClassroomFilters((f) => ({ ...f, departmentId: e.target.value }))}
              >
                <option value="">All departments</option>
                {myDepartments
                  .filter((d) =>
                    classroomFilters.facultyId ? String(d.parentId) === classroomFilters.facultyId : true
                  )
                  .map((d) => (
                    <option key={d._id} value={String(d._id)}>
                      {d.name}
                    </option>
                  ))}
              </select>
              <select
                className="input text-sm py-2 max-w-[160px]"
                value={classroomFilters.instructorId}
                onChange={(e) => setClassroomFilters((f) => ({ ...f, instructorId: e.target.value }))}
              >
                <option value="">All instructors</option>
                {instructorsInScope.map((m) => (
                  <option key={m._id} value={String(m.userId?._id)}>
                    {m.userId?.name}
                  </option>
                ))}
              </select>
            </div>

            {classroomStats.departmentRows.length > 0 && (
              <div className="px-4 sm:px-6 py-3 border-b border-slate-100 bg-slate-50/50">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                  By department
                </p>
                <div className="flex flex-wrap gap-2">
                  {classroomStats.departmentRows.slice(0, 6).map((row) => (
                    <span
                      key={row.deptName}
                      className="text-xs px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700"
                    >
                      <span className="font-semibold">{row.deptName}</span>
                      <span className="text-slate-500 ml-1">
                        {row.classrooms} · {row.students} students
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {filteredClassrooms.length ? (
              <div className="p-4 sm:p-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredClassrooms.map((c) => {
                  const deptId = String(c.orgUnitId?._id || c.orgUnitId || '');
                  return (
                    <ClassroomCard
                      key={c._id}
                      classroom={c}
                      departmentName={c.orgUnitId?.name || departmentById[deptId]?.name}
                      instructorName={c.createdBy?.name}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="px-6 py-12 text-center">
                <p className="font-semibold text-slate-800">No classrooms found</p>
                <p className="text-sm text-slate-500 mt-1">Adjust filters or create a classroom.</p>
              </div>
            )}
          </AdminSection>
        </div>
      )}

      {tab === 'analytics' && (
        <AdminSection
          eyebrow="Analytics"
          title="Organization analytics"
          subtitle="Hierarchical view scoped to your role — compare and drill down into everything below you."
          accent="sky"
          noPadding
        >
          <div className="px-4 sm:px-6 py-4">
            <OrgAnalyticsView
              analytics={analytics}
              loading={analyticsLoading}
              myRole={user?.isSuperAdmin ? 'super_admin' : myRole}
              isUniversityAdmin={user?.isSuperAdmin || isUniversityAdmin}
              faculties={faculties}
              myDepartments={myDepartments}
              instructorsInScope={instructorsInScope}
              filters={analyticsFilters}
              onFiltersChange={setAnalyticsFilters}
              onRefresh={() => loadAnalytics()}
            />
          </div>
        </AdminSection>
      )}

      {tab === 'structure' && (
        <div className="space-y-4">
          {canManageStructure(myRole) && (
            <AdminSection
              eyebrow="Hierarchy"
              title="Add faculty or department"
              subtitle="Faculty = Dean level · Department = HOD level · Classrooms live under departments."
              accent="brand"
            >
              <form onSubmit={handleCreateUnit} className="space-y-3">
                <div className="grid sm:grid-cols-3 gap-3">
                  <input
                    className="input"
                    placeholder="Name *"
                    value={unitForm.name}
                    onChange={(e) => setUnitForm({ ...unitForm, name: e.target.value })}
                    required
                  />
                  <select
                    className="input"
                    value={unitForm.type}
                    onChange={(e) => setUnitForm({ ...unitForm, type: e.target.value, parentId: '' })}
                  >
                    <option value="faculty">Faculty (Dean)</option>
                    <option value="department">Department (HOD)</option>
                  </select>
                  <select
                    className="input"
                    value={unitForm.parentId}
                    onChange={(e) => setUnitForm({ ...unitForm, parentId: e.target.value })}
                    required
                  >
                    <option value="">Parent unit *</option>
                    {unitForm.type === 'faculty' && rootUnit && (
                      <option value={String(rootUnit._id)}>{rootUnit.name} (University)</option>
                    )}
                    {unitForm.type === 'department' &&
                      (isUniversityAdmin
                        ? faculties
                        : faculties.filter((f) => deanFacultyIds.includes(String(f._id)))
                      ).map((f) => (
                        <option key={f._id} value={String(f._id)}>
                          {f.name}
                        </option>
                      ))}
                  </select>
                </div>
                <button type="submit" className="btn-primary text-sm">
                  Add unit
                </button>
              </form>
            </AdminSection>
          )}

          <AdminSection
            eyebrow="Tree"
            title="Organization structure"
            subtitle={
              myRole === 'unit_admin'
                ? 'Your departments and instructor data visibility settings.'
                : 'University → Faculty (Dean) → Department (HOD) → Classrooms'
            }
            accent="violet"
          >
            <div className="space-y-2">
              {visibleUnits.length ? (
                visibleUnits.map((unit) => (
                  <div
                    key={unit._id}
                    className={`rounded-xl border px-4 py-3 ${
                      unit.type === 'faculty'
                        ? 'border-violet-200 bg-violet-50/30'
                        : 'border-slate-200 bg-white ml-0 sm:ml-6'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">{unit.name}</p>
                        <p className="text-xs text-slate-500 capitalize">{unit.type}</p>
                      </div>
                      {unit.type === 'department' && (myRole === 'org_admin' || myRole === 'unit_admin') && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500">Instructor data:</span>
                          <select
                            className="input text-sm py-1.5 max-w-[11rem]"
                            value={unit.settings?.instructorVisibility || 'own'}
                            onChange={(e) => handleVisibility(unit._id, e.target.value)}
                          >
                            <option value="own">Own classrooms only</option>
                            <option value="unit_shared">Shared in department</option>
                          </select>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500 py-4 text-center">
                  {canManageStructure(myRole)
                    ? 'No units yet — add a faculty or department above.'
                    : 'No departments in your scope.'}
                </p>
              )}
            </div>
          </AdminSection>
        </div>
      )}

      {tab === 'members' && (
        <div className="space-y-4">
          {canCreateMembers(myRole) && (
            <AdminSection eyebrow="Accounts" title="Create member account" accent="brand">
              <form onSubmit={handleCreateMember} className="space-y-3">
                <div className="grid sm:grid-cols-2 gap-3">
                  <input
                    className="input"
                    placeholder="Full name *"
                    value={memberForm.name}
                    onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })}
                    required
                  />
                  <input
                    className="input"
                    type="email"
                    placeholder="Email (login) *"
                    value={memberForm.email}
                    onChange={(e) => setMemberForm({ ...memberForm, email: e.target.value })}
                    required
                  />
                  <input
                    className="input"
                    type="password"
                    placeholder="Password * (min 6 chars)"
                    value={memberForm.password}
                    onChange={(e) => setMemberForm({ ...memberForm, password: e.target.value })}
                    required
                    minLength={6}
                  />
                  <select
                    className="input"
                    value={memberForm.role}
                    onChange={(e) =>
                      setMemberForm({ ...memberForm, role: e.target.value, orgUnitId: '' })
                    }
                    disabled={!creatableRoles.length}
                  >
                    {creatableRoles.length ? (
                      creatableRoles.map((r) => (
                        <option key={r} value={r}>
                          {r === 'org_admin'
                            ? 'Dean (org admin)'
                            : r === 'unit_admin'
                              ? 'HOD'
                              : 'Instructor'}
                        </option>
                      ))
                    ) : (
                      <option value="">No roles available</option>
                    )}
                  </select>
                  {assignableUnits.length > 0 ? (
                    <select
                      className="input sm:col-span-2"
                      value={memberForm.orgUnitId}
                      onChange={(e) => setMemberForm({ ...memberForm, orgUnitId: e.target.value })}
                      required
                    >
                      <option value="">Assign to unit *</option>
                      {assignableUnits.map((u) => (
                        <option key={u._id} value={String(u._id)}>
                          {u.name} ({u.type === 'faculty' ? 'Faculty' : 'Department'})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="sm:col-span-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                      <p className="font-medium">No units available for this role</p>
                      <p className="text-xs mt-1">
                        {memberForm.role === 'org_admin'
                          ? 'Add a Faculty under Structure first.'
                          : 'Add a Department under Structure first.'}
                      </p>
                      {canManageStructure(myRole) && (
                        <button
                          type="button"
                          onClick={() => setTab('structure')}
                          className="text-xs font-semibold text-brand-600 mt-2 hover:underline"
                        >
                          Go to Structure →
                        </button>
                      )}
                    </div>
                  )}
                </div>
                <button
                  type="submit"
                  className="btn-primary text-sm"
                  disabled={!assignableUnits.length || !creatableRoles.length}
                >
                  Create account
                </button>
              </form>

              {createdCredentials && (
                <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm">
                  <p className="font-semibold text-emerald-900">Login credentials (share with user)</p>
                  <p className="mt-2">
                    Email: <strong>{createdCredentials.email}</strong>
                  </p>
                  <p>
                    Password: <strong>{createdCredentials.password}</strong>
                  </p>
                </div>
              )}
            </AdminSection>
          )}

          <AdminSection
            eyebrow="Team"
            title={`Members (${members.length})`}
            subtitle={membersScopeLabel}
            accent="violet"
            noPadding
          >
            <div className="max-h-[min(420px,55vh)] overflow-auto divide-y divide-slate-100">
              {members.length ? (
                members.map((m) => (
                  <div
                    key={m._id}
                    className="px-4 sm:px-6 py-3 flex flex-wrap justify-between gap-2 bg-white hover:bg-slate-50/80"
                  >
                    <div>
                      <p className="font-semibold text-slate-900">{m.userId?.name}</p>
                      <p className="text-xs text-slate-500">{m.userId?.email}</p>
                    </div>
                    <span className="text-xs font-bold px-2 py-1 rounded-md bg-slate-100 text-slate-700 h-fit">
                      {roleLabel(m.role, m.orgUnitId || m.orgUnit)}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500 text-center py-10">No members in your scope yet</p>
              )}
            </div>
          </AdminSection>
        </div>
      )}
    </AdminShell>
  );
}
