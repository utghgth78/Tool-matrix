"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { CheckCircle2, Info, X, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

type Toast = {
  id: string;
  title: string;
  description?: string;
  type?: "success" | "error" | "info";
};

type ToastContextValue = {
  notify: (toast: Omit<Toast, "id">) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const notify = useCallback((toast: Omit<Toast, "id">) => {
    const id = crypto.randomUUID();
    setToasts((current) => [...current, { ...toast, id }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id));
    }, 4200);
  }, []);

  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed right-4 top-4 z-50 flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-3">
        {toasts.map((toast) => {
          const Icon = toast.type === "error" ? XCircle : toast.type === "success" ? CheckCircle2 : Info;

          return (
            <div key={toast.id} className="rounded-lg border border-border bg-card p-4 shadow-lg">
              <div className="flex gap-3">
                <Icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{toast.title}</p>
                  {toast.description ? <p className="mt-1 text-sm text-muted-foreground">{toast.description}</p> : null}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="-mr-2 -mt-2 h-8 w-8"
                  aria-label="Dismiss notification"
                  onClick={() => setToasts((current) => current.filter((item) => item.id !== toast.id))}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider");
  return context;
}
