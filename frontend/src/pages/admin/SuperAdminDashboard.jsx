import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { platformApi } from '../../api/client';
import AdminShell from '../../components/admin/AdminShell';
import AdminSection from '../../components/admin/AdminSection';
import AdminStatCard from '../../components/admin/AdminStatCard';

export default function SuperAdminDashboard({ user }) {
  const navigate = useNavigate();
  const [orgs, setOrgs] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    name: '',
    slug: '',
    adminName: '',
    adminEmail: '',
    adminPassword: '',
  });
  const [message, setMessage] = useState('');
  const [credentials, setCredentials] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const load = () => {
    platformApi
      .listOrgs()
      .then((res) => setOrgs(res.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    setMessage('');
    setCredentials(null);
    try {
      const res = await platformApi.createOrg(form);
      setMessage(res.data.message);
      setCredentials(res.data.credentials);
      setShowCreate(false);
      setForm({ name: '', slug: '', adminName: '', adminEmail: '', adminPassword: '' });
      load();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to create organization');
    } finally {
      setCreating(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    navigate('/admin/login');
  };

  return (
    <AdminShell
      title="Platform Admin"
      subtitle={`Signed in as ${user.name} — create universities and org admin accounts`}
      actions={
        <button type="button" onClick={logout} className="btn-secondary text-sm">
          Logout
        </button>
      }
    >
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
        <AdminStatCard label="Universities" value={orgs.length} accent="brand" />
        <AdminStatCard label="Role" value="Super Admin" accent="violet" delay={0.05} />
        <AdminStatCard label="Status" value="Active" accent="emerald" delay={0.1} />
      </div>

      {message && (
        <div className="mb-4 px-4 py-2.5 rounded-xl bg-brand-50 border border-brand-100 text-sm text-brand-800">
          {message}
        </div>
      )}

      {credentials && (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm">
          <p className="font-semibold text-emerald-900">Org admin login credentials (share with university)</p>
          <p className="mt-2">
            Email: <strong>{credentials.email}</strong>
          </p>
          <p>
            Password: <strong>{credentials.password}</strong>
          </p>
        </div>
      )}

      <div className="flex gap-2 mb-5">
        <button type="button" onClick={() => setShowCreate(!showCreate)} className="btn-primary text-sm">
          + New University
        </button>
      </div>

      {showCreate && (
        <AdminSection
          eyebrow="Onboard"
          title="Create university + org admin account"
          subtitle="You set the university admin's email and password directly"
          accent="brand"
          className="mb-5"
        >
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-3">
              <input
                className="input"
                placeholder="University name *"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
              <input
                className="input"
                placeholder="URL slug (optional)"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
              />
              <input
                className="input"
                placeholder="Org admin name *"
                value={form.adminName}
                onChange={(e) => setForm({ ...form, adminName: e.target.value })}
                required
              />
              <input
                className="input"
                type="email"
                placeholder="Org admin email *"
                value={form.adminEmail}
                onChange={(e) => setForm({ ...form, adminEmail: e.target.value })}
                required
              />
              <input
                className="input sm:col-span-2"
                type="password"
                placeholder="Org admin password * (min 6 chars)"
                value={form.adminPassword}
                onChange={(e) => setForm({ ...form, adminPassword: e.target.value })}
                required
                minLength={6}
              />
            </div>
            <button type="submit" className="btn-primary text-sm" disabled={creating}>
              {creating ? 'Creating…' : 'Create university & account'}
            </button>
          </form>
        </AdminSection>
      )}

      <AdminSection eyebrow="Tenants" title="Universities" subtitle="Organizations on the platform" accent="violet">
        {loading ? (
          <p className="text-slate-500 text-sm">Loading…</p>
        ) : !orgs.length ? (
          <p className="text-slate-500 text-sm">No organizations yet. Create the first university above.</p>
        ) : (
          <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 overflow-hidden">
            {orgs.map((org) => (
              <li
                key={org._id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 bg-white hover:bg-slate-50"
              >
                <div>
                  <p className="font-bold text-slate-900">{org.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">/{org.slug}</p>
                </div>
                <Link to={`/admin/orgs/${org._id}`} className="btn-secondary text-sm">
                  View org →
                </Link>
              </li>
            ))}
          </ul>
        )}
      </AdminSection>
    </AdminShell>
  );
}
