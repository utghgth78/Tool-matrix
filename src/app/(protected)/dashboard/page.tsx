"use client";

import { AlertTriangle, CheckCircle2, Clock3, UploadCloud } from "lucide-react";
import { ConnectGoogleCard } from "@/components/connect-google-card";
import { DriveImport } from "@/components/drive-import";
import { QueueTable } from "@/components/queue-table";
import { StatCard } from "@/components/stat-card";
import { useAuth } from "@/hooks/use-auth";
import { useUserProfile } from "@/hooks/use-user-profile";
import { useVideos } from "@/hooks/use-videos";

export default function DashboardPage() {
  const { user } = useAuth();
  const profile = useUserProfile(user?.uid);
  const { videos, stats } = useVideos(user?.uid);

  return (
    <div className="space-y-6">
      <section>
        <p className="text-sm text-muted-foreground">Good to see you, {user?.displayName?.split(" ")[0] || "creator"}.</p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight md:text-3xl">Your upload system is ready.</h2>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total videos" value={stats.total} icon={UploadCloud} hint="Imported from Drive" />
        <StatCard label="Waiting" value={stats.pending} icon={Clock3} hint="Ready for cron" />
        <StatCard label="Uploaded" value={stats.uploaded} icon={CheckCircle2} hint="Published or processed" />
        <StatCard label="Needs attention" value={stats.failed} icon={AlertTriangle} hint="Retry anytime" />
      </div>

      <ConnectGoogleCard connected={profile?.googleConnected} />
      <DriveImport />
      <QueueTable videos={videos.slice(0, 8)} />
    </div>
  );
}
