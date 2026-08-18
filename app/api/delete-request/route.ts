import { NextResponse } from "next/server";
import { checkRateLimit, rateLimitHeaders } from "@/lib/rate-limit";
import { getCurrentUser, safeAuthError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const noStore = { "cache-control": "no-store" };
const activeStatuses = ["REQUESTED", "IN_REVIEW", "APPROVED"] as const;

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user?.workspace) return NextResponse.json({ error: "يجب تسجيل الدخول أولًا" }, { status: 401, headers: noStore });
    const request = await prisma.dataDeletionRequest.findFirst({ where: { workspaceId: user.workspace.id }, orderBy: { requestedAt: "desc" }, select: { id: true, status: true, reason: true, requestedAt: true, reviewedAt: true, completedAt: true } });
    return NextResponse.json({ request }, { headers: noStore });
  } catch (error) {
    return safeAuthError(error);
  }
}

export async function POST(request: Request) {
  const limit = checkRateLimit(request, "delete-request", 3, 24 * 60 * 60 * 1000);
  const headers = { ...noStore, ...rateLimitHeaders(limit) };
  if (!limit.allowed) return NextResponse.json({ error: "طلبات حذف البيانات محدودة. حاول لاحقًا." }, { status: 429, headers });
  try {
    const user = await getCurrentUser();
    if (!user?.workspace) return NextResponse.json({ error: "يجب تسجيل الدخول أولًا" }, { status: 401, headers });
    const workspace = await prisma.workspace.findUnique({ where: { id: user.workspace.id }, select: { id: true, ownerId: true } });
    if (!workspace || workspace.ownerId !== user.id) return NextResponse.json({ error: "طلب حذف مساحة العمل متاح لمالكها فقط" }, { status: 403, headers });
    const body = await request.json().catch(() => ({}));
    const reason = typeof body.reason === "string" ? body.reason.trim().slice(0, 500) || null : null;
    const existing = await prisma.dataDeletionRequest.findFirst({ where: { workspaceId: workspace.id, status: { in: [...activeStatuses] } }, orderBy: { requestedAt: "desc" }, select: { id: true, status: true, requestedAt: true } });
    if (existing) return NextResponse.json({ request: existing, alreadyExists: true }, { status: 200, headers });
    const created = await prisma.dataDeletionRequest.create({ data: { workspaceId: workspace.id, requestedById: user.id, reason }, select: { id: true, status: true, reason: true, requestedAt: true } });
    await prisma.auditLog.create({ data: { actorId: user.id, workspaceId: workspace.id, action: "CREATE", entity: "DataDeletionRequest", entityId: created.id, reason: "workspace_data_deletion_requested", metadataJson: JSON.stringify({ reviewRequired: true, automaticDeletion: false }) } });
    return NextResponse.json({ request: created, alreadyExists: false }, { status: 201, headers });
  } catch (error) {
    return safeAuthError(error);
  }
}
