import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

interface Context {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, context: Context) {
  const { id } = await context.params;

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      variants: { orderBy: { createdAt: "asc" } },
      media: { orderBy: { sortOrder: "asc" } },
      tags: { include: { tag: true } },
    },
  });

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  return NextResponse.json(product);
}

export async function PUT(req: NextRequest, context: Context) {
  const { id } = await context.params;
  const body = await req.json();

  // Strip relation fields that shouldn't be updated directly
  const { variants, media, tags, planogramSlots, categoryPins, ...data } = body;

  try {
    const product = await prisma.product.update({
      where: { id },
      data,
      include: {
        variants: { orderBy: { createdAt: "asc" } },
        media: { orderBy: { sortOrder: "asc" } },
        tags: { include: { tag: true } },
      },
    });

    return NextResponse.json(product);
  } catch {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }
}

export async function DELETE(_req: NextRequest, context: Context) {
  const { id } = await context.params;

  try {
    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }
}
