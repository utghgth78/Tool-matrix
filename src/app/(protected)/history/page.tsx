"use client";

import { QueueTable } from "@/components/queue-table";
import { useAuth } from "@/hooks/use-auth";
import { useVideos } from "@/hooks/use-videos";

export default function HistoryPage() {
  const { user } = useAuth();
  const { videos } = useVideos(user?.uid);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">Upload History</h2>
        <p className="mt-1 text-sm text-muted-foreground">Completed videos and YouTube links appear here.</p>
      </div>
      <QueueTable
        title="Completed uploads"
        emptyLabel="No uploaded videos yet."
        videos={videos.filter((video) => video.status === "uploaded")}
      />
    </div>
  );
}
