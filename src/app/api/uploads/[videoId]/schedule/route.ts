import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { getBearerUser, jsonError } from "@/lib/server/auth";
import { scheduleUploadSchema } from "@/lib/validators";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ videoId: string }> }
) {
  try {
    const user = await getBearerUser(request);
    const { videoId } = await context.params;
    const body = scheduleUploadSchema.parse(await request.json());
    const ref = adminDb.doc(`videos/${videoId}`);
    const snap = await ref.get();

    if (!snap.exists) throw new Error("Video not found.");
    if (snap.data()?.userId !== user.uid) throw new Error("You do not have access to this video.");
    if (snap.data()?.uploaded) throw new Error("Uploaded videos cannot be rescheduled.");

    const scheduledAt = body.scheduledAt
      ? Timestamp.fromDate(new Date(body.scheduledAt))
      : Timestamp.fromMillis(Date.now() + (body.delayMinutes || 0) * 60 * 1000);

    await ref.update({
      status: "scheduled",
      scheduledAt,
      updatedAt: FieldValue.serverTimestamp()
    });

    return Response.json({ ok: true, scheduledAt: scheduledAt.toDate().toISOString() });
  } catch (error) {
    return jsonError(error, 400);
  }
}
