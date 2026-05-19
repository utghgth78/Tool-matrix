import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";

export async function rateLimit(key: string, limit: number, windowSeconds: number) {
  const ref = adminDb.collection("rateLimits").doc(key.replaceAll("/", "_"));
  const now = Timestamp.now();
  const windowStart = Timestamp.fromMillis(Date.now() - windowSeconds * 1000);

  await adminDb.runTransaction(async (transaction) => {
    const snap = await transaction.get(ref);
    const data = snap.data();

    if (!snap.exists || data?.windowStartedAt?.toMillis() < windowStart.toMillis()) {
      transaction.set(ref, {
        count: 1,
        windowStartedAt: now,
        updatedAt: now
      });
      return;
    }

    if ((data?.count || 0) >= limit) {
      throw new Error("Too many requests. Please wait a moment and try again.");
    }

    transaction.update(ref, {
      count: FieldValue.increment(1),
      updatedAt: now
    });
  });
}
