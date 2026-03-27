import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import { writeFile } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";

// POST /api/upload — saves file to public/uploads/, returns a real /uploads/filename URL
export async function POST(req: NextRequest) {
  // const { userId } = await auth();
  // if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const userId = "test_user";

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return Response.json({ error: "No file provided" }, { status: 400 });
    }

    // Create unique filename
    const ext = file.name.split(".").pop() || "bin";
    const fileName = `${randomUUID()}.${ext}`;
    const uploadDir = join(process.cwd(), "public", "uploads");
    const filePath = join(uploadDir, fileName);

    // Write file to disk
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    // Return a simple URL (no base64, keeps payload tiny)
    const url = `/uploads/${fileName}`;

    return Response.json({
      url,
      fileName: file.name,
      size: file.size,
    });
  } catch (err: any) {
    console.error("[upload] Error:", err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
