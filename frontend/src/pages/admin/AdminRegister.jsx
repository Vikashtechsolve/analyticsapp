import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../../api/client';

export default function AdminRegister() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await authApi.register(form);
      localStorage.setItem('token', res.data.token);
      navigate('/admin');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md opacity-0 animate-fade-in-up">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-panel overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-brand-500 to-orange-500" />
          <div className="p-6 sm:p-8">
            <Link to="/" className="text-sm font-medium text-brand-600 hover:text-brand-700">
              ← Back to home
            </Link>
            <p className="section-eyebrow mt-4">Get started</p>
            <h1 className="text-2xl font-bold text-slate-900 mt-1">Create instructor account</h1>
            <p className="text-sm text-slate-600 mt-1">Set up classrooms and track LeetCode progress</p>

            {error && (
              <div className="mt-4 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Full name</label>
                <input
                  className="input"
                  placeholder="Dr. Jane Smith"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Email</label>
                <input
                  className="input"
                  type="email"
                  placeholder="you@university.edu"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Password</label>
                <input
                  className="input"
                  type="password"
                  placeholder="Min 6 characters"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  minLength={6}
                  required
                />
              </div>
              <button type="submit" className="btn-primary w-full py-2.5" disabled={loading}>
                {loading ? 'Creating...' : 'Create Account'}
              </button>
            </form>

            <p className="text-slate-600 text-sm mt-6 text-center">
              Already have an account?{' '}
              <Link to="/admin/login" className="text-brand-600 font-semibold hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
