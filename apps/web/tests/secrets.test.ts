import { describe, expect, it } from "vitest";
import { decryptSecret, encryptSecret, tryDecryptSecret } from "@/lib/auth/secrets";

describe("secret encryption", () => {
  it("round-trips encrypted secrets", () => {
    const key = "x".repeat(32);
    const encrypted = encryptSecret("totp-secret", key);

    expect(encrypted).not.toBe("totp-secret");
    expect(decryptSecret(encrypted, key)).toBe("totp-secret");
  });

  it("rejects missing encryption key", () => {
    expect(() => encryptSecret("totp-secret", undefined)).toThrow("APP_ENCRYPTION_KEY is required");
  });

  it("rejects plaintext secret payloads", () => {
    expect(() => decryptSecret("totp-secret", "x".repeat(32))).toThrow("Invalid encrypted secret payload");
  });

  it("returns null for invalid payloads in safe decrypt path", () => {
    expect(tryDecryptSecret("totp-secret", "x".repeat(32))).toBeNull();
  });
});
