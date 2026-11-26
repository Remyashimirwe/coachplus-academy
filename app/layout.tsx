import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import "@fontsource/poppins/400.css";
import "@fontsource/poppins/500.css";
import "@fontsource/poppins/600.css";
import "@fontsource/poppins/700.css";
import "@fontsource/poppins/800.css";
import "@fontsource/poppins/900.css";
import "./globals.css";
import Navbar from "./components/Navbar";
import WhatsAppButton from "./components/WhatsAppButton";
import ToastProvider from "./components/ToastProvider";
import { BRAND_NAME } from "./lib/constants";
import { SITE_URL } from "./lib/site-url";

const siteDescription =
  "Find trusted teachers for personalized home and online coaching in Rwanda. Explore school support, Cambridge programs, languages, exam preparation, and practical skills.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    template: `%s | ${BRAND_NAME}`,
    default: `${BRAND_NAME} | Find Trusted Teachers in Rwanda`,
  },
  description: siteDescription,
  icons: {
    icon: "/favicon-v2.png",
    shortcut: "/favicon-v2.png",
    apple: "/logo.png",
  },
  openGraph: {
    type: "website",
    siteName: BRAND_NAME,
    description: siteDescription,
    images: [{ url: "/logo.png", alt: `${BRAND_NAME} logo` }],
  },
  twitter: {
    card: "summary_large_image",
    description: siteDescription,
    images: ["/logo.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#E91E63",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              {
                "@context": "https://schema.org",
                "@type": "EducationalOrganization",
                "@id": `${SITE_URL}/#organization`,
                name: BRAND_NAME,
                url: SITE_URL,
                logo: `${SITE_URL}/logo.svg`,
                description: siteDescription,
                areaServed: { "@type": "Country", name: "Rwanda" },
              },
              {
                "@context": "https://schema.org",
                "@type": "WebSite",
                "@id": `${SITE_URL}/#website`,
                name: BRAND_NAME,
                url: SITE_URL,
                publisher: { "@id": `${SITE_URL}/#organization` },
              },
            ]).replace(/</g, "\\u003c"),
          }}
        />
        <Navbar />
        {/* Renders no DOM of its own, so the flex column layout is unchanged;
            it only provides the toast context plus a fixed-position stack. */}
        <ToastProvider>{children}</ToastProvider>
        <WhatsAppButton />
        <Analytics />
      </body>
    </html>
  );
}
