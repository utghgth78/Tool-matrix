"use client";

import { FirebaseApp, getApp, getApps, initializeApp } from "firebase/app";
import { Analytics, getAnalytics, isSupported } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAFPWDQ_BRBstoguLOuLLp4YokQOnicDB0",
  authDomain: "mycomputerstudiobd.firebaseapp.com",
  projectId: "mycomputerstudiobd",
  storageBucket: "mycomputerstudiobd.firebasestorage.app",
  messagingSenderId: "1060914631662",
  appId: "1:1060914631662:web:2ca1fb96c32b07f18b34ff",
  measurementId: "G-3NZR6K0789"
};

export const ADMIN_EMAIL = "mdefankhan56@gmail.com";

const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

let analyticsPromise: Promise<Analytics | null> | null = null;

export function getFirebaseAnalytics() {
  if (typeof window === "undefined") {
    return Promise.resolve(null);
  }

  if (!analyticsPromise) {
    analyticsPromise = isSupported()
      .then((supported) => (supported ? getAnalytics(app) : null))
      .catch(() => null);
  }

  return analyticsPromise;
}

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
