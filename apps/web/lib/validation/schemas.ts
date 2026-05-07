import { z } from "zod";
import { isValidLocalPart } from "@/lib/validation/email";

export const mailboxInputSchema = z.object({
  domainId: z.string().min(1),
  localPart: z.string().min(1).max(64).refine(isValidLocalPart, "Invalid email local-part"),
  inboxDestination: z.string().email().optional().or(z.literal("")),
  sendEnabled: z.boolean().default(false),
  receiveEnabled: z.boolean().default(true),
  status: z.enum(["active", "inactive", "disabled"]).default("active")
});

export const aliasInputSchema = z.object({
  domainId: z.string().min(1),
  localPart: z.string().min(1).max(64).refine(isValidLocalPart, "Invalid email local-part"),
  destinationMailboxId: z.string().optional().or(z.literal("")),
  type: z.enum(["custom", "service", "disposable", "catch_all_generated"]).default("custom"),
  status: z.enum(["active", "disabled", "expired", "quarantined"]).default("active"),
  expiresAt: z.string().optional().or(z.literal("")),
  notes: z.string().max(500).optional().or(z.literal("")),
  tags: z.array(z.string().min(1)).default([])
});

export const routingRuleInputSchema = z.object({
  domainId: z.string().min(1),
  aliasId: z.string().optional().or(z.literal("")),
  action: z.enum(["forward", "quarantine", "drop", "worker", "label"]),
  conditionJson: z.string().min(2),
  destinationJson: z.string().min(2),
  priority: z.coerce.number().int().min(0).max(1000).default(100),
  enabled: z.boolean().default(true)
});
