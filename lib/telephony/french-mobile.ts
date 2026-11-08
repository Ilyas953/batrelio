import { toE164Phone } from "@/lib/company/legal";
import { isFrenchMobile } from "./phone-rules";

// "06 12 34 56 78" -> "+33612345678"; null unless it is a French mobile (SMS only reach mobiles).
export function toFrenchMobile(value: string): string | null {
  const phone = toE164Phone(value);
  return phone && isFrenchMobile(phone) ? phone : null;
}
