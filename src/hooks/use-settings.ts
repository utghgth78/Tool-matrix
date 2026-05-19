"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { UserSettings } from "@/lib/types";

export const defaultSettings: Omit<UserSettings, "userId"> = {
  uploadDelayMinutes: 5,
  privacy: "public",
  autoMetadata: true,
  autoPublish: true
};

export function useSettings(userId?: string) {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setSettings(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    return onSnapshot(doc(db, "settings", userId), async (snapshot) => {
      if (!snapshot.exists()) {
        const initial = { userId, ...defaultSettings, updatedAt: serverTimestamp() };
        await setDoc(doc(db, "settings", userId), initial, { merge: true });
        return;
      }
      setSettings(snapshot.data() as UserSettings);
      setLoading(false);
    });
  }, [userId]);

  async function save(next: Partial<UserSettings>) {
    if (!userId) throw new Error("You must be signed in.");
    await setDoc(
      doc(db, "settings", userId),
      {
        userId,
        ...next,
        updatedAt: serverTimestamp()
      },
      { merge: true }
    );
  }

  return { settings: settings ?? (userId ? { userId, ...defaultSettings } : null), loading, save };
}
