import { prisma } from "@/lib/db";
import { CampaignCalendar } from "@/components/campaigns/CampaignCalendar";

export const dynamic = "force-dynamic";

export default async function CampaignsPage() {
  const campaigns = await prisma.campaign.findMany({
    orderBy: { startDate: "asc" },
  });

  return <CampaignCalendar campaigns={JSON.parse(JSON.stringify(campaigns))} />;
}
