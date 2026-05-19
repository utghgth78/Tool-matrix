"use client";

import { RefreshCcw, RotateCcw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import type { QueueVideo } from "@/lib/types";
import { formatBytes, formatDuration, getBackendUrl } from "@/lib/utils";

export function QueueTable({
  videos,
  title = "Upload queue",
  emptyLabel = "No videos queued yet."
}: {
  videos: QueueVideo[];
  title?: string;
  emptyLabel?: string;
}) {
  const { getIdToken } = useAuth();
  const { notify } = useToast();

  async function retry(videoId: string) {
    try {
      const token = await getIdToken();
      const response = await fetch(`${getBackendUrl()}/api/uploads/${videoId}/retry`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Retry failed.");
      notify({ type: "success", title: "Video returned to queue" });
    } catch (error) {
      notify({ type: "error", title: "Could not retry", description: error instanceof Error ? error.message : undefined });
    }
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold tracking-tight">{title}</h2>
          <p className="text-sm text-muted-foreground">Live queue state.</p>
        </div>
        <RefreshCcw className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardBody className="p-0">
        {videos.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">{emptyLabel}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-border bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-medium">Video</th>
                  <th className="px-5 py-3 font-medium">Size</th>
                  <th className="px-5 py-3 font-medium">Duration</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Created</th>
                  <th className="px-5 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {videos.map((video) => (
                  <tr key={video.id} className="hover:bg-muted/35">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-20 shrink-0 overflow-hidden rounded-md bg-muted">
                          {video.thumbnailUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={video.thumbnailUrl} alt="" className="h-full w-full object-cover" />
                          ) : null}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-medium">{video.title || video.fileName}</p>
                          <p className="truncate text-xs text-muted-foreground">{video.fileName}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">{formatBytes(video.size)}</td>
                    <td className="px-5 py-4 text-muted-foreground">{formatDuration(video.durationMs)}</td>
                    <td className="px-5 py-4">
                      <StatusBadge status={video.status} />
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">
                      {video.createdAt?.toDate ? `${formatDistanceToNow(video.createdAt.toDate())} ago` : "Just now"}
                    </td>
                    <td className="px-5 py-4">
                      {video.status === "failed" ? (
                        <Button variant="secondary" size="sm" onClick={() => retry(video.id)}>
                          <RotateCcw className="h-4 w-4" />
                          Retry
                        </Button>
                      ) : video.youtubeUrl ? (
                        <a className="text-primary hover:underline" href={video.youtubeUrl} target="_blank" rel="noreferrer">
                          Open
                        </a>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
