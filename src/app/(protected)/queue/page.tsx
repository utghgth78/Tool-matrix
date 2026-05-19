"use client";

import { DriveImport } from "@/components/drive-import";
import { QueueTable } from "@/components/queue-table";
import { useAuth } from "@/hooks/use-auth";
import { useVideos } from "@/hooks/use-videos";

export default function QueuePage() {
  const { user } = useAuth();
  const { videos } = useVideos(user?.uid);
  const activeVideos = videos.filter((video) => video.status !== "uploaded");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">Upload Queue</h2>
        <p className="mt-1 text-sm text-muted-foreground">Scan folders, watch statuses, and retry failed uploads.</p>
      </div>
      <DriveImport />
      <QueueTable videos={activeVideos} />
    </div>
  );
}
