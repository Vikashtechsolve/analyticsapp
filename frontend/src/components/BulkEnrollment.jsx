import { useMemo, useRef, useState } from 'react';
import { parseBulkCsv, SAMPLE_CSV, SAMPLE_CSV_NOTES } from '../utils/parseBulkCsv';
import AdminSection from './admin/AdminSection';

export default function BulkEnrollment({ divisions, defaultDivisionId, onEnroll, loading }) {
  const fileRef = useRef(null);
  const [bulkText, setBulkText] = useState('');
  const [divisionId, setDivisionId] = useState(defaultDivisionId || '');
  const [results, setResults] = useState(null);
  const parsedRows = useMemo(() => parseBulkCsv(bulkText), [bulkText]);
  const rowCount = parsedRows.length;
  const defaultDivisionName = divisions.find((d) => String(d._id) === divisionId)?.name || 'default';

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setBulkText(ev.target.result);
      setResults(null);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const downloadTemplate = () => {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bulk-enrollment-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSubmit = async () => {
    const rows = parsedRows;
    if (!rows.length) {
      setResults({ error: 'No valid rows found. Check your CSV format.' });
      return;
    }
    const res = await onEnroll({
      students: rows.map(({ divisionId: _ignored, ...row }) => row),
      divisionId,
    });
    setResults(res);
    if (res?.summary?.added > 0 || res?.summary?.updated > 0) setBulkText('');
  };

  return (
    <div className="space-y-5">
      <AdminSection
        eyebrow="Import"
        title="Bulk enrollment"
        subtitle="Upload a CSV or paste students — institute, department, batch year, and enrollment details"
        accent="brand"
        icon={
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
        }
      >
        <div className="flex flex-wrap justify-end mb-4">
          <button type="button" onClick={downloadTemplate} className="btn-secondary text-sm">
            Download CSV Template
          </button>
        </div>

        <div className="grid lg:grid-cols-2 gap-4 mb-5">
          <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center bg-slate-50 hover:border-brand-300 hover:bg-brand-50/30 transition-colors">
            <p className="text-slate-700 font-medium text-sm mb-3">Upload CSV file</p>
            <input ref={fileRef} type="file" accept=".csv,.txt" onChange={handleFile} className="hidden" />
            <button type="button" onClick={() => fileRef.current?.click()} className="btn-primary text-sm">
              Choose File
            </button>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm space-y-3">
            <p className="font-semibold text-slate-800">CSV columns (in order)</p>
            <code className="block bg-white border border-slate-200 p-2 rounded-lg text-[11px] text-slate-700 leading-relaxed whitespace-pre-wrap">
              {`Institute, Department, Graduation year,
Division (optional), Enrollment number, Name,
Parul mail ID, Mobile number (optional), Leetcode`}
            </code>
            <div className="text-xs text-slate-600 space-y-2">
              <p>
                <span className="font-semibold text-slate-700">Division (optional):</span> leave the cell empty to
                use the default section below. If you enter A, B, etc., students are grouped under that section and
                appear when filtering by division.
              </p>
              <p>
                <span className="font-semibold text-slate-700">Mobile (optional):</span> leave empty if unknown —
                keep the comma so the LeetCode column stays in the right place.
              </p>
              <p className="text-slate-500">LeetCode profile URL or username both work.</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 mb-5 text-xs text-slate-700 space-y-2">
          <p className="font-semibold text-slate-800">How optional fields look in the sample</p>
          <pre className="font-mono text-[11px] bg-white border border-slate-200 rounded-lg p-3 overflow-x-auto whitespace-pre">
            {SAMPLE_CSV_NOTES}
          </pre>
        </div>

        <div className="mb-4">
          <label className="text-xs font-semibold text-slate-600 mb-1 block">
            Default division (when Division column is empty)
          </label>
          <select className="input max-w-xs text-sm" value={divisionId} onChange={(e) => setDivisionId(e.target.value)}>
            {divisions.map((d) => (
              <option key={d._id} value={d._id}>
                {d.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-slate-500 mt-1">
            Students without a division in the CSV are assigned here. Public and instructor views can filter by
            division when sections are used.
          </p>
        </div>

        <div className="mb-4">
          <label className="text-xs font-semibold text-slate-600 mb-1 block">
            Paste or edit students ({rowCount} rows detected)
          </label>
          <textarea
            className="input h-52 font-mono text-xs"
            placeholder={SAMPLE_CSV}
            value={bulkText}
            onChange={(e) => {
              setBulkText(e.target.value);
              setResults(null);
            }}
          />
        </div>

        {parsedRows.length > 0 && (
          <div className="mb-4 rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
              Preview — check institute, enrollment & division before enrolling
            </div>
            {parsedRows.some((r) => !r.institute && !r.enrollmentNumber && !r.email) && (
              <div className="px-4 py-2 bg-amber-50 border-b border-amber-200 text-xs text-amber-800">
                Some rows are missing institute/enrollment/email. Paste the full 9-column row, or include the
                header row from the template.
              </div>
            )}
            <div className="max-h-48 overflow-y-auto overflow-x-auto">
              <table className="w-full text-xs min-w-[640px]">
                <thead className="bg-white sticky top-0">
                  <tr className="text-slate-500 uppercase tracking-wide">
                    <th className="text-left py-2 pl-4 pr-2">Name</th>
                    <th className="text-left py-2 pr-2">Institute</th>
                    <th className="text-left py-2 pr-2">Dept</th>
                    <th className="text-left py-2 pr-2">Enrollment</th>
                    <th className="text-left py-2 pr-2">Email</th>
                    <th className="text-left py-2 pr-4">Division</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedRows.slice(0, 8).map((row, i) => (
                    <tr key={i} className="border-t border-slate-100">
                      <td className="py-2 pl-4 pr-2 font-medium text-slate-800">{row.displayName}</td>
                      <td className="py-2 pr-2 text-slate-600">{row.institute || '—'}</td>
                      <td className="py-2 pr-2 text-slate-600">{row.academicDepartment || '—'}</td>
                      <td className="py-2 pr-2 font-mono text-slate-600">{row.enrollmentNumber || '—'}</td>
                      <td className="py-2 pr-2 text-slate-600 truncate max-w-[140px]">{row.email || '—'}</td>
                      <td className="py-2 pr-4">
                        {row.division ? (
                          <span className="font-semibold text-brand-700">{row.division}</span>
                        ) : (
                          <span className="text-slate-400">→ {defaultDivisionName}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {parsedRows.length > 8 && (
              <p className="px-4 py-2 text-[11px] text-slate-500 border-t border-slate-100">
                +{parsedRows.length - 8} more rows
              </p>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading || !bulkText.trim()}
          className="btn-primary disabled:opacity-50"
        >
          {loading ? 'Enrolling...' : `Enroll ${rowCount || ''} Students`}
        </button>
      </AdminSection>

      {results?.error && (
        <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm px-4 py-3 font-medium">
          {results.error}
        </div>
      )}

      {results?.summary && (
        <AdminSection
          eyebrow="Results"
          title="Enrollment summary"
          subtitle={`${results.summary.added} added · ${results.summary.updated ?? 0} updated · ${results.summary.failed} failed · ${results.summary.total} total`}
          accent="emerald"
        >
          <div className="flex gap-3 mb-4 flex-wrap">
            <span className="px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-sm font-bold">
              {results.summary.added} enrolled
            </span>
            {(results.summary.updated ?? 0) > 0 && (
              <span className="px-3 py-1 rounded-lg bg-sky-50 text-sky-700 border border-sky-200 text-sm font-bold">
                {results.summary.updated} updated
              </span>
            )}
            <span className="px-3 py-1 rounded-lg bg-red-50 text-red-700 border border-red-200 text-sm font-bold">
              {results.summary.failed} failed
            </span>
          </div>
          <div className="rounded-xl border border-slate-200 overflow-hidden max-h-64 overflow-y-auto overflow-x-auto">
            <table className="w-full text-sm min-w-[480px]">
              <thead className="sticky top-0 bg-slate-50">
                <tr className="text-slate-600 text-xs uppercase tracking-wider font-semibold border-b border-slate-200">
                  <th className="text-left py-2.5 pl-4 pr-2">Name</th>
                  <th className="text-left py-2.5 pr-2 hidden md:table-cell">Enrollment</th>
                  <th className="text-left py-2.5 pr-2">Username</th>
                  <th className="text-left py-2.5 pr-2 hidden sm:table-cell">Division</th>
                  <th className="text-left py-2.5 pr-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {results.results?.map((r, i) => (
                  <tr key={i} className="border-b border-slate-100">
                    <td className="py-2.5 pl-4 pr-2 font-medium text-slate-900">{r.displayName}</td>
                    <td className="py-2.5 pr-2 text-slate-600 hidden md:table-cell font-mono text-xs">
                      {r.enrollmentNumber || '—'}
                    </td>
                    <td className="py-2.5 pr-2 text-slate-600">@{r.leetcodeUsername || '—'}</td>
                    <td className="py-2.5 pr-2 text-slate-600 hidden sm:table-cell">{r.division || '—'}</td>
                    <td className="py-2.5 pr-4">
                      {r.success ? (
                        <span className="text-xs font-bold text-emerald-600">
                          {r.updated ? 'Updated' : 'Enrolled'}
                        </span>
                      ) : (
                        <span className="text-xs font-medium text-red-600">{r.error}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AdminSection>
      )}
    </div>
  );
}
