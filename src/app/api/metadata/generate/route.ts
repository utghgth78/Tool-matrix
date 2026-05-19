import { NextRequest } from "next/server";
import { generateMetadataFromGemini } from "@/lib/ai/gemini";
import { getBearerUser, getClientIp, jsonError } from "@/lib/server/auth";
import { rateLimit } from "@/lib/security/rate-limit";
import { metadataSchema } from "@/lib/validators";

export async function POST(request: NextRequest) {
  try {
    const user = await getBearerUser(request);
    await rateLimit(`metadata:${user.uid}:${getClientIp(request)}`, 30, 60 * 60);
    const input = metadataSchema.parse(await request.json());
    const metadata = await generateMetadataFromGemini(input);
    return Response.json({ ok: true, metadata });
  } catch (error) {
    return jsonError(error, 400);
  }
}
