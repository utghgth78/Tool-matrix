"use client";

import { FormEvent, useState } from "react";
import { Chrome, LockKeyhole, Mail, Sparkles, UserRound } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageToggle } from "@/components/LanguageToggle";
import { NeonButton } from "@/components/NeonButton";

interface AuthCardProps {
  adminMode?: boolean;
}

export function AuthCard({ adminMode = false }: AuthCardProps) {
  const { signIn, signInWithGoogle, signUp } = useAuth();
  const { t } = useLanguage();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState(adminMode ? "mdefankhan56@gmail.com" : "");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError("");

    try {
      if (mode === "signup" && !adminMode) {
        await signUp(email, password, displayName);
      } else {
        await signIn(email, password);
      }
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Authentication failed";
      setError(message.replace("Firebase: ", ""));
    } finally {
      setBusy(false);
    }
  };

  const handleGoogleLogin = async () => {
    setBusy(true);
    setError("");

    try {
      await signInWithGoogle();
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Google login failed";
      setError(message.replace("Firebase: ", ""));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="relative z-10 flex min-h-screen items-center justify-center px-5 py-10">
      <section className="grid w-full max-w-6xl items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-matrix-cyan/30 bg-matrix-cyan/10 px-4 py-2 text-sm font-semibold text-matrix-cyan">
            <Sparkles className="h-4 w-4" aria-hidden />
            Cyber studio tool packs
          </div>
          <div>
            <h1 className="max-w-3xl text-5xl font-black leading-tight text-white md:text-7xl">
              {adminMode ? t.adminLogin : t.appName}
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-white/72">
              {adminMode
                ? t.adminOnly
                : "A dark neon matrix for sharing studio-ready files, links, code snippets, and premium production packs."}
            </p>
          </div>
          <div className="grid max-w-xl grid-cols-3 gap-3">
            {["Free tools", "Premium packs", "Pro studio"].map((item) => (
              <div key={item} className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm font-semibold text-white/78">
                {item}
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="glass-panel neon-border rounded-2xl p-6 md:p-8">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-matrix-pink">
                {adminMode ? t.admin : t.dashboard}
              </p>
              <h2 className="mt-2 text-2xl font-black text-white">
                {mode === "signin" || adminMode ? t.signIn : t.signUp}
              </h2>
            </div>
            <LanguageToggle />
          </div>

          {!adminMode && (
            <div className="mb-5 grid grid-cols-2 rounded-xl border border-white/10 bg-white/5 p-1">
              <button
                type="button"
                onClick={() => setMode("signin")}
                className={`rounded-lg px-4 py-2 text-sm font-bold transition ${
                  mode === "signin" ? "bg-matrix-pink text-white" : "text-white/60 hover:bg-white/10"
                }`}
              >
                {t.signIn}
              </button>
              <button
                type="button"
                onClick={() => setMode("signup")}
                className={`rounded-lg px-4 py-2 text-sm font-bold transition ${
                  mode === "signup" ? "bg-matrix-cyan text-matrix-ink" : "text-white/60 hover:bg-white/10"
                }`}
              >
                {t.signUp}
              </button>
            </div>
          )}

          <div className="space-y-4">
            {mode === "signup" && !adminMode && (
              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-white/75">
                  <UserRound className="h-4 w-4 text-matrix-cyan" aria-hidden />
                  {t.name}
                </span>
                <input
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  required
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-matrix-cyan focus:shadow-cyan"
                />
              </label>
            )}

            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-white/75">
                <Mail className="h-4 w-4 text-matrix-cyan" aria-hidden />
                {t.email}
              </span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                readOnly={adminMode}
                className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-matrix-cyan focus:shadow-cyan read-only:text-white/70"
              />
            </label>

            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-white/75">
                <LockKeyhole className="h-4 w-4 text-matrix-cyan" aria-hidden />
                {t.password}
              </span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                minLength={6}
                className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-matrix-cyan focus:shadow-cyan"
              />
            </label>

            {error && <p className="rounded-lg border border-red-400/40 bg-red-500/10 p-3 text-sm text-red-100">{error}</p>}

            <NeonButton type="submit" disabled={busy} className="w-full py-3">
              {busy ? t.loading : mode === "signin" || adminMode ? t.signIn : t.signUp}
            </NeonButton>

            <div className="flex items-center gap-3">
              <span className="h-px flex-1 bg-white/10" />
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-white/40">or</span>
              <span className="h-px flex-1 bg-white/10" />
            </div>

            <NeonButton type="button" variant="ghost" disabled={busy} onClick={handleGoogleLogin} className="w-full py-3">
              <Chrome className="h-4 w-4" aria-hidden />
              Continue with Gmail
            </NeonButton>
          </div>
        </form>
      </section>
    </main>
  );
}
