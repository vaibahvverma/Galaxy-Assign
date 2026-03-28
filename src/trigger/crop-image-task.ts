import { task } from "@trigger.dev/sdk/v3";
import { execSync } from "child_process";
import { writeFileSync, readFileSync, unlinkSync, mkdirSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { randomUUID } from "crypto";

export type CropImageTaskPayload = {
  imageUrl: string;
  xPercent?: number;
  yPercent?: number;
  widthPercent?: number;
  heightPercent?: number;
  transloaditKey: string;
  transloaditSecret: string;
};

export type CropImageTaskOutput = {
  outputUrl: string;
};

export const cropImageTask = task({
  id: "crop-image-task",
  maxDuration: 120,
  run: async (payload: CropImageTaskPayload): Promise<CropImageTaskOutput> => {
    const {
      imageUrl,
      xPercent = 0,
      yPercent = 0,
      widthPercent = 100,
      heightPercent = 100,
    } = payload;

    // Download image
    const inputRes = await fetch(imageUrl);
    const inputBuffer = Buffer.from(await inputRes.arrayBuffer());
    const ext = imageUrl.split(".").pop()?.split("?")[0] || "jpg";
    const tmpDir = join(tmpdir(), randomUUID());
    mkdirSync(tmpDir, { recursive: true });
    const inputPath = join(tmpDir, `input.${ext}`);
    const outputPath = join(tmpDir, "output.jpg");
    writeFileSync(inputPath, inputBuffer);

    // Use FFmpeg to probe image dimensions
    const probeOutput = execSync(
      `ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0 "${inputPath}"`
    ).toString().trim();
    const [width, height] = probeOutput.split(",").map(Number);

    const cropX = Math.round((xPercent / 100) * width);
    const cropY = Math.round((yPercent / 100) * height);
    const cropW = Math.round((widthPercent / 100) * width);
    const cropH = Math.round((heightPercent / 100) * height);

    // Run FFmpeg crop
    execSync(
      `ffmpeg -i "${inputPath}" -vf "crop=${cropW}:${cropH}:${cropX}:${cropY}" -frames:v 1 "${outputPath}" -y`
    );

    // Upload to Transloadit
    const outputBuffer = readFileSync(outputPath);
    const formData = new FormData();
    const paramsObj = {
      auth: { key: payload.transloaditKey },
      steps: {
        ":original": { robot: "/upload/handle" },
        exported: {
          robot: "/s3/store",
          use: ":original",
        },
      },
    };
    formData.append("params", JSON.stringify(paramsObj));
    formData.append("file", new Blob([outputBuffer], { type: "image/jpeg" }), "cropped.jpg");

    const uploadRes = await fetch("https://api2.transloadit.com/assemblies", {
      method: "POST",
      body: formData,
    });
    const uploadData = await uploadRes.json();

    // Cleanup temp files
    try {
      unlinkSync(inputPath);
      unlinkSync(outputPath);
    } catch {}

    const outputUrl = uploadData?.results?.[":original"]?.[0]?.ssl_url || 
                      uploadData?.results?.exported?.[0]?.ssl_url ||
                      imageUrl;

    return { outputUrl };
  },
});
