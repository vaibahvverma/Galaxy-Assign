import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Allow execution route up to 60s before Next.js times out
export const maxDuration = 60;

const ExecuteSchema = z.object({
  workflowId: z.string(),
  nodes: z.array(z.any()),
  edges: z.array(z.any()),
  scope: z.enum(["FULL", "PARTIAL", "SINGLE"]).default("FULL"),
  selectedNodeIds: z.array(z.string()).optional(),
});

type NodeOutputs = Record<string, any>;

// --- Topological sort for DAG execution order ---
function topologicalSort(nodes: any[], edges: any[]): string[][] {
  const nodeIds = nodes.map((n) => n.id);
  const inDegree: Record<string, number> = {};
  const adj: Record<string, string[]> = {};

  for (const id of nodeIds) {
    inDegree[id] = 0;
    adj[id] = [];
  }

  for (const edge of edges) {
    if (adj[edge.source] !== undefined) {
      adj[edge.source].push(edge.target);
      inDegree[edge.target] = (inDegree[edge.target] || 0) + 1;
    }
  }

  const levels: string[][] = [];
  let queue = nodeIds.filter((id) => inDegree[id] === 0);

  while (queue.length > 0) {
    levels.push([...queue]);
    const nextQueue: string[] = [];
    for (const id of queue) {
      for (const neighbor of adj[id] || []) {
        inDegree[neighbor]--;
        if (inDegree[neighbor] === 0) nextQueue.push(neighbor);
      }
    }
    queue = nextQueue;
  }

  return levels;
}

// --- Resolve input value from connected edge ---
function resolveInput(
  nodeId: string,
  handleId: string,
  edges: any[],
  nodeOutputs: NodeOutputs,
  nodes: any[]
): any {
  const edge = edges.find(
    (e) => e.target === nodeId && e.targetHandle === handleId
  );
  if (!edge) return null;
  const sourceNode = nodes.find((n) => n.id === edge.source);
  if (!sourceNode) return null;
  const outputs = nodeOutputs[edge.source];
  if (sourceNode.type === "text") return outputs?.text || sourceNode.data?.text || "";
  if (sourceNode.type === "imageUpload") return outputs?.imageUrl || sourceNode.data?.imageUrl || null;
  if (sourceNode.type === "videoUpload") return outputs?.videoUrl || sourceNode.data?.videoUrl || null;
  if (sourceNode.type === "llm") return outputs?.text || null;
  if (sourceNode.type === "cropImage") return outputs?.imageUrl || null;
  if (sourceNode.type === "extractFrame") return outputs?.imageUrl || null;
  return outputs?.output || null;
}

// --- Fetch image as inline part for Gemini vision ---
async function fetchImagePart(url: string) {
  try {
    if (url.startsWith("data:")) {
      const [header, data] = url.split(",");
      const mimeType = header.split(":")[1].split(";")[0];
      return { inlineData: { data, mimeType } };
    }
    const res = await fetch(url);
    if (!res.ok) return null;
    const buffer = await res.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    const mimeType = res.headers.get("content-type") || "image/jpeg";
    return { inlineData: { data: base64, mimeType } };
  } catch {
    return null;
  }
}

