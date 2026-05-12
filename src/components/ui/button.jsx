import React from "react";
import { cn } from "../../lib/utils";

export function Button({ className, variant = "red", size = "default", ...props }) {
  const variants = {
    red: "cyber-button",
    blue: "cyber-button blue",
    gold: "cyber-button gold",
  };
  const sizes = {
    default: "",
    small: "small",
  };

  return <button className={cn(variants[variant], sizes[size], className)} {...props} />;
}
