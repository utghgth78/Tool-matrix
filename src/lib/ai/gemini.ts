import { GoogleGenerativeAI } from "@google/generative-ai";
import type { VideoMetadata } from "@/lib/types";
import { requiredEnv } from "@/lib/env";

function parseJson(text: string): VideoMetadata {
  const cleaned = text.replace(/```json|```/g, "").trim();
  const parsed = JSON.parse(cleaned) as VideoMetadata;
  return {
    title: parsed.title?.slice(0, 100) || "Untitled video",
    description: parsed.description || "",
    tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 20).map(String) : [],
    hashtags: Array.isArray(parsed.hashtags) ? parsed.hashtags.slice(0, 8).map(String) : []
  };
}

export async function generateMetadataFromGemini(input: {
  fileName: string;
  folderName?: string;
}): Promise<VideoMetadata> {
  const ai = new GoogleGenerativeAI(requiredEnv("GEMINI_API_KEY"));
  const model = ai.getGenerativeModel({
    model: process.env.GEMINI_MODEL || "gemini-1.5-flash"
  });

  const prompt = `Generate YouTube SEO metadata as strict JSON for this video.
File name: ${input.fileName}
Folder name: ${input.folderName || "Unknown"}

Return only:
{
  "title": "max 100 characters",
  "description": "2-4 paragraphs with a clear call to action",
  "tags": ["8 to 20 short searchable tags"],
  "hashtags": ["3 to 8 hashtags beginning with #"]
}`;

  const result = await model.generateContent(prompt);
  return parseJson(result.response.text());
}
