"use client";

import { useState } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { useSettings } from "@/hooks/use-settings";
import { useToast } from "@/hooks/use-toast";
import type { UploadPrivacy } from "@/lib/types";

export function SettingsForm({ userId }: { userId: string }) {
  const { settings, save } = useSettings(userId);
  const { notify } = useToast();
  const [saving, setSaving] = useState(false);

  if (!settings) return null;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSaving(true);

    try {
      await save({
        uploadDelayMinutes: Number(form.get("uploadDelayMinutes") || 5),
        privacy: form.get("privacy") as UploadPrivacy,
        autoMetadata: form.get("autoMetadata") === "on",
        autoPublish: form.get("autoPublish") === "on"
      });
      notify({ type: "success", title: "Settings saved" });
    } catch (error) {
      notify({ type: "error", title: "Could not save settings", description: error instanceof Error ? error.message : undefined });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="font-semibold tracking-tight">Upload preferences</h2>
        <p className="text-sm text-muted-foreground">Automation defaults.</p>
      </CardHeader>
      <CardBody>
        <form className="space-y-6" onSubmit={submit}>
          <label className="block">
            <span className="text-sm font-medium">Upload delay in minutes</span>
            <input
              name="uploadDelayMinutes"
              type="number"
              min={0}
              max={1440}
              defaultValue={settings.uploadDelayMinutes}
              className="mt-2 h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium">Video privacy</span>
            <select
              name="privacy"
              defaultValue={settings.privacy}
              className="mt-2 h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="public">Public</option>
              <option value="private">Private</option>
              <option value="unlisted">Unlisted</option>
            </select>
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex items-center justify-between rounded-lg border border-border p-4">
              <span>
                <span className="block text-sm font-medium">Auto metadata</span>
                <span className="text-sm text-muted-foreground">Generate SEO title, tags, and description.</span>
              </span>
              <input name="autoMetadata" type="checkbox" defaultChecked={settings.autoMetadata} className="h-5 w-5 accent-primary" />
            </label>

            <label className="flex items-center justify-between rounded-lg border border-border p-4">
              <span>
                <span className="block text-sm font-medium">Auto publish</span>
                <span className="text-sm text-muted-foreground">Let cron upload the next ready video.</span>
              </span>
              <input name="autoPublish" type="checkbox" defaultChecked={settings.autoPublish} className="h-5 w-5 accent-primary" />
            </label>
          </div>

          <Button type="submit" disabled={saving}>
            <Save className="h-4 w-4" />
            Save settings
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}
