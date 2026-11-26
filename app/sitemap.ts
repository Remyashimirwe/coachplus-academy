import type { MetadataRoute } from "next";
import { getCachedPrograms } from "@/app/lib/db";
import { SITE_URL } from "@/app/lib/site-url";

const publicPaths = [
  "/",
  "/programs",
  "/how-it-works",
  "/why-choose-us",
  "/request",
  "/become-a-teacher",
  "/privacy-policy",
  "/terms-of-service",
  "/cookie-policy",
];

// Keep the sitemap available if the catalog database is briefly unavailable.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages: MetadataRoute.Sitemap = publicPaths.map((path) => ({
    url: new URL(path, SITE_URL).toString(),
  }));

  try {
    const programs = await getCachedPrograms();
    pages.push(
      ...programs.map((program) => ({
        url: new URL(`/programs/${program.id}`, SITE_URL).toString(),
      })),
    );
  } catch {
    console.error("Sitemap catalog lookup failed; serving public pages only.");
  }

  return pages;
}
