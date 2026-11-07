import { SHARE_REWARD_LABEL } from "@/lib/missions/shared-mission";

// "+10 %": what sharing a mission earns, in the colour of money.
export function RewardBadge({ size = "sm" }: { size?: "sm" | "md" }) {
  const sizeClasses = size === "md" ? "px-3 py-1 text-base" : "px-2 py-0.5 text-sm";
  return <span className={`shrink-0 rounded-full bg-emerald-500 font-extrabold text-white ${sizeClasses}`}>{SHARE_REWARD_LABEL}</span>;
}
