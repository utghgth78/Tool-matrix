"use client";

import {
  User,
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  getRedirectResult,
  GoogleAuthProvider,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  updateProfile
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { ADMIN_EMAIL, auth, db } from "@/lib/firebase";
import { UserProfile } from "@/lib/types";

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  authError: string;
  isAdmin: boolean;
  clearAuthError: () => void;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function isAdminEmail(email?: string | null) {
  return email?.toLowerCase() === ADMIN_EMAIL;
}

function getAuthErrorMessage(error: unknown) {
  const code = typeof error === "object" && error !== null && "code" in error ? String(error.code) : "";
  const message = error instanceof Error ? error.message.replace("Firebase: ", "") : "Login failed. Please try again.";
  const domain =
    typeof window !== "undefined" ? window.location.hostname : "your Vercel domain";

  if (code.includes("unauthorized-domain")) {
    return `This website domain is not authorized in Firebase. Add ${domain} in Firebase Authentication settings.`;
  }

  if (code.includes("operation-not-allowed")) {
    return "Google login is not enabled in Firebase Authentication.";
  }

  if (code.includes("popup-blocked")) {
    return "Popup was blocked. Redirect login will start automatically.";
  }

  if (code.includes("popup-closed-by-user") || code.includes("cancelled-popup-request")) {
    return "Google login was cancelled. Please try again.";
  }

  if (code.includes("network-request-failed")) {
    return "Network problem. Check your internet connection and try again.";
  }

  return message;
}

async function ensureProfile(user: User) {
  const profileRef = doc(db, "profiles", user.uid);
  const snapshot = await getDoc(profileRef);
  const displayName = user.displayName || user.email?.split("@")[0] || "Tool Matrix User";

  if (!snapshot.exists()) {
    await setDoc(profileRef, {
      uid: user.uid,
      email: user.email,
      displayName,
      photoURL: user.photoURL || "",
      membershipTier: "free",
      membershipExpiresAt: null,
      restricted: false,
      role: isAdminEmail(user.email) ? "admin" : "user",
      createdAt: serverTimestamp(),
      lastLoginAt: serverTimestamp()
    });
  } else {
    const profileUpdate = {
      displayName,
      photoURL: user.photoURL || "",
      lastLoginAt: serverTimestamp(),
      ...(isAdminEmail(user.email) ? { email: user.email, role: "admin" } : {})
    };

    await setDoc(
      profileRef,
      profileUpdate,
      { merge: true }
    );
  }

  return getDoc(profileRef);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState("");

  const refreshProfile = async () => {
    if (!auth.currentUser) {
      setProfile(null);
      return;
    }

    const profileRef = doc(db, "profiles", auth.currentUser.uid);
    const snapshot = await getDoc(profileRef);
    setProfile(snapshot.exists() ? (snapshot.data() as UserProfile) : null);
  };

  useEffect(() => {
    let cancelled = false;

    async function prepareAuth() {
      try {
        await setPersistence(auth, browserLocalPersistence);
        await getRedirectResult(auth);
      } catch (error) {
        if (!cancelled) {
          setAuthError(getAuthErrorMessage(error));
        }
      }
    }

    prepareAuth();

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true);
      setUser(currentUser);

      if (!currentUser) {
        setProfile(null);
        setLoading(false);
        return;
      }

      try {
        const snapshot = await ensureProfile(currentUser);
        setProfile(snapshot.exists() ? (snapshot.data() as UserProfile) : null);
      } catch (error) {
        console.error("Profile sync failed", error);
        setProfile({
          uid: currentUser.uid,
          email: currentUser.email || "",
          displayName: currentUser.displayName || currentUser.email?.split("@")[0] || "Tool Matrix User",
          photoURL: currentUser.photoURL || "",
          membershipTier: "free",
          membershipExpiresAt: null,
          restricted: false,
          role: isAdminEmail(currentUser.email) ? "admin" : "user"
        });
      } finally {
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      loading,
      authError,
      isAdmin: isAdminEmail(user?.email),
      clearAuthError: () => setAuthError(""),
      signIn: async (email, password) => {
        setAuthError("");
        await signInWithEmailAndPassword(auth, email.trim(), password);
      },
      signInWithGoogle: async () => {
        setAuthError("");
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: "select_account" });

        try {
          await signInWithPopup(auth, provider);
        } catch (error) {
          const code = typeof error === "object" && error !== null && "code" in error ? String(error.code) : "";
          if (
            code.includes("popup-blocked") ||
            code.includes("operation-not-supported-in-this-environment")
          ) {
            setAuthError("Popup was blocked. Redirecting to Google login...");
            await signInWithRedirect(auth, provider);
            return;
          }

          const friendlyMessage = getAuthErrorMessage(error);
          setAuthError(friendlyMessage);
          throw new Error(friendlyMessage);
        }
      },
      signUp: async (email, password, displayName) => {
        setAuthError("");
        const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        await updateProfile(credential.user, { displayName: displayName.trim() });
        await ensureProfile(credential.user);
      },
      logout: () => signOut(auth),
      refreshProfile
    }),
    [authError, loading, profile, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
