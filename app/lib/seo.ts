import type { Metadata } from "next";
import { BRAND_NAME } from "./constants";
import { SITE_URL } from "./site-url";

export function pageMetadata({
  title,
  description,
  path,
}: {
  title: string;
  description: string;
  path: string;
}): Metadata {
  const url = new URL(path, SITE_URL).toString();
  const fullTitle = `${title} | ${BRAND_NAME}`;
  const logoUrl = new URL("/logo.png", SITE_URL).toString();

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      siteName: BRAND_NAME,
      title: fullTitle,
      description,
      url,
      images: [{ url: logoUrl, alt: `${BRAND_NAME} logo` }],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [logoUrl],
    },
  };
}
