"use client";

import { useEffect, useState } from "react";
import { FiBell, FiBellOff, FiCheckCircle, FiLoader, FiSend } from "react-icons/fi";

type Permission = "default" | "granted" | "denied" | "unsupported";

export default function NotificationSettings() {
  const [permission, setPermission] = useState<Permission>("unsupported");
  const [requesting, setRequesting] = useState(false);
  const [testStatus, setTestStatus] = useState<{ success: boolean; text: string } | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    const update = () => setPermission(Notification.permission as Permission);
    const timeout = window.setTimeout(update, 0);
    return () => window.clearTimeout(timeout);
  }, []);

  const requestPermission = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    setRequesting(true);
    try {
      const result = await Notification.requestPermission();
      setPermission(result as Permission);
      if (result === "granted") {
        setTestStatus({ success: true, text: "Notifications are enabled." });
      } else {
        setTestStatus({ success: false, text: "Notifications are still blocked." });
      }
    } finally {
      setRequesting(false);
    }
  };

  const sendTest = async () => {
    if (permission !== "granted") return;
    try {
      new Notification("CoachPlus Academy", {
        body: "This is a test notification. You are all set!",
        icon: "/logo.png",
      });
      setTestStatus({ success: true, text: "Test notification sent." });
    } catch {
      setTestStatus({ success: false, text: "Could not send a test notification on this browser." });
    }
  };

  const granted = permission === "granted";
  const denied = permission === "denied";
  const unsupported = permission === "unsupported";

  return (
    <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-slate-100">
        <h2 className="font-bold text-slate-800 flex items-center gap-2">
          <FiBell className="size-4 text-slate-400" /> Notifications
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Get browser alerts when something happens on the platform.
        </p>
      </div>
      <div className="p-5">
        {unsupported ? (
          <p className="text-sm text-slate-500">Your browser does not support notifications. You can still use the in-app notification bell.</p>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                {granted ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 text-emerald-700 px-3 py-1 text-xs font-bold">
                    <FiCheckCircle className="size-3.5" /> Enabled
                  </span>
                ) : denied ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-100 text-rose-700 px-3 py-1 text-xs font-bold">
                    <FiBellOff className="size-3.5" /> Blocked
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 text-amber-700 px-3 py-1 text-xs font-bold">
                    <FiBell className="size-3.5" /> Not allowed yet
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                {denied
                  ? "Notifications are blocked in your browser. Click the lock icon in your browser&apos;s address bar and allow notifications for this site, then press “Check again” below."
                  : granted
                  ? "You will receive browser notifications when attendance or other activity is recorded."
                  : "Allow notifications to get alerted when attendance or other activity is recorded."}
              </p>
            </div>
            <div className="flex flex-col gap-2 shrink-0">
              <button
                onClick={requestPermission}
                disabled={requesting}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#E91E63] px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-rose-500/20 hover:bg-[#7B1FA2] transition-all disabled:opacity-50"
              >
                {requesting ? <FiLoader className="size-4 animate-spin" /> : <FiBell className="size-4" />}
                {denied ? "Request Again" : granted ? "Check again" : "Allow Notifications"}
              </button>
              {granted && (
                <button
                  onClick={sendTest}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-600 hover:border-slate-300 transition-all"
                >
                  <FiSend className="size-4" /> Send Test
                </button>
              )}
            </div>
          </div>
        )}
        {testStatus && (
          <p className={`mt-3 text-xs font-bold flex items-center gap-1.5 ${testStatus.success ? "text-emerald-600" : "text-rose-600"}`}>
            {testStatus.success ? <FiCheckCircle /> : <FiBellOff />}
            {testStatus.text}
          </p>
        )}
      </div>
    </div>
  );
}