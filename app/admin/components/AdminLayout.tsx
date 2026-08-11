"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FiLogOut,
  FiHome,
  FiGrid,
  FiBook,
  FiUsers,
  FiMessageSquare,
  FiMenu,
  FiX,
  FiSearch,
  FiBell,
  FiSettings,
} from "react-icons/fi";
import { logout } from "@/app/actions/auth";

const navItems = [
  { id: "overview", label: "Overview", icon: FiGrid, href: "/admin" },
  { id: "programs", label: "Manage Learning", icon: FiBook, href: "/admin/programs" },
  { id: "requests", label: "Teacher Requests", icon: FiMessageSquare, href: "/admin/requests" },
  { id: "teachers", label: "Teacher Applications", icon: FiUsers, href: "/admin/teachers" },
  { id: "settings", label: "Settings", icon: FiSettings, href: "/admin/settings" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const isLoginPage = pathname === "/admin/login";

  if (isLoginPage) {
    return (
      <div className="min-h-screen bg-[#F8FAFC]">
        <main>
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 transform bg-[#0F172A] text-white transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-20 items-center gap-3 px-8 border-b border-slate-800">
          <img src="/logo.png" alt="Wecoach Academy" className="size-9 rounded-lg" />
          <span className="text-xl font-bold tracking-tight">Wecoach Academy <span className="text-[#E91E63]">Admin</span></span>
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
          <form action={logout}>
            <button className="flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-semibold text-slate-400 transition hover:bg-rose-500/10 hover:text-rose-500">
              <FiLogOut className="size-5" />
              Sign Out
            </button>
          </form>
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
            <div className="hidden sm:flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-xl text-slate-500">
              <FiSearch className="size-4" />
              <input type="text" placeholder="Search..." className="bg-transparent border-none outline-none text-sm w-64" />
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
            <button className="p-2 text-slate-400 hover:text-slate-600 relative">
              <FiBell className="size-5" />
              <span className="absolute top-2 right-2 size-2 bg-rose-500 rounded-full border-2 border-white" />
            </button>
            <div className="size-10 rounded-full bg-gradient-to-tr from-[#FF5733] to-[#E91E63] border-2 border-white shadow-sm" />
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8">
          {children}
        </main>
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
    </div>
  );
}
