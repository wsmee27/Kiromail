import { describe, expect, it } from "vitest";
import { generate, generateSecret } from "otplib";
import { isTwoFactorLocked, verifyTwoFactorCode } from "@/lib/auth/two-factor";

describe("two-factor verification", () => {
  it("accepts valid TOTP token", async () => {
    const secret = await generateSecret();
    const token = await generate({ secret });

    await expect(verifyTwoFactorCode(secret, token)).resolves.toBe(true);
  });

  it("rejects invalid TOTP token", async () => {
    const secret = await generateSecret();

    await expect(verifyTwoFactorCode(secret, "000000")).resolves.toBe(false);
  });

  it("detects active database-backed lockouts", () => {
    expect(isTwoFactorLocked(new Date(Date.now() + 60_000))).toBe(true);
    expect(isTwoFactorLocked(new Date(Date.now() - 60_000))).toBe(false);
    expect(isTwoFactorLocked(null)).toBe(false);
  });
});
