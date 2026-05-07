"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireOwner } from "@/lib/auth/session";
import { createAuditLog } from "@/lib/audit";
import { buildAddress } from "@/lib/validation/email";
import { mailboxInputSchema } from "@/lib/validation/schemas";

export async function createMailboxAction(formData: FormData) {
  const session = await requireOwner();
  const input = mailboxInputSchema.parse({
    domainId: String(formData.get("domainId") ?? ""),
    localPart: String(formData.get("localPart") ?? ""),
    inboxDestination: String(formData.get("inboxDestination") ?? ""),
    sendEnabled: formData.get("sendEnabled") === "on",
    receiveEnabled: formData.get("receiveEnabled") !== "off",
    status: String(formData.get("status") ?? "active")
  });

  const domain = await prisma.domain.findUniqueOrThrow({ where: { id: input.domainId } });
  const mailbox = await prisma.mailbox.create({
    data: {
      domainId: input.domainId,
      localPart: input.localPart.toLowerCase(),
      address: buildAddress(input.localPart, domain.domain),
      inboxDestination: input.inboxDestination || null,
      sendEnabled: input.sendEnabled,
      receiveEnabled: input.receiveEnabled,
      status: input.status,
      ownerUserId: session.userId
    }
  });

  await createAuditLog(prisma, {
    actorUserId: session.userId,
    action: "mailbox.create",
    resourceType: "mailbox",
    resourceId: mailbox.id,
    metadata: { address: mailbox.address }
  });

  revalidatePath("/dashboard/mailboxes");
}

export async function disableMailboxAction(formData: FormData) {
  const session = await requireOwner();
  const id = String(formData.get("id") ?? "");
  const mailbox = await prisma.mailbox.update({ where: { id }, data: { status: "disabled" } });

  await createAuditLog(prisma, {
    actorUserId: session.userId,
    action: "mailbox.disable",
    resourceType: "mailbox",
    resourceId: mailbox.id,
    metadata: { address: mailbox.address }
  });

  revalidatePath("/dashboard/mailboxes");
}
