import { pageMetadata } from "@/app/lib/seo";

export const metadata = pageMetadata({
  title: "Terms of Service",
  description:
    "Review the terms for using CoachPlus Academy's website, tutoring services, and learning platform.",
  path: "/terms-of-service",
});

export default function TermsOfServiceLayout({ children }: { children: React.ReactNode }) {
  return children;
}
