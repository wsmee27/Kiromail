import { describe, expect, it, vi } from "vitest";
import { createAuditLog } from "@/lib/audit";

describe("createAuditLog", () => {
  it("writes normalized audit log data", async () => {
    const prisma = {
      auditLog: {
        create: vi.fn().mockResolvedValue({ id: "audit_1" })
      }
    };

    await createAuditLog(prisma as never, {
      actorUserId: "user_1",
      action: "alias.create",
      resourceType: "alias",
      resourceId: "alias_1",
      metadata: { address: "github@freakyswan.my.id" }
    });

    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: {
        actorUserId: "user_1",
        action: "alias.create",
        resourceType: "alias",
        resourceId: "alias_1",
        ipAddress: undefined,
        userAgent: undefined,
        metadata: { address: "github@freakyswan.my.id" }
      }
    });
  });
});
