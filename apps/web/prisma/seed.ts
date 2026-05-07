import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

import { hashPassword } from "../lib/auth/password";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL
});

const prisma = new PrismaClient({ adapter });
const primaryDomain = "freakyswan.my.id";

const defaultMailboxes = [
  "founder",
  "hello",
  "team",
  "support",
  "admin",
  "billing",
  "security"
] as const;

const sensitiveAliases = new Map<string, string[]>([
  ["admin", ["security", "ai-disabled"]],
  ["billing", ["billing", "ai-disabled"]],
  ["security", ["security", "ai-disabled"]],
  ["cloudflare", ["security", "ai-disabled"]],
  ["github", ["security", "ai-disabled"]],
  ["bank", ["security", "ai-disabled"]]
]);

async function main() {
  const email = process.env.SEED_OWNER_EMAIL;
  const password = process.env.SEED_OWNER_PASSWORD;

  if (!email || !password) {
    throw new Error("SEED_OWNER_EMAIL and SEED_OWNER_PASSWORD are required");
  }

  const passwordHash = await hashPassword(password);

  const owner = await prisma.user.upsert({
    where: { email },
    update: {
      name: "FreakySwan",
      passwordHash,
      role: "owner",
      status: "active"
    },
    create: {
      email,
      name: "FreakySwan",
      passwordHash,
      role: "owner",
      status: "active"
    }
  });

  const domain = await prisma.domain.upsert({
    where: { domain: primaryDomain },
    update: {
      provider: "cloudflare",
      status: "pending",
      isPrimary: true
    },
    create: {
      domain: primaryDomain,
      provider: "cloudflare",
      status: "pending",
      isPrimary: true
    }
  });

  for (const localPart of defaultMailboxes) {
    await prisma.mailbox.upsert({
      where: { address: `${localPart}@${primaryDomain}` },
      update: {
        ownerUserId: owner.id,
        inboxDestination: email,
        sendEnabled: localPart === "founder",
        receiveEnabled: true,
        status: "active"
      },
      create: {
        domainId: domain.id,
        localPart,
        address: `${localPart}@${primaryDomain}`,
        ownerUserId: owner.id,
        inboxDestination: email,
        sendEnabled: localPart === "founder",
        receiveEnabled: true,
        status: "active"
      }
    });
  }

  for (const [localPart, tags] of sensitiveAliases) {
    await prisma.alias.upsert({
      where: { address: `${localPart}@${primaryDomain}` },
      update: {
        domainId: domain.id,
        type: "service",
        status: "active",
        tags,
        createdById: owner.id
      },
      create: {
        domainId: domain.id,
        localPart,
        address: `${localPart}@${primaryDomain}`,
        type: "service",
        status: "active",
        tags,
        createdById: owner.id
      }
    });
  }

  const existingPreference = await prisma.aiPreference.findFirst({
    where: {
      userId: owner.id,
      mailboxId: null
    }
  });

  if (existingPreference) {
    await prisma.aiPreference.update({
      where: { id: existingPreference.id },
      data: {
        aiBodyAccess: false,
        aiMetadataAccess: true,
        dailyDigestEnabled: false,
        phishingScoreEnabled: false
      }
    });
  } else {
    await prisma.aiPreference.create({
      data: {
        userId: owner.id,
        mailboxId: null,
        aiBodyAccess: false,
        aiMetadataAccess: true,
        dailyDigestEnabled: false,
        phishingScoreEnabled: false
      }
    });
  }

  console.log(`Seeded owner ${owner.email} for ${primaryDomain}`);
}

main()
  .catch(async (error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
