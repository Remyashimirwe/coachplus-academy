import type { MetadataRoute } from "next";
import { SITE_URL } from "@/app/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/student",
        "/teacher",
        "/api/",
        "/setup-password",
        "/accept-invite",
        "/reupload-documents",
        "/en/admin",
        "/en/student",
        "/en/teacher",
        "/fr/admin",
        "/fr/student",
        "/fr/teacher",
      ],
    },
    sitemap: new URL("/sitemap.xml", SITE_URL).toString(),
  };
}
