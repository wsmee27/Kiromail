export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-3xl border border-slate-800/80 bg-slate-900/70 p-5 shadow-[0_20px_60px_rgba(2,6,23,0.28)] backdrop-blur ${className}`}>
      {children}
    </div>
  );
}
