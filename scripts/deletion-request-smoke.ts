import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const baseUrl = process.env.BASE_URL ?? "http://localhost:3000";
const suffix = Date.now();
const ownerEmail = `deletion-owner-${suffix}@example.com`;
const memberEmail = `deletion-member-${suffix}@example.com`;
const password = "DeletionPass123!";

function expect(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

function client() {
  let cookie = "";
  return async (path: string, init: RequestInit = {}) => {
    const headers = new Headers(init.headers);
    if (cookie) headers.set("cookie", cookie);
    const response = await fetch(`${baseUrl}${path}`, { ...init, headers });
    const setCookie = response.headers.get("set-cookie");
    if (setCookie) cookie = setCookie.split(";", 1)[0];
    const payload = await response.json().catch(() => null);
    return { response, payload };
  };
}

async function main() {
  const plan = await prisma.plan.findUnique({ where: { code: "starter" }, select: { id: true } });
  if (!plan) throw new Error("starter plan missing; seed before running deletion smoke");
  const passwordHash = await bcrypt.hash(password, 10);
  const owner = await prisma.user.create({ data: { email: ownerEmail, name: "Deletion Owner", passwordHash, emailVerifiedAt: new Date() } });
  const member = await prisma.user.create({ data: { email: memberEmail, name: "Deletion Member", passwordHash, emailVerifiedAt: new Date() } });
  const workspace = await prisma.workspace.create({ data: { name: `Deletion Workspace ${suffix}`, ownerId: owner.id, planId: plan.id, members: { create: [{ userId: owner.id, role: "OWNER" }, { userId: member.id, role: "VIEWER" }] } } });
  try {
    const ownerRequest = client();
    const login = await ownerRequest("/api/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: ownerEmail, password }) });
    expect(login.response.ok, `owner login failed: ${login.response.status}`);
    const created = await ownerRequest("/api/delete-request", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ reason: "QA privacy workflow" }) });
    expect(created.response.status === 201 && created.payload?.alreadyExists === false, "owner deletion request was not created");
    const duplicate = await ownerRequest("/api/delete-request", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ reason: "duplicate" }) });
    expect(duplicate.response.ok && duplicate.payload?.alreadyExists === true, "deletion request was not idempotent");
    const status = await ownerRequest("/api/delete-request");
    expect(status.response.ok && status.payload?.request?.status === "REQUESTED", "deletion request status was not retrievable");

    const memberRequest = client();
    const memberLogin = await memberRequest("/api/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: memberEmail, password }) });
    expect(memberLogin.response.ok, `member login failed: ${memberLogin.response.status}`);
    const forbidden = await memberRequest("/api/delete-request", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ reason: "not owner" }) });
    expect(forbidden.response.status === 403, "non-owner deletion request was not rejected");
    console.log(`Deletion request smoke passed for ${workspace.id}`);
  } finally {
    await prisma.workspace.delete({ where: { id: workspace.id } }).catch(() => undefined);
    await prisma.user.deleteMany({ where: { id: { in: [owner.id, member.id] } } });
    await prisma.$disconnect();
  }
}

main().catch(async (error) => {
  await prisma.$disconnect();
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
