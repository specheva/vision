import { prisma } from "@/lib/db";
import { OnlineMerch } from "@/components/online/OnlineMerch";

export const dynamic = "force-dynamic";

export default async function OnlinePage() {
  const [landingPages, merchRules, categoryPins] = await Promise.all([
    prisma.landingPage.findMany({ orderBy: { updatedAt: "desc" } }),
    prisma.categoryMerchRule.findMany({ where: { isActive: true }, orderBy: { category: "asc" } }),
    prisma.categoryPin.findMany({ where: { isActive: true }, include: { product: true }, orderBy: { position: "asc" } }),
  ]);

  return (
    <OnlineMerch
      landingPages={JSON.parse(JSON.stringify(landingPages))}
      merchRules={JSON.parse(JSON.stringify(merchRules))}
      categoryPins={JSON.parse(JSON.stringify(categoryPins))}
    />
  );
}
