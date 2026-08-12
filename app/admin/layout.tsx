"use client";

import { ReactNode, useEffect, useState } from "react";
import AdminLayoutComponent from "./components/AdminLayout";
import { getSession } from "@/app/lib/auth";
import { usePathname, useRouter } from "next/navigation";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (pathname === "/admin/login") {
      setLoading(false);
      return;
    }

    getSession().then((session) => {
      if (session) {
        if (session.user.role !== "ADMIN") {
          router.push("/admin/login");
        } else {
          setUser(session.user);
        }
      } else {
        router.push("/admin/login");
      }
      setLoading(false);
    });
  }, [router, pathname]);

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="size-12 border-4 border-[#E91E63]/20 border-t-[#E91E63] rounded-full animate-spin" />
      </div>
    );
  }

  if (!user && pathname !== "/admin/login") {
    return null; 
  }

  return <AdminLayoutComponent user={user}>{children}</AdminLayoutComponent>;
}
