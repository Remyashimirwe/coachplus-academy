"use client";

import { useState, useEffect, ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  FiLogOut,
  FiHome,
  FiMenu,
  FiX,
  FiSearch,
  FiBell,
  FiCheckCircle,
  FiInfo,
  FiAlertCircle,
} from "react-icons/fi";
import { IconType } from "react-icons";
import { logout } from "@/app/actions/auth";

interface NavItem {
  id: string;
  label: string;
  icon: IconType;
  href: string;
  section?: string;
  badge?: number;
}

interface User {
  name: string;
  role: string;
  email: string;
  image?: string | null;
}

function Avatar({ user, className }: { user: User; className: string }) {
  const [error, setError] = useState(false);
  if (user.image && !error) {
    return <img src={user.image} alt={user.name} onError={() => setError(true)} className={`${className} object-cover`} />;
  }
  return <span className={`${className} flex items-center justify-center`}>{user.name.charAt(0).toUpperCase()}</span>;
}

interface Notification {
  id: number;
  title: string;
  message: string;
  type: "info" | "success" | "warning";
  createdAt: string;
  read: boolean;
}

function notificationTime(createdAt: string): string {
  const diff = Date.now() - new Date(createdAt).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

interface DashboardLayoutProps {
  children: ReactNode;
  navItems: NavItem[];
  user: User;
  title?: string;
  fallbackTitle?: string;
}

function NavLink({ item, pathname, onClick }: { item: NavItem; pathname: string; onClick: () => void }) {
  const isActive = pathname === item.href;
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={`group relative flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
        isActive
          ? "bg-white text-slate-900 shadow-lg shadow-black/20"
          : "text-slate-400 hover:bg-slate-800 hover:text-white"
      }`}
    >
      <span
        className={`absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-slate-900 transition-all ${
          isActive ? "opacity-100" : "opacity-0 group-hover:opacity-40"
        }`}
      />
      <item.icon className="size-5 shrink-0" />
      <span className="truncate">{item.label}</span>
      {!!item.badge && (
        <span className="ml-auto shrink-0 min-w-5 h-5 px-1.5 rounded-full bg-white text-[#0F172A] text-[10px] font-black flex items-center justify-center">
          {item.badge}
        </span>
      )}
    </Link>
  );
}

