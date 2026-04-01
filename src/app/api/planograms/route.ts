import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const planograms = await prisma.planogram.findMany({
    include: {
      slots: {
        include: { product: true },
        orderBy: { position: "asc" },
      },
      clusterAssignments: {
        include: { cluster: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(planograms);
}
