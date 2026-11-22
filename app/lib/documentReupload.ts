import { createHash } from "node:crypto";
import { db } from "@/app/lib/db";

export function hashDocumentUploadToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function findDocumentReuploadApplication(token: string) {
  if (!/^[a-f0-9]{64}$/i.test(token)) return null;
  return db.teacherApplication.findFirst({
    where: {
      status: "documents_needed",
      documentUploadTokenHash: hashDocumentUploadToken(token),
      documentUploadTokenExpiresAt: { gt: new Date() },
    },
    select: {
      id: true,
      fullName: true,
      missingDocument: true,
      missingDocumentKind: true,
      missingDocumentReason: true,
    },
  });
}
