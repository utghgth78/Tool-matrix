"use client";

import { Languages } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export function LanguageToggle() {
  const { language, setLanguage, t } = useLanguage();

  return (
    <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 p-1">
      <Languages className="ml-2 h-4 w-4 text-matrix-cyan" aria-hidden />
      <span className="sr-only">{t.language}</span>
      {(["en", "bn"] as const).map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => setLanguage(item)}
          className={`rounded-full px-3 py-1 text-sm font-semibold transition ${
            language === item
              ? "bg-matrix-pink text-white shadow-pink"
              : "text-white/65 hover:bg-white/10 hover:text-white"
          }`}
        >
          {item.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
