import { NextResponse } from "next/server";
import { safeAuthError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const plans = await prisma.plan.findMany({ where: { active: true }, orderBy: { monthlyCents: "asc" } });
    return NextResponse.json({ plans: plans.map((plan) => ({ ...plan, features: JSON.parse(plan.featuresJson), limits: JSON.parse(plan.limitsJson) })) });
  } catch (error) {
    return safeAuthError(error);
  }
}
