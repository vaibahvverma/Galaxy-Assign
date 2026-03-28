import { task } from "@trigger.dev/sdk/v3";
import { GoogleGenerativeAI, Part } from "@google/generative-ai";

export type LLMTaskPayload = {
  model: string;
  systemPrompt?: string;
  userMessage: string;
  imageUrls?: string[]; // URLs to images for vision
};

export type LLMTaskOutput = {
  text: string;
};

export const llmTask = task({
  id: "llm-task",
  maxDuration: 300, // 5 minutes
  run: async (payload: LLMTaskPayload): Promise<LLMTaskOutput> => {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: payload.model || "gemini-1.5-flash" });

    const parts: Part[] = [];

    // Add images if present
    if (payload.imageUrls && payload.imageUrls.length > 0) {
      for (const url of payload.imageUrls) {
        const res = await fetch(url);
        const buffer = await res.arrayBuffer();
        const base64 = Buffer.from(buffer).toString("base64");
        const mimeType = res.headers.get("content-type") || "image/jpeg";
        parts.push({
          inlineData: {
            mimeType: mimeType as any,
            data: base64,
          },
        });
      }
    }

    // Add the user message text
    parts.push({ text: payload.userMessage });

    const generateConfig: Parameters<typeof model.generateContent>[0] = {
      contents: [{ role: "user", parts }],
    };

    if (payload.systemPrompt) {
      generateConfig.systemInstruction = payload.systemPrompt;
    }

    const result = await model.generateContent(generateConfig);
    const text = result.response.text();

    return { text };
  },
});
