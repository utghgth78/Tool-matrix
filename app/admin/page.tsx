"use client";

import { ChangeEvent, FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import {
  BellRing,
  Boxes,
  ChartNoAxesColumnIncreasing,
  LayoutTemplate,
  LockKeyhole,
  PackagePlus,
  Pencil,
  ShieldAlert,
  Tags,
  Trash2,
  Upload,
  UsersRound,
  Wrench
} from "lucide-react";
import { AuthCard } from "@/components/AuthCard";
import { LoadingState } from "@/components/LoadingState";
import { NeonButton } from "@/components/NeonButton";
import { TopBar } from "@/components/TopBar";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { ADMIN_EMAIL, db, storage } from "@/lib/firebase";
import {
  Category,
  LayoutDensity,
  MembershipPackage,
  MembershipTier,
  NotificationItem,
  Tool,
  ToolStatus,
  ToolTier,
  ToolType,
  UiSettings,
  UserProfile
} from "@/lib/types";

type AdminTab = "analytics" | "tools" | "users" | "categories" | "packages" | "notifications" | "ui";

const emptyToolForm = {
  title: "",
  description: "",
  categoryId: "",
  tier: "free" as ToolTier,
  type: "link" as ToolType,
  status: "active" as ToolStatus,
  externalUrl: "",
  codeSnippet: "",
  redirectOnClick: true
};

const defaultUi: UiSettings = {
  heroTitle: "Studio tools, packed in neon.",
  heroSubtitle: "Upload once from admin, unlock by tier, and let every studio user work from a fast cyber dashboard.",
  accentColor: "#ff2ebd",
  layoutDensity: "comfortable",
  noticeText: ""
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function Field({
  label,
  children
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-white/72">{label}</span>
      {children}
    </label>
  );
}

function inputClass() {
  return "w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition placeholder:text-white/30 focus:border-matrix-cyan focus:shadow-cyan";
}

export default function AdminPage() {
  const { user, loading, isAdmin } = useAuth();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<AdminTab>("analytics");
  const [tools, setTools] = useState<Tool[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [packages, setPackages] = useState<MembershipPackage[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [ui, setUi] = useState<UiSettings>(defaultUi);
  const [busy, setBusy] = useState(false);

  const [toolForm, setToolForm] = useState(emptyToolForm);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [toolFile, setToolFile] = useState<File | null>(null);
  const [editingToolId, setEditingToolId] = useState<string | null>(null);

  const [categoryName, setCategoryName] = useState("");
  const [categoryAccent, setCategoryAccent] = useState("#16f5ff");
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);

  const [packageForm, setPackageForm] = useState({
    name: "",
    tier: "premium" as MembershipTier,
    priceBdt: 199,
    durationDays: 90,
    features: "Premium tools\nPriority downloads",
    active: true
  });
  const [editingPackageId, setEditingPackageId] = useState<string | null>(null);

  const [notificationForm, setNotificationForm] = useState({
    title: "",
    message: "",
    ctaLabel: "",
    ctaUrl: "",
    active: true
  });
  const [editingNotificationId, setEditingNotificationId] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin) {
      return undefined;
    }

    const unsubscribers = [
      onSnapshot(collection(db, "tools"), (snapshot) => {
        setTools(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as Tool));
      }),
      onSnapshot(collection(db, "categories"), (snapshot) => {
        setCategories(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as Category));
      }),
      onSnapshot(collection(db, "profiles"), (snapshot) => {
        setProfiles(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as unknown as UserProfile));
      }),
      onSnapshot(collection(db, "packages"), (snapshot) => {
        setPackages(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as MembershipPackage));
      }),
      onSnapshot(collection(db, "notifications"), (snapshot) => {
        setNotifications(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as NotificationItem));
      }),
      onSnapshot(doc(db, "settings", "ui"), (snapshot) => {
        if (snapshot.exists()) {
          setUi({ ...defaultUi, ...(snapshot.data() as UiSettings) });
        }
      })
    ];

    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
  }, [isAdmin]);

  const sortedTools = useMemo(() => [...tools].sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0)), [tools]);
  const mostUsed = sortedTools.slice(0, 5);
  const leastUsed = [...sortedTools].reverse().slice(0, 5);

  if (loading) {
    return <LoadingState />;
  }

  if (!user) {
    return <AuthCard adminMode />;
  }

  if (!isAdmin) {
    return (
      <>
        <TopBar />
        <main className="relative z-10 mx-auto grid min-h-[75vh] max-w-3xl place-items-center px-5">
          <section className="glass-panel neon-border rounded-2xl p-8 text-center">
            <ShieldAlert className="mx-auto mb-4 h-12 w-12 text-matrix-pink" aria-hidden />
            <h1 className="text-3xl font-black text-white">Access denied</h1>
            <p className="mt-3 leading-7 text-white/68">
              Admin access is only available for {ADMIN_EMAIL} after signing in with the Firebase admin password.
            </p>
          </section>
        </main>
      </>
    );
  }

  const uploadIfNeeded = async (file: File | null, folder: "tools" | "thumbnails") => {
    if (!file) {
      return "";
    }

    const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
    const fileRef = ref(storage, `${folder}/${Date.now()}-${cleanName}`);
    await uploadBytes(fileRef, file);
    return getDownloadURL(fileRef);
  };

  const resetToolForm = () => {
    setToolForm(emptyToolForm);
    setThumbnailFile(null);
    setToolFile(null);
    setEditingToolId(null);
  };

  const saveTool = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    try {
      const category = categories.find((item) => item.id === toolForm.categoryId);
      const existingTool = editingToolId ? tools.find((tool) => tool.id === editingToolId) : null;
      const [thumbnailUrl, fileUrl] = await Promise.all([
        uploadIfNeeded(thumbnailFile, "thumbnails"),
        uploadIfNeeded(toolFile, "tools")
      ]);

      const payload = {
        ...toolForm,
        categoryName: category?.name || "",
        thumbnailUrl: thumbnailUrl || existingTool?.thumbnailUrl || "",
        fileUrl: fileUrl || existingTool?.fileUrl || "",
        usageCount: existingTool?.usageCount || 0,
        updatedAt: serverTimestamp()
      };

      if (editingToolId) {
        await setDoc(doc(db, "tools", editingToolId), payload, { merge: true });
      } else {
        await addDoc(collection(db, "tools"), {
          ...payload,
          createdAt: serverTimestamp()
        });
      }

      resetToolForm();
    } finally {
      setBusy(false);
    }
  };

  const editTool = (tool: Tool) => {
    setEditingToolId(tool.id);
    setToolForm({
      title: tool.title,
      description: tool.description,
      categoryId: tool.categoryId,
      tier: tool.tier,
      type: tool.type,
      status: tool.status,
      externalUrl: tool.externalUrl || "",
      codeSnippet: tool.codeSnippet || "",
      redirectOnClick: tool.redirectOnClick
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const saveCategory = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload = {
      name: categoryName.trim(),
      slug: slugify(categoryName),
      accent: categoryAccent,
      createdAt: serverTimestamp()
    };

    if (editingCategoryId) {
      await setDoc(doc(db, "categories", editingCategoryId), payload, { merge: true });
    } else {
      await addDoc(collection(db, "categories"), payload);
    }

    setCategoryName("");
    setCategoryAccent("#16f5ff");
    setEditingCategoryId(null);
  };

  const savePackage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload = {
      ...packageForm,
      priceBdt: Number(packageForm.priceBdt),
      durationDays: Number(packageForm.durationDays),
      features: packageForm.features.split("\n").map((item) => item.trim()).filter(Boolean),
      createdAt: serverTimestamp()
    };

    if (editingPackageId) {
      await setDoc(doc(db, "packages", editingPackageId), payload, { merge: true });
    } else {
      await addDoc(collection(db, "packages"), payload);
    }

    setEditingPackageId(null);
    setPackageForm({
      name: "",
      tier: "premium",
      priceBdt: 199,
      durationDays: 90,
      features: "Premium tools\nPriority downloads",
      active: true
    });
  };

  const seedDefaultPackage = async () => {
    await addDoc(collection(db, "packages"), {
      name: "3 Months for 199 BDT",
      tier: "premium",
      priceBdt: 199,
      durationDays: 90,
      active: true,
      features: ["Premium tools", "3 months access", "Studio-ready packs"],
      createdAt: serverTimestamp()
    });
  };

  const saveNotification = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload = {
      ...notificationForm,
      createdAt: serverTimestamp()
    };

    if (editingNotificationId) {
      await setDoc(doc(db, "notifications", editingNotificationId), payload, { merge: true });
    } else {
      await addDoc(collection(db, "notifications"), payload);
    }

    setEditingNotificationId(null);
    setNotificationForm({ title: "", message: "", ctaLabel: "", ctaUrl: "", active: true });
  };

  const saveUi = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await setDoc(doc(db, "settings", "ui"), ui, { merge: true });
  };

  const updateUser = async (profile: UserProfile, values: Partial<UserProfile>) => {
    await updateDoc(doc(db, "profiles", profile.uid), values);
  };

  const updateUserExpiry = async (profile: UserProfile, value: string) => {
    await updateUser(profile, {
      membershipExpiresAt: value ? Timestamp.fromDate(new Date(`${value}T23:59:59`)) : null
    });
  };

  const fileHandler = (setter: (file: File | null) => void) => (event: ChangeEvent<HTMLInputElement>) => {
    setter(event.target.files?.[0] || null);
  };

  const tabs: Array<{ id: AdminTab; label: string; icon: ReactNode }> = [
    { id: "analytics", label: t.analytics, icon: <ChartNoAxesColumnIncreasing className="h-4 w-4" /> },
    { id: "tools", label: t.tools, icon: <Wrench className="h-4 w-4" /> },
    { id: "users", label: t.users, icon: <UsersRound className="h-4 w-4" /> },
    { id: "categories", label: t.categories, icon: <Tags className="h-4 w-4" /> },
    { id: "packages", label: t.packages, icon: <PackagePlus className="h-4 w-4" /> },
    { id: "notifications", label: t.notifications, icon: <BellRing className="h-4 w-4" /> },
    { id: "ui", label: t.uiEditor, icon: <LayoutTemplate className="h-4 w-4" /> }
  ];

  return (
    <>
      <TopBar />
      <main className="relative z-10 mx-auto max-w-7xl px-5 py-8">
        <section className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-matrix-cyan">{t.adminPanel}</p>
            <h1 className="mt-2 text-4xl font-black text-white">Command Matrix</h1>
          </div>
          <div className="inline-flex items-center gap-2 rounded-xl border border-matrix-pink/35 bg-matrix-pink/10 px-4 py-3 text-sm font-bold text-pink-100">
            <LockKeyhole className="h-4 w-4" aria-hidden />
            {ADMIN_EMAIL}
          </div>
        </section>

        <nav className="mb-6 flex gap-2 overflow-x-auto rounded-2xl border border-white/10 bg-white/5 p-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex min-w-fit items-center gap-2 rounded-xl px-4 py-3 text-sm font-black transition ${
                activeTab === tab.id
                  ? "bg-gradient-to-r from-matrix-pink to-matrix-cyan text-matrix-ink shadow-neon"
                  : "text-white/65 hover:bg-white/10 hover:text-white"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>

        {activeTab === "analytics" && (
          <section className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
              {[
                { label: t.tools, value: tools.length, icon: <Boxes /> },
                { label: t.users, value: profiles.length, icon: <UsersRound /> },
                { label: t.categories, value: categories.length, icon: <Tags /> },
                { label: t.packages, value: packages.length, icon: <PackagePlus /> }
              ].map((metric) => (
                <div key={metric.label} className="glass-panel rounded-2xl p-6">
                  <div className="mb-5 grid h-12 w-12 place-items-center rounded-xl bg-matrix-cyan/15 text-matrix-cyan">
                    {metric.icon}
                  </div>
                  <p className="text-sm font-bold uppercase tracking-[0.2em] text-white/45">{metric.label}</p>
                  <p className="mt-2 text-4xl font-black text-white">{metric.value}</p>
                </div>
              ))}
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <ToolRanking title={t.mostUsed} tools={mostUsed} />
              <ToolRanking title={t.leastUsed} tools={leastUsed} />
            </div>
          </section>
        )}

        {activeTab === "tools" && (
          <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <form onSubmit={saveTool} className="glass-panel rounded-2xl p-6">
              <div className="mb-5 flex items-center gap-3">
                <Upload className="h-6 w-6 text-matrix-cyan" aria-hidden />
                <h2 className="text-2xl font-black text-white">{editingToolId ? t.edit : t.addTool}</h2>
              </div>
              <div className="grid gap-4">
                <Field label={t.title}>
                  <input required value={toolForm.title} onChange={(event) => setToolForm({ ...toolForm, title: event.target.value })} className={inputClass()} />
                </Field>
                <Field label={t.description}>
                  <textarea required rows={4} value={toolForm.description} onChange={(event) => setToolForm({ ...toolForm, description: event.target.value })} className={inputClass()} />
                </Field>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label={t.category}>
                    <select required value={toolForm.categoryId} onChange={(event) => setToolForm({ ...toolForm, categoryId: event.target.value })} className={inputClass()}>
                      <option value="">Select category</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label={t.tier}>
                    <select value={toolForm.tier} onChange={(event) => setToolForm({ ...toolForm, tier: event.target.value as ToolTier })} className={inputClass()}>
                      <option value="free">{t.free}</option>
                      <option value="premium">{t.premium}</option>
                      <option value="pro">{t.pro}</option>
                    </select>
                  </Field>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label={t.type}>
                    <select value={toolForm.type} onChange={(event) => setToolForm({ ...toolForm, type: event.target.value as ToolType })} className={inputClass()}>
                      <option value="link">{t.link}</option>
                      <option value="file">{t.file}</option>
                      <option value="snippet">{t.snippet}</option>
                    </select>
                  </Field>
                  <Field label="Status">
                    <select value={toolForm.status} onChange={(event) => setToolForm({ ...toolForm, status: event.target.value as ToolStatus })} className={inputClass()}>
                      <option value="active">{t.active}</option>
                      <option value="draft">{t.draft}</option>
                    </select>
                  </Field>
                </div>
                <Field label={t.link}>
                  <input value={toolForm.externalUrl} onChange={(event) => setToolForm({ ...toolForm, externalUrl: event.target.value })} placeholder="https://example.com" className={inputClass()} />
                </Field>
                <Field label={t.snippet}>
                  <textarea rows={6} value={toolForm.codeSnippet} onChange={(event) => setToolForm({ ...toolForm, codeSnippet: event.target.value })} className={inputClass()} />
                </Field>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label={t.thumbnail}>
                    <input type="file" accept="image/*" onChange={fileHandler(setThumbnailFile)} className={inputClass()} />
                  </Field>
                  <Field label={t.file}>
                    <input type="file" onChange={fileHandler(setToolFile)} className={inputClass()} />
                  </Field>
                </div>
                <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4 text-sm font-bold text-white/75">
                  <input
                    type="checkbox"
                    checked={toolForm.redirectOnClick}
                    onChange={(event) => setToolForm({ ...toolForm, redirectOnClick: event.target.checked })}
                    className="h-5 w-5 accent-matrix-pink"
                  />
                  {t.redirect}
                </label>
                <div className="flex gap-3">
                  <NeonButton type="submit" disabled={busy}>
                    {busy ? t.loading : t.save}
                  </NeonButton>
                  {editingToolId && (
                    <NeonButton type="button" variant="ghost" onClick={resetToolForm}>
                      {t.cancel}
                    </NeonButton>
                  )}
                </div>
              </div>
            </form>

            <AdminList title={t.tools}>
              {tools.map((tool) => (
                <div key={tool.id} className="rounded-xl border border-white/10 bg-black/25 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-black text-white">{tool.title}</h3>
                      <p className="mt-1 text-sm text-white/55">
                        {tool.categoryName} • {tool.tier} • {tool.type} • {tool.usageCount || 0} clicks
                      </p>
                    </div>
                    <RowActions onEdit={() => editTool(tool)} onDelete={() => deleteDoc(doc(db, "tools", tool.id))} />
                  </div>
                </div>
              ))}
            </AdminList>
          </section>
        )}

        {activeTab === "users" && (
          <AdminList title={t.users}>
            {profiles.map((profile) => (
              <div key={profile.uid} className="rounded-xl border border-white/10 bg-black/25 p-4">
                <div className="grid gap-4 lg:grid-cols-[1fr_auto_auto_auto] lg:items-center">
                  <div>
                    <h3 className="text-lg font-black text-white">{profile.displayName || profile.email}</h3>
                    <p className="text-sm text-white/55">{profile.email}</p>
                  </div>
                  <select
                    value={profile.membershipTier}
                    onChange={(event) => updateUser(profile, { membershipTier: event.target.value as MembershipTier })}
                    className={inputClass()}
                  >
                    <option value="free">{t.free}</option>
                    <option value="premium">{t.premium}</option>
                    <option value="pro">{t.pro}</option>
                  </select>
                  <input
                    type="date"
                    onChange={(event) => updateUserExpiry(profile, event.target.value)}
                    className={inputClass()}
                  />
                  <label className="flex min-w-fit items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-white/75">
                    <input
                      type="checkbox"
                      checked={profile.restricted}
                      onChange={(event) => updateUser(profile, { restricted: event.target.checked })}
                      className="h-5 w-5 accent-matrix-pink"
                    />
                    Restricted
                  </label>
                </div>
              </div>
            ))}
          </AdminList>
        )}

        {activeTab === "categories" && (
          <section className="grid gap-6 lg:grid-cols-[0.75fr_1.25fr]">
            <form onSubmit={saveCategory} className="glass-panel rounded-2xl p-6">
              <h2 className="mb-5 text-2xl font-black text-white">{editingCategoryId ? t.edit : t.addCategory}</h2>
              <div className="grid gap-4">
                <Field label={t.title}>
                  <input required value={categoryName} onChange={(event) => setCategoryName(event.target.value)} className={inputClass()} />
                </Field>
                <Field label="Accent">
                  <input type="color" value={categoryAccent} onChange={(event) => setCategoryAccent(event.target.value)} className="h-12 w-full rounded-xl border border-white/10 bg-black/30 p-2" />
                </Field>
                <NeonButton type="submit">{t.save}</NeonButton>
              </div>
            </form>
            <AdminList title={t.categories}>
              {categories.map((category) => (
                <div key={category.id} className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-black/25 p-4">
                  <div className="flex items-center gap-3">
                    <span className="h-4 w-4 rounded-full" style={{ backgroundColor: category.accent }} />
                    <div>
                      <h3 className="font-black text-white">{category.name}</h3>
                      <p className="text-sm text-white/50">{category.slug}</p>
                    </div>
                  </div>
                  <RowActions
                    onEdit={() => {
                      setEditingCategoryId(category.id);
                      setCategoryName(category.name);
                      setCategoryAccent(category.accent);
                    }}
                    onDelete={() => deleteDoc(doc(db, "categories", category.id))}
                  />
                </div>
              ))}
            </AdminList>
          </section>
        )}

        {activeTab === "packages" && (
          <section className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
            <form onSubmit={savePackage} className="glass-panel rounded-2xl p-6">
              <div className="mb-5 flex items-center justify-between gap-3">
                <h2 className="text-2xl font-black text-white">{t.packages}</h2>
                <NeonButton type="button" variant="ghost" onClick={seedDefaultPackage}>
                  {t.seedDefault}
                </NeonButton>
              </div>
              <div className="grid gap-4">
                <Field label={t.title}>
                  <input required value={packageForm.name} onChange={(event) => setPackageForm({ ...packageForm, name: event.target.value })} className={inputClass()} />
                </Field>
                <div className="grid gap-4 md:grid-cols-3">
                  <Field label={t.tier}>
                    <select value={packageForm.tier} onChange={(event) => setPackageForm({ ...packageForm, tier: event.target.value as MembershipTier })} className={inputClass()}>
                      <option value="premium">{t.premium}</option>
                      <option value="pro">{t.pro}</option>
                    </select>
                  </Field>
                  <Field label="BDT">
                    <input type="number" min="0" value={packageForm.priceBdt} onChange={(event) => setPackageForm({ ...packageForm, priceBdt: Number(event.target.value) })} className={inputClass()} />
                  </Field>
                  <Field label="Days">
                    <input type="number" min="1" value={packageForm.durationDays} onChange={(event) => setPackageForm({ ...packageForm, durationDays: Number(event.target.value) })} className={inputClass()} />
                  </Field>
                </div>
                <Field label="Features">
                  <textarea rows={5} value={packageForm.features} onChange={(event) => setPackageForm({ ...packageForm, features: event.target.value })} className={inputClass()} />
                </Field>
                <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4 text-sm font-bold text-white/75">
                  <input type="checkbox" checked={packageForm.active} onChange={(event) => setPackageForm({ ...packageForm, active: event.target.checked })} className="h-5 w-5 accent-matrix-pink" />
                  {t.active}
                </label>
                <NeonButton type="submit">{t.save}</NeonButton>
              </div>
            </form>
            <AdminList title={t.packages}>
              {packages.map((item) => (
                <div key={item.id} className="rounded-xl border border-white/10 bg-black/25 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-black text-white">{item.name}</h3>
                      <p className="text-sm text-white/55">
                        {item.tier} • {item.priceBdt} BDT • {item.durationDays} days
                      </p>
                    </div>
                    <RowActions
                      onEdit={() => {
                        setEditingPackageId(item.id);
                        setPackageForm({
                          name: item.name,
                          tier: item.tier,
                          priceBdt: item.priceBdt,
                          durationDays: item.durationDays,
                          active: item.active,
                          features: item.features.join("\n")
                        });
                      }}
                      onDelete={() => deleteDoc(doc(db, "packages", item.id))}
                    />
                  </div>
                </div>
              ))}
            </AdminList>
          </section>
        )}

        {activeTab === "notifications" && (
          <section className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
            <form onSubmit={saveNotification} className="glass-panel rounded-2xl p-6">
              <h2 className="mb-5 text-2xl font-black text-white">{t.notifications}</h2>
              <div className="grid gap-4">
                <Field label={t.title}>
                  <input required value={notificationForm.title} onChange={(event) => setNotificationForm({ ...notificationForm, title: event.target.value })} className={inputClass()} />
                </Field>
                <Field label={t.description}>
                  <textarea required rows={4} value={notificationForm.message} onChange={(event) => setNotificationForm({ ...notificationForm, message: event.target.value })} className={inputClass()} />
                </Field>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="CTA label">
                    <input value={notificationForm.ctaLabel} onChange={(event) => setNotificationForm({ ...notificationForm, ctaLabel: event.target.value })} className={inputClass()} />
                  </Field>
                  <Field label="CTA URL">
                    <input value={notificationForm.ctaUrl} onChange={(event) => setNotificationForm({ ...notificationForm, ctaUrl: event.target.value })} className={inputClass()} />
                  </Field>
                </div>
                <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4 text-sm font-bold text-white/75">
                  <input type="checkbox" checked={notificationForm.active} onChange={(event) => setNotificationForm({ ...notificationForm, active: event.target.checked })} className="h-5 w-5 accent-matrix-pink" />
                  {t.active}
                </label>
                <NeonButton type="submit">{t.save}</NeonButton>
              </div>
            </form>
            <AdminList title={t.notifications}>
              {notifications.map((item) => (
                <div key={item.id} className="rounded-xl border border-white/10 bg-black/25 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-black text-white">{item.title}</h3>
                      <p className="mt-1 text-sm text-white/55">{item.active ? t.active : t.draft}</p>
                    </div>
                    <RowActions
                      onEdit={() => {
                        setEditingNotificationId(item.id);
                        setNotificationForm({
                          title: item.title,
                          message: item.message,
                          ctaLabel: item.ctaLabel || "",
                          ctaUrl: item.ctaUrl || "",
                          active: item.active
                        });
                      }}
                      onDelete={() => deleteDoc(doc(db, "notifications", item.id))}
                    />
                  </div>
                </div>
              ))}
            </AdminList>
          </section>
        )}

        {activeTab === "ui" && (
          <form onSubmit={saveUi} className="glass-panel max-w-4xl rounded-2xl p-6">
            <h2 className="mb-5 text-2xl font-black text-white">{t.uiEditor}</h2>
            <div className="grid gap-4">
              <Field label="Hero title">
                <input value={ui.heroTitle} onChange={(event) => setUi({ ...ui, heroTitle: event.target.value })} className={inputClass()} />
              </Field>
              <Field label="Hero subtitle">
                <textarea rows={4} value={ui.heroSubtitle} onChange={(event) => setUi({ ...ui, heroSubtitle: event.target.value })} className={inputClass()} />
              </Field>
              <Field label="Notice text">
                <input value={ui.noticeText} onChange={(event) => setUi({ ...ui, noticeText: event.target.value })} className={inputClass()} />
              </Field>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Accent color">
                  <input type="color" value={ui.accentColor} onChange={(event) => setUi({ ...ui, accentColor: event.target.value })} className="h-12 w-full rounded-xl border border-white/10 bg-black/30 p-2" />
                </Field>
                <Field label={t.layout}>
                  <select value={ui.layoutDensity} onChange={(event) => setUi({ ...ui, layoutDensity: event.target.value as LayoutDensity })} className={inputClass()}>
                    <option value="comfortable">{t.comfortable}</option>
                    <option value="compact">{t.compact}</option>
                  </select>
                </Field>
              </div>
              <NeonButton type="submit">{t.save}</NeonButton>
            </div>
          </form>
        )}
      </main>
    </>
  );
}

