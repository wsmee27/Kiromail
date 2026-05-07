import { getIronSession, type IronSession, type SessionOptions } from "iron-session";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";

export type SessionData = {
  userId?: string;
  email?: string;
  role?: "owner" | "admin" | "member";
  pendingTwoFactorUserId?: string;
  pendingTwoFactorExpiresAt?: string;
};

type UserAccess = {
  role: "owner" | "admin" | "member";
  status: "active" | "invited" | "disabled";
};

export function getSessionPassword(value = process.env.SESSION_PASSWORD) {
  if (!value) {
    throw new Error("SESSION_PASSWORD is required");
  }

  return value;
}

export function isActiveOwner(user: UserAccess | null) {
  return user?.role === "owner" && user.status === "active";
}

function getSessionOptions(): SessionOptions {
  return {
    cookieName: "swanmail_session",
    password: getSessionPassword(),
    cookieOptions: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "lax"
    }
  };
}

export async function getSession(): Promise<IronSession<SessionData>> {
  return getIronSession<SessionData>(await cookies(), getSessionOptions());
}

export async function requireOwner() {
  const session = await getSession();

  if (!session.userId) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, email: true, role: true, status: true }
  });

  if (!isActiveOwner(user)) {
    session.destroy();
    redirect("/login");
  }

  if (!user) {
    redirect("/login");
  }

  return {
    ...session,
    email: user.email,
    role: user.role
  };
}
