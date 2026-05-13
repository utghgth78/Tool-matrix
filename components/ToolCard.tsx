"use client";

import { useState } from "react";
import { Copy, ExternalLink, FileCode2, LockKeyhole, MousePointerClick } from "lucide-react";
import { doc, increment, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { canAccessTool } from "@/lib/access";
import { Tool, UserProfile } from "@/lib/types";
import { useLanguage } from "@/contexts/LanguageContext";
import { NeonButton } from "@/components/NeonButton";

interface ToolCardProps {
  tool: Tool;
  profile: UserProfile | null;
}

export function ToolCard({ tool, profile }: ToolCardProps) {
  const { t } = useLanguage();
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const allowed = canAccessTool(profile, tool.tier);
  const targetUrl = tool.externalUrl || tool.fileUrl || "";

  const registerUse = async () => {
    await updateDoc(doc(db, "tools", tool.id), {
      usageCount: increment(1)
    });
  };

  const handleOpen = async () => {
    if (!allowed) {
      return;
    }

    registerUse().catch(() => undefined);

    if (tool.type === "snippet" && !tool.redirectOnClick) {
      setExpanded((value) => !value);
      return;
    }

    if (targetUrl) {
      window.open(targetUrl, "_blank", "noopener,noreferrer");
    }
  };

  const copySnippet = async () => {
    if (!tool.codeSnippet) {
      return;
    }

    await navigator.clipboard.writeText(tool.codeSnippet);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <article className="masonry-item neon-border rounded-2xl">
      <div className="glass-panel overflow-hidden rounded-2xl transition duration-200 hover:-translate-y-1">
        <button type="button" onClick={handleOpen} className="group relative block w-full text-left">
          <div className="aspect-[16/10] overflow-hidden bg-gradient-to-br from-matrix-violet via-matrix-panel to-black">
            {tool.thumbnailUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={tool.thumbnailUrl}
                alt=""
                className="h-full w-full object-cover opacity-90 transition duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="grid h-full place-items-center">
                <FileCode2 className="h-16 w-16 text-matrix-cyan/75" aria-hidden />
              </div>
            )}
          </div>
          <div className="absolute left-3 top-3 flex gap-2">
            <span className="rounded-full border border-matrix-pink/50 bg-matrix-pink/20 px-3 py-1 text-xs font-black uppercase text-pink-100">
              {t[tool.tier]}
            </span>
            {tool.categoryName && (
              <span className="rounded-full border border-matrix-cyan/40 bg-matrix-cyan/15 px-3 py-1 text-xs font-bold text-cyan-100">
                {tool.categoryName}
              </span>
            )}
          </div>
          {!allowed && (
            <div className="absolute inset-0 grid place-items-center bg-black/70 backdrop-blur-sm">
              <span className="inline-flex items-center gap-2 rounded-full border border-matrix-pink/50 bg-matrix-pink/15 px-4 py-2 text-sm font-black text-white">
                <LockKeyhole className="h-4 w-4" aria-hidden />
                {t.locked}
              </span>
            </div>
          )}
        </button>

        <div className="space-y-4 p-5">
          <div>
            <h3 className="text-xl font-black text-white">{tool.title}</h3>
            <p className="mt-2 text-sm leading-6 text-white/68">{tool.description}</p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">
              {tool.usageCount || 0} clicks
            </span>
            <NeonButton type="button" onClick={handleOpen} disabled={!allowed}>
              {tool.type === "snippet" && !tool.redirectOnClick ? (
                <FileCode2 className="h-4 w-4" aria-hidden />
              ) : tool.redirectOnClick ? (
                <MousePointerClick className="h-4 w-4" aria-hidden />
              ) : (
                <ExternalLink className="h-4 w-4" aria-hidden />
              )}
              {tool.type === "snippet" && !tool.redirectOnClick ? t.viewSnippet : t.openTool}
            </NeonButton>
          </div>

          {expanded && allowed && tool.codeSnippet && (
            <div className="rounded-xl border border-matrix-cyan/25 bg-black/40">
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-matrix-cyan">{t.snippet}</span>
                <button
                  type="button"
                  onClick={copySnippet}
                  className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1 text-xs font-bold text-white hover:bg-white/15"
                >
                  <Copy className="h-3.5 w-3.5" aria-hidden />
                  {copied ? t.copied : t.copyCode}
                </button>
              </div>
              <pre className="max-h-72 overflow-auto p-4 text-xs leading-6 text-cyan-50">
                <code>{tool.codeSnippet}</code>
              </pre>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
