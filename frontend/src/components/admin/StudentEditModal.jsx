import { useEffect, useState } from 'react';

const emptyForm = {
  displayName: '',
  leetcodeUsername: '',
  institute: '',
  academicDepartment: '',
  graduationYear: '',
  enrollmentNumber: '',
  email: '',
  mobile: '',
  divisionId: '',
};

export default function StudentEditModal({ student, divisions, open, onClose, onSave, saving }) {
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!student || !open) return;
    setForm({
      displayName: student.displayName || '',
      leetcodeUsername: student.leetcodeUsername || '',
      institute: student.institute || '',
      academicDepartment: student.academicDepartment || '',
      graduationYear: student.graduationYear ? String(student.graduationYear) : '',
      enrollmentNumber: student.enrollmentNumber || '',
      email: student.email || '',
      mobile: student.mobile || '',
      divisionId: student.divisionId?._id || student.divisionId || '',
    });
    setError('');
  }, [student, open]);

  if (!open || !student) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await onSave(student._id, {
        displayName: form.displayName.trim(),
        leetcodeUsername: form.leetcodeUsername.trim(),
        institute: form.institute.trim(),
        academicDepartment: form.academicDepartment.trim(),
        graduationYear: form.graduationYear.trim() || null,
        enrollmentNumber: form.enrollmentNumber.trim(),
        email: form.email.trim(),
        mobile: form.mobile.trim(),
        divisionId: form.divisionId,
      });
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update student');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close"
      />
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl border border-slate-200">
        <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-brand-600">Edit student</p>
            <h2 className="text-lg font-bold text-slate-900 mt-0.5">{student.displayName}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="block sm:col-span-2">
              <span className="text-xs font-semibold text-slate-600 mb-1 block">Name</span>
              <input
                className="input text-sm"
                value={form.displayName}
                onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                required
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="text-xs font-semibold text-slate-600 mb-1 block">LeetCode username or URL</span>
              <input
                className="input text-sm"
                value={form.leetcodeUsername}
                onChange={(e) => setForm({ ...form, leetcodeUsername: e.target.value })}
                required
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-600 mb-1 block">Institute</span>
              <input
                className="input text-sm"
                value={form.institute}
                onChange={(e) => setForm({ ...form, institute: e.target.value })}
                placeholder="e.g. PIET"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-600 mb-1 block">Department</span>
              <input
                className="input text-sm"
                value={form.academicDepartment}
                onChange={(e) => setForm({ ...form, academicDepartment: e.target.value })}
                placeholder="e.g. IT"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-600 mb-1 block">Graduation year</span>
              <input
                className="input text-sm"
                type="number"
                min="2000"
                max="2100"
                value={form.graduationYear}
                onChange={(e) => setForm({ ...form, graduationYear: e.target.value })}
                placeholder="2027"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-600 mb-1 block">Division</span>
              <select
                className="input text-sm"
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
            </label>
            <label className="block sm:col-span-2">
              <span className="text-xs font-semibold text-slate-600 mb-1 block">Enrollment number</span>
              <input
                className="input text-sm font-mono"
                value={form.enrollmentNumber}
                onChange={(e) => setForm({ ...form, enrollmentNumber: e.target.value })}
                placeholder="2403031080098"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-600 mb-1 block">University email</span>
              <input
                className="input text-sm"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="student@paruluniversity.ac.in"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-600 mb-1 block">Mobile (optional)</span>
              <input
                className="input text-sm"
                value={form.mobile}
                onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                placeholder="9876543210"
              />
            </label>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm px-3 py-2">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button type="button" onClick={onClose} className="btn-secondary text-sm" disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn-primary text-sm disabled:opacity-50" disabled={saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
