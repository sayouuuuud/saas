import { NextResponse } from "next/server";
import { safeAuthError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const plans = await prisma.plan.findMany({
      where: { active: true },
      orderBy: { monthlyCents: "asc" },
      take: 50,
      select: { id: true, code: true, name: true, description: true, monthlyCents: true, yearlyCents: true, trialDays: true, supportTier: true, featuresJson: true, limitsJson: true },
    });
    return NextResponse.json({ plans: plans.map(({ featuresJson, limitsJson, ...plan }) => ({ ...plan, features: JSON.parse(featuresJson), limits: JSON.parse(limitsJson) })) });
  } catch (error) {
    return safeAuthError(error);
  }
}
