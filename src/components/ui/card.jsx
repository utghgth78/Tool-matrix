import React from "react";
import { cn } from "../../lib/utils";

export function Card({ className, ...props }) {
  return <div className={cn("hologram-card", className)} {...props} />;
}

export function CardHeader({ className, ...props }) {
  return <div className={cn("mb-4", className)} {...props} />;
}

export function CardContent({ className, ...props }) {
  return <div className={cn("space-y-4", className)} {...props} />;
}
