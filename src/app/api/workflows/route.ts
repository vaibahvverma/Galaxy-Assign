import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

const WorkflowSchema = z.object({
  name: z.string().min(1).default("Untitled Workflow"),
  nodes: z.array(z.any()),
  edges: z.array(z.any()),
});

// GET /api/workflows — list user's workflows
export async function GET() {
  // const { userId } = await auth();
  // if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const userId = "test_user";

  const workflows = await prisma.workflow.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    select: { id: true, name: true, createdAt: true, updatedAt: true },
  });

  return Response.json({ workflows });
}

// POST /api/workflows — create or upsert workflow
export async function POST(req: NextRequest) {
  // const { userId } = await auth();
  // if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const userId = "test_user";

  const body = await req.json();
  const parsed = WorkflowSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { name, nodes, edges } = parsed.data;

  const workflow = await prisma.workflow.create({
    data: { userId, name, nodes, edges },
  });

  return Response.json({ workflow }, { status: 201 });
}
