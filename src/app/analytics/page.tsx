import { prisma } from "@/lib/db";
import { AnalyticsDashboard } from "@/components/analytics/AnalyticsDashboard";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const [productCount, storeCount, campaignCount, planogramCount] = await Promise.all([
    prisma.product.count(),
    prisma.store.count(),
    prisma.campaign.count(),
    prisma.planogram.count(),
  ]);

  const categoryBreakdown = await prisma.product.groupBy({
    by: ["category"],
    _count: true,
  });

  const regionBreakdown = await prisma.store.groupBy({
    by: ["region"],
    _count: true,
  });

  return (
    <AnalyticsDashboard
      stats={{ productCount, storeCount, campaignCount, planogramCount }}
      categoryBreakdown={JSON.parse(JSON.stringify(categoryBreakdown))}
      regionBreakdown={JSON.parse(JSON.stringify(regionBreakdown))}
    />
  );
}
