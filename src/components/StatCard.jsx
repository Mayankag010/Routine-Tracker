export function StatCard({ value, label }) {
  return (
    <div className="rounded-xl border border-line bg-surface/40 px-4 py-4">
      <p className="font-display text-2xl mb-0.5">{value}</p>
      <p className="text-xs text-inkSoft">{label}</p>
    </div>
  );
}
