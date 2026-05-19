import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { google } from "googleapis";
import { Readable } from "stream";
import { adminDb } from "@/lib/firebase/admin";
import { generateMetadataFromGemini } from "@/lib/ai/gemini";
import { getAuthorizedGoogleClient } from "@/lib/google/oauth";
import { uploadVideoToYouTube } from "@/lib/google/youtube";
import type { QueueVideo, UserSettings, VideoMetadata } from "@/lib/types";

const defaultSettings: Omit<UserSettings, "userId"> = {
  uploadDelayMinutes: 5,
  privacy: "public",
  autoMetadata: true,
  autoPublish: true
};

export async function getUserSettings(userId: string): Promise<UserSettings> {
  const snap = await adminDb.doc(`settings/${userId}`).get();
  return {
    userId,
    ...defaultSettings,
    ...(snap.exists ? snap.data() : {})
  } as UserSettings;
}

async function acquireUploadLock() {
  const ref = adminDb.doc("locks/upload-next");
  const now = Timestamp.now();
  const lockedUntil = Timestamp.fromMillis(Date.now() + 15 * 60 * 1000);

  return adminDb.runTransaction(async (transaction) => {
    const snap = await transaction.get(ref);
    const data = snap.data();

    if (snap.exists && data?.lockedUntil?.toMillis() > now.toMillis()) return false;

    transaction.set(ref, {
      lockedAt: now,
      lockedUntil
    });
    return true;
  });
}

async function releaseUploadLock() {
  await adminDb.doc("locks/upload-next").delete().catch(() => undefined);
}

async function claimNextVideo() {
  const now = Timestamp.now();
  const snapshot = await adminDb
    .collection("videos")
    .where("uploaded", "==", false)
    .where("status", "in", ["pending", "metadata_ready", "scheduled"])
    .orderBy("scheduledAt", "asc")
    .limit(10)
    .get();

  const candidate = snapshot.docs.find((doc) => {
    const scheduledAt = doc.data().scheduledAt as Timestamp | undefined;
    return !scheduledAt || scheduledAt.toMillis() <= now.toMillis();
  });

  if (!candidate) return null;

  const claimed = await adminDb.runTransaction(async (transaction) => {
    const fresh = await transaction.get(candidate.ref);
    const data = fresh.data() as QueueVideo | undefined;
    if (!fresh.exists || !data || data.uploaded || data.status === "uploading") return null;

    transaction.update(candidate.ref, {
      status: "uploading",
      updatedAt: FieldValue.serverTimestamp()
    });

    return { id: fresh.id, ...data, status: "uploading" } as QueueVideo;
  });

  return claimed;
}

async function claimVideoById(videoId: string, userId?: string) {
  const ref = adminDb.doc(`videos/${videoId}`);

  return adminDb.runTransaction(async (transaction) => {
    const fresh = await transaction.get(ref);
    const data = fresh.data() as QueueVideo | undefined;
    if (!fresh.exists || !data) throw new Error("Video not found.");
    if (userId && data.userId !== userId) throw new Error("You do not have access to this video.");
    if (data.uploaded) throw new Error("This video has already been uploaded.");
    if (data.status === "uploading") throw new Error("This video is already uploading.");

    transaction.update(ref, {
      status: "uploading",
      updatedAt: FieldValue.serverTimestamp()
    });

    return { id: fresh.id, ...data, status: "uploading" } as QueueVideo;
  });
}

function fallbackMetadata(video: QueueVideo): VideoMetadata {
  const baseTitle = (video.title || video.fileName).replace(/\.[^/.]+$/, "").replace(/[-_]+/g, " ").trim();
  return {
    title: baseTitle.slice(0, 100) || "New video",
    description: `Watch ${baseTitle || "this video"} on our YouTube channel.`,
    tags: [baseTitle, video.folderName || "video", "youtube"].filter(Boolean).slice(0, 20),
    hashtags: ["#YouTube", "#Video"]
  };
}

async function getDriveDownloadStream(userId: string, driveFileId: string) {
  const auth = await getAuthorizedGoogleClient(userId);
  const drive = google.drive({ version: "v3", auth });
  const response = await drive.files.get(
    { fileId: driveFileId, alt: "media" },
    { responseType: "stream" }
  );

  return {
    auth,
    stream: response.data as Readable
  };
}

async function uploadClaimedVideo(video: QueueVideo, force = false) {
  const settings = await getUserSettings(video.userId);
  if (!settings.autoPublish && !force) {
    await adminDb.doc(`videos/${video.id}`).update({
      status: "scheduled",
      updatedAt: FieldValue.serverTimestamp()
    });
    return { ok: true, skipped: true, reason: "Auto publish is disabled." };
  }

  let metadata = video.metadata || fallbackMetadata(video);
  if (settings.autoMetadata && !video.metadata) {
    metadata = await generateMetadataFromGemini({
      fileName: video.fileName,
      folderName: video.folderName
    }).catch(() => fallbackMetadata(video));
  }

  const { auth, stream } = await getDriveDownloadStream(video.userId, video.driveFileId);
  const youtube = await uploadVideoToYouTube({
    auth,
    stream,
    mimeType: video.mimeType,
    metadata,
    privacy: settings.privacy
  });

  await adminDb.doc(`videos/${video.id}`).update({
    status: "uploaded",
    uploaded: true,
    youtubeVideoId: youtube.youtubeVideoId,
    youtubeUrl: youtube.youtubeUrl,
    metadata,
    uploadedAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    lastError: FieldValue.delete()
  });

  await adminDb.collection("uploads").add({
    userId: video.userId,
    videoId: video.id,
    youtubeVideoId: youtube.youtubeVideoId,
    youtubeUrl: youtube.youtubeUrl,
    status: "uploaded",
    createdAt: FieldValue.serverTimestamp()
  });

  return { ok: true, uploaded: video.id, youtubeVideoId: youtube.youtubeVideoId };
}

export async function processNextUpload() {
  const locked = await acquireUploadLock();
  if (!locked) return { ok: true, skipped: true, reason: "Another upload is already running." };

  let video: QueueVideo | null = null;

  try {
    video = await claimNextVideo();
    if (!video) return { ok: true, skipped: true, reason: "No videos are ready." };

    return uploadClaimedVideo(video);
  } catch (error) {
    if (video) {
      await adminDb.doc(`videos/${video.id}`).update({
        status: "failed",
        uploaded: false,
        retryCount: FieldValue.increment(1),
        lastError: error instanceof Error ? error.message : "Upload failed.",
        updatedAt: FieldValue.serverTimestamp()
      });
    }
    throw error;
  } finally {
    await releaseUploadLock();
  }
}

export async function processVideoUpload(videoId: string, userId?: string) {
  const locked = await acquireUploadLock();
  if (!locked) return { ok: true, skipped: true, reason: "Another upload is already running." };

  let video: QueueVideo | null = null;

  try {
    video = await claimVideoById(videoId, userId);
    return await uploadClaimedVideo(video, true);
  } catch (error) {
    if (video) {
      await adminDb.doc(`videos/${video.id}`).update({
        status: "failed",
        uploaded: false,
        retryCount: FieldValue.increment(1),
        lastError: error instanceof Error ? error.message : "Upload failed.",
        updatedAt: FieldValue.serverTimestamp()
      });
    }
    throw error;
  } finally {
    await releaseUploadLock();
  }
}
