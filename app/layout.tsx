import type { Metadata, Viewport } from "next";
import "@fontsource/poppins/400.css";
import "@fontsource/poppins/500.css";
import "@fontsource/poppins/600.css";
import "@fontsource/poppins/700.css";
import "@fontsource/poppins/800.css";
import "@fontsource/poppins/900.css";
import "./globals.css";
import Navbar from "./components/Navbar";
import WhatsAppButton from "./components/WhatsAppButton";
import { BRAND_NAME } from "./lib/constants";

export const metadata: Metadata = {
  title: {
    template: `%s | ${BRAND_NAME}`,
    default: `${BRAND_NAME} | Find the Perfect Teacher`,
  },
  description:
    "Connect with verified home and online teachers for personalized learning.",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#E91E63",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <Navbar />
        {children}
        <WhatsAppButton />
      </body>
    </html>
  );
}
