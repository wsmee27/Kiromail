export function Input({ className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full rounded-xl border border-slate-700/80 bg-slate-950/80 px-3 py-2 text-slate-100 outline-none ring-cyan-400 transition placeholder:text-slate-600 focus:border-cyan-400/70 focus:ring-2 ${className}`}
      {...props}
    />
  );
}
