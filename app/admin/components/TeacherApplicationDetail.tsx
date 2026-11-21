"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FiArrowLeft } from "react-icons/fi";
import TeacherApplicationModal from "./TeacherApplicationModal";

export default function TeacherApplicationDetail({ application }: { application: any }) {
  const [app, setApp] = useState(application);
  const router = useRouter();

  return (
    <div className="mx-auto max-w-5xl">
      <button
        type="button"
        onClick={() => router.push("/admin/teachers")}
        className="mb-4 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
      >
        <FiArrowLeft aria-hidden="true" /> Back to applications
      </button>
      <TeacherApplicationModal
        app={app}
        pageMode
        onClose={() => router.push("/admin/teachers")}
        onApproved={(_id, patch) => setApp((current: any) => ({ ...current, ...(patch || {}), status: "approved" }))}
        onDenied={(_id, patch) => setApp((current: any) => ({ ...current, ...(patch || {}), status: "rejected" }))}
        onStatusChanged={(_id, status, patch) =>
          setApp((current: any) => ({ ...current, ...(patch || {}), status }))
        }
      />
    </div>
  );
}
