import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

function getEncryptionKey(value = process.env.APP_ENCRYPTION_KEY) {
  if (!value) {
    throw new Error("APP_ENCRYPTION_KEY is required");
  }

  return createHash("sha256").update(value).digest();
}

export function encryptSecret(secret: string, key?: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getEncryptionKey(key), iv);
  const encrypted = Buffer.concat([cipher.update(secret, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return `${iv.toString("base64")}:${tag.toString("base64")}:${encrypted.toString("base64")}`;
}

export function decryptSecret(payload: string, key?: string) {
  const [ivValue, tagValue, encryptedValue] = payload.split(":");

  if (!ivValue || !tagValue || !encryptedValue) {
    throw new Error("Invalid encrypted secret payload");
  }

  const decipher = createDecipheriv("aes-256-gcm", getEncryptionKey(key), Buffer.from(ivValue, "base64"));
  decipher.setAuthTag(Buffer.from(tagValue, "base64"));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedValue, "base64")),
    decipher.final()
  ]);

  return decrypted.toString("utf8");
}

export function tryDecryptSecret(payload: string, key?: string) {
  try {
    return decryptSecret(payload, key);
  } catch {
    return null;
  }
}
