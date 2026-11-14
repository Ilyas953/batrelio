import { describe, expect, it } from "vitest";
import { GREETING_NEXT_STEPS, defaultGreetingIntro, greetingWithSms, missedCallSms, toPlayResponse, toVoiceResponse } from "@/lib/telephony/messages";
import { DEFAULT_GREETING_VOICE, GREETING_VOICES, LIVE_FALLBACK_VOICE, findGreetingVoice, liveReadingVoice } from "@/lib/telephony/voices";
import { greetingAudioPath } from "@/lib/telephony/greeting-audio-path";
import {
  chooseGreeting,
  chooseGreetingVariant,
  decideSms,
  greetingText,
  greetingVariantsByExclusion,
  type AnsweringCompany,
} from "@/lib/telephony/missed-call";
import { isFrenchMobile, isIdentifiedCaller } from "@/lib/telephony/phone-rules";
import { CANCEL_FORWARDING_CODE, FORWARDING_RING_SECONDS, forwardingCode } from "@/lib/telephony/forwarding";

const company: AnsweringCompany = {
  id: "c1",
  name: "Toitures Martin",
  sms_sender_name: "TOITMARTIN",
  sms_sender_approved: false,
  auto_reply_enabled: true,
  contact_phone: "+33611111111",
  greeting_intro: null,
  phone_number: "+33199000001",
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
    // The setup test call comes from the artisan's Batrelio number: never a customer request.
    expect(decideSms(company, company.phone_number!, false)).toBe("skipped_own_number");
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
    expect(chooseGreeting("send", company)).toBe(greetingWithSms(company.name));
    expect(chooseGreeting("send", company)).toContain("SMS");
    expect(chooseGreeting("skipped_not_mobile", company)).not.toContain("SMS");
    expect(chooseGreeting("skipped_disabled", company)).not.toContain("SMS");
  });

  it("asks a hidden caller to call back", () => {
    expect(chooseGreeting("skipped_anonymous", company)).toContain("masqué");
  });

  // Both greetings are looked up while the exclusion list is read: the caller is waiting.
  it("knows both possible greetings before the exclusion list is read", () => {
    expect(greetingVariantsByExclusion(company, CUSTOMER_MOBILE)).toEqual({ excluded: "withoutSms", notExcluded: "withSms" });
    expect(greetingVariantsByExclusion(company, undefined)).toEqual({ excluded: "hiddenCaller", notExcluded: "hiddenCaller" });
    expect(greetingVariantsByExclusion({ ...company, auto_reply_enabled: false }, CUSTOMER_MOBILE)).toEqual({
      excluded: "withoutSms",
      notExcluded: "withoutSms",
    });
  });

  it("always says the company name", () => {
    for (const decision of ["send", "skipped_anonymous", "skipped_excluded"] as const) {
      expect(chooseGreeting(decision, company)).toContain(company.name);
    }
  });
});

describe("personalised greeting", () => {
  const custom = { ...company, greeting_intro: "Bonjour, c'est Pierre de Toitures Martin, je suis sur un toit" };

  it("starts with the artisan's words, then always says what happens next", () => {
    expect(chooseGreeting("send", custom)).toBe(`${custom.greeting_intro}. ${GREETING_NEXT_STEPS.withSms}`);
    expect(chooseGreeting("skipped_not_mobile", custom)).toBe(`${custom.greeting_intro}. ${GREETING_NEXT_STEPS.withoutSms}`);
    expect(chooseGreeting("skipped_anonymous", custom)).toBe(`${custom.greeting_intro}. ${GREETING_NEXT_STEPS.hiddenCaller}`);
  });

  it("does not double the final punctuation", () => {
    expect(chooseGreeting("send", { ...company, greeting_intro: "Bonjour !" })).toBe(`Bonjour ! ${GREETING_NEXT_STEPS.withSms}`);
  });

  it("falls back to the default when left empty", () => {
    expect(chooseGreeting("send", { ...company, greeting_intro: "   " })).toBe(
      `${defaultGreetingIntro(company.name)} ${GREETING_NEXT_STEPS.withSms}`,
    );
  });
});

