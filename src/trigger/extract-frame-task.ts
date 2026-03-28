import { task } from "@trigger.dev/sdk/v3";
import { execSync } from "child_process";
import { writeFileSync, readFileSync, unlinkSync, mkdirSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { randomUUID } from "crypto";

export type ExtractFrameTaskPayload = {
  videoUrl: string;
  timestamp?: string; // seconds like "10" or percentage like "50%"
  transloaditKey: string;
  transloaditSecret: string;
};

export type ExtractFrameTaskOutput = {
  outputUrl: string;
};

export const extractFrameTask = task({
  id: "extract-frame-task",
  maxDuration: 120,
  run: async (payload: ExtractFrameTaskPayload): Promise<ExtractFrameTaskOutput> => {
    const { videoUrl, timestamp = "50%" } = payload;

    // Download video
    const inputRes = await fetch(videoUrl);
    const inputBuffer = Buffer.from(await inputRes.arrayBuffer());
    const ext = videoUrl.split(".").pop()?.split("?")[0] || "mp4";
    const tmpDir = join(tmpdir(), randomUUID());
    mkdirSync(tmpDir, { recursive: true });
    const inputPath = join(tmpDir, `input.${ext}`);
    const outputPath = join(tmpDir, "frame.jpg");
    writeFileSync(inputPath, inputBuffer);

    // Resolve timestamp
    let seekTime = "0";
    if (timestamp.endsWith("%")) {
      const pct = parseFloat(timestamp) / 100;
      const durationOutput = execSync(
        `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${inputPath}"`
      ).toString().trim();
      const duration = parseFloat(durationOutput);
      seekTime = (pct * duration).toFixed(2);
    } else {
      seekTime = timestamp;
    }

    // Extract frame with FFmpeg
    execSync(
      `ffmpeg -ss ${seekTime} -i "${inputPath}" -vframes 1 -q:v 2 "${outputPath}" -y`
    );

    // Upload to Transloadit
    const outputBuffer = readFileSync(outputPath);
    const formData = new FormData();
    const paramsObj = {
      auth: { key: payload.transloaditKey },
      steps: {
        ":original": { robot: "/upload/handle" },
      },
    };
    formData.append("params", JSON.stringify(paramsObj));
    formData.append("file", new Blob([outputBuffer], { type: "image/jpeg" }), "frame.jpg");

    const uploadRes = await fetch("https://api2.transloadit.com/assemblies", {
      method: "POST",
      body: formData,
    });
    const uploadData = await uploadRes.json();

    // Cleanup
    try {
      unlinkSync(inputPath);
      unlinkSync(outputPath);
    } catch {}

    const outputUrl = uploadData?.results?.[":original"]?.[0]?.ssl_url || videoUrl;
    return { outputUrl };
  },
});
