"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FiCheckCircle, FiAlertCircle, FiInfo, FiX } from "react-icons/fi";

type ToastKind = "success" | "error" | "info";

type Toast = { id: number; kind: ToastKind; message: string };

export type ToastApi = {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
};

const ToastContext = createContext<ToastApi | null>(null);

/**
 * Global feedback for actions taken anywhere on the site.
 *
 * The dashboards previously updated their lists optimistically and then went
 * quiet: a successful approval simply removed the row, and a failure only
 * surfaced as a message scoped to whichever row you happened to be looking
 * at. This gives every action the same, visible outcome — the app's own
 * snackbars are the counterpart on mobile — so a user never has to guess
 * whether an action landed.
 *
 * Access it with `const toast = useToast()` then `toast.success(...)`,
 * `toast.error(...)` or `toast.info(...)`.
 */
export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a <ToastProvider>.");
  }
  return ctx;
}

const STYLES: Record<ToastKind, { icon: typeof FiInfo; color: string; ring: string }> = {
  success: { icon: FiCheckCircle, color: "text-emerald-600", ring: "border-emerald-200" },
  error: { icon: FiAlertCircle, color: "text-rose-600", ring: "border-rose-200" },
  info: { icon: FiInfo, color: "text-slate-600", ring: "border-slate-200" },
};

/** Errors linger longer than confirmations — they usually need reading twice. */
const DURATION_MS: Record<ToastKind, number> = {
  success: 3500,
  info: 3500,
  error: 6000,
};

export default function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (kind: ToastKind, message: string) => {
      const id = ++nextId.current;
      setToasts((prev) => [...prev.slice(-2), { id, kind, message }]);
      setTimeout(() => dismiss(id), DURATION_MS[kind]);
    },
    [dismiss]
  );

  const api = useMemo<ToastApi>(
    () => ({
      success: (m) => push("success", m),
      error: (m) => push("error", m),
      info: (m) => push("info", m),
    }),
    [push]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      {/* Polite live region so screen readers announce new feedback without
          interrupting whatever the user is doing. */}
      <div
        aria-live="polite"
        role="status"
        className="fixed bottom-4 right-4 z-[100] flex w-[min(22rem,calc(100vw-2rem))] flex-col gap-2"
      >
        <AnimatePresence initial={false}>
          {toasts.map((toast) => {
            const { icon: Icon, color, ring } = STYLES[toast.kind];
            return (
              <motion.div
                key={toast.id}
                layout
                initial={{ opacity: 0, y: 16, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.97 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className={`flex items-start gap-3 rounded-2xl border ${ring} bg-white p-3.5 shadow-xl shadow-slate-900/10`}
              >
                <Icon className={`mt-0.5 size-4 shrink-0 ${color}`} />
                <p className="flex-1 text-[13px] font-medium leading-snug text-slate-700">
                  {toast.message}
                </p>
                <button
                  onClick={() => dismiss(toast.id)}
                  aria-label="Dismiss notification"
                  className="-mr-1 shrink-0 rounded-lg p-1 text-slate-300 transition-colors hover:bg-slate-100 hover:text-slate-500"
                >
                  <FiX className="size-3.5" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