describe("greeting voice", () => {
  it("reads the greeting with the chosen voice, in French", () => {
    const twiml = toVoiceResponse("Bonjour", "remi-ai");
    expect(twiml).toContain('voice="Google.fr-FR-Chirp3-HD-Puck"');
    expect(twiml).toContain('language="fr-FR"');
    expect(twiml).toContain("<Hangup/>");
  });

  it("uses the default voice when nothing or an unknown voice is stored", () => {
    expect(findGreetingVoice(null).id).toBe(DEFAULT_GREETING_VOICE);
    expect(findGreetingVoice("removed-voice").id).toBe(DEFAULT_GREETING_VOICE);
  });

  it("reads live with a voice outside the provider's beta when the recording is not ready", () => {
    expect(liveReadingVoice("claire-ai")).toBe(LIVE_FALLBACK_VOICE);
    expect(liveReadingVoice(null)).toBe(LIVE_FALLBACK_VOICE);
    expect(findGreetingVoice(LIVE_FALLBACK_VOICE).kind).toBe("standard");
    expect(liveReadingVoice("mathieu")).toBe("mathieu");
    expect(toVoiceResponse("Bonjour", liveReadingVoice("hugo-ai"))).toContain('voice="Google.fr-FR-Neural2-F"');
  });

  it("plays in the page exactly the voice customers hear on the phone", () => {
    for (const voice of GREETING_VOICES) expect(voice.providerVoice).toBe(`Google.${voice.synthesisVoice}`);
  });

  it("cannot be used to inject TwiML through the artisan's text", () => {
    const twiml = toVoiceResponse('Bonjour</Say><Dial>+33612345678</Dial><Say>', "classic");
    expect(twiml).not.toContain("<Dial>");
    expect(twiml).toContain("&lt;Dial&gt;");
  });

  it("offers only voice ids the database accepts", () => {
    for (const voice of GREETING_VOICES) expect(voice.id).toMatch(/^[a-z0-9-]{1,40}$/);
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

describe("greeting recorded beforehand", () => {
  it("is one file per voice and exact text: any change gives a new recording", () => {
    const base = greetingAudioPath("c1", "claire-ai", "Bonjour");
    expect(base).toMatch(/^c1\/[0-9a-f]{32}\.mp3$/);
    expect(greetingAudioPath("c1", "claire-ai", "Bonjour")).toBe(base);
    expect(greetingAudioPath("c1", "hugo-ai", "Bonjour")).not.toBe(base);
    expect(greetingAudioPath("c1", "claire-ai", "Bonjour !")).not.toBe(base);
    expect(greetingAudioPath("c2", "claire-ai", "Bonjour").startsWith("c2/")).toBe(true);
  });

  it("records the three endings a caller may hear", () => {
    expect(chooseGreetingVariant("send")).toBe("withSms");
    expect(chooseGreetingVariant("skipped_anonymous")).toBe("hiddenCaller");
    expect(chooseGreetingVariant("skipped_not_mobile")).toBe("withoutSms");
    expect(greetingText("withSms", company)).toBe(chooseGreeting("send", company));
  });

  it("plays the file, and its address cannot inject TwiML", () => {
    const twiml = toPlayResponse("https://x.supabase.co/storage/v1/object/sign/greeting-audio/c1/a.mp3?token=a&b=<Dial>");
    expect(twiml).toContain("<Play>https://x.supabase.co/storage/v1/object/sign/greeting-audio/c1/a.mp3?token=a&amp;b=&lt;Dial&gt;</Play>");
    expect(twiml).not.toContain("<Dial>");
  });
});

describe("call forwarding code", () => {
  it("forwards after 15 seconds of ringing, so customers do not hang up before the greeting", () => {
    expect(forwardingCode("+33939123452")).toBe("**004*0939123452**15#");
    expect(FORWARDING_RING_SECONDS % 5).toBe(0);
    expect(FORWARDING_RING_SECONDS).toBeGreaterThanOrEqual(5);
    expect(FORWARDING_RING_SECONDS).toBeLessThanOrEqual(30);
  });

  it("cancels every conditional forwarding at once", () => {
    expect(CANCEL_FORWARDING_CODE).toBe("##004#");
  });
});
