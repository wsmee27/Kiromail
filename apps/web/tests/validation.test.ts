import { describe, expect, it } from "vitest";
import { buildAddress, isValidLocalPart } from "@/lib/validation/email";
import { aliasInputSchema, mailboxInputSchema } from "@/lib/validation/schemas";

describe("email validation", () => {
  it("accepts simple local parts", () => {
    expect(isValidLocalPart("founder")).toBe(true);
    expect(isValidLocalPart("github-alerts")).toBe(true);
    expect(isValidLocalPart("billing_2026")).toBe(true);
  });

  it("rejects invalid local parts", () => {
    expect(isValidLocalPart("admin@")).toBe(false);
    expect(isValidLocalPart("two words")).toBe(false);
    expect(isValidLocalPart(".startdot")).toBe(false);
    expect(isValidLocalPart("enddot.")).toBe(false);
  });

  it("builds normalized address", () => {
    expect(buildAddress("Founder", "freakyswan.my.id")).toBe("founder@freakyswan.my.id");
  });

  it("validates mailbox input", () => {
    const result = mailboxInputSchema.safeParse({
      domainId: "domain_1",
      localPart: "founder",
      inboxDestination: "owner@gmail.com",
      sendEnabled: true,
      receiveEnabled: true,
      status: "active"
    });

    expect(result.success).toBe(true);
  });

  it("validates alias input", () => {
    const result = aliasInputSchema.safeParse({
      domainId: "domain_1",
      localPart: "github",
      destinationMailboxId: "mailbox_1",
      type: "service",
      status: "active",
      notes: "GitHub account",
      tags: ["service", "security"]
    });

    expect(result.success).toBe(true);
  });
});
