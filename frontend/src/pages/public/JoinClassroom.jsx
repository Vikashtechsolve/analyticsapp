import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { publicApi } from '../../api/client';

export default function JoinClassroom() {
  const { slug } = useParams();
  const [classroom, setClassroom] = useState(null);
  const [divisions, setDivisions] = useState([]);
  const [form, setForm] = useState({
    displayName: '',
    leetcodeUsername: '',
    divisionId: '',
    joinCode: '',
  });
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    publicApi.classroom(slug).then((res) => {
      setClassroom(res.data.classroom);
      setDivisions(res.data.divisions);
      if (res.data.divisions.length) {
        setForm((f) => ({ ...f, divisionId: res.data.divisions[0]._id }));
      }
    });
  }, [slug]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: '', message: '' });
    try {
      const res = await publicApi.join(slug, form);
      setStatus({ type: 'success', message: res.data.message });
    } catch (err) {
      setStatus({
        type: 'error',
        message: err.response?.data?.message || 'Join failed',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!classroom) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="card max-w-md w-full">
        <Link to={`/c/${slug}`} className="text-brand-500 text-sm hover:underline">
          ← Back to dashboard
        </Link>
        <h1 className="text-xl font-bold mt-3">Join {classroom.name}</h1>
        <p className="text-slate-400 text-sm mb-6">
          Submit your LeetCode profile. An instructor will approve your request.
        </p>

        {status.message && (
          <div
            className={`mb-4 p-3 rounded-lg text-sm ${
              status.type === 'success'
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
            }`}
          >
            {status.message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-slate-400 block mb-1">Your Name</label>
            <input
              className="input"
              value={form.displayName}
              onChange={(e) => setForm({ ...form, displayName: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="text-sm text-slate-400 block mb-1">LeetCode Username or URL</label>
            <input
              className="input"
              placeholder="username or https://leetcode.com/u/username/"
              value={form.leetcodeUsername}
              onChange={(e) => setForm({ ...form, leetcodeUsername: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="text-sm text-slate-400 block mb-1">Division</label>
            <select
              className="input"
              value={form.divisionId}
              onChange={(e) => setForm({ ...form, divisionId: e.target.value })}
              required
            >
              {divisions.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm text-slate-400 block mb-1">Join Code (if required)</label>
            <input
              className="input"
              value={form.joinCode}
              onChange={(e) => setForm({ ...form, joinCode: e.target.value })}
            />
          </div>
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'Submitting...' : 'Request to Join'}
          </button>
        </form>
      </div>
    </div>
  );
}
