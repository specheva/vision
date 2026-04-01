import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

interface Context {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, context: Context) {
  const { id } = await context.params;
  const { field } = await req.json();

  if (field !== "isBestseller" && field !== "isNewArrival") {
    return NextResponse.json(
      { error: 'Invalid field. Must be "isBestseller" or "isNewArrival".' },
      { status: 400 }
    );
  }

  const existing = await prisma.product.findUnique({
    where: { id },
    select: { [field]: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const product = await prisma.product.update({
    where: { id },
    data: { [field]: !existing[field] },
  });

  return NextResponse.json(product);
}
