"use client";

import { ConnectGoogleCard } from "@/components/connect-google-card";
import { SettingsForm } from "@/components/settings-form";
import { useAuth } from "@/hooks/use-auth";
import { useUserProfile } from "@/hooks/use-user-profile";

export default function SettingsPage() {
  const { user } = useAuth();
  const profile = useUserProfile(user?.uid);

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">Settings</h2>
        <p className="mt-1 text-sm text-muted-foreground">Manage OAuth access and automation behavior.</p>
      </div>
      <ConnectGoogleCard connected={profile?.googleConnected} />
      <SettingsForm userId={user.uid} />
    </div>
  );
}
