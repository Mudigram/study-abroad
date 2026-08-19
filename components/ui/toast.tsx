"use client";

import * as React from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  type?: "success" | "error" | "info";
}

type ToastContextType = {
  toast: (message: Omit<ToastMessage, "id">) => void;
};

const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastMessage[]>([]);

  const toast = React.useCallback(({ title, description, type = "success" }: Omit<ToastMessage, "id">) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, title, description, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}

      {/* Floating Toast Notification Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "pointer-events-auto flex items-start gap-3 rounded-2xl border-2 p-4 shadow-xl transition-all duration-300 animate-in slide-in-from-bottom-5 fade-in-50",
              t.type === "success" && "border-emerald-300 bg-emerald-50 text-slate-950 shadow-emerald-950/10",
              t.type === "error" && "border-rose-300 bg-rose-50 text-slate-950 shadow-rose-950/10",
              t.type === "info" && "border-indigo-300 bg-indigo-50 text-slate-950 shadow-indigo-950/10",
            )}
          >
            <div className="mt-0.5 shrink-0">
              {t.type === "success" && <CheckCircle2 className="h-5 w-5 text-emerald-600" />}
              {t.type === "error" && <AlertCircle className="h-5 w-5 text-rose-600" />}
              {t.type === "info" && <Info className="h-5 w-5 text-indigo-600" />}
            </div>

            <div className="flex-1 space-y-0.5">
              <h4 className="font-heading text-xs font-black text-slate-900">{t.title}</h4>
              {t.description && (
                <p className="text-[11px] font-bold text-slate-600 leading-snug">{t.description}</p>
              )}
            </div>

            <button
              onClick={() => removeToast(t.id)}
              className="rounded-full p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-800 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
