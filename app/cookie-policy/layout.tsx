import { pageMetadata } from "@/app/lib/seo";

export const metadata = pageMetadata({
  title: "Cookie Policy",
  description:
    "Learn how CoachPlus Academy uses cookies and similar technologies on its website.",
  path: "/cookie-policy",
});

export default function CookiePolicyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
