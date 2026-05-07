import type { PrismaClient, Prisma } from "@prisma/client";

type AuditInput = {
  actorUserId?: string;
  action: string;
  resourceType?: string;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Prisma.InputJsonValue;
};

export function createAuditLog(prisma: PrismaClient, input: AuditInput) {
  return prisma.auditLog.create({
    data: {
      actorUserId: input.actorUserId,
      action: input.action,
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
      metadata: input.metadata ?? {}
    }
  });
}
