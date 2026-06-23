import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi, classroomApi, platformApi } from '../../api/client';
import AdminShell from '../../components/admin/AdminShell';
import AdminSection from '../../components/admin/AdminSection';
import AdminTabs from '../../components/admin/AdminTabs';
import AdminStatCard from '../../components/admin/AdminStatCard';
import ClassroomCard from '../../components/admin/ClassroomCard';
import OrgAnalyticsView from '../../components/admin/OrgAnalyticsView';
import { roleLabel, highestRoleInOrg, canCreateClassroom } from '../../utils/orgRoles';

export default function InstructorOrgDashboard({ user: initialUser }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(initialUser);
  const orgId = initialUser?.memberships?.[0]?.org?._id;
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('classrooms');
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', orgUnitId: '', joinCode: '' });
  const [message, setMessage] = useState('');
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsFilters, setAnalyticsFilters] = useState({
    facultyId: '',
    departmentId: '',
    instructorId: '',
    search: '',
  });

  const myRole = useMemo(() => highestRoleInOrg(user?.memberships || [], orgId), [user, orgId]);
  const primaryMembership = user?.memberships?.find((m) => String(m.org?._id) === String(orgId));
  const deptName = primaryMembership?.orgUnit?.name;

  const myDepartments = useMemo(() => {
    const seen = new Set();
    return (user?.memberships || [])
      .filter((m) => String(m.org?._id) === String(orgId) && m.role === 'instructor' && m.orgUnit)
      .map((m) => m.orgUnit)
      .filter((d) => {
        const id = String(d._id);
        if (seen.has(id)) return false;
        seen.add(id);
        return true;
      });
  }, [user, orgId]);

  const load = async () => {
    try {
      const [meRes, roomsRes] = await Promise.all([authApi.me(), classroomApi.list()]);
      setUser(meRes.data.user);
      const orgRooms = roomsRes.data.filter((c) => String(c.orgId) === String(orgId));
      setClassrooms(orgRooms);
      const deptId = meRes.data.user?.memberships?.find(
        (m) => String(m.org?._id) === String(orgId) && m.orgUnit
      )?.orgUnit?._id;
      if (deptId) {
        setForm((f) => (f.orgUnitId ? f : { ...f, orgUnitId: String(deptId) }));
      }
    } catch {
      navigate('/admin/login');
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    if (!orgId) return;
    setAnalyticsLoading(true);
    try {
      const res = await platformApi.orgAnalytics(orgId, analyticsFilters);
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
  }, [tab, orgId, analyticsFilters.departmentId, analyticsFilters.instructorId]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return classrooms.filter((c) => {
      if (q && !c.name?.toLowerCase().includes(q) && !c.slug?.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  }, [classrooms, search]);

  const totalStudents = filtered.reduce((sum, c) => sum + (c.stats?.activeStudents || 0), 0);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await classroomApi.create({ ...form, orgId });
      setForm({ name: '', description: '', orgUnitId: form.orgUnitId, joinCode: '' });
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

  const tabs = [
    { id: 'classrooms', label: 'Classrooms' },
    { id: 'analytics', label: 'Analytics' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500 animate-pulse">Loading…</p>
      </div>
    );
  }

  const orgName = primaryMembership?.org?.name || 'Organization';

  return (
    <AdminShell
      title={`${user?.name?.split(' ')[0] || 'Instructor'}'s classrooms`}
      subtitle={
        <>
          {roleLabel(myRole, primaryMembership?.orgUnit)} · {orgName}
          {deptName && <span className="text-slate-500"> · {deptName}</span>}
        </>
      }
      actions={
        <div className="flex gap-2">
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
      <div className="grid grid-cols-3 gap-2 mb-4">
        <AdminStatCard label="My classrooms" value={filtered.length} accent="brand" compact />
        <AdminStatCard label="Students" value={totalStudents} accent="emerald" compact delay={0.03} />
        <AdminStatCard label="Department" value={deptName || '—'} accent="violet" compact delay={0.06} />
      </div>

      {message && (
        <div className="mb-3 px-3 py-2 rounded-lg bg-brand-50 border border-brand-100 text-sm text-brand-800">
          {message}
        </div>
      )}

      <AdminTabs tabs={tabs} active={tab} onChange={setTab} label="Instructor dashboard" />

      {tab === 'classrooms' && (
        <>
          {showCreate && (
            <AdminSection eyebrow="Create" title="New classroom" accent="brand" className="mb-4">
              <form onSubmit={handleCreate} className="space-y-3">
                <div className="grid sm:grid-cols-2 gap-3">
                  <input
                    className="input"
                    placeholder="Classroom name *"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                  <input
                    className="input"
                    placeholder="Join code (optional)"
                    value={form.joinCode}
                    onChange={(e) => setForm({ ...form, joinCode: e.target.value })}
                  />
                </div>
                <input type="hidden" value={form.orgUnitId} readOnly />
                {deptName && (
                  <p className="text-xs text-slate-500">
                    Department: <span className="font-semibold text-slate-700">{deptName}</span>
                  </p>
                )}
                <input
                  className="input"
                  placeholder="Description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
                <button type="submit" className="btn-primary text-sm">
                  Create Classroom
                </button>
              </form>
            </AdminSection>
          )}

          <AdminSection
            eyebrow="Teaching"
            title={`Your classrooms (${filtered.length})`}
            subtitle="Manage students, sync LeetCode, and view insights per classroom."
            accent="violet"
            noPadding
            headerAction={
              <input
                className="input text-sm max-w-[180px] py-2"
                placeholder="Search…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            }
          >
            {filtered.length ? (
              <div className="p-4 sm:p-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filtered.map((c) => (
                  <ClassroomCard key={c._id} classroom={c} departmentName={c.orgUnitId?.name || deptName} />
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-sm text-center py-10">No classrooms assigned yet</p>
            )}
          </AdminSection>
        </>
      )}

      {tab === 'analytics' && (
        <AdminSection
          eyebrow="Analytics"
          title="Your teaching analytics"
          subtitle="Detailed performance for classrooms in your scope."
          accent="sky"
          noPadding
        >
          <div className="px-4 sm:px-6 py-4">
            <OrgAnalyticsView
              analytics={analytics}
              loading={analyticsLoading}
              myRole={myRole}
              isUniversityAdmin={false}
              faculties={[]}
              myDepartments={myDepartments}
              instructorsInScope={[]}
              filters={analyticsFilters}
              onFiltersChange={setAnalyticsFilters}
              onRefresh={() => loadAnalytics()}
            />
          </div>
        </AdminSection>
      )}
    </AdminShell>
  );
}
