"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LogIn, Play, Sparkles, UploadCloud } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const router = useRouter();
  const { user, loading, signInWithGoogle } = useAuth();

  useEffect(() => {
    if (!loading && user) router.replace("/dashboard");
  }, [loading, router, user]);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="surface-grid flex min-h-screen items-center justify-center px-5 py-10">
        <div className="grid w-full max-w-6xl overflow-hidden rounded-[28px] border border-border bg-card shadow-glow md:grid-cols-[1.08fr_0.92fr]">
          <div className="flex min-h-[560px] flex-col justify-between p-8 sm:p-10 lg:p-12">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                <Play className="h-5 w-5 fill-current" />
              </div>
              <div>
                <p className="text-lg font-semibold tracking-tight">TubeFlow AI</p>
                <p className="text-sm text-muted-foreground">Drive to YouTube automation</p>
              </div>
            </div>

            <div className="max-w-xl animate-fade-up">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-1 text-sm text-muted-foreground">
                <Sparkles className="h-4 w-4 text-primary" />
                Built for free-tier infrastructure
              </div>
              <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
                Upload every video in the right order.
              </h1>
              <p className="mt-5 max-w-lg text-base leading-7 text-muted-foreground sm:text-lg">
                Connect Google Drive, queue videos, generate SEO metadata, and publish to YouTube with a simple cron endpoint.
              </p>
              <Button
                className="mt-8 h-12 px-5 text-base"
                onClick={signInWithGoogle}
                disabled={loading}
              >
                <LogIn className="h-5 w-5" />
                Continue with Google
              </Button>
            </div>

            <div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
              <span>Firebase Auth</span>
              <span>Firestore queue</span>
              <span>Gemini metadata</span>
            </div>
          </div>

          <div className="hidden border-l border-border bg-muted/40 p-8 md:block">
            <div className="flex h-full flex-col justify-between rounded-[24px] border border-border bg-background p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Current batch</p>
                  <p className="text-2xl font-semibold">24 videos</p>
                </div>
                <div className="rounded-2xl bg-accent p-3 text-accent-foreground">
                  <UploadCloud className="h-6 w-6" />
                </div>
              </div>
              <div className="space-y-4">
                {["intro-masterclass.mp4", "feature-walkthrough.webm", "customer-story.mov"].map((item, index) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-border bg-card p-4"
                    style={{ animationDelay: `${index * 90}ms` }}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{item}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {index === 0 ? "Uploading now" : index === 1 ? "Metadata ready" : "Pending"}
                        </p>
                      </div>
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-primary" />
                    </div>
                  </div>
                ))}
              </div>
              <div className="rounded-2xl bg-primary p-5 text-primary-foreground">
                <p className="text-sm opacity-80">Next cron run</p>
                <p className="mt-1 text-3xl font-semibold">04:58</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
