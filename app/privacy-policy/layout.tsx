import { pageMetadata } from "@/app/lib/seo";

export const metadata = pageMetadata({
  title: "Privacy Policy",
  description:
    "Read how CoachPlus Academy collects, uses, and protects personal information across its website and learning services.",
  path: "/privacy-policy",
});

export default function PrivacyPolicyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
