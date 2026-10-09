"use client";

import { FaGooglePlay } from "react-icons/fa";
import { PLAYSTORE_URL } from "@/app/lib/constants";

type PlayStoreButtonProps = {
  variant?: "solid" | "outline" | "dark";
  className?: string;
};

/** Link that sends visitors to the CoachPlus app listing on the Google Play Store. */
export default function PlayStoreButton({
  variant = "solid",
  className = "",
}: PlayStoreButtonProps) {
  const styles =
    variant === "solid"
      ? "bg-white text-[#0f172a] shadow-2xl hover:bg-white/90"
      : variant === "dark"
        ? "bg-[#0f172a] text-white shadow-xl hover:bg-[#1e293b]"
        : "border border-white/30 bg-white/10 text-white backdrop-blur-md hover:bg-white/20";

  const iconColor =
    variant === "dark" ? "text-[#E91E63]" : "text-[#E91E63]";

  return (
    <a
      href={PLAYSTORE_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Get the app on Google Play"
      className={`group inline-flex min-h-[52px] items-center gap-3 rounded-2xl px-6 transition-all duration-300 hover:-translate-y-1 active:scale-95 ${styles} ${className}`}
    >
      <FaGooglePlay className={`size-6 ${iconColor}`} />
      <span className="flex flex-col items-start leading-tight">
        <span className="text-[10px] font-medium uppercase tracking-wider opacity-70">
          Get it on
        </span>
        <span className="text-base font-bold">Google Play</span>
      </span>
    </a>
  );
}
