import { pageMetadata } from "@/app/lib/seo";

export const metadata = pageMetadata({
  title: "Why Choose CoachPlus Academy",
  description:
    "Learn how CoachPlus Academy supports safe, flexible, personalized coaching with trusted teachers for families in Rwanda.",
  path: "/why-choose-us",
});

export default function WhyChooseUsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
