"use server";

import { db } from "@/app/lib/db";

export async function saveRequest(formData: FormData) {
  const parentName = String(formData.get("parent-name") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const grade = String(formData.get("grade") || "").trim();
  const details = String(formData.get("details") || "").trim();
  const subjects = formData
    .getAll("subject")
    .map((s) => String(s))
    .join(", ");

  db.prepare(
    "INSERT INTO requests (parent_name, email, phone, grade, subjects, details) VALUES (?, ?, ?, ?, ?, ?)"
  ).run(parentName, email, phone, grade, subjects, details);
}
