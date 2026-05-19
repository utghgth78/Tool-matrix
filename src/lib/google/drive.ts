import { google } from "googleapis";
import type { OAuth2Client } from "google-auth-library";

export const supportedVideoExtensions = [".mp4", ".mov", ".mkv", ".avi", ".webm"];

export function parseDriveFolderId(folderUrl: string) {
  const decoded = decodeURIComponent(folderUrl.trim());
  const patterns = [
    /\/folders\/([a-zA-Z0-9_-]+)/,
    /[?&]id=([a-zA-Z0-9_-]+)/,
    /^([a-zA-Z0-9_-]{10,})$/
  ];

  for (const pattern of patterns) {
    const match = decoded.match(pattern);
    if (match?.[1]) return match[1];
  }

  throw new Error("Paste a valid Google Drive folder link.");
}

export function isSupportedVideo(name = "", mimeType = "") {
  const lowerName = name.toLowerCase();
  return mimeType.startsWith("video/") || supportedVideoExtensions.some((extension) => lowerName.endsWith(extension));
}

export async function scanDriveFolder(auth: OAuth2Client, folderId: string) {
  const drive = google.drive({ version: "v3", auth });
  const folder = await drive.files.get({
    fileId: folderId,
    fields: "id,name"
  });

  const files = [];
  let pageToken: string | undefined;

  do {
    const response = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      pageSize: 1000,
      pageToken,
      fields: "nextPageToken, files(id,name,mimeType,size,webViewLink,thumbnailLink,videoMediaMetadata)"
    });

    files.push(...(response.data.files || []));
    pageToken = response.data.nextPageToken || undefined;
  } while (pageToken);

  return {
    folderName: folder.data.name || "Drive folder",
    files: files.filter((file) => isSupportedVideo(file.name || "", file.mimeType || ""))
  };
}
