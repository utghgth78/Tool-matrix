import { NextRequest } from "next/server";
import { processNextUpload } from "@/lib/queue";
import { jsonError } from "@/lib/server/auth";

function assertCronAccess(request: NextRequest) {
  const expected = process.env.CRON_SECRET;
  if (!expected && process.env.NODE_ENV !== "production") return;

  const auth = request.headers.get("authorization") || "";
  const headerSecret = request.headers.get("x-cron-secret");
  const bearer = auth.startsWith("Bearer ") ? auth.slice(7) : "";

  if (!expected || (headerSecret !== expected && bearer !== expected)) {
    throw new Error("Invalid cron secret.");
  }
}

async function handler(request: NextRequest) {
  try {
    assertCronAccess(request);
    const result = await processNextUpload();
    return Response.json(result);
  } catch (error) {
    return jsonError(error, 500);
  }
}

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  return handler(request);
}

export async function GET(request: NextRequest) {
  return handler(request);
}
