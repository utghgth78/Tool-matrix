"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/client";

export type UserProfile = {
  displayName?: string;
  email?: string;
  photoURL?: string;
  googleConnected?: boolean;
  youtubeConnected?: boolean;
  driveConnected?: boolean;
};

export function useUserProfile(userId?: string) {
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (!userId) {
      setProfile(null);
      return;
    }

    return onSnapshot(doc(db, "users", userId), (snapshot) => {
      setProfile(snapshot.exists() ? (snapshot.data() as UserProfile) : null);
    });
  }, [userId]);

  return profile;
}
