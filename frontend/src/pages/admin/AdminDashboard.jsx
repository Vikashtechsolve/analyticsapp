import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi, classroomApi } from '../../api/client';
import AdminShell from '../../components/admin/AdminShell';
import AdminSection from '../../components/admin/AdminSection';
import AdminStatCard from '../../components/admin/AdminStatCard';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [instructor, setInstructor] = useState(null);
  const [classrooms, setClassrooms] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', joinCode: '' });
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const load = async () => {
    try {
      const [me, rooms] = await Promise.all([authApi.me(), classroomApi.list()]);
      setInstructor(me.data.instructor);
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

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/admin/login');
  };

  const copyLink = (slug) => {
    navigator.clipboard.writeText(`${window.location.origin}/c/${slug}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-pulse space-y-3 w-full max-w-md px-4">
          <div className="h-12 bg-white rounded-xl border border-slate-200" />
          <div className="h-32 bg-white rounded-xl border border-slate-200" />
        </div>
      </div>
    );
  }

  return (
    <AdminShell
      title={`Welcome, ${instructor?.name?.split(' ')[0] || 'Instructor'}`}
      subtitle="Manage classrooms, sync LeetCode data, and track student progress"
      actions={
        <>
          <button type="button" onClick={() => setShowCreate(!showCreate)} className="btn-primary text-sm">
            + New Classroom
          </button>
          <button type="button" onClick={handleLogout} className="btn-secondary text-sm">
            Logout
          </button>
        </>
      }
    >
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
        <AdminStatCard label="Classrooms" value={classrooms.length} accent="brand" />
        <AdminStatCard
          label="Active"
          value={classrooms.filter((c) => c.lastSyncedAt).length}
          accent="emerald"
          delay={0.05}
        />
        <AdminStatCard label="Instructor" value={instructor?.email?.split('@')[0] || '—'} accent="slate" delay={0.1} />
      </div>

      {showCreate && (
        <AdminSection
          eyebrow="Create"
          title="New classroom"
          subtitle="Set up a classroom for your students. Share the public link or join code after creation."
          accent="brand"
          className="mb-5"
        >
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Classroom name *</label>
                <input
                  className="input"
                  placeholder="e.g. CS 101 Spring 2026"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Join code (optional)</label>
                <input
                  className="input"
                  placeholder="For self-registration"
                  value={form.joinCode}
                  onChange={(e) => setForm({ ...form, joinCode: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Description</label>
              <input
                className="input"
                placeholder="Brief description for students"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="btn-primary" disabled={creating}>
                {creating ? 'Creating...' : 'Create Classroom'}
              </button>
              <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        </AdminSection>
      )}

      <AdminSection
        eyebrow="Your classes"
        title="Classrooms"
        subtitle={`${classrooms.length} classroom${classrooms.length !== 1 ? 's' : ''} under your account`}
        accent="violet"
        delay={0.05}
        icon={
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.628 48.628 0 0112 20.904a48.628 48.628 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.636 50.636 0 00-2.658-.813A59.906 59.906 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0112 13.489a50.717 50.717 0 017.74-3.342" />
          </svg>
        }
      >
        {!classrooms.length ? (
          <div className="text-center py-12 rounded-xl border border-dashed border-slate-200 bg-slate-50">
            <p className="text-slate-800 font-semibold">No classrooms yet</p>
            <p className="text-slate-500 text-sm mt-1">Create your first classroom to get started</p>
            <button type="button" onClick={() => setShowCreate(true)} className="btn-primary text-sm mt-4">
              + Create Classroom
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {classrooms.map((c, i) => (
              <div
                key={c._id}
                className="group rounded-xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-5 hover:border-brand-200 hover:shadow-md transition-all opacity-0 animate-fade-in-up"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-bold text-lg text-slate-900 truncate group-hover:text-brand-700 transition-colors">
                      {c.name}
                    </h3>
                    <p className="text-sm text-slate-600 mt-1 line-clamp-2">
                      {c.description || 'No description'}
                    </p>
                  </div>
                  <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-md bg-brand-50 text-brand-700 border border-brand-100">
                    {c.slug}
                  </span>
                </div>
                {c.lastSyncedAt && (
                  <p className="text-xs text-slate-500 mt-3">
                    Last synced {new Date(c.lastSyncedAt).toLocaleString()}
                  </p>
                )}
                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-100">
                  <Link to={`/admin/classrooms/${c._id}`} className="btn-primary text-sm">
                    Manage
                  </Link>
                  <Link to={`/c/${c.slug}`} className="btn-secondary text-sm" target="_blank">
                    Public View ↗
                  </Link>
                  <button type="button" onClick={() => copyLink(c.slug)} className="btn-secondary text-sm">
                    Copy Link
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </AdminSection>
    </AdminShell>
  );
}
