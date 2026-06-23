export default function StatCard({ label, value, sub }) {
  return (
    <div className="card">
      <p className="text-slate-500 text-sm">{label}</p>
      <p className="text-3xl font-bold mt-1 text-slate-900">{value}</p>
      {sub && <p className="text-slate-500 text-xs mt-1">{sub}</p>}
    </div>
  );
}
