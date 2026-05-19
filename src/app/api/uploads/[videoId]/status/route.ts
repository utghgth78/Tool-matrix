import { FieldValue } from "firebase-admin/firestore";
import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { getBearerUser, jsonError } from "@/lib/server/auth";
import { updateStatusSchema } from "@/lib/validators";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ videoId: string }> }
) {
  try {
    const user = await getBearerUser(request);
    const { videoId } = await context.params;
    const { status } = updateStatusSchema.parse(await request.json());
    const ref = adminDb.doc(`videos/${videoId}`);
    const snap = await ref.get();

    if (!snap.exists) throw new Error("Video not found.");
    if (snap.data()?.userId !== user.uid) throw new Error("You do not have access to this video.");
    if (snap.data()?.uploaded) throw new Error("Uploaded videos cannot be changed from the client.");

    await ref.update({
      status,
      updatedAt: FieldValue.serverTimestamp(),
      ...(status !== "failed" ? { lastError: FieldValue.delete() } : {})
    });

    return Response.json({ ok: true, status });
  } catch (error) {
    return jsonError(error, 400);
  }
}
