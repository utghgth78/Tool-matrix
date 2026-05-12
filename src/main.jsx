import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  BadgeCheck,
  Bell,
  Boxes,
  BrainCircuit,
  Check,
  Cloud,
  Code2,
  Crown,
  DatabaseZap,
  Edit3,
  ExternalLink,
  Eye,
  Flame,
  Gamepad2,
  Gauge,
  Gem,
  Grid3X3,
  ImagePlus,
  KeyRound,
  Layers3,
  Loader2,
  Lock,
  LogIn,
  LogOut,
  Mail,
  Menu,
  MousePointerClick,
  Pencil,
  Plus,
  Rocket,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Trash2,
  UploadCloud,
  User,
  Wand2,
  X,
  Zap,
} from "lucide-react";
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  getRedirectResult,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithRedirect,
  signOut,
  updateProfile,
} from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { logEvent } from "firebase/analytics";
import { analytics, auth, db, storage } from "./services/firebase";
import "./styles.css";

const ADMIN_ROUTES = ["/matrix-control", "/system-core", "/hidden-admin", "/admin"];
const USER_DASHBOARD_ROUTES = ["/dashboard", "/user-dashboard"];
const ADMIN_EMAILS = ["mdefankhan56@gmail.com"];
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });
const DEFAULT_CATEGORIES = [
  "AI Tools",
  "Editing Tools",
  "Developer Tools",
  "Gaming Tools",
  "Utility Tools",
  "Premium Tools",
];

function getCurrentRoute() {
  const hashRoute = window.location.hash?.startsWith("#/") ? window.location.hash.slice(1) : "";
  return hashRoute || window.location.pathname;
}

function isAdminEmail(email) {
  return ADMIN_EMAILS.includes((email || "").toLowerCase());
}

function isAdminPath(route) {
  return ADMIN_ROUTES.some((adminRoute) => route === adminRoute || route.startsWith(`${adminRoute}/`));
}

function isUserDashboardPath(route) {
  return USER_DASHBOARD_ROUTES.includes(route);
}

function useAuthUser() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRedirectResult(auth).catch((error) => {
      window.sessionStorage.setItem("toolMatrixAuthError", error.message);
    });

    const unsub = auth.onAuthStateChanged(async (current) => {
      setUser(current);
      if (current) {
        const userRef = doc(db, "users", current.uid);
        const snap = await getDoc(userRef);
        const payload = {
          uid: current.uid,
          name: current.displayName || current.email?.split("@")[0] || "Matrix User",
          email: current.email,
          photoURL: current.photoURL || "",
          plan: snap.exists() ? snap.data().plan || "free" : "free",
          premiumUntil: snap.exists() ? snap.data().premiumUntil || null : null,
          lastLoginAt: serverTimestamp(),
        };
        await setDoc(userRef, payload, { merge: true });
        setProfile({ ...payload, ...(snap.exists() ? snap.data() : {}) });
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  return { user, profile, loading };
}

function useRealtimeCollection(name, constraints = []) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = constraints.length ? query(collection(db, name), ...constraints) : collection(db, name);
    const unsub = onSnapshot(
      q,
      (snap) => {
        setItems(snap.docs.map((item) => ({ id: item.id, ...item.data() })));
        setLoading(false);
      },
      () => setLoading(false)
    );
    return () => unsub();
  }, [name]);

  return { items, loading };
}

function useAdmin(user) {
  const [allowed, setAllowed] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let live = true;
    async function verify() {
      if (!user?.email) {
        setAllowed(false);
        setChecking(false);
        return;
      }
      const email = user.email.toLowerCase();
      const direct = await getDoc(doc(db, "admins", email));
      const byUid = await getDoc(doc(db, "admins", user.uid));
      if (live) {
        setAllowed(ADMIN_EMAILS.includes(email) || direct.exists() || byUid.exists());
        setChecking(false);
      }
    }
    setChecking(true);
    verify();
    return () => {
      live = false;
    };
  }, [user?.uid, user?.email]);

  return { allowed, checking };
}

function App() {
  const { user, profile, loading } = useAuthUser();
  const [route, setRoute] = useState(getCurrentRoute);
  const [loginOpen, setLoginOpen] = useState(false);
  const [premiumLock, setPremiumLock] = useState(null);
  const isAdminRoute = isAdminPath(route);
  const isUserDashboardRoute = isUserDashboardPath(route);

  useEffect(() => {
    const sync = () => setRoute(getCurrentRoute());
    window.addEventListener("popstate", sync);
    window.addEventListener("hashchange", sync);
    return () => {
      window.removeEventListener("popstate", sync);
      window.removeEventListener("hashchange", sync);
    };
  }, []);

  const go = (path) => {
    window.history.pushState({}, "", path);
    setRoute(path);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    if (loading || !user) return;
    const intent = window.sessionStorage.getItem("toolMatrixLoginIntent");
    const admin = isAdminEmail(user.email);

    if ((intent === "admin" || isAdminRoute) && admin && route !== "/matrix-control/dashboard") {
      window.sessionStorage.removeItem("toolMatrixLoginIntent");
      go("/matrix-control/dashboard");
      return;
    }

    if (intent === "user" && !isUserDashboardPath(route)) {
      window.sessionStorage.removeItem("toolMatrixLoginIntent");
      go("/dashboard");
    }
  }, [loading, user?.uid, user?.email, route, isAdminRoute]);

  if (loading) return <BootScreen />;

  return (
    <div className="min-h-screen overflow-hidden bg-cyber text-white">
      <BackgroundFX />
      <Scanlines />
      <MouseGlow />
      <AnimatePresence mode="wait">
        {isAdminRoute ? (
          <AdminPortal key="admin" user={user} route={route} go={go} />
        ) : isUserDashboardRoute ? (
          <UserDashboardPortal
            key="user-dashboard"
            user={user}
            profile={profile}
            go={go}
            openLogin={() => setLoginOpen(true)}
            openPremiumLock={setPremiumLock}
          />
        ) : (
          <PublicSite
            key="public"
            user={user}
            profile={profile}
            go={go}
            openLogin={() => setLoginOpen(true)}
            openPremiumLock={setPremiumLock}
          />
        )}
      </AnimatePresence>
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} onSuccess={() => go("/dashboard")} />
      <PremiumModal tool={premiumLock} onClose={() => setPremiumLock(null)} go={go} />
    </div>
  );
}

function BootScreen() {
  return (
    <div className="grid min-h-screen place-items-center bg-[#050006] text-white">
      <div className="text-center">
        <div className="mx-auto mb-5 h-20 w-20 rounded-full border border-matrix-red/50 bg-matrix-red/10 shadow-neon">
          <Loader2 className="mx-auto mt-5 animate-spin text-matrix-red" size={38} />
        </div>
        <p className="font-display text-xl tracking-[0.24em] text-matrix-blue">TOOL MATRIX</p>
        <p className="mt-2 text-matrix-red">সিস্টেম চালু হচ্ছে / Initializing core</p>
      </div>
    </div>
  );
}

