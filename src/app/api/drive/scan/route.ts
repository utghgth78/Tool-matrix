import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { parseDriveFolderId, scanDriveFolder } from "@/lib/google/drive";
import { getAuthorizedGoogleClient } from "@/lib/google/oauth";
import { getUserSettings } from "@/lib/queue";
import { getBearerUser, getClientIp, jsonError } from "@/lib/server/auth";
import { rateLimit } from "@/lib/security/rate-limit";
import { scanDriveSchema } from "@/lib/validators";

export async function POST(request: NextRequest) {
  try {
    const user = await getBearerUser(request);
    await rateLimit(`drive-scan:${user.uid}:${getClientIp(request)}`, 12, 60 * 60);

    const body = scanDriveSchema.parse(await request.json());
    const folderId = parseDriveFolderId(body.folderUrl);
    const auth = await getAuthorizedGoogleClient(user.uid);
    const settings = await getUserSettings(user.uid);
    const result = await scanDriveFolder(auth, folderId);

    let created = 0;
    let skipped = 0;

    for (const [index, file] of result.files.entries()) {
      if (!file.id) continue;
      const ref = adminDb.doc(`videos/${user.uid}_${file.id}`);
      const exists = await ref.get();
      if (exists.exists) {
        skipped += 1;
        continue;
      }

      const scheduledAt = Timestamp.fromMillis(Date.now() + settings.uploadDelayMinutes * 60 * 1000 * index);
      await ref.create({
        userId: user.uid,
        title: file.name || "Untitled video",
        fileName: file.name || "Untitled video",
        folderName: result.folderName,
        folderId,
        driveFileId: file.id,
        driveUrl: file.webViewLink || `https://drive.google.com/file/d/${file.id}/view`,
        mimeType: file.mimeType || null,
        size: file.size ? Number(file.size) : null,
        durationMs: file.videoMediaMetadata?.durationMillis ? Number(file.videoMediaMetadata.durationMillis) : null,
        thumbnailUrl: file.thumbnailLink || null,
        status: "pending",
        uploaded: false,
        youtubeVideoId: "",
        retryCount: 0,
        scheduledAt,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      });
      created += 1;
    }

    return Response.json({ ok: true, folderName: result.folderName, found: result.files.length, created, skipped });
  } catch (error) {
    return jsonError(error, 400);
  }
}
