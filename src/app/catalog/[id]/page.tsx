import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { ProductDetail } from "@/components/catalog/ProductDetail";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ProductDetailPage({ params }: Props) {
  const { id } = await params;

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      variants: { orderBy: { createdAt: "asc" } },
      media: { orderBy: { sortOrder: "asc" } },
      tags: { include: { tag: true } },
      planogramSlots: {
        include: {
          planogram: { select: { id: true, name: true, status: true } },
        },
      },
    },
  });

  if (!product) notFound();

  return (
    <ProductDetail product={JSON.parse(JSON.stringify(product))} />
  );
}
