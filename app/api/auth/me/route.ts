import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ user: null }, { status: 401 });
  return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email, workspace: user.workspace ? { id: user.workspace.id, name: user.workspace.name, plan: user.workspace.subscription?.plan.name ?? user.workspace.plan?.name ?? null, subscriptionStatus: user.workspace.subscription?.status ?? null, lmsLinks: user.workspace.lmsLinks } : null } });
}
