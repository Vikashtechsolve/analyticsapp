export default function TabPanel({ active, id, children }) {
  if (active !== id) return null;

  return (
    <div key={id} className="space-y-6 opacity-0 animate-fade-in-up">
      {children}
    </div>
  );
}
