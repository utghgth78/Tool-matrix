"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import {
  Clock3,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Settings,
  Sun,
  UploadCloud,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/queue", label: "Upload Queue", icon: Clock3 },
  { href: "/history", label: "Upload History", icon: History },
  { href: "/settings", label: "Settings", icon: Settings }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, router, user]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </main>
    );
  }

  if (!user) return null;

  const sidebar = (
    <aside className="flex h-full w-72 flex-col border-r border-border bg-card">
      <div className="flex h-16 items-center justify-between px-5">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <UploadCloud className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold tracking-tight">TubeFlow AI</p>
            <p className="text-xs text-muted-foreground">Automation studio</p>
          </div>
        </Link>
        <Button className="lg:hidden" size="icon" variant="ghost" onClick={() => setOpen(false)} aria-label="Close menu">
          <X className="h-5 w-5" />
        </Button>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
                active ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-border p-4">
        <div className="mb-3 flex items-center gap-3 rounded-lg bg-muted p-3">
          {user.photoURL ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.photoURL} alt="" className="h-9 w-9 rounded-full" />
          ) : (
            <div className="h-9 w-9 rounded-full bg-primary" />
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{user.displayName || "Creator"}</p>
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          </div>
        </div>
        <Button variant="secondary" className="w-full justify-start" onClick={logout}>
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex">{sidebar}</div>
      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button className="absolute inset-0 bg-black/50" aria-label="Close menu" onClick={() => setOpen(false)} />
          <div className="relative h-full">{sidebar}</div>
        </div>
      ) : null}
      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/85 px-4 backdrop-blur md:px-6">
          <div className="flex items-center gap-3">
            <Button className="lg:hidden" size="icon" variant="ghost" onClick={() => setOpen(true)} aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </Button>
            <div>
              <p className="text-sm text-muted-foreground">Workspace</p>
              <h1 className="text-lg font-semibold tracking-tight">YouTube automation</h1>
            </div>
          </div>
          <Button
            variant="secondary"
            size="icon"
            aria-label="Toggle theme"
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          >
            {resolvedTheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </header>
        <main className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6">{children}</main>
      </div>
    </div>
  );
}