function PublicSite({ user, profile, go, openLogin, openPremiumLock }) {
  const { items: tools, loading } = useRealtimeCollection("tools", [orderBy("createdAt", "desc")]);
  const { items: categoryDocs } = useRealtimeCollection("categories", [orderBy("name", "asc")]);
  const { items: popups } = useRealtimeCollection("popups", [where("enabled", "==", true), limit(1)]);
  const { items: settingsDocs } = useRealtimeCollection("settings", []);
  const [queryText, setQueryText] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [menuOpen, setMenuOpen] = useState(false);

  const settings = settingsDocs.find((item) => item.id === "site") || {};
  useEffect(() => {
    if (settings.neonRed) document.documentElement.style.setProperty("--theme-red", settings.neonRed);
    if (settings.electricBlue) document.documentElement.style.setProperty("--theme-blue", settings.electricBlue);
  }, [settings.neonRed, settings.electricBlue]);
  const categories = ["All", ...new Set([...DEFAULT_CATEGORIES, ...categoryDocs.map((cat) => cat.name).filter(Boolean)])];
  const filteredTools = tools.filter((tool) => {
    const matchesQuery = [tool.toolName, tool.description, tool.category]
      .join(" ")
      .toLowerCase()
      .includes(queryText.toLowerCase());
    const matchesCategory = activeCategory === "All" || tool.category === activeCategory;
    return matchesQuery && matchesCategory;
  });
  const isPremiumUser = profile?.plan === "premium";
  const freeTools = filteredTools.filter((tool) => !tool.premium);
  const premiumTools = filteredTools.filter((tool) => tool.premium);
  const featured = tools.filter((tool) => tool.featured).slice(0, 6);
  const trending = [...tools].sort((a, b) => (b.clicks || 0) - (a.clicks || 0)).slice(0, 6);

  const openTool = async (tool) => {
    if (tool.premium && profile?.plan !== "premium") {
      openPremiumLock(tool);
      return;
    }
    if (analytics) logEvent(analytics, "tool_click", { tool_id: tool.id, tool_name: tool.toolName });
    await updateDoc(doc(db, "tools", tool.id), { clicks: increment(1) }).catch(() => {});
    const target = tool.toolType === "HTML Tool" ? tool.htmlFileURL || tool.htmlURL : tool.externalURL;
    if (target) window.open(target, tool.openNewTab === false ? "_self" : "_blank", "noopener,noreferrer");
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <Navbar user={user} go={go} openLogin={openLogin} menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
      <main>
        <Hero settings={settings} openLogin={openLogin} />
        <SearchPanel
          queryText={queryText}
          setQueryText={setQueryText}
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
          categories={categories}
        />
        <ToolsSection
          sectionId="free-tools"
          title="Free Tools Hub"
          bangla="রিয়েলটাইম টুলস ড্যাশবোর্ড"
          tools={freeTools}
          loading={loading}
          emptyBangla="এখনো কোনো টুল আপলোড করা হয়নি"
          emptyEnglish="No Tools Available"
          onOpen={openTool}
          isPremiumUser={isPremiumUser}
        />
        <PremiumShowcase tools={premiumTools} loading={loading} onOpen={openTool} isPremiumUser={isPremiumUser} />
        <ToolsSection
          sectionId="trending"
          title="Trending Tools"
          bangla="নির্বাচিত ফিচার্ড টুলস"
          tools={trending}
          emptyBangla="অ্যাডমিন ফিচার করলে এখানে দেখাবে"
          emptyEnglish="No featured tools yet"
          onOpen={openTool}
          isPremiumUser={isPremiumUser}
          compact
        />
        <CategoryGrid categories={categories.filter((cat) => cat !== "All")} />
        <UpgradeBanner />
        <Features />
        <Membership />
        <ToolsSection
          sectionId="featured"
          title="Latest Featured Uploads"
          bangla="অ্যাডমিন নির্বাচিত ফিচার্ড টুলস"
          tools={featured}
          emptyBangla="অ্যাডমিন ফিচার করলে এখানে দেখাবে"
          emptyEnglish="No featured tools yet"
          onOpen={openTool}
          isPremiumUser={isPremiumUser}
          compact
        />
        <MembersOnlyArea isPremiumUser={isPremiumUser} openLogin={openLogin} />
        <ToolsSection
          sectionId="all-premium-tools"
          title="Premium Matrix Tools"
          bangla="প্রিমিয়াম ব্যবহারকারীদের বিশেষ টুলস"
          tools={premiumTools}
          emptyBangla="প্রিমিয়াম টুল আপলোডের অপেক্ষায়"
          emptyEnglish="Premium tools coming from admin panel"
          onOpen={openTool}
          isPremiumUser={isPremiumUser}
          compact
        />
      </main>
      <Footer settings={settings} />
      <PopupAnnouncement popup={popups[0]} />
    </motion.div>
  );
}

function UserDashboardPortal({ user, profile, go, openLogin, openPremiumLock }) {
  if (!user) {
    return (
      <AccessGate
        title="User Login Required"
        bangla="ড্যাশবোর্ড দেখতে আগে login করুন"
        action={openLogin}
        actionText="Login To Dashboard"
      />
    );
  }

  return <UserDashboard user={user} profile={profile} go={go} openPremiumLock={openPremiumLock} />;
}

function UserDashboard({ user, profile, go, openPremiumLock }) {
  const { items: tools, loading } = useRealtimeCollection("tools", [orderBy("createdAt", "desc")]);
  const { items: categoryDocs } = useRealtimeCollection("categories", [orderBy("name", "asc")]);
  const [queryText, setQueryText] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const isPremiumUser = profile?.plan === "premium";
  const categories = ["All", ...new Set([...DEFAULT_CATEGORIES, ...categoryDocs.map((cat) => cat.name).filter(Boolean)])];
  const filteredTools = tools.filter((tool) => {
    const searchable = [tool.toolName, tool.description, tool.category].join(" ").toLowerCase();
    const matchesQuery = searchable.includes(queryText.toLowerCase());
    const matchesCategory = activeCategory === "All" || tool.category === activeCategory;
    return matchesQuery && matchesCategory;
  });
  const featured = filteredTools.filter((tool) => tool.featured).slice(0, 6);
  const latest = filteredTools.slice(0, 9);
  const freeTools = filteredTools.filter((tool) => !tool.premium);
  const premiumTools = filteredTools.filter((tool) => tool.premium);

  const openTool = async (tool) => {
    if (tool.premium && !isPremiumUser) {
      openPremiumLock(tool);
      return;
    }
    if (analytics) logEvent(analytics, "tool_click", { tool_id: tool.id, tool_name: tool.toolName });
    await updateDoc(doc(db, "tools", tool.id), { clicks: increment(1) }).catch(() => {});
    const target = tool.toolType === "HTML Tool" ? tool.htmlFileURL || tool.htmlURL : tool.externalURL;
    if (target) window.open(target, tool.openNewTab === false ? "_self" : "_blank", "noopener,noreferrer");
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-screen px-4 pb-16 pt-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <button onClick={() => go("/")} className="font-display text-2xl font-black">
            TOOL <span className="text-matrix-red">MATRIX</span>
          </button>
          <div className="flex flex-wrap gap-3">
            {isAdminEmail(user.email) && (
              <button onClick={() => go("/matrix-control/dashboard")} className="cyber-button small gold">
                <ShieldCheck size={16} /> Admin Panel
              </button>
            )}
            <button onClick={() => signOut(auth).then(() => go("/"))} className="cyber-button small">
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>

        <section className="dashboard-hero">
          <div>
            <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-matrix-blue/40 bg-matrix-blue/10 px-4 py-2 text-matrix-blue">
              <User size={16} /> User Dashboard / ইউজার ড্যাশবোর্ড
            </p>
            <h1 className="font-display text-4xl font-black md:text-6xl">Welcome, {profile?.name || user.displayName || "Matrix User"}</h1>
            <p className="mt-3 max-w-2xl text-lg text-white/65">Uploaded tools realtime দেখা যাবে. Free tools open করুন, premium tools unlock করতে upgrade করুন.</p>
          </div>
          <div className="hologram-card p-5">
            <p className="text-sm text-white/50">Membership Status</p>
            <p className={`font-display text-3xl ${isPremiumUser ? "text-matrix-gold" : "text-matrix-blue"}`}>{isPremiumUser ? "PREMIUM MATRIX" : "FREE ACCESS"}</p>
            <p className="text-white/55">{isPremiumUser ? `Expiry: ${profile?.premiumUntil || "Active"}` : "Basic access / Limited tools"}</p>
            {!isPremiumUser && (
              <a href="#premium-tools" className="cyber-button gold mt-4 w-full justify-center">
                <Crown size={17} /> Upgrade Now
              </a>
            )}
          </div>
        </section>

        <SearchPanel
          queryText={queryText}
          setQueryText={setQueryText}
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
          categories={categories}
        />

        <ToolsSection
          sectionId="featured-dashboard"
          title="Featured Tools"
          bangla="নির্বাচিত টুলস"
          tools={featured}
          loading={loading}
          emptyEnglish="No featured tools yet"
          emptyBangla="অ্যাডমিন feature করলে এখানে দেখাবে"
          onOpen={openTool}
          isPremiumUser={isPremiumUser}
          compact
        />
        <ToolsSection
          sectionId="latest-uploads"
          title="Latest Uploads"
          bangla="সর্বশেষ আপলোড"
          tools={latest}
          loading={loading}
          emptyEnglish="No Tools Available"
          emptyBangla="এখনো কোনো টুল আপলোড করা হয়নি"
          onOpen={openTool}
          isPremiumUser={isPremiumUser}
        />
        <ToolsSection
          sectionId="free-dashboard-tools"
          title="Free Tools"
          bangla="ফ্রি ব্যবহারযোগ্য টুলস"
          tools={freeTools}
          loading={loading}
          emptyEnglish="No free tools yet"
          emptyBangla="ফ্রি টুল আপলোডের অপেক্ষায়"
          onOpen={openTool}
          isPremiumUser={isPremiumUser}
          compact
        />
        <ToolsSection
          sectionId="premium-tools"
          title="Premium Tools"
          bangla="লক করা প্রিমিয়াম টুলস"
          tools={premiumTools}
          loading={loading}
          emptyEnglish="No premium tools yet"
          emptyBangla="প্রিমিয়াম টুল আপলোডের অপেক্ষায়"
          onOpen={openTool}
          isPremiumUser={isPremiumUser}
          compact
        />
        <CategoryGrid categories={categories.filter((cat) => cat !== "All")} />
      </div>
    </motion.div>
  );
}

