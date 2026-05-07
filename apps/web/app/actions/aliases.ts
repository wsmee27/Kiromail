"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireOwner } from "@/lib/auth/session";
import { createAuditLog } from "@/lib/audit";
import { buildAddress } from "@/lib/validation/email";
import { aliasInputSchema } from "@/lib/validation/schemas";

export async function createAliasAction(formData: FormData) {
  const session = await requireOwner();
  const input = aliasInputSchema.parse({
    domainId: String(formData.get("domainId") ?? ""),
    localPart: String(formData.get("localPart") ?? ""),
    destinationMailboxId: String(formData.get("destinationMailboxId") ?? ""),
    type: String(formData.get("type") ?? "custom"),
    status: String(formData.get("status") ?? "active"),
    expiresAt: String(formData.get("expiresAt") ?? ""),
    notes: String(formData.get("notes") ?? ""),
    tags: String(formData.get("tags") ?? "").split(",").map((tag) => tag.trim()).filter(Boolean)
  });

  const domain = await prisma.domain.findUniqueOrThrow({ where: { id: input.domainId } });
  const alias = await prisma.alias.create({
    data: {
      domainId: input.domainId,
      localPart: input.localPart.toLowerCase(),
      address: buildAddress(input.localPart, domain.domain),
      destinationMailboxId: input.destinationMailboxId || null,
      type: input.type,
      status: input.status,
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
      notes: input.notes || null,
      tags: input.tags,
      createdById: session.userId
    }
  });

  await createAuditLog(prisma, {
    actorUserId: session.userId,
    action: "alias.create",
    resourceType: "alias",
    resourceId: alias.id,
    metadata: { address: alias.address }
  });

  revalidatePath("/dashboard/aliases");
}

export async function disableAliasAction(formData: FormData) {
  const session = await requireOwner();
  const id = String(formData.get("id") ?? "");
  const alias = await prisma.alias.update({ where: { id }, data: { status: "disabled" } });

  await createAuditLog(prisma, {
    actorUserId: session.userId,
    action: "alias.disable",
    resourceType: "alias",
    resourceId: alias.id,
    metadata: { address: alias.address }
  });

  revalidatePath("/dashboard/aliases");
}
