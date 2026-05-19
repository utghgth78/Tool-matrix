"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, signInWithPopup, signOut, type User } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, createGoogleProvider, db } from "@/lib/firebase/client";
import { getBackendUrl } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  getIdToken: () => Promise<string>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { notify } = useToast();

  useEffect(() => {
    return onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      setLoading(false);
    });
  }, []);

  const createSession = useCallback(async (nextUser: User) => {
    const token = await nextUser.getIdToken();
    const response = await fetch(`${getBackendUrl()}/api/auth/session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
      credentials: "include"
    });

    if (!response.ok) throw new Error("Could not create a secure session.");
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const credential = await signInWithPopup(auth, createGoogleProvider());
    await createSession(credential.user);
    await setDoc(
      doc(db, "users", credential.user.uid),
      {
        displayName: credential.user.displayName,
        email: credential.user.email,
        photoURL: credential.user.photoURL,
        updatedAt: serverTimestamp()
      },
      { merge: true }
    );
    notify({ type: "success", title: "Signed in", description: "Welcome to TubeFlow AI." });
  }, [createSession, notify]);

  const logout = useCallback(async () => {
    await fetch(`${getBackendUrl()}/api/auth/logout`, {
      method: "POST",
      credentials: "include"
    });
    await signOut(auth);
    notify({ type: "info", title: "Signed out" });
  }, [notify]);

  const getIdToken = useCallback(async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error("You must be signed in.");
    return currentUser.getIdToken();
  }, []);

  const value = useMemo(
    () => ({ user, loading, signInWithGoogle, logout, getIdToken }),
    [getIdToken, loading, logout, signInWithGoogle, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
