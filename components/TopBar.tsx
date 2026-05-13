"use client";

import Link from "next/link";
import { LayoutDashboard, LogOut, ShieldCheck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageToggle } from "@/components/LanguageToggle";
import { NeonButton } from "@/components/NeonButton";

export function TopBar() {
  const { profile, isAdmin, logout } = useAuth();
  const { t } = useLanguage();

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-matrix-ink/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4">
        <Link href="/" className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-matrix-pink to-matrix-cyan font-black text-matrix-ink shadow-neon">
            TM
          </span>
          <span>
            <span className="block text-lg font-black text-white">{t.appName}</span>
            <span className="block text-xs font-semibold text-white/55">{profile?.displayName || profile?.email}</span>
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <LanguageToggle />
          {isAdmin && (
            <Link
              href="/admin"
              className="hidden items-center gap-2 rounded-lg border border-matrix-cyan/30 bg-matrix-cyan/10 px-3 py-2 text-sm font-bold text-matrix-cyan transition hover:bg-matrix-cyan/20 sm:flex"
            >
              <ShieldCheck className="h-4 w-4" aria-hidden />
              {t.admin}
            </Link>
          )}
          <Link
            href="/"
            className="hidden items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-bold text-white/75 transition hover:bg-white/10 md:flex"
          >
            <LayoutDashboard className="h-4 w-4" aria-hidden />
            {t.dashboard}
          </Link>
          <NeonButton type="button" variant="ghost" onClick={logout}>
            <LogOut className="h-4 w-4" aria-hidden />
            {t.logout}
          </NeonButton>
        </div>
      </div>
    </header>
  );
}
