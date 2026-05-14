export default function StatusPill({ active, children, danger }) {
  const color = danger ? "bg-danger shadow-danger" : active ? "bg-emerald-300 shadow-[0_0_18px_rgba(110,231,183,.4)]" : "bg-slate-500";
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs uppercase tracking-[0.16em] text-slate-200">
      <span className={`h-2 w-2 rounded-full ${color}`} />
      {children}
    </span>
  );
}
