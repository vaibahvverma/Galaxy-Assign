import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

const UpdateSchema = z.object({
  name: z.string().optional(),
  nodes: z.array(z.any()).optional(),
  edges: z.array(z.any()).optional(),
});

// GET /api/workflows/[id]
export async function GET(
  _req: NextRequest,
  ctx: RouteContext<"/api/workflows/[id]">
) {
  // const { userId } = await auth();
  // if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const userId = "test_user";
  const { id } = await ctx.params;

  const workflow = await prisma.workflow.findUnique({ where: { id } });
  if (!workflow || workflow.userId !== userId) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  return Response.json({ workflow });
}

// PATCH /api/workflows/[id] — save/update workflow
export async function PATCH(
  req: NextRequest,
  ctx: RouteContext<"/api/workflows/[id]">
) {
  // const { userId } = await auth();
  // if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const userId = "test_user";
  const { id } = await ctx.params;

  const workflow = await prisma.workflow.findUnique({ where: { id } });
  if (!workflow || workflow.userId !== userId) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const updated = await prisma.workflow.update({
    where: { id },
    data: parsed.data,
  });

  return Response.json({ workflow: updated });
}

// DELETE /api/workflows/[id]
export async function DELETE(
  _req: NextRequest,
  ctx: RouteContext<"/api/workflows/[id]">
) {
  // const { userId } = await auth();
  // if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const userId = "test_user";
  const { id } = await ctx.params;

  const workflow = await prisma.workflow.findUnique({ where: { id } });
  if (!workflow || workflow.userId !== userId) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.workflow.delete({ where: { id } });
  return Response.json({ success: true });
}
