import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi, classroomApi } from '../../api/client';
import AdminShell from '../../components/admin/AdminShell';
import AdminSection from '../../components/admin/AdminSection';
import AdminStatCard from '../../components/admin/AdminStatCard';
import ClassroomCard from '../../components/admin/ClassroomCard';

export default function LegacyInstructorDashboard({ user: initialUser }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(initialUser);
  const [classrooms, setClassrooms] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', joinCode: '' });
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState('');

  const load = async () => {
    try {
      const [me, rooms] = await Promise.all([authApi.me(), classroomApi.list()]);
      setUser(me.data.user);
      setClassrooms(rooms.data);
    } catch {
      localStorage.removeItem('token');
      navigate('/admin/login');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await classroomApi.create(form);
      setForm({ name: '', description: '', joinCode: '' });
      setShowCreate(false);
      load();
    } finally {
      setCreating(false);
    }
  };

  const filtered = classrooms.filter((c) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return c.name?.toLowerCase().includes(q) || c.slug?.toLowerCase().includes(q);
  });

  const totalStudents = classrooms.reduce((sum, c) => sum + (c.stats?.activeStudents || 0), 0);

  const logout = () => {
    localStorage.removeItem('token');
    navigate('/admin/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500 animate-pulse">Loading…</p>
      </div>
    );
  }

  return (
    <AdminShell
      title={`Welcome, ${user?.name?.split(' ')[0] || 'Instructor'}`}
      subtitle="Manage your classrooms and track student progress"
      actions={
        <>
          <button type="button" onClick={() => setShowCreate(!showCreate)} className="btn-primary text-sm">
            {showCreate ? 'Cancel' : '+ Classroom'}
          </button>
          <button type="button" onClick={logout} className="btn-secondary text-sm">
            Logout
          </button>
        </>
      }
    >
      <div className="grid grid-cols-3 gap-2 mb-4">
        <AdminStatCard label="Classrooms" value={classrooms.length} accent="brand" compact />
        <AdminStatCard label="Students" value={totalStudents} accent="emerald" compact delay={0.03} />
        <AdminStatCard
          label="Synced"
          value={classrooms.filter((c) => c.lastSyncedAt).length}
          accent="sky"
          compact
          delay={0.06}
        />
      </div>

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
            <input
              className="input"
              placeholder="Description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
            <button type="submit" className="btn-primary text-sm" disabled={creating}>
              {creating ? 'Creating…' : 'Create Classroom'}
            </button>
          </form>
        </AdminSection>
      )}

      <AdminSection
        eyebrow="Classes"
        title={`Your classrooms (${filtered.length})`}
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
              <ClassroomCard key={c._id} classroom={c} />
            ))}
          </div>
        ) : (
          <p className="text-slate-500 text-sm text-center py-10">No classrooms yet</p>
        )}
      </AdminSection>
    </AdminShell>
  );
}
