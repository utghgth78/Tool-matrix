"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, doc, onSnapshot, query, where } from "firebase/firestore";
import { BellRing, Crown, Gem, Sparkles } from "lucide-react";
import { AuthCard } from "@/components/AuthCard";
import { LoadingState } from "@/components/LoadingState";
import { NeonButton } from "@/components/NeonButton";
import { ToolCard } from "@/components/ToolCard";
import { TopBar } from "@/components/TopBar";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { canAccessTool, hasActiveMembership } from "@/lib/access";
import { db, getFirebaseAnalytics } from "@/lib/firebase";
import { MembershipPackage, NotificationItem, Tool, UiSettings } from "@/lib/types";

const defaultUi: UiSettings = {
  heroTitle: "Studio tools, packed in neon.",
  heroSubtitle: "Upload once from admin, unlock by tier, and let every studio user work from a fast cyber dashboard.",
  accentColor: "#ff2ebd",
  layoutDensity: "comfortable",
  noticeText: ""
};

export default function HomePage() {
  const { user, profile, loading } = useAuth();
  const { t } = useLanguage();
  const [tools, setTools] = useState<Tool[]>([]);
  const [ui, setUi] = useState<UiSettings>(defaultUi);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [packages, setPackages] = useState<MembershipPackage[]>([]);
  const [dismissed, setDismissed] = useState<string[]>([]);

  useEffect(() => {
    getFirebaseAnalytics();
  }, []);

  useEffect(() => {
    if (!user) {
      return undefined;
    }

    const toolsQuery = query(collection(db, "tools"), where("status", "==", "active"));
    const unsubscribeTools = onSnapshot(toolsQuery, (snapshot) => {
      setTools(
        snapshot.docs
          .map((item) => ({ id: item.id, ...item.data() }) as Tool)
          .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0))
      );
    });

    const unsubscribeUi = onSnapshot(doc(db, "settings", "ui"), (snapshot) => {
      if (snapshot.exists()) {
        setUi({ ...defaultUi, ...(snapshot.data() as UiSettings) });
      }
    });

    const notificationsQuery = query(collection(db, "notifications"), where("active", "==", true));
    const unsubscribeNotifications = onSnapshot(notificationsQuery, (snapshot) => {
      setNotifications(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as NotificationItem));
    });

    const packagesQuery = query(collection(db, "packages"), where("active", "==", true));
    const unsubscribePackages = onSnapshot(packagesQuery, (snapshot) => {
      setPackages(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as MembershipPackage));
    });

    return () => {
      unsubscribeTools();
      unsubscribeUi();
      unsubscribeNotifications();
      unsubscribePackages();
    };
  }, [user]);

  const activeNotification = useMemo(
    () => notifications.find((notification) => !dismissed.includes(notification.id)),
    [dismissed, notifications]
  );
  const visibleTools = useMemo(() => tools.filter((tool) => canAccessTool(profile, tool.tier)), [profile, tools]);

  if (loading) {
    return <LoadingState />;
  }

  if (!user) {
    return <AuthCard />;
  }

  if (profile?.restricted) {
    return (
      <>
        <TopBar />
        <main className="relative z-10 mx-auto flex min-h-[70vh] max-w-3xl items-center justify-center px-5">
          <div className="glass-panel neon-border rounded-2xl p-8 text-center">
            <BellRing className="mx-auto mb-4 h-12 w-12 text-matrix-pink" aria-hidden />
            <h1 className="text-3xl font-black text-white">{t.restricted}</h1>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <TopBar />
      <main className="relative z-10 mx-auto max-w-7xl px-5 py-8">
        <section className="mb-8 grid gap-5 lg:grid-cols-[1.45fr_0.55fr]">
          <div
            className="glass-panel neon-border rounded-2xl p-7 md:p-9"
            style={{ boxShadow: `0 0 34px ${ui.accentColor}33` }}
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-matrix-cyan/35 bg-matrix-cyan/10 px-4 py-2 text-sm font-bold text-matrix-cyan">
              <Sparkles className="h-4 w-4" aria-hidden />
              {profile?.displayName || profile?.email}
            </div>
            <h1 className="max-w-4xl text-4xl font-black leading-tight text-white md:text-6xl">{ui.heroTitle}</h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-white/70 md:text-lg">{ui.heroSubtitle}</p>
            {ui.noticeText && (
              <p className="mt-6 rounded-xl border border-matrix-pink/35 bg-matrix-pink/10 p-4 text-sm font-semibold text-pink-50">
                {ui.noticeText}
              </p>
            )}
          </div>

          <aside className="glass-panel rounded-2xl p-6">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-matrix-pink/20 text-matrix-pink">
                {profile?.membershipTier === "pro" ? <Gem aria-hidden /> : <Crown aria-hidden />}
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/45">{t.membership}</p>
                <h2 className="text-2xl font-black capitalize text-white">{t[profile?.membershipTier || "free"]}</h2>
              </div>
            </div>
            <div className="mt-6 rounded-xl border border-white/10 bg-black/25 p-4">
              <p className="text-sm text-white/65">
                {hasActiveMembership(profile)
                  ? `${t.expires}: ${profile?.membershipExpiresAt?.toDate?.().toLocaleDateString("en-BD") || "Unlimited"}`
                  : "Free members can access all free studio tools."}
              </p>
            </div>
            <div className="mt-4 space-y-3">
              {(packages.length
                ? packages
                : [
                    {
                      id: "default-premium-package",
                      name: "3 Months for 199 BDT",
                      tier: "premium",
                      priceBdt: 199,
                      durationDays: 90,
                      active: true,
                      features: ["Premium tools"]
                    } as MembershipPackage
                  ]
              ).map((item) => (
                <a
                  key={item.id}
                  href={`mailto:mdefankhan56@gmail.com?subject=${encodeURIComponent(`Tool Matrix ${item.name} subscription`)}`}
                  className="block rounded-xl border border-matrix-cyan/25 bg-matrix-cyan/10 p-4 transition hover:border-matrix-cyan/60 hover:bg-matrix-cyan/15"
                >
                  <span className="text-xs font-bold uppercase tracking-[0.2em] text-matrix-cyan">{t[item.tier]}</span>
                  <strong className="mt-1 block text-lg text-white">{item.name}</strong>
                  <span className="text-sm text-white/62">
                    {item.priceBdt} BDT • {item.durationDays} days
                  </span>
                </a>
              ))}
            </div>
          </aside>
        </section>

        {visibleTools.length === 0 ? (
          <section className="glass-panel rounded-2xl p-10 text-center">
            <h2 className="text-2xl font-black text-white">{tools.length === 0 ? t.noTools : t.noAccessibleTools}</h2>
          </section>
        ) : (
          <section className={ui.layoutDensity === "compact" ? "masonry-grid text-sm" : "masonry-grid"}>
            {visibleTools.map((tool) => (
              <ToolCard key={tool.id} tool={tool} profile={profile} />
            ))}
          </section>
        )}
      </main>

      {activeNotification && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 px-5 backdrop-blur-sm">
          <div className="glass-panel neon-border w-full max-w-lg rounded-2xl p-6">
            <p className="mb-2 text-sm font-bold uppercase tracking-[0.25em] text-matrix-pink">Tool Matrix</p>
            <h2 className="text-3xl font-black text-white">{activeNotification.title}</h2>
            <p className="mt-4 leading-7 text-white/72">{activeNotification.message}</p>
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              {activeNotification.ctaUrl && (
                <a
                  href={activeNotification.ctaUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center rounded-lg bg-matrix-cyan px-4 py-2 text-sm font-black text-matrix-ink"
                >
                  {activeNotification.ctaLabel || "Open"}
                </a>
              )}
              <NeonButton
                type="button"
                variant="ghost"
                onClick={() => setDismissed((items) => [...items, activeNotification.id])}
              >
                Close
              </NeonButton>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
