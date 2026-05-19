import type { VideoStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const statusLabel: Record<VideoStatus, string> = {
  pending: "Pending",
  metadata_ready: "Metadata ready",
  scheduled: "Scheduled",
  uploading: "Uploading",
  uploaded: "Uploaded",
  failed: "Failed"
};

export function StatusBadge({ status }: { status: VideoStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
        status === "uploaded" && "bg-success/12 text-emerald-500",
        status === "uploading" && "bg-primary/12 text-primary",
        status === "pending" && "bg-muted text-muted-foreground",
        status === "metadata_ready" && "bg-accent text-accent-foreground",
        status === "scheduled" && "bg-warning/12 text-amber-500",
        status === "failed" && "bg-danger/12 text-red-500"
      )}
    >
      {status === "uploading" && <span className="mr-1.5 h-1.5 w-1.5 animate-pulseSoft rounded-full bg-current" />}
      {statusLabel[status]}
    </span>
  );
}
