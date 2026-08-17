import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const plans = [
  { code: "starter", name: "Starter", description: "للمدرس الفردي الذي يريد إدارة اشتراكه ورابط منصته.", monthlyCents: 1900, yearlyCents: 19000, trialDays: 14, supportTier: "standard", featuresJson: JSON.stringify(["حساب مدرس", "رابط LMS واحد", "فواتير SaaS", "دعم عادي"]), limitsJson: JSON.stringify({ members: 1, links: 1 }) },
  { code: "growth", name: "Growth", description: "للمدرسين والفرق الصغيرة مع تقارير وفحص دوري.", monthlyCents: 4900, yearlyCents: 49000, trialDays: 14, supportTier: "priority", featuresJson: JSON.stringify(["كل مزايا Starter", "أعضاء الفريق", "تقارير أوسع", "فحص دوري للرابط"]), limitsJson: JSON.stringify({ members: 5, links: 3 }) },
  { code: "academy", name: "Academy", description: "للأكاديميات التي تحتاج إدارة متقدمة ودعمًا ذا أولوية.", monthlyCents: 9900, yearlyCents: 99000, trialDays: 30, supportTier: "priority", featuresJson: JSON.stringify(["كل مزايا Growth", "Workspaces موسعة", "تقارير متقدمة", "دعم أولوية"]), limitsJson: JSON.stringify({ members: 20, links: 10 }) },
];

async function main() {
  for (const plan of plans) await prisma.plan.upsert({ where: { code: plan.code }, update: plan, create: plan });
  console.log(`Seeded ${plans.length} SaaS plans`);
}

main().finally(() => prisma.$disconnect());
