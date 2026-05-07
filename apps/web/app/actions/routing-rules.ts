"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireOwner } from "@/lib/auth/session";
import { createAuditLog } from "@/lib/audit";
import { routingRuleInputSchema } from "@/lib/validation/schemas";

export async function createRoutingRuleAction(formData: FormData) {
  const session = await requireOwner();
  const input = routingRuleInputSchema.parse({
    domainId: String(formData.get("domainId") ?? ""),
    aliasId: String(formData.get("aliasId") ?? ""),
    action: String(formData.get("action") ?? "forward"),
    conditionJson: String(formData.get("conditionJson") ?? "{}"),
    destinationJson: String(formData.get("destinationJson") ?? "{}"),
    priority: String(formData.get("priority") ?? "100"),
    enabled: formData.get("enabled") === "on"
  });

  const rule = await prisma.routingRule.create({
    data: {
      domainId: input.domainId,
      aliasId: input.aliasId || null,
      action: input.action,
      conditionJson: JSON.parse(input.conditionJson),
      destinationJson: JSON.parse(input.destinationJson),
      priority: input.priority,
      enabled: input.enabled
    }
  });

  await createAuditLog(prisma, {
    actorUserId: session.userId,
    action: "routingRule.create",
    resourceType: "routingRule",
    resourceId: rule.id,
    metadata: { action: rule.action }
  });

  revalidatePath("/dashboard/rules");
}

export async function disableRoutingRuleAction(formData: FormData) {
  const session = await requireOwner();
  const id = String(formData.get("id") ?? "");
  const rule = await prisma.routingRule.update({ where: { id }, data: { enabled: false } });

  await createAuditLog(prisma, {
    actorUserId: session.userId,
    action: "routingRule.disable",
    resourceType: "routingRule",
    resourceId: rule.id,
    metadata: { action: rule.action }
  });

  revalidatePath("/dashboard/rules");
}
