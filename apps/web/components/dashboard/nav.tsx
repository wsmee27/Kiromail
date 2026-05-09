"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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
  const currentPath = usePathname();

  return (
    <nav className="flex flex-col gap-2">
      {links.map(([label, href]) => {
        const isActive = currentPath === href || (href !== "/dashboard" && currentPath.startsWith(`${href}/`));

        return (
          <Link
            key={href}
            href={href}
            className={[
              "group relative overflow-hidden rounded-2xl border px-3 py-2.5 text-sm transition",
              isActive
                ? "border-cyan-400/40 bg-cyan-400/12 text-white shadow-[0_12px_32px_-20px_rgba(34,211,238,0.9)]"
                : "border-transparent text-slate-300 hover:border-white/10 hover:bg-white/5 hover:text-white"
            ].join(" ")}
          >
            <span
              className={[
                "absolute inset-y-2 left-2 w-1 rounded-full transition",
                isActive ? "bg-cyan-300 shadow-[0_0_18px_rgba(103,232,249,0.9)]" : "bg-transparent group-hover:bg-white/20"
              ].join(" ")}
            />
            <span className="relative pl-3">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
