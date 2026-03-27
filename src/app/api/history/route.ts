import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/history?workflowId=xxx
export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const workflowId = searchParams.get("workflowId");

  const runs = await prisma.workflowRun.findMany({
    where: {
      userId,
      ...(workflowId ? { workflowId } : {}),
    },
    orderBy: { startedAt: "desc" },
    take: 50,
    include: {
      nodeRuns: {
        orderBy: { startedAt: "asc" },
      },
    },
  });

  return Response.json({ runs });
}
