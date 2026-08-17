import crypto from "node:crypto";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const ISSUER = "Centralia SaaS";

function key() {
  const configured = process.env.SESSION_ENCRYPTION_KEY || process.env.AUTH_SECRET;
  if (!configured && process.env.NODE_ENV === "production") throw new Error("SESSION_ENCRYPTION_KEY_REQUIRED");
  return crypto.createHash("sha256").update(configured || "centralia-development-encryption-key").digest();
}

function base64(value: Buffer) {
  return value.toString("base64url");
}

function fromBase64(value: string) {
  return Buffer.from(value, "base64url");
}

export function generateSecret() {
  const bytes = crypto.randomBytes(20);
  let bits = 0;
  let value = 0;
  let output = "";
  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) output += ALPHABET[(value << (5 - bits)) & 31];
  return output;
}

function decodeBase32(input: string) {
  let bits = 0;
  let value = 0;
  const output: number[] = [];
  for (const character of input.replace(/=+$/, "").toUpperCase()) {
    const index = ALPHABET.indexOf(character);
    if (index < 0) throw new Error("INVALID_TOTP_SECRET");
    value = (value << 5) | index;
    bits += 5;
    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(output);
}

export function encryptSecret(secret: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key(), iv);
  const encrypted = Buffer.concat([cipher.update(secret, "utf8"), cipher.final()]);
  return [base64(iv), base64(cipher.getAuthTag()), base64(encrypted)].join(".");
}

export function decryptSecret(payload: string) {
  const [ivEncoded, tagEncoded, encryptedEncoded] = payload.split(".");
  if (!ivEncoded || !tagEncoded || !encryptedEncoded) throw new Error("INVALID_ENCRYPTED_TOTP_SECRET");
  const decipher = crypto.createDecipheriv("aes-256-gcm", key(), fromBase64(ivEncoded));
  decipher.setAuthTag(fromBase64(tagEncoded));
  return Buffer.concat([decipher.update(fromBase64(encryptedEncoded)), decipher.final()]).toString("utf8");
}

function codeFor(secret: string, counter: number) {
  const digest = crypto.createHmac("sha1", decodeBase32(secret)).update(Buffer.from(counter.toString(16).padStart(16, "0"), "hex")).digest();
  const offset = digest[digest.length - 1] & 15;
  const value = ((digest[offset] & 127) << 24) | ((digest[offset + 1] & 255) << 16) | ((digest[offset + 2] & 255) << 8) | (digest[offset + 3] & 255);
  return String(value % 1_000_000).padStart(6, "0");
}

export function verifyCode(secret: string, code: string) {
  if (!/^\d{6}$/.test(code)) return false;
  const counter = Math.floor(Date.now() / 1000 / 30);
  return [-1, 0, 1].some((offset) => crypto.timingSafeEqual(Buffer.from(code), Buffer.from(codeFor(secret, counter + offset))));
}

export function otpauthUri(email: string, secret: string) {
  return `otpauth://totp/${encodeURIComponent(ISSUER)}:${encodeURIComponent(email)}?secret=${secret}&issuer=${encodeURIComponent(ISSUER)}&algorithm=SHA1&digits=6&period=30`;
}