function Navbar({ user, go, openLogin, menuOpen, setMenuOpen }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const nav = ["Home", "Tools", "Categories", "Premium", "Dashboard"];
  return (
    <header className={`fixed inset-x-0 top-0 z-40 transition ${scrolled ? "border-b border-matrix-red/20 bg-black/55 backdrop-blur-xl" : "bg-transparent"}`}>
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
        <button onClick={() => go("/")} className="glitch font-display text-xl font-black text-white" data-text="TOOL MATRIX">
          TOOL <span className="text-matrix-red">MATRIX</span>
        </button>
        <nav className="hidden items-center gap-6 text-sm font-semibold text-white/75 md:flex">
          {nav.map((item) => (
            <a key={item} href={`#${item.toLowerCase()}`} className="neon-link">
              {item}
            </a>
          ))}
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          <span className="rounded-full border border-matrix-gold/50 bg-matrix-gold/10 px-3 py-1 text-xs font-bold text-matrix-gold shadow-gold">
            Premium 199 BDT
          </span>
          {user ? (
            <button onClick={() => signOut(auth)} className="cyber-button small">
              <LogOut size={16} /> Logout
            </button>
          ) : (
            <button onClick={openLogin} className="cyber-button small">
              <LogIn size={16} /> Login
            </button>
          )}
        </div>
        <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)} aria-label="Open menu">
          {menuOpen ? <X /> : <Menu />}
        </button>
      </div>
      {menuOpen && (
        <div className="mx-4 mb-4 rounded border border-matrix-red/30 bg-black/85 p-4 backdrop-blur-xl md:hidden">
          {nav.map((item) => (
            <a key={item} href={`#${item.toLowerCase()}`} className="block py-2 text-white/80" onClick={() => setMenuOpen(false)}>
              {item}
            </a>
          ))}
          <button onClick={openLogin} className="cyber-button mt-3 w-full justify-center">
            <LogIn size={16} /> Login
          </button>
        </div>
      )}
    </header>
  );
}

function Hero({ settings, openLogin }) {
  return (
    <section id="home" className="relative min-h-screen overflow-hidden px-4 pb-16 pt-28">
      <div className="cyber-grid" />
      <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[1.05fr_.95fr]">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-matrix-blue/40 bg-matrix-blue/10 px-4 py-2 text-sm text-matrix-blue shadow-blue">
            <Sparkles size={16} /> Ultimate AI & Utility Tools Platform
          </div>
          <h1 className="glitch hero-title font-display font-black uppercase leading-none" data-text={settings.title || "TOOL MATRIX"}>
            {settings.title || "TOOL MATRIX"}
          </h1>
          <p className="mt-5 max-w-2xl text-2xl font-semibold text-white">
            {settings.hero || "Explore The Future Tools"}
            <span className="block text-matrix-red">ভবিষ্যতের AI ও Utility Tools এখন এক প্ল্যাটফর্মে</span>
          </p>
          <p className="mt-5 max-w-2xl text-lg text-white/70">
            সকল প্রয়োজনীয় টুলস এক জায়গায়. Admin uploads tools from the hidden control center, আর dashboard realtime update হয় Firebase দিয়ে.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <a href="#tools" className="cyber-button">
              <Rocket size={18} /> Explore Tools
            </a>
            <button onClick={openLogin} className="cyber-button blue">
              <Zap size={18} /> Start Free
            </button>
            <a href="#premium" className="cyber-button gold">
              <Crown size={18} /> Premium Access
            </a>
          </div>
          <div className="mt-10 grid max-w-2xl grid-cols-3 gap-3">
            {[
              ["Realtime", "তাৎক্ষণিক আপডেট"],
              ["Firebase", "ক্লাউড সিকিউর"],
              ["No Tools", "শুরুতে খালি"],
            ].map(([en, bn]) => (
              <div key={en} className="hologram-card p-4">
                <p className="font-display text-matrix-blue">{en}</p>
                <p className="text-sm text-white/60">{bn}</p>
              </div>
            ))}
          </div>
        </motion.div>
        {settings.bannerURL ? (
          <div className="hologram-card overflow-hidden p-3">
            <img src={settings.bannerURL} alt="Tool Matrix banner" className="aspect-[4/3] w-full object-cover" />
          </div>
        ) : (
          <CyberConsole />
        )}
      </div>
    </section>
  );
}

