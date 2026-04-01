import { prisma } from "@/lib/db";
import { StoreDirectory } from "@/components/stores/StoreDirectory";

export const dynamic = "force-dynamic";

export default async function StoresPage() {
  const stores = await prisma.store.findMany({
    include: {
      clusterAssignments: {
        include: { cluster: true },
      },
    },
    orderBy: { name: "asc" },
  });

  return (
    <StoreDirectory stores={JSON.parse(JSON.stringify(stores))} />
  );
}
