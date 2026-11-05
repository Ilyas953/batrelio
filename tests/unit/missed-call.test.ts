import { describe, expect, it } from "vitest";
import { greetingWithSms, missedCallSms } from "@/lib/telephony/messages";
import { chooseGreeting, decideSms, type AnsweringCompany } from "@/lib/telephony/missed-call";
import { isFrenchMobile, isIdentifiedCaller } from "@/lib/telephony/phone-rules";

const company: AnsweringCompany = {
  id: "c1",
  name: "Toitures Martin",
  sms_sender_name: "TOITMARTIN",
  sms_sender_approved: false,
  auto_reply_enabled: true,
  contact_phone: "+33611111111",
};
const CUSTOMER_MOBILE = "+33639981234";

describe("who gets an SMS after a missed call", () => {
  it("texts a customer calling from a French mobile", () => {
    expect(decideSms(company, CUSTOMER_MOBILE, false)).toBe("send");
    expect(decideSms(company, "+33739981234", false)).toBe("send");
  });

  it("never texts a hidden number, even when the auto reply is paused", () => {
    expect(decideSms(company, undefined, false)).toBe("skipped_anonymous");
    expect(decideSms(company, "+266696687", false)).toBe("skipped_anonymous");
    expect(decideSms({ ...company, auto_reply_enabled: false }, undefined, false)).toBe("skipped_anonymous");
  });

  it("never texts the artisan's own number or an excluded one", () => {
    expect(decideSms(company, company.contact_phone!, false)).toBe("skipped_own_number");
    expect(decideSms(company, CUSTOMER_MOBILE, true)).toBe("skipped_excluded");
  });

  it("sends nothing while paused", () => {
    expect(decideSms({ ...company, auto_reply_enabled: false }, CUSTOMER_MOBILE, false)).toBe("skipped_disabled");
  });

  it("does not text landlines or foreign numbers (SMS would not arrive or cost too much)", () => {
    expect(decideSms(company, "+33199001234", false)).toBe("skipped_not_mobile");
    expect(decideSms(company, "+33912345678", false)).toBe("skipped_not_mobile");
    expect(decideSms(company, "+447700900123", false)).toBe("skipped_not_mobile");
  });
});

describe("what the caller hears", () => {
  it("announces the SMS only when one is sent", () => {
    expect(chooseGreeting("send", company.name)).toBe(greetingWithSms(company.name));
    expect(chooseGreeting("send", company.name)).toContain("SMS");
    expect(chooseGreeting("skipped_not_mobile", company.name)).not.toContain("SMS");
    expect(chooseGreeting("skipped_disabled", company.name)).not.toContain("SMS");
  });

  it("asks a hidden caller to call back", () => {
    expect(chooseGreeting("skipped_anonymous", company.name)).toContain("masqué");
  });

  it("always says the company name", () => {
    for (const decision of ["send", "skipped_anonymous", "skipped_excluded"] as const) {
      expect(chooseGreeting(decision, company.name)).toContain(company.name);
    }
  });
});

// GSM 03.38 basic set: anything else switches the SMS to UCS-2 (70 characters per part, cost x2+).
const GSM_7BIT =
  "@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !\"#¤%&'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà";

describe("the SMS sent to the caller", () => {
  const link = "https://batrelio.com/demande/0123456789abcdef0123456789abcdef";
  const sms = missedCallSms("Toitures Martin", link);

  it("carries the request link and the company name", () => {
    expect(sms).toContain(link);
    expect(sms).toContain("Toitures Martin");
  });

  it("only uses GSM characters, so it is not billed as UCS-2", () => {
    const outside = [...sms].filter((character) => !GSM_7BIT.includes(character));
    expect(outside).toEqual([]);
  });

  it("stays within 2 SMS parts for a usual company name", () => {
    expect(sms.length).toBeLessThanOrEqual(2 * 153);
  });

  it("contains no advertising (art. L. 34-5 CPCE)", () => {
    expect(sms.toLowerCase()).not.toMatch(/promo|offre|batrelio\.com\/(?!demande)/);
  });
});

describe("phone rules", () => {
  it("recognises French mobiles only", () => {
    expect(isFrenchMobile("+33612345678")).toBe(true);
    expect(isFrenchMobile("+33712345678")).toBe(true);
    expect(isFrenchMobile("+33112345678")).toBe(false);
    expect(isFrenchMobile("+3361234567")).toBe(false);
  });

  it("treats provider placeholders for hidden numbers as unidentified", () => {
    expect(isIdentifiedCaller("+266696687")).toBe(false);
    expect(isIdentifiedCaller("anonymous")).toBe(false);
    expect(isIdentifiedCaller(null)).toBe(false);
    expect(isIdentifiedCaller(CUSTOMER_MOBILE)).toBe(true);
  });
});
