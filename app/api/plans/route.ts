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

function prismaErrorDetails(error: unknown) {
  if (!error || typeof error !== "object") return { name: "UnknownError", code: null };
  const candidate = error as { name?: unknown; code?: unknown };
  return {
    name: typeof candidate.name === "string" ? candidate.name : "UnknownError",
    code: typeof candidate.code === "string" ? candidate.code : null,
  };
}

function shouldDegradePlanCatalog(error: unknown) {
  const { name, code } = prismaErrorDetails(error);
  const databaseFailureCode = typeof code === "string" && (/^P10\d{2}$/.test(code) || ["P2021", "P2022"].includes(code));
  return name === "PrismaClientInitializationError" || (name === "PrismaClientKnownRequestError" && databaseFailureCode);
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
    const details = prismaErrorDetails(error);
    if (shouldDegradePlanCatalog(error)) {
      console.error("[api/plans] database-backed catalog unavailable", details);
      return NextResponse.json(
        { plans: [], degraded: true },
        { status: 200, headers: { "cache-control": "no-store", "x-centralia-degraded": "plans-database-unavailable" } },
      );
    }
    return safeAuthError(error);
  }
}
