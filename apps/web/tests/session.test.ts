import { describe, expect, it } from "vitest";
import { getSessionPassword, isActiveOwner } from "@/lib/auth/session";

describe("session security", () => {
  it("requires SESSION_PASSWORD", () => {
    expect(() => getSessionPassword(undefined)).toThrow("SESSION_PASSWORD is required");
  });

  it("accepts configured session password", () => {
    expect(getSessionPassword("x".repeat(32))).toBe("x".repeat(32));
  });

  it("accepts only active owner users", () => {
    expect(isActiveOwner({ role: "owner", status: "active" })).toBe(true);
    expect(isActiveOwner({ role: "admin", status: "active" })).toBe(false);
    expect(isActiveOwner({ role: "owner", status: "disabled" })).toBe(false);
    expect(isActiveOwner(null)).toBe(false);
  });
});
