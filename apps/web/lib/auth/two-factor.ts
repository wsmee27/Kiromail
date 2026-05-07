import { verify } from "otplib";

export const TWO_FACTOR_MAX_ATTEMPTS = 5;
export const TWO_FACTOR_LOCKOUT_MINUTES = 15;

export function shouldRequireTwoFactor(user: { twoFactorEnabled: boolean }) {
  return user.twoFactorEnabled;
}

export function isTwoFactorLocked(lockedUntil: Date | null) {
  return lockedUntil ? lockedUntil.getTime() > Date.now() : false;
}

export function getTwoFactorLockoutDate() {
  return new Date(Date.now() + TWO_FACTOR_LOCKOUT_MINUTES * 60 * 1000);
}

export async function verifyTwoFactorCode(secret: string, token: string) {
  if (!secret || !token) {
    return false;
  }

  const result = await verify({ secret, token });
  return result.valid;
}
