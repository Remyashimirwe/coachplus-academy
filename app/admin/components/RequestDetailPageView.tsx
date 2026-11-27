"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import RequestDetailModal from "./RequestDetailModal";

type TeacherOption = {
  id: number;
  name: string;
  email: string;
  phone?: string;
  subjects?: string;
};

type RequestData = {
  id: number;
  parent_name: string;
  email: string;
  [key: string]: unknown;
};

export default function RequestDetailPageView({
  request: initialRequest,
  teachers,
}: {
  request: RequestData;
  teachers: TeacherOption[];
}) {
  const [request, setRequest] = useState<RequestData>(initialRequest);
  const router = useRouter();

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      <RequestDetailModal
        request={request}
        teachers={teachers}
        embedded
        onClose={() => router.push("/admin/requests")}
        onUpdated={(id, changes) =>
          setRequest((prev) => (prev.id === id ? { ...prev, ...changes } : prev))
        }
      />
    </div>
  );
}
