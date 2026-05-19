import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { requiredEnv } from "@/lib/env";

function getPrivateKey() {
  return requiredEnv("FIREBASE_PRIVATE_KEY").replace(/\\n/g, "\n");
}

const app =
  getApps()[0] ||
  initializeApp({
    credential: cert({
      projectId: requiredEnv("NEXT_PUBLIC_FIREBASE_PROJECT_ID"),
      clientEmail: requiredEnv("FIREBASE_CLIENT_EMAIL"),
      privateKey: getPrivateKey()
    }),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
  });

export const adminAuth = getAuth(app);
export const adminDb = getFirestore(app);
