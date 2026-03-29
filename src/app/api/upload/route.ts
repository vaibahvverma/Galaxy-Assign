import { NextRequest } from "next/server";

// POST /api/upload — converts file to base64 data URL, works on Vercel (no disk write needed)
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return Response.json({ error: "No file provided" }, { status: 400 });
    }

    // Max 20MB to stay within Vercel request limits
    if (file.size > 20 * 1024 * 1024) {
      return Response.json({ error: "File too large (max 20MB)" }, { status: 413 });
    }

    // Convert to base64 data URL — works everywhere, no disk needed
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = buffer.toString("base64");
    const mimeType = file.type || "application/octet-stream";
    const dataUrl = `data:${mimeType};base64,${base64}`;

    return Response.json({
      url: dataUrl,
      fileName: file.name,
      size: file.size,
    });
  } catch (err: any) {
    console.error("[upload] Error:", err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
}