function AdminList({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="glass-panel rounded-2xl p-6">
      <h2 className="mb-5 text-2xl font-black text-white">{title}</h2>
      <div className="grid max-h-[72vh] gap-3 overflow-auto pr-1">{children}</div>
    </section>
  );
}

function ToolRanking({ title, tools }: { title: string; tools: Tool[] }) {
  return (
    <section className="glass-panel rounded-2xl p-6">
      <h2 className="mb-5 text-2xl font-black text-white">{title}</h2>
      <div className="space-y-3">
        {tools.length === 0 ? (
          <p className="rounded-xl border border-white/10 bg-black/25 p-4 text-white/55">No tool activity yet.</p>
        ) : (
          tools.map((tool, index) => (
            <div key={tool.id} className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-black/25 p-4">
              <div>
                <p className="text-sm font-bold text-matrix-cyan">#{index + 1}</p>
                <h3 className="font-black text-white">{tool.title}</h3>
              </div>
              <span className="rounded-full border border-matrix-pink/35 bg-matrix-pink/10 px-3 py-1 text-sm font-black text-pink-100">
                {tool.usageCount || 0}
              </span>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function RowActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={onEdit}
        className="grid h-10 w-10 place-items-center rounded-lg border border-matrix-cyan/35 bg-matrix-cyan/10 text-matrix-cyan transition hover:bg-matrix-cyan/20"
        title="Edit"
      >
        <Pencil className="h-4 w-4" aria-hidden />
      </button>
      <button
        type="button"
        onClick={onDelete}
        className="grid h-10 w-10 place-items-center rounded-lg border border-red-400/45 bg-red-500/10 text-red-100 transition hover:bg-red-500/20"
        title="Delete"
      >
        <Trash2 className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}
