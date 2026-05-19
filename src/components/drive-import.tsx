"use client";

import { useState } from "react";
import { FolderSearch, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { getBackendUrl } from "@/lib/utils";

export function DriveImport() {
  const [folderUrl, setFolderUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const { getIdToken } = useAuth();
  const { notify } = useToast();

  async function scanFolder(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    try {
      const token = await getIdToken();
      const response = await fetch(`${getBackendUrl()}/api/drive/scan`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ folderUrl })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Folder scan failed.");

      notify({
        type: "success",
        title: "Drive folder scanned",
        description: `${payload.created} new videos queued, ${payload.skipped} duplicates skipped.`
      });
      setFolderUrl("");
    } catch (error) {
      notify({
        type: "error",
        title: "Could not scan folder",
        description: error instanceof Error ? error.message : "Try again after reconnecting Google."
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-accent p-2 text-accent-foreground">
            <FolderSearch className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-semibold tracking-tight">Import from Drive</h2>
            <p className="text-sm text-muted-foreground">Ready for a new Drive batch.</p>
          </div>
        </div>
      </CardHeader>
      <CardBody>
        <form className="flex flex-col gap-3 sm:flex-row" onSubmit={scanFolder}>
          <input
            value={folderUrl}
            onChange={(event) => setFolderUrl(event.target.value)}
            placeholder="https://drive.google.com/drive/folders/..."
            className="h-11 min-w-0 flex-1 rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus:ring-2 focus:ring-ring"
            required
          />
          <Button type="submit" className="h-11" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FolderSearch className="h-4 w-4" />}
            Scan folder
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}
