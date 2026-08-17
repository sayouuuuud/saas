import { NextResponse } from "next/server";
import { getCurrentUser, safeAuthError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ user: null }, { status: 401, headers: { "cache-control": "no-store" } });
    if (!user.workspace) return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email, workspace: null } }, { headers: { "cache-control": "private, no-store" } });

    const [workspace, lmsLinks] = await Promise.all([
      prisma.workspace.findUnique({
        where: { id: user.workspace.id },
        select: {
          id: true,
          name: true,
          plan: { select: { name: true } },
          subscription: { select: { status: true, plan: { select: { name: true } } } },
        },
      }),
      prisma.lmsLink.findMany({
        where: { workspaceId: user.workspace.id },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, displayName: true, publicUrl: true, status: true },
      }),
    ]);

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        workspace: workspace
          ? { id: workspace.id, name: workspace.name, plan: workspace.subscription?.plan.name ?? workspace.plan?.name ?? null, subscriptionStatus: workspace.subscription?.status ?? null, lmsLinks }
          : null,
      },
    }, { headers: { "cache-control": "private, no-store" } });
  } catch (error) {
    return safeAuthError(error);
  }
}
