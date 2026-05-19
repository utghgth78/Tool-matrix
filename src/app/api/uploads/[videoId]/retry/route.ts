import { FieldValue } from "firebase-admin/firestore";
import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { getBearerUser, jsonError } from "@/lib/server/auth";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ videoId: string }> }
) {
  try {
    const user = await getBearerUser(request);
    const { videoId } = await context.params;
    const ref = adminDb.doc(`videos/${videoId}`);
    const snap = await ref.get();

    if (!snap.exists) throw new Error("Video not found.");
    if (snap.data()?.userId !== user.uid) throw new Error("You do not have access to this video.");

    await ref.update({
      status: "pending",
      uploaded: false,
      scheduledAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      lastError: FieldValue.delete()
    });

    return Response.json({ ok: true });
  } catch (error) {
    return jsonError(error, 400);
  }
}