// POST /api/execute
export async function POST(req: NextRequest) {
  // const { userId } = await auth();
  // if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const userId = "test_user";

  const body = await req.json();
  const parsed = ExecuteSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { workflowId, nodes, edges, scope, selectedNodeIds } = parsed.data;

  // Filter nodes to execute based on scope
  let targetNodes = nodes;
  if (scope !== "FULL" && selectedNodeIds?.length) {
    targetNodes = nodes.filter((n) => selectedNodeIds.includes(n.id));
  }

  // Create WorkflowRun record
  const run = await prisma.workflowRun.create({
    data: { workflowId, userId, scope, status: "RUNNING" },
  });

  const nodeOutputs: NodeOutputs = {};
  const nodeRunIds: Record<string, string> = {};
  const levels = topologicalSort(targetNodes, edges);

  // Initialize Gemini
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

  // Execute level by level
  for (const level of levels) {
    const levelNodes = targetNodes.filter((n) => level.includes(n.id));

    // Create NodeRun records
    await Promise.all(
      levelNodes.map(async (node) => {
        const nodeRun = await prisma.nodeRun.create({
          data: {
            runId: run.id,
            nodeId: node.id,
            nodeType: node.type,
            status: "RUNNING",
            startedAt: new Date(),
          },
        });
        nodeRunIds[node.id] = nodeRun.id;
      })
    );

    // Execute all nodes in parallel
    await Promise.all(
      levelNodes.map(async (node) => {
        const startTime = Date.now();
        try {
          let output: any = {};

          if (node.type === "text") {
            output = { text: node.data?.text || "" };
          } else if (node.type === "imageUpload") {
            output = { imageUrl: node.data?.imageUrl || null };
          } else if (node.type === "videoUpload") {
            output = { videoUrl: node.data?.videoUrl || null };
          } else if (node.type === "llm") {
            // Validate Gemini API key before calling
            const geminiKey = process.env.GEMINI_API_KEY || "";
            if (!geminiKey || geminiKey.length < 20 || geminiKey.startsWith("gen-lang-client")) {
              throw new Error(
                "Invalid Gemini API key. Go to https://aistudio.google.com/apikey to get a valid key starting with 'AIza...' and set it as GEMINI_API_KEY in .env.local"
              );
            }

            // --- Call Gemini directly ---
            const systemPrompt =
              resolveInput(node.id, "system_prompt", edges, nodeOutputs, nodes) ||
              node.data?.systemPrompt;
            const userMessage =
              resolveInput(node.id, "user_message", edges, nodeOutputs, nodes) ||
              node.data?.userMessage || "";

            // Collect all image inputs from connected edges
            const imageEdges = edges.filter(
              (e) => e.target === node.id && e.targetHandle === "images"
            );
            const imageUrls: string[] = imageEdges
              .map((e: any) => {
                const src = nodes.find((n: any) => n.id === e.source);
                return nodeOutputs[e.source]?.imageUrl || src?.data?.imageUrl;
              })
              .filter(Boolean);

            // User's API key only has access to Gemini 2.x models. Map older nodes to new models.
            // Force everything to 'flash' as 'pro' has strict 0-quota limits on some free keys.
            let modelName = node.data?.model || "gemini-2.5-flash";
            if (modelName === "gemini-1.5-pro" || modelName === "gemini-2.5-pro") modelName = "gemini-2.5-flash";
            if (modelName === "gemini-1.5-flash") modelName = "gemini-2.5-flash";
            
            const model = genAI.getGenerativeModel({ model: modelName });

            // Build content parts
            const parts: any[] = [];
            if (systemPrompt) parts.push({ text: `System: ${systemPrompt}\n\n` });
            parts.push({ text: userMessage || "Please process this request." });

            // Add images — fetch from /uploads/ URL  
            for (const imgUrl of imageUrls) {
              if (!imgUrl) continue;
              // Build full URL for server-side fetch
              const fullUrl = imgUrl.startsWith("/") 
                ? `http://localhost:${process.env.PORT || 3000}${imgUrl}`
                : imgUrl;
              const imgPart = await fetchImagePart(fullUrl);
              if (imgPart) parts.push(imgPart);
            }

            const result = await model.generateContent({ contents: [{ role: "user", parts }] });
            const text = result.response.text();
            output = { text };
          } else if (node.type === "cropImage") {
            // For FFmpeg operations, we just pass through the image URL for now
            // (Real FFmpeg processing requires a server-side worker)
            const imageUrl =
              resolveInput(node.id, "image_url", edges, nodeOutputs, nodes) ||
              node.data?.imageUrl;
            if (!imageUrl) throw new Error("No image connected to Crop Image node");
            output = { imageUrl, note: "Crop preview (FFmpeg worker required for actual crop)" };
          } else if (node.type === "extractFrame") {
            const videoUrl =
              resolveInput(node.id, "video_url", edges, nodeOutputs, nodes) ||
              node.data?.videoUrl;
            if (!videoUrl) throw new Error("No video connected to Extract Frame node");
            output = { imageUrl: null, videoUrl, note: "Frame extraction requires FFmpeg worker (Trigger.dev)" };
          }

          nodeOutputs[node.id] = output;
          const durationMs = Date.now() - startTime;

          await prisma.nodeRun.update({
            where: { id: nodeRunIds[node.id] },
            data: { status: "SUCCESS", outputData: output, durationMs },
          });
        } catch (err: any) {
          const durationMs = Date.now() - startTime;
          await prisma.nodeRun.update({
            where: { id: nodeRunIds[node.id] },
            data: { status: "FAILED", error: err?.message || "Unknown error", durationMs },
          });
          nodeOutputs[node.id] = { error: err?.message };
        }
      })
    );
  }

  // Determine overall run status
  const nodeRuns = await prisma.nodeRun.findMany({ where: { runId: run.id } });
  const allSuccess = nodeRuns.every((n: { status: string }) => n.status === "SUCCESS");
  const allFailed = nodeRuns.every((n: { status: string }) => n.status === "FAILED");
  const finalStatus = allSuccess ? "SUCCESS" : allFailed ? "FAILED" : "PARTIAL";

  const finishedAt = new Date();
  const durationMs = finishedAt.getTime() - run.startedAt.getTime();

  await prisma.workflowRun.update({
    where: { id: run.id },
    data: { status: finalStatus, finishedAt, durationMs },
  });

  return Response.json({
    runId: run.id,
    status: finalStatus,
    outputs: nodeOutputs,
    nodeRuns: nodeRuns.map((n: { nodeId: string; nodeType: string; status: string; outputData: any; error: string | null; durationMs: number | null }) => ({
      nodeId: n.nodeId,
      nodeType: n.nodeType,
      status: n.status,
      outputData: n.outputData,
      error: n.error,
      durationMs: n.durationMs,
    })),
  });
}
