import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const stores = await prisma.store.findMany({
    include: {
      clusterAssignments: {
        include: { cluster: true },
      },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(stores);
}
