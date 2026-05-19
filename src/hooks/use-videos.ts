"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { QueueVideo } from "@/lib/types";

export function useVideos(userId?: string) {
  const [videos, setVideos] = useState<QueueVideo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setVideos([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const videosQuery = query(
      collection(db, "videos"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );

    return onSnapshot(videosQuery, (snapshot) => {
      setVideos(snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }) as QueueVideo));
      setLoading(false);
    });
  }, [userId]);

  const stats = useMemo(() => {
    return {
      total: videos.length,
      pending: videos.filter((video) => ["pending", "metadata_ready", "scheduled"].includes(video.status)).length,
      uploaded: videos.filter((video) => video.status === "uploaded").length,
      failed: videos.filter((video) => video.status === "failed").length,
      uploading: videos.filter((video) => video.status === "uploading").length
    };
  }, [videos]);

  return { videos, loading, stats };
}
