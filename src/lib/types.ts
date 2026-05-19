import type { Timestamp } from "firebase/firestore";

export type VideoStatus = "pending" | "metadata_ready" | "uploading" | "uploaded" | "failed" | "scheduled";

export type UploadPrivacy = "public" | "private" | "unlisted";

export type VideoMetadata = {
  title: string;
  description: string;
  tags: string[];
  hashtags: string[];
};

export type QueueVideo = {
  id: string;
  userId: string;
  title: string;
  fileName: string;
  folderName?: string;
  driveFileId: string;
  driveUrl: string;
  mimeType?: string;
  size?: number;
  durationMs?: number;
  thumbnailUrl?: string;
  status: VideoStatus;
  uploaded: boolean;
  youtubeVideoId?: string;
  youtubeUrl?: string;
  metadata?: VideoMetadata;
  retryCount: number;
  lastError?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  scheduledAt?: Timestamp;
  uploadedAt?: Timestamp;
};

export type UserSettings = {
  userId: string;
  uploadDelayMinutes: number;
  privacy: UploadPrivacy;
  autoMetadata: boolean;
  autoPublish: boolean;
  updatedAt?: Timestamp;
};
