import { createHmac } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const baseUrl = process.env.BASE_URL ?? "http://localhost:3000";
const email = `staff-2fa-${Date.now()}@example.com`;
const password = "StaffPass123!";
let cookie = "";

function expect(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

async function request(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  if (cookie) headers.set("cookie", cookie);
  const response = await fetch(`${baseUrl}${path}`, { ...init, headers });
  const setCookie = response.headers.get("set-cookie");
  if (setCookie) cookie = setCookie.split(";", 1)[0];
  const payload = await response.json().catch(() => null);
  return { response, payload };
}

function totpCode(secret: string) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];
  for (const character of secret.replace(/=+$/, "").toUpperCase()) {
    const index = alphabet.indexOf(character);
    if (index < 0) throw new Error("invalid test TOTP secret");
    value = (value << 5) | index;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  const counter = Math.floor(Date.now() / 1000 / 30);
  const message = Buffer.from(counter.toString(16).padStart(16, "0"), "hex");
  const digest = createHmac("sha1", Buffer.from(bytes)).update(message).digest();
  const offset = digest[digest.length - 1] & 15;
  const number = ((digest[offset] & 127) << 24) | ((digest[offset + 1] & 255) << 16) | ((digest[offset + 2] & 255) << 8) | (digest[offset + 3] & 255);
  return String(number % 1_000_000).padStart(6, "0");
}

async function main() {
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({ data: { email, name: "Staff 2FA QA", passwordHash, isStaff: true, emailVerifiedAt: new Date() } });
  try {
    const login = await request("/api/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, password }) });
    expect(login.response.ok, `staff login failed: ${login.response.status}`);
    expect(login.payload?.twoFactorSetupRequired === true, "staff login did not report required 2FA setup");

    const adminBefore = await request("/admin");
    expect(adminBefore.response.ok && adminBefore.payload === null, "admin page should return HTML");
    const adminBeforeText = await fetch(`${baseUrl}/admin`, { headers: { cookie } }).then((response) => response.text());
    expect(adminBeforeText.includes("فعّل المصادقة الثنائية أولًا"), "admin page was not gated before staff 2FA enrollment");

    const status = await request("/api/auth/2fa");
    expect(status.response.ok && status.payload?.requiredForStaff === true && status.payload?.enabled === false, "staff 2FA policy status is incorrect");

    const start = await request("/api/auth/2fa", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "start" }) });
    expect(start.response.ok && typeof start.payload?.secret === "string", "staff 2FA enrollment did not start");
    const code = totpCode(start.payload.secret);
    const enable = await request("/api/auth/2fa", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "enable", code }) });
    expect(enable.response.ok && enable.payload?.enabled === true, "staff TOTP enrollment failed");

    const disable = await request("/api/auth/2fa", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "disable", code: totpCode(start.payload.secret) }) });
    expect(disable.response.status === 403, "staff TOTP disable was not rejected");
    const statusAfter = await request("/api/auth/2fa");
    expect(statusAfter.payload?.enabled === true, "staff TOTP was disabled despite mandatory policy");
    const adminAfter = await fetch(`${baseUrl}/admin`, { headers: { cookie } }).then((response) => response.text());
    expect(adminAfter.includes("لوحة تشغيل"), "admin page remained gated after staff 2FA enrollment");
    console.log(`Staff 2FA smoke passed for ${email}`);
  } finally {
    await prisma.user.delete({ where: { id: user.id } }).catch(() => undefined);
    await prisma.$disconnect();
  }
}

main().catch(async (error) => {
  await prisma.$disconnect();
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
