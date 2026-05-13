"use client";

import { useLanguage } from "@/contexts/LanguageContext";

export function LoadingState() {
  const { t } = useLanguage();

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="glass-panel neon-border rounded-2xl px-8 py-6 text-center">
        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-2 border-matrix-cyan border-t-matrix-pink" />
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-white/70">{t.loading}</p>
      </div>
    </main>
  );
}
