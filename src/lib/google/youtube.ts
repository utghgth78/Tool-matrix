import { google } from "googleapis";
import type { OAuth2Client } from "google-auth-library";
import type { Readable } from "stream";
import type { UploadPrivacy, VideoMetadata } from "@/lib/types";

export async function uploadVideoToYouTube({
  auth,
  stream,
  mimeType,
  metadata,
  privacy
}: {
  auth: OAuth2Client;
  stream: Readable;
  mimeType?: string;
  metadata: VideoMetadata;
  privacy: UploadPrivacy;
}) {
  const youtube = google.youtube({ version: "v3", auth });
  const response = await youtube.videos.insert({
    part: ["snippet", "status"],
    requestBody: {
      snippet: {
        title: metadata.title,
        description: `${metadata.description}\n\n${metadata.hashtags.join(" ")}`.trim(),
        tags: metadata.tags,
        categoryId: "22"
      },
      status: {
        privacyStatus: privacy,
        selfDeclaredMadeForKids: false
      }
    },
    media: {
      mimeType: mimeType || "video/mp4",
      body: stream
    }
  });

  const id = response.data.id;
  if (!id) throw new Error("YouTube upload completed without returning a video id.");

  return {
    youtubeVideoId: id,
    youtubeUrl: `https://www.youtube.com/watch?v=${id}`
  };
}
