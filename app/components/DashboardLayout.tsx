"use client";

import { useState, createContext, useContext, ReactNode, useEffect } from "react";
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
}

interface User {
  name: string;
  role: string;
  email: string;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning";
  time: string;
  read: boolean;
}

interface DashboardLayoutProps {
  children: ReactNode;
  navItems: NavItem[];
  user: User;
  title: string;
}

export default function DashboardLayout({
  children,
  navItems,
  user,
  title,
}: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: "1",
      title: "Welcome!",
      message: `Welcome to your ${user.role.toLowerCase()} dashboard, ${user.name}.`,
      type: "success",
      time: "Just now",
      read: false,
    },
    {
      id: "2",
      title: "System Update",
      message: "The platform has been updated with new responsive features.",
      type: "info",
      time: "2 hours ago",
      read: false,
    }
  ]);

  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
    router.refresh();
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 transform bg-[#0F172A] text-white transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-20 items-center gap-3 px-8 border-b border-slate-800">
          <img src="/logo.png" alt="Wecoach Academy" className="size-9 rounded-lg" />
          <span className="text-xl font-bold tracking-tight">
            Wecoach <span className="text-[#E91E63]">Academy</span>
          </span>
        </div>

        <div className="px-6 py-4 border-b border-slate-800 lg:hidden">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">User</p>
            <div className="flex items-center gap-3">
                <div className="size-8 rounded-full bg-gradient-to-tr from-[#FF5733] to-[#E91E63] border border-white/20" />
                <div className="overflow-hidden">
                    <p className="text-sm font-bold truncate">{user.name}</p>
                    <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
                </div>
            </div>
        </div>

        <nav className="mt-8 px-4 space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-semibold transition-all ${
                  isActive
                    ? "bg-[#E91E63] text-white shadow-lg shadow-rose-500/20"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <item.icon className="size-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-8 w-full px-4">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-semibold text-slate-400 transition hover:bg-rose-500/10 hover:text-rose-500"
          >
            <FiLogOut className="size-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:pl-72">
        {/* Topbar */}
        <header className="sticky top-0 z-40 h-20 border-b border-slate-200 bg-white/80 backdrop-blur-md px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              <FiMenu className="size-6" />
            </button>
            <h1 className="text-lg font-bold text-slate-800 hidden md:block">{title}</h1>
            <div className="hidden sm:flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-xl text-slate-500 ml-4">
              <FiSearch className="size-4" />
              <input
                type="text"
                placeholder="Search..."
                className="bg-transparent border-none outline-none text-sm w-48 lg:w-64"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="hidden sm:flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-[#E91E63] transition-colors"
            >
              <FiHome className="size-4" />
              Live Site
            </Link>
            
            <div className="relative">
                <button 
                    onClick={() => setNotificationsOpen(!notificationsOpen)}
                    className="p-2 text-slate-400 hover:text-slate-600 relative"
                >
                    <FiBell className="size-5" />
                    {unreadCount > 0 && (
                        <span className="absolute top-2 right-2 size-2 bg-rose-500 rounded-full border-2 border-white" />
                    )}
                </button>

                {notificationsOpen && (
                    <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-white shadow-xl border border-slate-100 overflow-hidden z-50">
                        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <h3 className="font-bold text-slate-800 text-sm">Notifications</h3>
                            <button 
                                onClick={markAllRead}
                                className="text-[10px] font-bold text-[#E91E63] hover:underline"
                            >
                                Mark all as read
                            </button>
                        </div>
                        <div className="max-h-96 overflow-y-auto">
                            {notifications.length > 0 ? (
                                notifications.map(notification => (
                                    <div 
                                        key={notification.id}
                                        className={`p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors ${!notification.read ? 'bg-rose-50/30' : ''}`}
                                    >
                                        <div className="flex gap-3">
                                            <div className={`mt-0.5 size-8 rounded-full flex items-center justify-center shrink-0 ${
                                                notification.type === 'success' ? 'bg-green-100 text-green-600' :
                                                notification.type === 'warning' ? 'bg-amber-100 text-amber-600' :
                                                'bg-blue-100 text-blue-600'
                                            }`}>
                                                {notification.type === 'success' ? <FiCheckCircle /> :
                                                 notification.type === 'warning' ? <FiAlertCircle /> :
                                                 <FiInfo />}
                                            </div>
                                            <div>
                                                <h4 className="text-xs font-bold text-slate-800">{notification.title}</h4>
                                                <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-2">{notification.message}</p>
                                                <span className="text-[9px] text-slate-400 mt-1 block">{notification.time}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-8 text-center text-slate-400 text-xs">
                                    No notifications
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <div className="hidden md:flex flex-col items-end mr-2">
              <span className="text-sm font-bold text-slate-800 leading-tight">{user.name}</span>
              <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">{user.role}</span>
            </div>
            <div className="size-10 rounded-full bg-gradient-to-tr from-[#FF5733] to-[#E91E63] border-2 border-white shadow-sm" />
          </div>
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
