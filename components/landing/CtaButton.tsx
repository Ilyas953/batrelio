import Link from "next/link";
import { OFFER } from "@/lib/offer";
import { ArrowRightIcon } from "./icons";

type CtaButtonProps = {
  label?: string;
  variant?: "primary" | "secondary" | "light";
  href?: string;
  className?: string;
};

const VARIANT_CLASSES = {
  primary: "bg-orange-600 text-white shadow-lg shadow-orange-600/25 hover:bg-orange-700",
  secondary: "border-2 border-stone-300 bg-white text-stone-900 hover:border-stone-900",
  light: "bg-white text-stone-900 hover:bg-orange-50",
} as const;

export function CtaButton({
  label = "Essayer gratuitement",
  variant = "primary",
  href = OFFER.signupHref,
  className = "",
}: CtaButtonProps) {
  return (
    <Link
      href={href}
      className={`inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl px-7 text-lg font-semibold transition-colors focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-orange-400 ${VARIANT_CLASSES[variant]} ${className}`}
    >
      {label}
      {variant !== "secondary" && <ArrowRightIcon className="size-5" />}
    </Link>
  );
}
