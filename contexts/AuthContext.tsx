"use client";

import {
  User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
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
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

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
      role: user.email === ADMIN_EMAIL ? "admin" : "user",
      createdAt: serverTimestamp(),
      lastLoginAt: serverTimestamp()
    });
  } else {
    const profileUpdate = {
      email: user.email,
      displayName,
      photoURL: user.photoURL || "",
      lastLoginAt: serverTimestamp(),
      ...(user.email === ADMIN_EMAIL ? { role: "admin" } : {})
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
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      loading,
      isAdmin: user?.email === ADMIN_EMAIL,
      signIn: async (email, password) => {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      },
      signUp: async (email, password, displayName) => {
        const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        await updateProfile(credential.user, { displayName: displayName.trim() });
        await ensureProfile(credential.user);
      },
      logout: () => signOut(auth),
      refreshProfile
    }),
    [loading, profile, user]
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
