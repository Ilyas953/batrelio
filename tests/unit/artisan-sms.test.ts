import { describe, expect, it } from "vitest";
import { acceptedQuoteSms, decideArtisanSms, newRequestSms, quotePageUrl, requestPageUrl } from "@/lib/requests/artisan-sms";

const URL = requestPageUrl("https://batrelio.com", "0b6f1c2e-6a4f-4d3b-9c1e-2f3a4b5c6d7e");
// Characters of the basic GSM alphabet: a message made of them fits 160 per SMS.
const GSM_7 = /^[A-Za-z0-9 @£$¥èéùìòÇØøÅå_ÆæßÉ!"#%&'()*+,\-./:;<=>?¡ÄÖÑÜ§¿äöñüà\n]*$/;

describe("SMS telling the artisan about a new request", () => {
  it("is sent to a French mobile only, never for a test account", () => {
    expect(decideArtisanSms("+33612345678", false)).toBe("send");
    expect(decideArtisanSms("+33712345678", false)).toBe("send");
    expect(decideArtisanSms("+33145678901", false)).toBe("skipped_not_mobile");
    expect(decideArtisanSms(null, false)).toBe("skipped_no_phone");
    expect(decideArtisanSms("+33612345678", true)).toBe("skipped_test_account");
  });

  it("says who, their number and where to see the request", () => {
    expect(newRequestSms({ customerName: "Mme Le Goff", customerPhone: "+33639985511", requestUrl: URL })).toBe(
      `Batrelio : nouvelle demande de Mme Le Goff (06 39 98 55 11). Voir : ${URL}`,
    );
    expect(newRequestSms({ customerName: " ", customerPhone: "+33639985511", requestUrl: URL })).toBe(
      `Batrelio : nouvelle demande du 06 39 98 55 11. Voir : ${URL}`,
    );
  });

  it("fits in a single SMS for a usual name", () => {
    const text = newRequestSms({ customerName: "Jean-Pierre Martin", customerPhone: "+33639985511", requestUrl: URL });
    expect(text).toMatch(GSM_7);
    expect(text.length).toBeLessThanOrEqual(160);
  });

  it("links to the request in the artisan space", () => {
    expect(URL).toBe("https://batrelio.com/espace/demandes/0b6f1c2e-6a4f-4d3b-9c1e-2f3a4b5c6d7e");
  });
});

describe("SMS when a quote is accepted online", () => {
  it("says who accepted which quote, with the link", () => {
    const body = acceptedQuoteSms({ signerName: "Marie Le Goff", quoteNumber: "2026-004", quoteUrl: quotePageUrl("https://batrelio.com", "q1") });
    expect(body).toBe("Batrelio : Marie Le Goff a accepté le devis 2026-004. Voir : https://batrelio.com/espace/devis/q1");
    expect(body.length).toBeLessThanOrEqual(160);
  });
});
