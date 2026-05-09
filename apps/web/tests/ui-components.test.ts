import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";

describe("soft premium UI primitives", () => {
  it("renders page header title, description, and action", () => {
    const html = renderToStaticMarkup(
      createElement(PageHeader, {
        title: "Domains",
        description: "Manage DNS health.",
        action: createElement("a", { href: "/dashboard/domains" }, "Open")
      })
    );

    expect(html).toContain("Domains");
    expect(html).toContain("Manage DNS health.");
    expect(html).toContain('href="/dashboard/domains"');
  });

  it("renders stat label, value, and helper", () => {
    const html = renderToStaticMarkup(createElement(StatCard, { label: "Domains", value: 3, helper: "1 needs attention" }));

    expect(html).toContain("Domains");
    expect(html).toContain(">3<");
    expect(html).toContain("1 needs attention");
  });

  it("renders status text without relying on color alone", () => {
    const html = renderToStaticMarkup(createElement(StatusBadge, { status: "verified" }));

    expect(html).toContain("verified");
  });

  it("renders empty state copy and action", () => {
    const html = renderToStaticMarkup(
      createElement(EmptyState, {
        title: "No aliases",
        description: "Aliases protect public addresses.",
        action: createElement("a", { href: "/dashboard/aliases" }, "Create alias")
      })
    );

    expect(html).toContain("No aliases");
    expect(html).toContain("Aliases protect public addresses.");
    expect(html).toContain('href="/dashboard/aliases"');
  });
});
