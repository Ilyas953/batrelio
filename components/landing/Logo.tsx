import { Bricolage_Grotesque } from "next/font/google";

const logoFont = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: "800",
});

type LogoProps = { className?: string };

export function Logo({ className = "text-stone-900" }: LogoProps) {
  return (
    <span className={`${logoFont.className} text-[1.7rem] leading-none tracking-[-0.04em] ${className}`}>
      batrelio<span className="text-orange-600">.</span>
    </span>
  );
}
