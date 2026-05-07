import { describe, expect, it } from "vitest";
import { shouldRequireTwoFactor } from "@/lib/auth/two-factor";

describe("2FA gate", () => {
  it("requires challenge only when user has 2FA enabled", () => {
    expect(shouldRequireTwoFactor({ twoFactorEnabled: true })).toBe(true);
    expect(shouldRequireTwoFactor({ twoFactorEnabled: false })).toBe(false);
  });
});
