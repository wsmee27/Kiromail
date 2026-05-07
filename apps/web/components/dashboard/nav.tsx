import Link from "next/link";

const links = [
  ["Dashboard", "/dashboard"],
  ["Domains", "/dashboard/domains"],
  ["Mailboxes", "/dashboard/mailboxes"],
  ["Aliases", "/dashboard/aliases"],
  ["Rules", "/dashboard/rules"],
  ["Logs", "/dashboard/logs"],
  ["Settings", "/dashboard/settings"]
] as const;

export function DashboardNav() {
  return (
    <nav className="flex flex-col gap-2">
      {links.map(([label, href]) => (
        <Link key={href} href={href} className="rounded-xl px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white">
          {label}
        </Link>
      ))}
    </nav>
  );
}