function CyberConsole() {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.1 }} className="relative">
      <div className="absolute -inset-8 rounded-full bg-matrix-red/20 blur-3xl" />
      <div className="hologram-card relative overflow-hidden p-5">
        <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
          <div>
            <p className="font-display text-matrix-red">CYBERPUNK CONTROL FEED</p>
            <p className="text-sm text-white/50">হ্যাকার ড্যাশবোর্ড ভিজ্যুয়াল সিস্টেম</p>
          </div>
          <Gauge className="text-matrix-blue" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="terminal-panel sm:col-span-2">
            <p className="text-matrix-blue">root@tool-matrix:~$ firebase realtime listen</p>
            <p className="text-matrix-red">Admin Upload → Firestore Sync → Public Dashboard</p>
            <p className="text-white/60">টুল আপলোড হলেই homepage এ live দেখা যাবে.</p>
          </div>
          {[
            [BrainCircuit, "AI Tools", "স্মার্ট অটোমেশন"],
            [Code2, "Dev Tools", "কোড ইউটিলিটি"],
            [Gamepad2, "Gaming", "AAA neon mode"],
            [ShieldCheck, "Security", "Admin protected"],
          ].map(([Icon, title, sub]) => (
            <div key={title} className="rounded border border-white/10 bg-white/5 p-4 transition hover:border-matrix-red/60 hover:shadow-neon">
              <Icon className="mb-3 text-matrix-blue" />
              <p className="font-display">{title}</p>
              <p className="text-sm text-white/55">{sub}</p>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function SearchPanel({ queryText, setQueryText, activeCategory, setActiveCategory, categories }) {
  return (
    <section id="dashboard" className="px-4 py-8">
      <div className="mx-auto max-w-7xl rounded border border-matrix-red/30 bg-black/35 p-4 backdrop-blur-xl">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
          <label className="relative block">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-matrix-blue" size={20} />
            <input
              value={queryText}
              onChange={(event) => setQueryText(event.target.value)}
              placeholder="Search tools / টুল খুঁজুন..."
              className="cyber-input pl-12"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button key={cat} onClick={() => setActiveCategory(cat)} className={`filter-chip ${activeCategory === cat ? "active" : ""}`}>
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ToolsSection({ sectionId = "tools", title, bangla, tools, loading, emptyEnglish, emptyBangla, onOpen, compact, isPremiumUser }) {
  return (
    <section id={sectionId} className="px-4 py-14">
      <div className="mx-auto max-w-7xl">
        <SectionTitle icon={Boxes} title={title} bangla={bangla} />
        {loading ? (
          <div className="grid min-h-56 place-items-center">
            <Loader2 className="animate-spin text-matrix-red" size={42} />
          </div>
        ) : tools.length === 0 ? (
          <EmptyState title={emptyEnglish} bangla={emptyBangla} />
        ) : (
          <div className={`grid gap-5 ${compact ? "md:grid-cols-2 xl:grid-cols-3" : "md:grid-cols-2 xl:grid-cols-3"}`}>
            {tools.map((tool) => (
              <ToolCard key={tool.id} tool={tool} onOpen={onOpen} locked={tool.premium && !isPremiumUser} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function PremiumShowcase({ tools, loading, onOpen, isPremiumUser }) {
  return (
    <section className="px-4 py-16">
      <div className="mx-auto max-w-7xl">
        <div className="premium-showcase overflow-hidden p-6 md:p-8">
          <div className="mb-8 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-matrix-gold/50 bg-matrix-gold/10 px-4 py-2 text-sm font-bold text-matrix-gold shadow-gold">
                <Crown size={17} /> Members Only / VIP Matrix
              </div>
              <h2 className="font-display text-4xl font-black md:text-6xl">Unlock The Future</h2>
              <p className="mt-2 text-xl text-white/70">প্রিমিয়াম টুলস আনলক করুন. Exclusive AI utilities, VIP content, unlimited access.</p>
            </div>
            <a href="#premium" className="cyber-button gold">
              <Crown size={18} /> Upgrade 199 BDT
            </a>
          </div>
          {loading ? (
            <div className="grid min-h-44 place-items-center">
              <Loader2 className="animate-spin text-matrix-gold" size={38} />
            </div>
          ) : tools.length === 0 ? (
            <EmptyState title="Premium tools coming soon" bangla="অ্যাডমিন premium tool আপলোড করলে এখানে locked preview দেখা যাবে" />
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {tools.slice(0, 6).map((tool) => (
                <ToolCard key={tool.id} tool={tool} onOpen={onOpen} locked={tool.premium && !isPremiumUser} premiumShowcase />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function UpgradeBanner() {
  return (
    <section className="px-4 py-12">
      <div className="mx-auto max-w-7xl">
        <div className="upgrade-banner">
          <div>
            <p className="mb-2 font-display text-sm uppercase tracking-[0.24em] text-matrix-gold">Premium Selling Core</p>
            <h2 className="font-display text-3xl font-black md:text-5xl">Build Your Cyberpunk Tool Arsenal</h2>
            <p className="mt-3 max-w-3xl text-lg text-white/68">
              Free tools bring traffic, premium tools create revenue. ফ্রি ইউজাররা preview দেখবে, আর Premium Matrix সদস্যরা সব exclusive tool unlock করবে.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              ["FREE", "Basic access", "Limited tools"],
              ["PREMIUM", "Full access", "VIP effects"],
              ["MARKETPLACE", "Tool ecosystem", "Community growth"],
            ].map(([title, sub, bn]) => (
              <div key={title} className="rounded border border-white/10 bg-black/28 p-4">
                <p className="font-display text-matrix-blue">{title}</p>
                <p className="text-white/70">{sub}</p>
                <p className="text-sm text-white/45">{bn}</p>
              </div>
            ))}
          </div>
          <a href="#premium" className="cyber-button gold mt-6">
            <Gem size={18} /> See Membership
          </a>
        </div>
      </div>
    </section>
  );
}

function MembersOnlyArea({ isPremiumUser, openLogin }) {
  return (
    <section className="px-4 py-14">
      <div className="mx-auto max-w-7xl">
        <div className={`members-area ${isPremiumUser ? "unlocked" : ""}`}>
          <div className="relative z-10">
            <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-matrix-red/40 bg-matrix-red/10 px-4 py-2 text-sm font-bold text-matrix-red">
              <Lock size={16} /> Members Only Area
            </p>
            <h2 className="font-display text-4xl font-black">VIP Matrix Dashboard</h2>
            <p className="mt-3 max-w-2xl text-lg text-white/65">
              Premium-only content, exclusive uploads, unlimited access. প্রিমিয়াম মেম্বার হলে সব locked utility খুলে যাবে.
            </p>
            <button onClick={openLogin} className="cyber-button mt-6">
              <LogIn size={18} /> {isPremiumUser ? "Premium Active" : "Login To Upgrade"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function ToolCard({ tool, onOpen, locked, premiumShowcase }) {
  return (
    <motion.article whileHover={{ y: -6 }} className={`hologram-card group relative overflow-hidden ${locked ? "locked-card" : ""} ${premiumShowcase ? "premium-card" : ""}`}>
      <div className="relative aspect-[16/9] overflow-hidden bg-gradient-to-br from-matrix-red/20 via-matrix-purple/20 to-matrix-blue/10">
        {tool.thumbnailURL ? (
          <img src={tool.thumbnailURL} alt={tool.toolName} className="h-full w-full object-cover opacity-80 transition group-hover:scale-105" loading="lazy" />
        ) : (
          <div className="grid h-full place-items-center">
            <Wand2 className="text-matrix-blue drop-shadow-[0_0_12px_rgba(0,231,255,.8)]" size={56} />
          </div>
        )}
        <div className="absolute left-3 top-3 flex gap-2">
          <span className="badge blue">{tool.category || "Utility Tools"}</span>
          <span className={`badge ${tool.premium ? "gold" : "red"}`}>{tool.premium ? "Premium" : "Free"}</span>
        </div>
        {locked && (
          <div className="absolute inset-0 grid place-items-center bg-black/55 backdrop-blur-[2px]">
            <div className="rounded-full border border-matrix-gold/60 bg-matrix-gold/10 p-4 text-matrix-gold shadow-gold">
              <Lock size={32} />
            </div>
          </div>
        )}
      </div>
      <div className="p-5">
        <div className="flex items-start gap-3">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded border border-matrix-red/40 bg-matrix-red/10 shadow-neon">
            {tool.iconURL ? <img src={tool.iconURL} alt="" className="h-8 w-8 object-contain" loading="lazy" /> : <Sparkles className="text-matrix-red" />}
          </div>
          <div>
            <h3 className="font-display text-xl font-bold">{tool.toolName}</h3>
            <p className="mt-1 text-white/65">{tool.description || "দ্রুত ও নিরাপদ টুল ব্যবহার করুন"}</p>
          </div>
        </div>
        {locked && <p className="mt-4 rounded border border-matrix-gold/30 bg-matrix-gold/10 p-3 text-sm font-semibold text-matrix-gold">Premium preview only / আপগ্রেড করলে access পাবেন</p>}
        <button onClick={() => onOpen(tool)} className={`cyber-button mt-5 w-full justify-center ${tool.premium ? "gold" : ""}`}>
          {locked ? <Crown size={17} /> : tool.premium ? <Lock size={17} /> : <ExternalLink size={17} />} {locked ? "Upgrade To Open" : "Open Tool"}
        </button>
      </div>
    </motion.article>
  );
}

function EmptyState({ title, bangla }) {
  return (
    <div className="hologram-card grid min-h-64 place-items-center p-8 text-center">
      <div>
        <DatabaseZap className="mx-auto mb-4 text-matrix-red" size={52} />
        <h3 className="font-display text-3xl">{title}</h3>
        <p className="mt-2 text-xl text-white/65">{bangla}</p>
        <p className="mt-4 text-white/45">Admin panel থেকে upload করলে এখানে instantly show করবে.</p>
      </div>
    </div>
  );
}

function CategoryGrid({ categories }) {
  const icons = [BrainCircuit, Edit3, Code2, Gamepad2, Cloud, Crown];
  return (
    <section id="categories" className="px-4 py-16">
      <div className="mx-auto max-w-7xl">
        <SectionTitle icon={Grid3X3} title="Cyber Categories" bangla="নিয়ন ক্যাটাগরি গ্রিড" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat, index) => {
            const Icon = icons[index % icons.length];
            return (
              <div key={cat} className="category-card">
                <Icon className="text-matrix-blue" size={34} />
                <p className="font-display text-xl">{cat}</p>
                <p className="text-white/55">দ্রুত browse করুন / Filter tools instantly</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Features() {
  const features = [
    [BrainCircuit, "AI Powered Tools", "AI দিয়ে কাজ দ্রুত করুন"],
    [Zap, "Fast Processing", "দ্রুত লোডিং ও smooth action"],
    [Gauge, "Premium Dashboard", "VIP access ও exclusive tools"],
    [ShieldCheck, "Firebase Security", "নিরাপদ admin rules"],
    [MousePointerClick, "Mobile Responsive", "সব ডিভাইসে perfect layout"],
    [Cloud, "Cloud Based", "Firebase cloud data sync"],
  ];
  return (
    <section className="px-4 py-16">
      <div className="mx-auto max-w-7xl">
        <SectionTitle icon={Flame} title="Matrix Features" bangla="প্রিমিয়াম সাইবার ফিচার" />
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {features.map(([Icon, title, bn]) => (
            <div className="hologram-card p-6" key={title}>
              <Icon className="mb-4 text-matrix-red" size={36} />
              <h3 className="font-display text-xl">{title}</h3>
              <p className="mt-2 text-white/60">{bn}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Membership() {
  return (
    <section id="premium" className="px-4 py-16">
      <div className="mx-auto max-w-7xl">
        <SectionTitle icon={Gem} title="Membership Access" bangla="ফ্রি ও প্রিমিয়াম প্ল্যান" />
        <div className="grid gap-6 lg:grid-cols-2">
          <PlanCard title="FREE ACCESS" bangla="ফ্রি টুলস ব্যবহার করুন" color="blue" price="0 BDT" features={["Access free tools", "Search tools", "Browse categories"]} />
          <PlanCard
            title="PREMIUM MATRIX"
            bangla="সব প্রিমিয়াম টুলস আনলক করুন"
            color="gold"
            price="199 BDT / 3 Months"
            features={["Access all premium tools", "VIP dashboard", "Premium badges", "Exclusive tools", "Unlimited access"]}
          />
        </div>
      </div>
    </section>
  );
}

function PlanCard({ title, bangla, color, price, features }) {
  return (
    <div className={`hologram-card p-7 ${color === "gold" ? "border-matrix-gold/40 shadow-gold" : "border-matrix-blue/40 shadow-blue"}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-display text-3xl">{title}</h3>
          <p className="text-white/60">{bangla}</p>
        </div>
        <span className={`badge ${color}`}>{color === "gold" ? "Red Neon + Gold" : "Blue Neon"}</span>
      </div>
      <p className="my-6 font-display text-4xl text-matrix-red">{price}</p>
      <div className="space-y-3">
        {features.map((feature) => (
          <p key={feature} className="flex items-center gap-3 text-white/75">
            <Check className={color === "gold" ? "text-matrix-gold" : "text-matrix-blue"} size={18} /> {feature}
          </p>
        ))}
      </div>
    </div>
  );
}

function SectionTitle({ icon: Icon, title, bangla }) {
  return (
    <div className="mb-8 flex items-end justify-between gap-4">
      <div>
        <div className="mb-3 inline-flex items-center gap-2 text-matrix-blue">
          <Icon size={20} /> <span className="font-display text-sm uppercase tracking-[0.2em]">TOOL MATRIX</span>
        </div>
        <h2 className="font-display text-3xl font-black md:text-5xl">{title}</h2>
        <p className="mt-2 text-lg text-white/60">{bangla}</p>
      </div>
    </div>
  );
}

function LoginModal({ open, onClose, onSuccess }) {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    const redirectError = window.sessionStorage.getItem("toolMatrixAuthError");
    if (redirectError) {
      setMessage(redirectError);
      window.sessionStorage.removeItem("toolMatrixAuthError");
    }
  }, [open]);

  const googleLogin = async () => {
    setBusy(true);
    try {
      window.sessionStorage.setItem("toolMatrixLoginIntent", "user");
      await signInWithRedirect(auth, googleProvider);
    } catch (error) {
      setMessage(error.message);
      setBusy(false);
    } finally {
      if (auth.currentUser) setBusy(false);
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      if (mode === "register") {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(result.user, { displayName: name });
        await setDoc(doc(db, "users", result.user.uid), {
          uid: result.user.uid,
          name,
          email,
          plan: "free",
          createdAt: serverTimestamp(),
        });
      } else if (mode === "forgot") {
        await sendPasswordResetEmail(auth, email);
        setMessage("Password reset email sent / রিসেট লিংক পাঠানো হয়েছে");
        return;
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      onClose();
      onSuccess?.();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 grid place-items-center bg-black/75 p-4 backdrop-blur-sm">
          <motion.div initial={{ y: 24, scale: 0.96 }} animate={{ y: 0, scale: 1 }} exit={{ y: 24, scale: 0.96 }} className="hologram-card w-full max-w-md p-6">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="font-display text-2xl">{mode === "register" ? "Create Account" : mode === "forgot" ? "Reset Password" : "Matrix Login"}</h2>
                <p className="text-white/55">Google redirect অথবা email/password ব্যবহার করুন</p>
              </div>
              <button onClick={onClose}>
                <X />
              </button>
            </div>
            <button onClick={googleLogin} disabled={busy} className="cyber-button blue mb-4 w-full justify-center">
              <Mail size={18} /> Continue with Google
            </button>
            <form onSubmit={submit} className="space-y-3">
              {mode === "register" && <input className="cyber-input" placeholder="Name / নাম" value={name} onChange={(e) => setName(e.target.value)} required />}
              <input className="cyber-input" type="email" placeholder="Email / Gmail" value={email} onChange={(e) => setEmail(e.target.value)} required />
              {mode !== "forgot" && <input className="cyber-input" type="password" placeholder="Password / পাসওয়ার্ড" value={password} onChange={(e) => setPassword(e.target.value)} required />}
              <button disabled={busy} className="cyber-button w-full justify-center">
                {busy ? <Loader2 className="animate-spin" size={18} /> : <KeyRound size={18} />} {mode === "register" ? "Register" : mode === "forgot" ? "Send Reset Link" : "Login"}
              </button>
            </form>
            {message && <p className="mt-4 rounded border border-matrix-red/30 bg-matrix-red/10 p-3 text-sm text-matrix-red">{message}</p>}
            <div className="mt-5 flex flex-wrap justify-between gap-3 text-sm text-white/65">
              <button onClick={() => setMode(mode === "register" ? "login" : "register")}>{mode === "register" ? "Already have account?" : "Create new account"}</button>
              <button onClick={() => setMode("forgot")}>Forgot password?</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function PremiumModal({ tool, onClose }) {
  return (
    <AnimatePresence>
      {tool && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-4 backdrop-blur-md">
          <motion.div initial={{ scale: 0.92 }} animate={{ scale: 1 }} exit={{ scale: 0.92 }} className="hologram-card max-w-lg p-7 text-center">
            <Lock className="mx-auto mb-4 text-matrix-gold" size={60} />
            <h2 className="font-display text-3xl text-matrix-red">PREMIUM ACCESS REQUIRED</h2>
            <p className="mt-3 text-xl text-white/70">এই টুল ব্যবহার করতে প্রিমিয়াম প্ল্যান প্রয়োজন</p>
            <p className="mt-2 text-white/45">{tool.toolName}</p>
            <div className="mt-6 flex justify-center gap-3">
              <a href="#premium" onClick={onClose} className="cyber-button gold">
                <Crown size={18} /> Upgrade Now
              </a>
              <button onClick={onClose} className="cyber-button blue">
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function PopupAnnouncement({ popup }) {
  const [open, setOpen] = useState(Boolean(popup));
  useEffect(() => setOpen(Boolean(popup)), [popup?.id]);
  if (!popup || !open) return null;
  return (
    <div className="fixed bottom-5 right-5 z-40 max-w-sm">
      <div className="hologram-card overflow-hidden">
        {popup.imageURL && <img src={popup.imageURL} alt="" className="h-36 w-full object-cover" />}
        <div className="p-4">
          <div className="flex items-start justify-between">
            <h3 className="font-display text-matrix-blue">{popup.title || "Matrix Announcement"}</h3>
            <button onClick={() => setOpen(false)}>
              <X size={18} />
            </button>
          </div>
          <p className="mt-2 text-white/65">{popup.text || "নতুন আপডেট এসেছে / New system update"}</p>
        </div>
      </div>
    </div>
  );
}

function AdminPortal({ user, route, go }) {
  const { allowed, checking } = useAdmin(user);
  const adminGoogleLogin = async () => {
    window.sessionStorage.setItem("toolMatrixLoginIntent", "admin");
    await signInWithRedirect(auth, googleProvider);
  };
  if (!user) return <AdminLoginPanel action={adminGoogleLogin} />;
  if (checking) return <BootScreen />;
  if (!allowed) return <AccessDenied go={go} />;
  return <AdminDashboard user={user} go={go} />;
}

function AdminLoginPanel({ action }) {
  return (
    <div className="grid min-h-screen place-items-center px-4">
      <div className="hologram-card max-w-xl p-8 text-center">
        <ShieldCheck className="mx-auto mb-5 text-matrix-red" size={66} />
        <h1 className="font-display text-4xl">Admin Matrix Login</h1>
        <p className="mt-3 text-white/65">Hidden admin control center. শুধু authorized Gmail দিয়ে access হবে.</p>
        <p className="mt-3 rounded border border-matrix-blue/30 bg-matrix-blue/10 p-3 text-matrix-blue">Allowed admin: mdefankhan56@gmail.com</p>
        <button onClick={action} className="cyber-button gold mx-auto mt-6">
          <Mail size={18} /> Continue With Admin Gmail
        </button>
      </div>
    </div>
  );
}

function AccessGate({ title, bangla, action, actionText }) {
  return (
    <div className="grid min-h-screen place-items-center px-4">
      <div className="hologram-card max-w-xl p-8 text-center">
        <ShieldCheck className="mx-auto mb-5 text-matrix-blue" size={62} />
        <h1 className="font-display text-4xl">{title}</h1>
        <p className="mt-3 text-white/65">{bangla}</p>
        <button onClick={action} className="cyber-button mx-auto mt-6">
          <LogIn size={18} /> {actionText}
        </button>
      </div>
    </div>
  );
}

function AccessDenied({ go }) {
  useEffect(() => {
    const timer = setTimeout(() => go("/"), 3500);
    return () => clearTimeout(timer);
  }, [go]);
  return (
    <div className="grid min-h-screen place-items-center px-4">
      <div className="hologram-card max-w-2xl p-8 text-center">
        <AlertTriangle className="mx-auto mb-5 animate-pulse text-matrix-red" size={78} />
        <h1 className="glitch font-display text-4xl text-matrix-red" data-text="UNAUTHORIZED ACCESS DETECTED">
          UNAUTHORIZED ACCESS DETECTED
        </h1>
        <p className="mt-3 text-2xl text-white">AUTHORIZED PERSONNEL ONLY</p>
        <p className="mt-2 text-white/60">আপনার Gmail admin তালিকায় নেই. Redirecting homepage...</p>
      </div>
    </div>
  );
}

function AdminDashboard({ user, go }) {
  const { items: tools } = useRealtimeCollection("tools", [orderBy("createdAt", "desc")]);
  const { items: categories } = useRealtimeCollection("categories", [orderBy("name", "asc")]);
  const { items: users } = useRealtimeCollection("users", []);
  const { items: popups } = useRealtimeCollection("popups", [orderBy("createdAt", "desc")]);
  const [tab, setTab] = useState("upload");
  const premiumUsers = users.filter((item) => item.plan === "premium");

  return (
    <div className="min-h-screen px-4 py-6">
      <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-[260px_1fr]">
        <aside className="hologram-card p-4 lg:sticky lg:top-6 lg:h-[calc(100vh-48px)]">
          <button onClick={() => go("/")} className="mb-6 font-display text-2xl font-black">
            TOOL <span className="text-matrix-red">MATRIX</span>
          </button>
          <p className="mb-5 text-sm text-white/50">Cyberpunk Control Center / অ্যাডমিন কোর</p>
          {[
            ["upload", UploadCloud, "Tool Upload"],
            ["tools", Boxes, "Manage Tools"],
            ["categories", Layers3, "Categories"],
            ["members", User, "Memberships"],
            ["popups", Bell, "Popups"],
            ["settings", Settings, "Website Settings"],
          ].map(([id, Icon, label]) => (
            <button key={id} onClick={() => setTab(id)} className={`admin-nav ${tab === id ? "active" : ""}`}>
              <Icon size={18} /> {label}
            </button>
          ))}
          <button onClick={() => signOut(auth)} className="cyber-button mt-6 w-full justify-center">
            <LogOut size={16} /> Logout
          </button>
        </aside>
        <main className="space-y-5">
          <div className="hologram-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="font-display text-3xl">Cyberpunk Control Center</h1>
                <p className="text-white/55">Welcome {user.displayName || user.email}. সবকিছু Firestore থেকে realtime sync হচ্ছে.</p>
              </div>
              <button onClick={() => go("/")} className="cyber-button blue">
                <Eye size={18} /> View Site
              </button>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            <StatCard icon={Boxes} label="Tools" bangla="মোট টুলস" value={tools.length} />
            <StatCard icon={User} label="Users" bangla="মোট ইউজার" value={users.length} />
            <StatCard icon={Crown} label="Premium" bangla="প্রিমিয়াম" value={premiumUsers.length} />
            <StatCard icon={Bell} label="Popups" bangla="পপআপ" value={popups.length} />
          </div>
          <AnalyticsPanel tools={tools} users={users} premiumUsers={premiumUsers} />
          {tab === "upload" && <ToolUpload user={user} categories={categories} />}
          {tab === "tools" && <ManageTools tools={tools} categories={categories} user={user} />}
          {tab === "categories" && <CategoryManager categories={categories} />}
          {tab === "members" && <MembershipManager users={users} />}
          {tab === "popups" && <PopupManager popups={popups} />}
          {tab === "settings" && <SettingsManager />}
        </main>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, bangla, value }) {
  return (
    <div className="hologram-card p-5">
      <Icon className="mb-3 text-matrix-blue" />
      <p className="text-sm text-white/50">{label} / {bangla}</p>
      <p className="font-display text-4xl text-matrix-red">{value}</p>
    </div>
  );
}

function AnalyticsPanel({ tools, users, premiumUsers }) {
  const ranked = [...tools].sort((a, b) => (b.clicks || 0) - (a.clicks || 0));
  const mostUsed = ranked[0];
  const leastUsed = ranked[ranked.length - 1];
  const conversion = users.length ? Math.round((premiumUsers.length / users.length) * 100) : 0;

  return (
    <div className="hologram-card p-5">
      <div className="mb-4 flex items-center gap-2">
        <Gauge className="text-matrix-blue" />
        <h2 className="font-display text-2xl">Firebase Analytics Overview / অ্যানালিটিক্স</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded border border-white/10 bg-white/5 p-4">
          <p className="text-sm text-white/50">Most Used Tool</p>
          <p className="font-display text-xl text-matrix-blue">{mostUsed?.toolName || "No clicks yet"}</p>
          <p className="text-white/45">{mostUsed?.clicks || 0} clicks</p>
        </div>
        <div className="rounded border border-white/10 bg-white/5 p-4">
          <p className="text-sm text-white/50">Least Used Tool</p>
          <p className="font-display text-xl text-matrix-red">{leastUsed?.toolName || "No tools yet"}</p>
          <p className="text-white/45">{leastUsed?.clicks || 0} clicks</p>
        </div>
        <div className="rounded border border-white/10 bg-white/5 p-4">
          <p className="text-sm text-white/50">Premium Conversion</p>
          <p className="font-display text-xl text-matrix-gold">{conversion}%</p>
          <p className="text-white/45">Premium users / total users</p>
        </div>
      </div>
    </div>
  );
}

function ToolUpload({ user, categories, editing, onDone }) {
  const [form, setForm] = useState(
    editing || {
      toolName: "",
      description: "",
      category: DEFAULT_CATEGORIES[0],
      toolType: "External Tool",
      externalURL: "",
      premium: false,
      featured: false,
      openNewTab: true,
    }
  );
  const [thumbnail, setThumbnail] = useState(null);
  const [icon, setIcon] = useState(null);
  const [htmlFile, setHtmlFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const categoryNames = [...new Set([...DEFAULT_CATEGORIES, ...categories.map((cat) => cat.name).filter(Boolean)])];

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  const uploadFile = async (file, folder) => {
    if (!file) return "";
    const fileRef = ref(storage, `${folder}/${Date.now()}-${file.name}`);
    await uploadBytes(fileRef, file);
    return getDownloadURL(fileRef);
  };

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const thumbnailURL = thumbnail ? await uploadFile(thumbnail, "tool-thumbnails") : form.thumbnailURL || "";
      const iconURL = icon ? await uploadFile(icon, "tool-icons") : form.iconURL || "";
      const htmlFileURL = htmlFile ? await uploadFile(htmlFile, "html-tools") : form.htmlFileURL || "";
      const payload = {
        ...form,
        thumbnailURL,
        iconURL,
        htmlFileURL,
        htmlURL: htmlFileURL,
        uploadedBy: user.email,
        updatedAt: serverTimestamp(),
      };
      if (editing?.id) {
        await updateDoc(doc(db, "tools", editing.id), payload);
        onDone?.();
      } else {
        await addDoc(collection(db, "tools"), { ...payload, clicks: 0, createdAt: serverTimestamp() });
        setForm({ toolName: "", description: "", category: DEFAULT_CATEGORIES[0], toolType: "External Tool", externalURL: "", premium: false, featured: false, openNewTab: true });
      }
      setMessage("Tool saved successfully / টুল সেভ হয়েছে");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="hologram-card space-y-4 p-5">
      <h2 className="font-display text-2xl">{editing ? "Edit Tool" : "Upload Tool"} / টুল আপলোড</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <input className="cyber-input" placeholder="Tool Name" value={form.toolName} onChange={(e) => set("toolName", e.target.value)} required />
        <select className="cyber-input" value={form.category} onChange={(e) => set("category", e.target.value)}>
          {categoryNames.map((cat) => <option key={cat}>{cat}</option>)}
        </select>
        <textarea className="cyber-input md:col-span-2" placeholder="Bengali description / বাংলা বিবরণ" value={form.description} onChange={(e) => set("description", e.target.value)} required />
        <select className="cyber-input" value={form.toolType} onChange={(e) => set("toolType", e.target.value)}>
          <option>External Tool</option>
          <option>HTML Tool</option>
          <option>Redirect Tool</option>
        </select>
        <input className="cyber-input" placeholder="External URL" value={form.externalURL || ""} onChange={(e) => set("externalURL", e.target.value)} />
        <FileInput label="Thumbnail Upload" onChange={setThumbnail} icon={ImagePlus} />
        <FileInput label="Tool Icon" onChange={setIcon} icon={BadgeCheck} />
        <FileInput label="HTML Upload" onChange={setHtmlFile} icon={Code2} accept=".html,text/html" />
      </div>
      <div className="flex flex-wrap gap-4">
        <Toggle label="Premium Tool" checked={form.premium} onChange={(value) => set("premium", value)} />
        <Toggle label="Featured Tool" checked={form.featured} onChange={(value) => set("featured", value)} />
        <Toggle label="Open New Tab" checked={form.openNewTab} onChange={(value) => set("openNewTab", value)} />
      </div>
      <button disabled={busy} className="cyber-button">
        {busy ? <Loader2 className="animate-spin" size={18} /> : <UploadCloud size={18} />} Save Tool
      </button>
      {message && <p className="text-matrix-blue">{message}</p>}
    </form>
  );
}

function FileInput({ label, onChange, icon: Icon, accept }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded border border-white/10 bg-white/5 p-4 text-white/70 transition hover:border-matrix-blue/50">
      <Icon className="text-matrix-blue" />
      <span>{label}</span>
      <input type="file" accept={accept} className="hidden" onChange={(event) => onChange(event.target.files?.[0] || null)} />
    </label>
  );
}

function Toggle({ label, checked, onChange }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded border border-white/10 bg-white/5 px-4 py-3">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span>{label}</span>
    </label>
  );
}

function ManageTools({ tools, categories, user }) {
  const [editing, setEditing] = useState(null);
  if (editing) return <ToolUpload editing={editing} categories={categories} user={user} onDone={() => setEditing(null)} />;
  return (
    <div className="hologram-card overflow-hidden p-5">
      <h2 className="mb-4 font-display text-2xl">Manage Tools / টুল ম্যানেজ</h2>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left">
          <thead className="text-matrix-blue">
            <tr><th>Name</th><th>Category</th><th>Plan</th><th>Clicks</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {tools.map((tool) => (
              <tr key={tool.id} className="border-t border-white/10">
                <td className="py-3">{tool.toolName}</td>
                <td>{tool.category}</td>
                <td>{tool.premium ? "Premium" : "Free"}</td>
                <td>{tool.clicks || 0}</td>
                <td className="flex gap-2 py-2">
                  <button onClick={() => setEditing(tool)} className="icon-button"><Pencil size={16} /></button>
                  <button onClick={() => deleteDoc(doc(db, "tools", tool.id))} className="icon-button danger"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CategoryManager({ categories }) {
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState("");
  const [editingName, setEditingName] = useState("");
  const add = async (event) => {
    event.preventDefault();
    if (!name.trim()) return;
    await addDoc(collection(db, "categories"), { name: name.trim(), createdAt: serverTimestamp() });
    setName("");
  };
  const saveEdit = async (cat) => {
    if (!editingName.trim()) return;
    await updateDoc(doc(db, "categories", cat.id), { name: editingName.trim(), updatedAt: serverTimestamp() });
    setEditingId("");
    setEditingName("");
  };
  return (
    <div className="hologram-card p-5">
      <h2 className="font-display text-2xl">Categories / ক্যাটাগরি</h2>
      <form onSubmit={add} className="mt-4 flex gap-3">
        <input className="cyber-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="New category name" />
        <button className="cyber-button"><Plus size={18} /> Add</button>
      </form>
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {categories.map((cat) => (
          <div className="flex items-center justify-between rounded border border-white/10 bg-white/5 p-3" key={cat.id}>
            {editingId === cat.id ? (
              <input className="cyber-input mr-3" value={editingName} onChange={(e) => setEditingName(e.target.value)} />
            ) : (
              <span>{cat.name}</span>
            )}
            <div className="flex gap-2">
              {editingId === cat.id ? (
                <button onClick={() => saveEdit(cat)} className="icon-button"><Check size={16} /></button>
              ) : (
                <button onClick={() => { setEditingId(cat.id); setEditingName(cat.name || ""); }} className="icon-button"><Pencil size={16} /></button>
              )}
              <button onClick={() => deleteDoc(doc(db, "categories", cat.id))} className="icon-button danger"><Trash2 size={16} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MembershipManager({ users }) {
  const [expiryByUser, setExpiryByUser] = useState({});
  const makePremium = async (user) => {
    const expiry = new Date();
    expiry.setMonth(expiry.getMonth() + 3);
    await setDoc(doc(db, "users", user.uid || user.id), { plan: "premium", premiumUntil: expiry.toISOString() }, { merge: true });
  };
  const setCustomExpiry = async (user) => {
    const expiry = expiryByUser[user.id];
    if (!expiry) return;
    await setDoc(doc(db, "users", user.uid || user.id), { plan: "premium", premiumUntil: new Date(expiry).toISOString() }, { merge: true });
  };
  const removePremium = async (user) => setDoc(doc(db, "users", user.uid || user.id), { plan: "free", premiumUntil: null }, { merge: true });
  return (
    <div className="hologram-card overflow-hidden p-5">
      <h2 className="mb-4 font-display text-2xl">Membership Manager / মেম্বারশিপ</h2>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left">
          <thead className="text-matrix-blue"><tr><th>User</th><th>Email</th><th>Plan</th><th>Expiry</th><th>Action</th></tr></thead>
          <tbody>
            {users.map((item) => (
              <tr className="border-t border-white/10" key={item.id}>
                <td className="py-3">{item.name || "Matrix User"}</td><td>{item.email}</td><td>{item.plan || "free"}</td>
                <td>
                  <input
                    className="cyber-input min-w-48"
                    type="date"
                    value={expiryByUser[item.id] || ""}
                    onChange={(e) => setExpiryByUser((prev) => ({ ...prev, [item.id]: e.target.value }))}
                    title={item.premiumUntil || "Set expiry date"}
                  />
                </td>
                <td className="flex gap-2 py-2">
                  <button onClick={() => makePremium(item)} className="cyber-button small gold">Upgrade</button>
                  <button onClick={() => setCustomExpiry(item)} className="cyber-button small">Set Expiry</button>
                  <button onClick={() => removePremium(item)} className="cyber-button small blue">Free</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PopupManager({ popups }) {
  const [form, setForm] = useState({ title: "", text: "", enabled: true });
  const [image, setImage] = useState(null);
  const save = async (event) => {
    event.preventDefault();
    let imageURL = "";
    if (image) {
      const fileRef = ref(storage, `popups/${Date.now()}-${image.name}`);
      await uploadBytes(fileRef, image);
      imageURL = await getDownloadURL(fileRef);
    }
    await addDoc(collection(db, "popups"), { ...form, imageURL, createdAt: serverTimestamp() });
    setForm({ title: "", text: "", enabled: true });
  };
  return (
    <div className="hologram-card p-5">
      <h2 className="font-display text-2xl">Popup Manager / ঘোষণা পপআপ</h2>
      <form onSubmit={save} className="mt-4 grid gap-3">
        <input className="cyber-input" placeholder="Popup title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <textarea className="cyber-input" placeholder="Popup text / বাংলা + English" value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} />
        <FileInput label="Popup image" onChange={setImage} icon={ImagePlus} />
        <Toggle label="Enable popup" checked={form.enabled} onChange={(value) => setForm({ ...form, enabled: value })} />
        <button className="cyber-button"><Bell size={18} /> Create Popup</button>
      </form>
      <div className="mt-5 grid gap-3">
        {popups.map((popup) => (
          <div className="flex items-center justify-between rounded border border-white/10 bg-white/5 p-3" key={popup.id}>
            <span>{popup.title || popup.text}</span>
            <div className="flex gap-2">
              <button onClick={() => updateDoc(doc(db, "popups", popup.id), { enabled: !popup.enabled })} className="icon-button"><Eye size={16} /></button>
              <button onClick={() => deleteDoc(doc(db, "popups", popup.id))} className="icon-button danger"><Trash2 size={16} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SettingsManager() {
  const [form, setForm] = useState({
    title: "TOOL MATRIX",
    hero: "Explore The Future Tools",
    footer: "সকল প্রয়োজনীয় টুলস এক জায়গায়",
    neonRed: "#ff173f",
    electricBlue: "#00e7ff",
    premiumPrice: "199 BDT",
    premiumDuration: "3 Months",
  });
  const [logo, setLogo] = useState(null);
  const [banner, setBanner] = useState(null);
  const [message, setMessage] = useState("");
  useEffect(() => {
    getDoc(doc(db, "settings", "site")).then((snap) => {
      if (snap.exists()) setForm((prev) => ({ ...prev, ...snap.data() }));
    });
  }, []);
  const save = async (event) => {
    event.preventDefault();
    let logoURL = form.logoURL || "";
    let bannerURL = form.bannerURL || "";
    if (logo) {
      const logoRef = ref(storage, `banners/${Date.now()}-${logo.name}`);
      await uploadBytes(logoRef, logo);
      logoURL = await getDownloadURL(logoRef);
    }
    if (banner) {
      const bannerRef = ref(storage, `banners/${Date.now()}-${banner.name}`);
      await uploadBytes(bannerRef, banner);
      bannerURL = await getDownloadURL(bannerRef);
    }
    await setDoc(doc(db, "settings", "site"), { ...form, logoURL, bannerURL, updatedAt: serverTimestamp() }, { merge: true });
    setMessage("Website settings saved / সেটিংস আপডেট হয়েছে");
  };
  return (
    <form onSubmit={save} className="hologram-card space-y-4 p-5">
      <h2 className="font-display text-2xl">Website Settings / ওয়েবসাইট কাস্টমাইজ</h2>
      <input className="cyber-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Website title" />
      <input className="cyber-input" value={form.hero} onChange={(e) => setForm({ ...form, hero: e.target.value })} placeholder="Hero text" />
      <input className="cyber-input" value={form.footer} onChange={(e) => setForm({ ...form, footer: e.target.value })} placeholder="Footer text" />
      <div className="grid gap-4 md:grid-cols-2">
        <input className="cyber-input" value={form.neonRed} onChange={(e) => setForm({ ...form, neonRed: e.target.value })} placeholder="Neon red color" />
        <input className="cyber-input" value={form.electricBlue} onChange={(e) => setForm({ ...form, electricBlue: e.target.value })} placeholder="Electric blue color" />
        <input className="cyber-input" value={form.premiumPrice} onChange={(e) => setForm({ ...form, premiumPrice: e.target.value })} placeholder="Premium price" />
        <input className="cyber-input" value={form.premiumDuration} onChange={(e) => setForm({ ...form, premiumDuration: e.target.value })} placeholder="Premium duration" />
        <FileInput label="Upload Logo" onChange={setLogo} icon={ImagePlus} />
        <FileInput label="Homepage Banner" onChange={setBanner} icon={ImagePlus} />
      </div>
      <button className="cyber-button"><Settings size={18} /> Save Settings</button>
      {message && <p className="text-matrix-blue">{message}</p>}
    </form>
  );
}

function Footer({ settings }) {
  return (
    <footer className="border-t border-matrix-red/20 px-4 py-10">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 text-white/55">
        <p className="font-display text-white">TOOL <span className="text-matrix-red">MATRIX</span></p>
        <p>{settings.footer || "সকল প্রয়োজনীয় টুলস এক জায়গায়"} / Ultimate AI & Utility Tools Platform</p>
        <p>Free tools, premium access, realtime Firebase marketplace</p>
      </div>
    </footer>
  );
}

function BackgroundFX() {
  return (
    <>
      <canvas ref={useMatrixRain()} className="pointer-events-none fixed inset-0 z-0 opacity-30" />
      <div className="particles" />
    </>
  );
}

function useMatrixRain() {
  const canvasRef = React.useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);
    const letters = "TOOLMATRIX০১২৩৪৫৬৭৮৯AIUTILITY";
    const columns = Math.floor(width / 18);
    const drops = Array.from({ length: columns }, () => Math.random() * height);
    let frame;
    const draw = () => {
      ctx.fillStyle = "rgba(5,0,6,.12)";
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = "#ff173f";
      ctx.font = "16px monospace";
      drops.forEach((drop, i) => {
        const text = letters[Math.floor(Math.random() * letters.length)];
        ctx.fillText(text, i * 18, drop);
        drops[i] = drop > height + Math.random() * 1000 ? 0 : drop + 18;
      });
      frame = requestAnimationFrame(draw);
    };
    const resize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", resize);
    draw();
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
    };
  }, []);
  return canvasRef;
}

function Scanlines() {
  return <div className="pointer-events-none fixed inset-0 z-30 scanlines" />;
}

function MouseGlow() {
  useEffect(() => {
    const root = document.documentElement;
    const move = (event) => {
      root.style.setProperty("--mx", `${event.clientX}px`);
      root.style.setProperty("--my", `${event.clientY}px`);
    };
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, []);
  return <div className="pointer-events-none fixed inset-0 z-10 mouse-glow" />;
}

createRoot(document.getElementById("root")).render(<App />);
