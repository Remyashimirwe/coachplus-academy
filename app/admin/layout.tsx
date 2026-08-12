"use client";

import { ReactNode, useEffect, useState } from "react";
import AdminLayoutComponent from "./components/AdminLayout";
import { getSession } from "@/app/lib/auth";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    getSession().then((session) => {
      if (session) setUser(session.user);
    });
  }, []);

  if (!user) return null; // Or a loader

  return <AdminLayoutComponent user={user}>{children}</AdminLayoutComponent>;
}
