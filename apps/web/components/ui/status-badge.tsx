const statusClasses: Record<string, string> = {
  active: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
  verified: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
  valid: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
  enabled: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
  degraded: "border-amber-400/20 bg-amber-400/10 text-amber-300",
  warning: "border-amber-400/20 bg-amber-400/10 text-amber-300",
  pending: "border-slate-500/30 bg-slate-700/40 text-slate-300",
  neutral: "border-slate-500/30 bg-slate-700/40 text-slate-300",
  disabled: "border-rose-400/20 bg-rose-400/10 text-rose-300",
  destructive: "border-rose-400/20 bg-rose-400/10 text-rose-300",
  missing: "border-slate-500/30 bg-slate-700/40 text-slate-300",
  mismatch: "border-amber-400/20 bg-amber-400/10 text-amber-300",
  manual: "border-cyan-400/20 bg-cyan-400/10 text-cyan-300",
  info: "border-cyan-400/20 bg-cyan-400/10 text-cyan-300",
  custom: "border-cyan-400/20 bg-cyan-400/10 text-cyan-300",
  service: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
  disposable: "border-amber-400/20 bg-amber-400/10 text-amber-300",
  catch_all_generated: "border-cyan-400/20 bg-cyan-400/10 text-cyan-300",
  forward: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
  quarantine: "border-amber-400/20 bg-amber-400/10 text-amber-300",
  drop: "border-rose-400/20 bg-rose-400/10 text-rose-300",
  worker: "border-cyan-400/20 bg-cyan-400/10 text-cyan-300",
  label: "border-slate-500/30 bg-slate-700/40 text-slate-300"
};

export function StatusBadge({ status, label }: { status: string; label?: string }) {
  const normalized = status.toLowerCase();
  const className = statusClasses[normalized] ?? statusClasses.neutral;

  return <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${className}`}>{label ?? status}</span>;
}
