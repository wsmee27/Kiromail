"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import { getSession } from "@/lib/auth/session";
import { createAuditLog } from "@/lib/audit";
import { tryDecryptSecret } from "@/lib/auth/secrets";
import {
  getTwoFactorLockoutDate,
  isTwoFactorLocked,
  shouldRequireTwoFactor,
  TWO_FACTOR_MAX_ATTEMPTS,
  verifyTwoFactorCode
} from "@/lib/auth/two-factor";

export async function loginAction(formData: FormData): Promise<void> {
  const email = String(formData.get("email") ?? "").toLowerCase();
  const password = String(formData.get("password") ?? "");

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || user.status !== "active") {
    await createAuditLog(prisma, {
      actorUserId: user?.id,
      action: "auth.login_failed",
      resourceType: "user",
      resourceId: user?.id,
      metadata: { email }
    });
    redirect("/login?error=invalid");
  }

  const valid = await verifyPassword(password, user.passwordHash);

  if (!valid) {
    await createAuditLog(prisma, {
      actorUserId: user.id,
      action: "auth.login_failed",
      resourceType: "user",
      resourceId: user.id,
      metadata: { email: user.email }
    });
    redirect("/login?error=invalid");
  }

  if (shouldRequireTwoFactor(user)) {
    if (isTwoFactorLocked(user.twoFactorLockedUntil)) {
      await createAuditLog(prisma, {
        actorUserId: user.id,
        action: "auth.two_factor_locked",
        resourceType: "user",
        resourceId: user.id,
        metadata: { email: user.email }
      });
      redirect("/login?error=2fa-locked");
    }

    const session = await getSession();
    session.pendingTwoFactorUserId = user.id;
    session.pendingTwoFactorExpiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    session.userId = undefined;
    session.role = undefined;
    session.email = user.email;
    await session.save();

    await createAuditLog(prisma, {
      actorUserId: user.id,
      action: "auth.two_factor_required",
      resourceType: "user",
      resourceId: user.id,
      metadata: { email: user.email }
    });
    redirect("/login/2fa");
  }

  const session = await getSession();
  session.userId = user.id;
  session.email = user.email;
  session.role = user.role;
  await session.save();

  await createAuditLog(prisma, {
    actorUserId: user.id,
    action: "auth.login",
    resourceType: "user",
    resourceId: user.id,
    metadata: { email: user.email }
  });

  redirect("/dashboard");
}

export async function verifyTwoFactorAction(formData: FormData): Promise<void> {
  const token = String(formData.get("token") ?? "").trim();
  const session = await getSession();

  if (!session.pendingTwoFactorUserId || !session.pendingTwoFactorExpiresAt) {
    redirect("/login");
  }

  if (Date.parse(session.pendingTwoFactorExpiresAt) < Date.now()) {
    session.destroy();
    redirect("/login?error=2fa-expired");
  }

  const user = await prisma.user.findUnique({ where: { id: session.pendingTwoFactorUserId } });

  if (!user || user.status !== "active" || user.role !== "owner" || !user.twoFactorSecretEncrypted) {
    session.destroy();
    redirect("/login?error=invalid");
  }

  if (isTwoFactorLocked(user.twoFactorLockedUntil)) {
    session.destroy();
    redirect("/login?error=2fa-locked");
  }

  const secret = tryDecryptSecret(user.twoFactorSecretEncrypted);

  if (!secret) {
    session.destroy();
    await createAuditLog(prisma, {
      actorUserId: user.id,
      action: "auth.two_factor_secret_invalid",
      resourceType: "user",
      resourceId: user.id,
      metadata: { email: user.email }
    });
    redirect("/login?error=invalid");
  }

  const valid = await verifyTwoFactorCode(secret, token);

  if (!valid) {
    const failedAttempts = user.twoFactorFailedAttempts + 1;
    const lockedUntil = failedAttempts >= TWO_FACTOR_MAX_ATTEMPTS ? getTwoFactorLockoutDate() : null;

    await prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorFailedAttempts: failedAttempts,
        twoFactorLockedUntil: lockedUntil
      }
    });

    await createAuditLog(prisma, {
      actorUserId: user.id,
      action: lockedUntil ? "auth.two_factor_locked" : "auth.two_factor_failed",
      resourceType: "user",
      resourceId: user.id,
      metadata: { email: user.email, failedAttempts }
    });

    if (lockedUntil) {
      session.destroy();
      redirect("/login?error=2fa-locked");
    }

    redirect("/login/2fa?error=invalid");
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      twoFactorFailedAttempts: 0,
      twoFactorLockedUntil: null
    }
  });

  session.pendingTwoFactorUserId = undefined;
  session.pendingTwoFactorExpiresAt = undefined;
  session.userId = user.id;
  session.email = user.email;
  session.role = user.role;
  await session.save();

  await createAuditLog(prisma, {
    actorUserId: user.id,
    action: "auth.login",
    resourceType: "user",
    resourceId: user.id,
    metadata: { email: user.email, twoFactor: true }
  });

  redirect("/dashboard");
}

export async function logoutAction() {
  const session = await getSession();
  session.destroy();
  redirect("/login");
}
