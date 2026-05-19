import { NextRequest } from "next/server";
import { processVideoUpload } from "@/lib/queue";
import { getBearerUser, jsonError } from "@/lib/server/auth";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ videoId: string }> }
) {
  try {
    const user = await getBearerUser(request);
    const { videoId } = await context.params;
    const result = await processVideoUpload(videoId, user.uid);
    return Response.json(result);
  } catch (error) {
    return jsonError(error, 400);
  }
}
