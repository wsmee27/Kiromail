import type {
  CreateAliasInput,
  DnsProvider,
  DomainVerificationResult,
  EmailRoutingProvider,
  EmailSendingProvider,
  EventQuery,
  SendEmailInput
} from "@/lib/providers/types";

function mockVerification(domain: string): DomainVerificationResult {
  return {
    domain,
    status: "pending",
    records: [
      { type: "MX", name: domain, value: "Cloudflare Email Routing", valid: false },
      { type: "TXT", name: domain, value: "SPF record not connected", valid: false },
      { type: "TXT", name: `_dmarc.${domain}`, value: "DMARC record not connected", valid: false }
    ]
  };
}

export class MockEmailRoutingProvider implements EmailRoutingProvider {
  async createAlias(input: CreateAliasInput) {
    return { id: `mock-${input.address}`, address: input.address, status: "active" as const };
  }

  async disableAlias() {}

  async listAliases() {
    return [];
  }

  async verifyDomain(domain: string) {
    return mockVerification(domain);
  }
}

export class MockEmailSendingProvider implements EmailSendingProvider {
  async sendEmail(input: SendEmailInput) {
    return { id: `mock-${input.from}-${input.to}`, status: "queued" as const };
  }

  async verifySendingDomain(domain: string) {
    return mockVerification(domain);
  }

  async listEvents(_input: EventQuery) {
    return [];
  }
}

export class MockDnsProvider implements DnsProvider {
  async getRecords() {
    return [];
  }

  async verifyEmailRecords(domain: string) {
    return mockVerification(domain);
  }
}
