import { prisma } from "@/lib/db";
import { CatalogGrid } from "@/components/catalog/CatalogGrid";

export const dynamic = "force-dynamic";

export default async function CatalogPage() {
  const [products, tags] = await Promise.all([
    prisma.product.findMany({
      include: {
        variants: true,
        tags: { include: { tag: true } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.tag.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <CatalogGrid
      products={JSON.parse(JSON.stringify(products))}
      tags={JSON.parse(JSON.stringify(tags))}
    />
  );
}
