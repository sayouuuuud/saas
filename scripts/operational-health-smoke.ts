import crypto from "node:crypto";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const baseUrl = process.env.BASE_URL ?? "http://localhost:3000";
const suffix = Date.now();

function expect(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

async function request(path: string, token: string, clientId: string) {
  const response = await fetch(`${baseUrl}${path}`, { headers: { cookie: `centralia_session=${token}`, "x-test-client": clientId } });
  const payload = await response.json().catch(() => null);
  return { response, payload };
}

async function main() {
  const passwordlessStaff = await prisma.user.create({ data: { email: `health-staff-${suffix}@example.com`, name: "Health Staff", isStaff: true, staffRole: "ADMIN", twoFactorEnabled: true, emailVerifiedAt: new Date() } });
  const pendingStaff = await prisma.user.create({ data: { email: `health-pending-${suffix}@example.com`, name: "Pending Staff", isStaff: true, staffRole: "ADMIN", twoFactorEnabled: false, emailVerifiedAt: new Date() } });
  const nonStaff = await prisma.user.create({ data: { email: `health-user-${suffix}@example.com`, name: "Health User", emailVerifiedAt: new Date() } });
  const tokens = await Promise.all([passwordlessStaff, pendingStaff, nonStaff].map(async (user) => {
    const token = crypto.randomBytes(32).toString("hex");
    await prisma.session.create({ data: { tokenHash: hashToken(token), userId: user.id, expiresAt: new Date(Date.now() + 60 * 60 * 1000) } });
    return token;
  }));

  try {
    const healthy = await request("/api/admin/operations/health", tokens[0], `health-${suffix}`);
    expect(healthy.response.ok, `staff health request failed: ${healthy.response.status}`);
    expect(healthy.response.headers.get("cache-control")?.includes("no-store"), "health response is cacheable");
    expect(healthy.payload?.status && Array.isArray(healthy.payload?.alerts), "health response shape is incomplete");
    expect(healthy.payload?.thresholds?.unprocessedWebhooks === 0, "webhook threshold is not explicit");
    expect(healthy.payload?.retention?.automaticDeletion === false, "retention mode unexpectedly enables automatic deletion");

    const pending = await request("/api/admin/operations/health", tokens[1], `health-pending-${suffix}`);
    expect(pending.response.status === 428, "staff without 2FA was not gated");

    const forbidden = await request("/api/admin/operations/health", tokens[2], `health-user-${suffix}`);
    expect(forbidden.response.status === 403, "non-staff health access was not rejected");
    console.log("Operational health smoke passed");
  } finally {
    await prisma.session.deleteMany({ where: { userId: { in: [passwordlessStaff.id, pendingStaff.id, nonStaff.id] } } });
    await prisma.user.deleteMany({ where: { id: { in: [passwordlessStaff.id, pendingStaff.id, nonStaff.id] } } });
    await prisma.$disconnect();
  }
}

main().catch(async (error) => {
  await prisma.$disconnect();
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
