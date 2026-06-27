import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { classroomApi, divisionApi, studentApi } from '../../api/client';
import BulkEnrollment from '../../components/BulkEnrollment';
import AdminShell from '../../components/admin/AdminShell';
import AdminSection from '../../components/admin/AdminSection';
import AdminTabs from '../../components/admin/AdminTabs';
import AdminStatCard from '../../components/admin/AdminStatCard';
import SyncButton from '../../components/admin/SyncButton';
import StudentsRoster from '../../components/admin/StudentsRoster';
import StudentEditModal from '../../components/admin/StudentEditModal';
import InsightsTab from '../../components/admin/InsightsTab';
import StudentFinderTab from '../../components/admin/StudentFinderTab';
import StudentAdminMeta from '../../components/admin/StudentAdminMeta';
import ClassroomManageSkeleton from '../../components/admin/ClassroomManageSkeleton';

export default function ClassroomManage() {
  const { id } = useParams();
  const [classroom, setClassroom] = useState(null);
  const [divisions, setDivisions] = useState([]);
  const [students, setStudents] = useState([]);
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [tab, setTab] = useState('students');
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [syncProgress, setSyncProgress] = useState(null);
  const [studentForm, setStudentForm] = useState({
    displayName: '',
    leetcodeUsername: '',
    divisionId: '',
  });
  const [divisionForm, setDivisionForm] = useState({ name: '' });
  const [message, setMessage] = useState('');
  const [bulkLoading, setBulkLoading] = useState(false);
  const [teacherInsights, setTeacherInsights] = useState(null);
  const [teacherLoading, setTeacherLoading] = useState(false);
  const [insightsDivisionId, setInsightsDivisionId] = useState('');
  const [finderDivisionId, setFinderDivisionId] = useState('');
  const [editingStudent, setEditingStudent] = useState(null);
  const [savingStudent, setSavingStudent] = useState(false);

  const activeStudents = students.filter((s) => s.status === 'active');

  const load = async () => {
    try {
      const [roomRes, studentRes, pendingRes] = await Promise.all([
        classroomApi.get(id),
        studentApi.list(id),
        studentApi.list(id, { status: 'pending' }),
      ]);
      setClassroom(roomRes.data.classroom);
      setDivisions(roomRes.data.divisions);
      setStudents(studentRes.data);
      setPending(pendingRes.data);
      setLoadError('');
      if (roomRes.data.divisions.length && !studentForm.divisionId) {
        setStudentForm((f) => ({ ...f, divisionId: roomRes.data.divisions[0]._id }));
      }
    } catch (err) {
      setLoadError(err.response?.data?.message || 'Failed to load classroom');
      setClassroom(null);
    }
  };

  const loadTeacherDashboard = async (divisionId = '') => {
    setTeacherLoading(true);
    try {
      const res = await classroomApi.teacherDashboard(id, divisionId || undefined);
      setTeacherInsights(res.data);
    } catch {
      setTeacherInsights(null);
    } finally {
      setTeacherLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      await load();
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (tab === 'insights') {
      loadTeacherDashboard(insightsDivisionId);
    }
  }, [tab, insightsDivisionId, id]);

  const handleAddStudent = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      await studentApi.create(id, studentForm);
      setStudentForm({ displayName: '', leetcodeUsername: '', divisionId: studentForm.divisionId });
      setShowAddStudent(false);
      setMessage('Student added');
      load();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to add student');
    }
  };

  const handleBulkEnroll = async (payload) => {
    setBulkLoading(true);
    setMessage('');
    try {
      const res = await studentApi.bulk(id, payload);
      load();
      return res.data;
    } catch (err) {
      return { error: err.response?.data?.message || 'Bulk enrollment failed' };
    } finally {
      setBulkLoading(false);
    }
  };

  const handleAddDivision = async (e) => {
    e.preventDefault();
    await divisionApi.create(id, divisionForm);
    setDivisionForm({ name: '' });
    setMessage('Division added');
    load();
  };

  const handleApprove = async (studentId, action) => {
    await studentApi.approve(id, studentId, action);
    load();
  };

  const handleSync = async () => {
    const active = students.filter((s) => s.status === 'active');
    if (!active.length) {
      setSyncProgress({ error: 'No students', done: true });
      setTimeout(() => setSyncProgress(null), 2000);
      return;
    }

    const startedAt = Date.now();
    const batchSize = 6;
    let offset = 0;
    let total = active.length;
    let completed = 0;
    let ok = 0;
    let fail = 0;

    setSyncProgress({ total, completed: 0, startedAt });

    const pause = (ms) => new Promise((r) => setTimeout(r, ms));

    try {
      while (true) {
        const res = await classroomApi.syncBatch(id, { offset, limit: batchSize });
        const data = res.data;
        total = data.total ?? total;
        completed = data.completed ?? completed + (data.processed || 0);
        ok += data.ok || 0;
        fail += data.failed || 0;

        setSyncProgress({ total, completed, startedAt });

        if (!data.hasMore) break;
        offset = data.nextOffset ?? offset + (data.processed || batchSize);
        await pause(1000);
      }

      setSyncProgress({ total, completed, startedAt, done: true, ok, fail });
      await load();
      if (tab === 'insights') loadTeacherDashboard(insightsDivisionId);
      setTimeout(() => setSyncProgress(null), 4000);
    } catch (err) {
      const partial = completed > 0 ? ` (${completed}/${total} done)` : '';
      setSyncProgress({
        error: `Sync interrupted${partial}`,
        done: true,
        ok,
        fail,
        total,
        completed,
      });
      await load();
      setTimeout(() => setSyncProgress(null), 5000);
    }
  };

  const handleRemoveStudent = async (studentId) => {
    if (!window.confirm('Remove this student?')) return;
    await studentApi.remove(id, studentId);
    load();
  };

  const handleUpdateStudent = async (studentId, payload) => {
    setSavingStudent(true);
    setMessage('');
    try {
      await studentApi.update(id, studentId, payload);
      setMessage('Student updated');
      await load();
    } finally {
      setSavingStudent(false);
    }
  };

  const tabs = [
    { id: 'students', label: 'Students' },
    { id: 'insights', label: 'Insights' },
    { id: 'finder', label: 'Student Finder' },
    { id: 'enroll', label: 'Bulk Enroll' },
    { id: 'more', label: 'More', badge: pending.length },
  ];

  if (loading) {
    return (
      <AdminShell title="Classroom" subtitle="Loading…" backTo="/admin">
        <ClassroomManageSkeleton />
      </AdminShell>
    );
  }

  if (loadError || !classroom) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <p className="text-red-600 font-semibold">Could not load classroom</p>
          <p className="text-slate-600 mt-2">{loadError || 'Classroom not found'}</p>
          <Link to="/admin" className="inline-block mt-4 text-brand-600 font-medium hover:underline">
            Back to admin
          </Link>
        </div>
      </div>
    );
  }

  const lastSyncLabel = classroom.lastSyncedAt
    ? new Date(classroom.lastSyncedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    : 'Never';

  return (
    <AdminShell
      title={classroom.name}
      subtitle={
        <>
          <Link to={`/c/${classroom.slug}`} className="text-brand-600 font-medium hover:underline" target="_blank">
            /c/{classroom.slug} ↗
          </Link>
        </>
      }
      backTo="/admin"
      actions={<SyncButton progress={syncProgress} onClick={handleSync} />}
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-3">
        <AdminStatCard label="Students" value={activeStudents.length} accent="brand" compact />
        <AdminStatCard label="Divisions" value={divisions.length} accent="violet" compact delay={0.03} />
        <AdminStatCard label="Pending" value={pending.length} accent="amber" compact delay={0.06} />
        <AdminStatCard label="Last Sync" value={lastSyncLabel} accent="slate" compact delay={0.09} />
      </div>

      <AdminTabs tabs={tabs} active={tab} onChange={setTab} label="Classroom management" />

      {message && (
        <div className="mb-3 px-3 py-2 rounded-lg bg-brand-50 border border-brand-100 text-sm text-brand-800">
          {message}
        </div>
      )}

      {tab === 'students' && (
        <div className="space-y-3">
          <StudentsRoster
            students={students}
            divisions={divisions}
            classroomSlug={classroom.slug}
            onRemove={handleRemoveStudent}
            onEdit={setEditingStudent}
            onGoBulk={() => setTab('enroll')}
            headerAction={
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddStudent(!showAddStudent)}
                  className="btn-secondary text-xs py-1.5 px-3"
                >
                  {showAddStudent ? 'Close' : '+ Add student'}
                </button>
                <button type="button" onClick={() => setTab('enroll')} className="btn-secondary text-xs py-1.5 px-3">
                  Bulk enroll
                </button>
              </div>
            }
          />

          {showAddStudent && (
            <AdminSection eyebrow="Enroll" title="Add one student" accent="brand">
              <form onSubmit={handleAddStudent} className="grid sm:grid-cols-4 gap-2 items-end">
                <input
                  className="input text-sm"
                  placeholder="Display name"
                  value={studentForm.displayName}
                  onChange={(e) => setStudentForm({ ...studentForm, displayName: e.target.value })}
                  required
                />
                <input
                  className="input text-sm"
                  placeholder="LeetCode username"
                  value={studentForm.leetcodeUsername}
                  onChange={(e) => setStudentForm({ ...studentForm, leetcodeUsername: e.target.value })}
                  required
                />
                <select
                  className="input text-sm"
                  value={studentForm.divisionId}
                  onChange={(e) => setStudentForm({ ...studentForm, divisionId: e.target.value })}
                >
                  {divisions.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.name}
                    </option>
                  ))}
                </select>
                <button type="submit" className="btn-primary text-sm py-2">
                  Add
                </button>
              </form>
            </AdminSection>
          )}

          <StudentEditModal
            student={editingStudent}
            divisions={divisions}
            open={Boolean(editingStudent)}
            onClose={() => setEditingStudent(null)}
            onSave={handleUpdateStudent}
            saving={savingStudent}
          />
        </div>
      )}

      {tab === 'insights' && (
        <InsightsTab
          classroomSlug={classroom.slug}
          divisions={divisions}
          insights={teacherInsights}
          loading={teacherLoading}
          divisionId={insightsDivisionId}
          onDivisionChange={setInsightsDivisionId}
          onRefresh={() => loadTeacherDashboard(insightsDivisionId)}
        />
      )}

      {tab === 'enroll' && (
        <BulkEnrollment
          divisions={divisions}
          defaultDivisionId={studentForm.divisionId}
          onEnroll={handleBulkEnroll}
          loading={bulkLoading}
        />
      )}

      {tab === 'finder' && (
        <StudentFinderTab
          classroomId={id}
          classroomSlug={classroom.slug}
          divisions={divisions}
          divisionId={finderDivisionId}
          onDivisionChange={setFinderDivisionId}
        />
      )}

      {tab === 'more' && (
        <div className="space-y-4">
          <AdminSection
            eyebrow="Approvals"
            title={`Pending requests (${pending.length})`}
            accent="amber"
          >
            {pending.length ? (
              <ul className="space-y-2">
                {pending.map((s) => (
                  <li
                    key={s._id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <span className="font-semibold text-slate-900 text-sm">{s.displayName}</span>
                      <span className="text-slate-500 text-xs ml-2">@{s.leetcodeUsername}</span>
                      <StudentAdminMeta student={s} />
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => handleApprove(s._id, 'approve')} className="btn-primary text-xs py-1.5">
                        Approve
                      </button>
                      <button type="button" onClick={() => handleApprove(s._id, 'reject')} className="btn-secondary text-xs py-1.5">
                        Reject
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500 py-4 text-center">No pending join requests</p>
            )}
          </AdminSection>

          <AdminSection eyebrow="Organize" title="Divisions" accent="sky">
            <form onSubmit={handleAddDivision} className="flex flex-wrap gap-2 mb-4">
              <input
                className="input text-sm flex-1 min-w-[180px]"
                placeholder="New division name"
                value={divisionForm.name}
                onChange={(e) => setDivisionForm({ name: e.target.value })}
                required
              />
              <button type="submit" className="btn-primary text-sm py-2">
                Add
              </button>
            </form>
            {divisions.length ? (
              <div className="flex flex-wrap gap-2">
                {divisions.map((d) => {
                  const count = activeStudents.filter(
                    (s) => String(s.divisionId?._id) === String(d._id)
                  ).length;
                  return (
                    <span
                      key={d._id}
                      className="inline-flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50"
                    >
                      <span className="font-semibold text-slate-800">{d.name}</span>
                      <span className="text-xs text-slate-500">{count} students</span>
                    </span>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-slate-500">No divisions yet</p>
            )}
          </AdminSection>
        </div>
      )}
    </AdminShell>
  );
}
