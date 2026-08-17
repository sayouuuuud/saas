import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const plans = await prisma.plan.findMany({ where: { active: true }, orderBy: { monthlyCents: "asc" } });
  return NextResponse.json({ plans: plans.map((plan) => ({ ...plan, features: JSON.parse(plan.featuresJson), limits: JSON.parse(plan.limitsJson) })) });
}
