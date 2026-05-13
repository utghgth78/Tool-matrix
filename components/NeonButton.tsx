"use client";

import { ButtonHTMLAttributes, ReactNode } from "react";
import { clsx } from "clsx";

interface NeonButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost" | "danger";
  children: ReactNode;
}

export function NeonButton({ children, className, variant = "primary", ...props }: NeonButtonProps) {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary" &&
          "bg-gradient-to-r from-matrix-pink to-matrix-cyan text-matrix-ink shadow-neon hover:scale-[1.02]",
        variant === "ghost" &&
          "border border-white/10 bg-white/5 text-white hover:border-matrix-cyan/60 hover:bg-matrix-cyan/10",
        variant === "danger" &&
          "border border-red-400/50 bg-red-500/10 text-red-100 hover:bg-red-500/20",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
