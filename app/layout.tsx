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

export const metadata: Metadata = {
  title: {
    template: "%s | Wecoach Academy",
    default: "Wecoach Academy | Find the Perfect Teacher",
  },
  description:
    "Connect with verified home and online teachers for personalized learning.",
  icons: {
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
