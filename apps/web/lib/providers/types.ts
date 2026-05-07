export type CreateAliasInput = {
  address: string;
  destination?: string;
};

export type AliasResult = {
  id: string;
  address: string;
  status: "active" | "disabled";
};

export type DomainVerificationResult = {
  domain: string;
  status: "pending" | "verified" | "degraded";
  records: Array<{ type: string; name: string; value: string; valid: boolean }>;
};

export type SendEmailInput = {
  from: string;
  to: string;
  subject: string;
  text: string;
};

export type SendResult = {
  id: string;
  status: "queued" | "sent" | "failed";
};

export type EventQuery = {
  since?: Date;
  limit?: number;
};

export type EmailProviderEvent = {
  id: string;
  type: string;
  createdAt: Date;
};

export type DnsRecord = {
  type: string;
  name: string;
  value: string;
};

export interface EmailRoutingProvider {
  createAlias(input: CreateAliasInput): Promise<AliasResult>;
  disableAlias(aliasId: string): Promise<void>;
  listAliases(): Promise<AliasResult[]>;
  verifyDomain(domain: string): Promise<DomainVerificationResult>;
}

export interface EmailSendingProvider {
  sendEmail(input: SendEmailInput): Promise<SendResult>;
  verifySendingDomain(domain: string): Promise<DomainVerificationResult>;
  listEvents(input: EventQuery): Promise<EmailProviderEvent[]>;
}

export interface DnsProvider {
  getRecords(domain: string): Promise<DnsRecord[]>;
  verifyEmailRecords(domain: string): Promise<DomainVerificationResult>;
}
