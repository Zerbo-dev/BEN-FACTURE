import crypto from "node:crypto";

function key() {
  const b = Buffer.from(process.env.ENCRYPTION_KEY || "", "base64");
  if (b.length !== 32) throw new Error("ENCRYPTION_KEY doit être une clé de 32 octets en base64 (openssl rand -base64 32).");
  return b;
}

export function encrypt(text) {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv("aes-256-gcm", key(), iv);
  const enc = Buffer.concat([c.update(String(text), "utf8"), c.final()]);
  return Buffer.concat([iv, c.getAuthTag(), enc]).toString("base64");
}

export function decrypt(payload) {
  const raw = Buffer.from(payload, "base64");
  const d = crypto.createDecipheriv("aes-256-gcm", key(), raw.subarray(0, 12));
  d.setAuthTag(raw.subarray(12, 28));
  return Buffer.concat([d.update(raw.subarray(28)), d.final()]).toString("utf8");
}

export const randomToken = (bytes = 16) => crypto.randomBytes(bytes).toString("hex");
