import { NextResponse } from "next/server";
import { safeAuthError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function parseFeatureList(value: string): string[] {
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) && parsed.every((item): item is string => typeof item === "string") ? parsed : [];
  } catch {
    return [];
  }
}

function parseLimits(value: string): Record<string, number> {
  try {
    const parsed: unknown = JSON.parse(value);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return Object.fromEntries(Object.entries(parsed).filter(([, item]) => typeof item === "number" && Number.isFinite(item))) as Record<string, number>;
  } catch {
    return {};
  }
}

export async function GET() {
  try {
    const plans = await prisma.plan.findMany({
      where: { active: true },
      orderBy: { monthlyCents: "asc" },
      take: 50,
      select: { id: true, code: true, name: true, description: true, monthlyCents: true, yearlyCents: true, trialDays: true, supportTier: true, featuresJson: true, limitsJson: true },
    });
    return NextResponse.json({ plans: plans.map(({ featuresJson, limitsJson, ...plan }) => ({ ...plan, features: parseFeatureList(featuresJson), limits: parseLimits(limitsJson) })) });
  } catch (error) {
    return safeAuthError(error);
  }
}
