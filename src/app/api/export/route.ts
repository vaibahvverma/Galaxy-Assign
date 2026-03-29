import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

const ExportSchema = z.object({
  nodes: z.array(z.any()),
  edges: z.array(z.any()),
  name: z.string().default("Untitled Workflow"),
});

// GET /api/export?workflowId=xxx — export as JSON
export async function GET(req: NextRequest) {
  // const { userId } = await auth();
  // if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const userId = "test_user";

  const { searchParams } = new URL(req.url);
  const workflowId = searchParams.get("workflowId");
  if (!workflowId) return Response.json({ error: "Missing workflowId" }, { status: 400 });

  const workflow = await prisma.workflow.findUnique({ where: { id: workflowId } });
  if (!workflow || workflow.userId !== userId) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  return new Response(
    JSON.stringify({ name: workflow.name, nodes: workflow.nodes, edges: workflow.edges }),
    {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${workflow.name.replace(/\s+/g, "_")}.json"`,
      },
    }
  );
}

// POST /api/export — import workflow from JSON
export async function POST(req: NextRequest) {
  // const { userId } = await auth();
  // if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const userId = "test_user";

  const body = await req.json();
  const parsed = ExportSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { name, nodes, edges } = parsed.data;
  const workflow = await prisma.workflow.create({
    data: { userId, name: `${name} (imported)`, nodes, edges },
  });

  return Response.json({ workflow }, { status: 201 });
}