export default function DashboardLayout({
  children,
  navItems,
  user,
  title,
  fallbackTitle,
}: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const pathname = usePathname();
  const router = useRouter();

  const [freshUser, setFreshUser] = useState<User | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch("/api/account");
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) setFreshUser(data);
        }
      } catch {
        // fall back to the server-rendered user prop
      }
    };
    load();
    const onAccountUpdated = () => load();
    window.addEventListener("account:updated", onAccountUpdated);
    return () => {
      cancelled = true;
      window.removeEventListener("account:updated", onAccountUpdated);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch("/api/notifications");
        if (res.ok) {
          const data = await res.json();
          if (!cancelled && data) {
            setNotifications(Array.isArray(data.notifications) ? data.notifications : []);
            setUnreadCount(data.unreadCount || 0);
          }
        }
      } catch {
        // ignore, notifications are non-critical
      }
    };
    load();
    const interval = setInterval(load, 30000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const displayUser = freshUser ?? user;

  const currentNavItem = navItems.find((item) => item.href === pathname);
  const resolvedTitle = title ?? currentNavItem?.label ?? fallbackTitle ?? "Dashboard";

  const handleLogout = async () => {
    const isLoginPage = pathname.startsWith("/admin");
    await logout();
    if (isLoginPage) {
      router.push("/admin/login");
    } else {
      router.push("/login");
    }
    router.refresh();
  };

  const markAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    try {
      await fetch("/api/notifications/read", { method: "POST" });
    } catch {
      // ignore
    }
  };

  const requestBrowserPermission = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      try {
        new Notification("CoachPlus Academy", { body: "You will now receive updates here." });
      } catch {
        // some browsers require a service worker; ignore
      }
    }
  };

  const notificationPermission = typeof window !== "undefined" && "Notification" in window ? Notification.permission : "unsupported";
  const canPromptNotifications = notificationPermission === "default" || notificationPermission === "denied";

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col transform bg-[#0F172A] text-white transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-20 shrink-0 items-center gap-3 px-8 border-b border-slate-800">
          <img src="/logo.png" alt="CoachPlus Academy" className="size-9 rounded-lg" />
          <span className="text-xl font-bold tracking-tight">
            CoachPlus <span className="text-white">Academy</span>
          </span>
        </div>

        <div className="px-6 py-5 border-b border-slate-800 shrink-0">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2.5">Signed in as</p>
            <div className="flex items-center gap-3">
                <Avatar user={displayUser} className="size-10 rounded-full bg-white text-slate-900 border border-white/20 font-black text-sm shrink-0" />
                <div className="overflow-hidden min-w-0">
                    <p className="text-sm font-bold truncate">{displayUser.name}</p>
                    <p className="text-[10px] text-slate-400 truncate">{displayUser.email}</p>
                </div>
            </div>
            <span className="mt-3 inline-block rounded-full bg-slate-800 text-slate-300 text-[9px] font-black uppercase tracking-widest px-2.5 py-1">
                {displayUser.role}
            </span>
        </div>

        <nav className="flex-1 min-h-0 overflow-y-auto mt-6 px-4 space-y-5 pb-4">
          {(() => {
            const hasSections = navItems.some((item) => !!item.section);
            if (!hasSections) {
              return (
                <div className="space-y-1">
                  {navItems.map((item) => (
                    <NavLink key={item.id} item={item} pathname={pathname} onClick={() => setSidebarOpen(false)} />
                  ))}
                </div>
              );
            }
            const groups: { section: string; items: NavItem[] }[] = [];
            navItems.forEach((item) => {
              const section = item.section || "General";
              let group = groups.find((g) => g.section === section);
              if (!group) {
                group = { section, items: [] };
                groups.push(group);
              }
              group.items.push(item);
            });
            return groups.map((group) => (
              <div key={group.section}>
                <p className="px-4 mb-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500">{group.section}</p>
                <div className="space-y-1">
                  {group.items.map((item) => (
                    <NavLink key={item.id} item={item} pathname={pathname} onClick={() => setSidebarOpen(false)} />
                  ))}
                </div>
              </div>
            ));
          })()}
        </nav>

        <div className="shrink-0 border-t border-slate-800 w-full px-4 py-4 space-y-2">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-semibold text-slate-400 transition hover:bg-slate-800 hover:text-white"
          >
            <FiLogOut className="size-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:pl-72">
        {/* Topbar */}
        <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/85 backdrop-blur-md">
          <div className="h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                <FiMenu className="size-6" />
              </button>
              <div className="min-w-0">
                <h1 className="text-lg font-bold text-slate-900 truncate leading-tight">{resolvedTitle}</h1>
                <p className="text-[11px] font-medium text-slate-400 truncate">CoachPlus Academy · {user.role} portal</p>
              </div>
              <div className="hidden lg:flex items-center gap-2 ml-4 bg-slate-100 hover:bg-slate-200/60 focus-within:bg-white border border-transparent focus-within:border-slate-400/50 focus-within:ring-2 focus-within:ring-slate-400/10 px-3.5 py-2 rounded-xl text-slate-500 transition-all">
                <FiSearch className="size-4 shrink-0" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="bg-transparent border-none outline-none text-sm w-64 placeholder:text-slate-400"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <Link
                href="/"
                className="hidden sm:flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 px-3 py-2 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <FiHome className="size-4" />
                Live Site
              </Link>

              <div className="hidden sm:block h-6 w-px bg-slate-200" />

              <div className="relative">
                <button
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className="p-2.5 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors relative"
                >
                  <FiBell className="size-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 size-2 bg-slate-900 rounded-full border-2 border-white" />
                  )}
                </button>

                {notificationsOpen && (
                  <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-white shadow-xl border border-slate-100 overflow-hidden z-50">
                    <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                      <h3 className="font-bold text-slate-800 text-sm">Notifications</h3>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllRead}
                          className="text-[10px] font-bold text-slate-700 hover:underline"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>
                    {canPromptNotifications && (
                      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex items-center gap-3">
                        <FiBell className="size-4 text-slate-700 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-bold text-slate-900">
                            {notificationPermission === "denied"
                              ? "Notifications are blocked in your browser."
                              : "Stay updated with browser notifications."}
                          </p>
                          <p className="text-[10px] text-slate-600 mt-0.5">
                            {notificationPermission === "denied"
                              ? "Enable them in your browser site settings, or manage in Settings."
                              : "Allow them to get notified when something changes."}
                          </p>
                        </div>
                        <button
                          onClick={requestBrowserPermission}
                          className="shrink-0 rounded-lg bg-slate-900 px-3 py-1.5 text-[10px] font-bold text-white hover:bg-black transition-colors"
                        >
                          Allow
                        </button>
                      </div>
                    )}
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length > 0 ? (
                        notifications.map((notification) => (
                          <div
                            key={notification.id}
                            className={`p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors ${!notification.read ? "bg-slate-50/60" : ""}`}
                          >
                            <div className="flex gap-3">
                              <div className={`mt-0.5 size-8 rounded-full flex items-center justify-center shrink-0 bg-slate-100 text-slate-700`}>
                                {notification.type === "success" ? <FiCheckCircle className="size-4" /> :
                                 notification.type === "warning" ? <FiAlertCircle className="size-4" /> :
                                 <FiInfo className="size-4" />}
                              </div>
                              <div>
                                <h4 className="text-xs font-bold text-slate-800">{notification.title}</h4>
                                <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-2">{notification.message}</p>
                                <span className="text-[9px] text-slate-400 mt-1 block">{notificationTime(notification.createdAt)}</span>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-8 text-center text-slate-400 text-xs">No notifications</div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2.5 pl-1.5 pr-2 py-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-default">
                <Avatar user={displayUser} className="size-9 rounded-full bg-slate-900 text-white border-2 border-slate-100 shadow-sm text-sm font-black shrink-0" />
                <div className="hidden md:flex flex-col items-start leading-tight">
                  <span className="text-sm font-bold text-slate-800">{displayUser.name}</span>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{displayUser.role}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="h-0.5 bg-slate-900" />
        </header>

        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
          <button
            onClick={() => setSidebarOpen(false)}
            className="fixed top-4 right-4 z-50 p-2 text-white hover:bg-white/10 rounded-lg lg:hidden"
          >
            <FiX className="size-6" />
          </button>
        </>
      )}

      {/* Click outside to close notifications */}
      {notificationsOpen && (
          <div 
            className="fixed inset-0 z-30" 
            onClick={() => setNotificationsOpen(false)} 
          />
      )}
    </div>
  );
}
