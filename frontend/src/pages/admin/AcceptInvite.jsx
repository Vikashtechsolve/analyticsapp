import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { inviteApi } from '../../api/client';

export default function AcceptInvite() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [invite, setInvite] = useState(null);
  const [form, setForm] = useState({ name: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    inviteApi
      .get(token)
      .then((res) => {
        setInvite(res.data);
        setForm((f) => ({ ...f, name: res.data.name || '' }));
      })
      .catch((err) => setError(err.response?.data?.message || 'Invalid invite'))
      .finally(() => setLoading(false));
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) {
      setError('Passwords do not match');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const res = await inviteApi.accept(token, { password: form.password, name: form.name });
      localStorage.setItem('token', res.data.token);
      navigate('/admin');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to accept invite');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500">Loading invite…</p>
      </div>
    );
  }

  if (!invite) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-red-600 font-medium">{error || 'Invite not found'}</p>
          <Link to="/admin/login" className="text-brand-600 text-sm mt-4 inline-block">
            Go to login
          </Link>
        </div>
      </div>
    );
  }

  const roleName =
    invite.role === 'org_admin'
      ? 'Dean / Org Admin'
      : invite.role === 'unit_admin'
        ? 'HOD'
        : 'Instructor';

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-brand-500 to-violet-500" />
        <div className="p-6 sm:p-8">
          <p className="admin-eyebrow">Invitation</p>
          <h1 className="text-xl font-bold text-slate-900 mt-1">Join {invite.org?.name}</h1>
          <p className="text-sm text-slate-600 mt-2">
            You are invited as <strong>{roleName}</strong>
            {invite.orgUnit ? ` for ${invite.orgUnit.name}` : ''}.
          </p>
          <p className="text-xs text-slate-500 mt-1">{invite.email}</p>

          {error && (
            <div className="mt-4 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <input
              className="input"
              placeholder="Your name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <input
              className="input"
              type="password"
              placeholder="Password (min 6 chars) *"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              minLength={6}
            />
            <input
              className="input"
              type="password"
              placeholder="Confirm password *"
              value={form.confirm}
              onChange={(e) => setForm({ ...form, confirm: e.target.value })}
              required
            />
            <button type="submit" className="btn-primary w-full" disabled={submitting}>
              {submitting ? 'Setting up…' : 'Accept & continue'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
