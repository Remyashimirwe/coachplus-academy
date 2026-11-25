import { pageMetadata } from "@/app/lib/seo";

export const metadata = pageMetadata({
  title: "How It Works",
  description:
    "See how CoachPlus Academy helps families find a trusted teacher, get matched to learning needs, and start personalized coaching.",
  path: "/how-it-works",
});

export default function HowItWorksLayout({ children }: { children: React.ReactNode }) {
  return children;
}
