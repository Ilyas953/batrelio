import { describe, expect, it } from "vitest";
import { readPhotos } from "@/lib/requests/photo-files";
import { MAX_PHOTO_BYTES, MAX_PHOTOS } from "@/lib/requests/limits";
import { isWellFormedToken } from "@/lib/requests/public-link";
import { randomFictionLandline, randomFictionMobile } from "@/lib/simulation/fiction-numbers";
import { isFrenchMobile } from "@/lib/telephony/phone-rules";
import { isValidTwilioSignature } from "@/lib/telephony/twilio";

// Example published in Twilio's webhook security documentation (auth token "12345", set in vitest.config.mts).
const TWILIO_URL = "https://mycompany.com/myapp.php?foo=1&bar=2";
const TWILIO_PARAMS = {
  CallSid: "CA1234567890ABCDE",
  Caller: "+12349013030",
  Digits: "1234",
  From: "+12349013030",
  To: "+18005551212",
};
const TWILIO_SIGNATURE = "0/KCTR6DLpKmkAf8muzZqo1nDgQ=";

describe("Twilio webhook signature", () => {
  it("accepts the example signed by Twilio", () => {
    expect(isValidTwilioSignature(TWILIO_URL, TWILIO_PARAMS, TWILIO_SIGNATURE)).toBe(true);
  });

  it("rejects a forged caller, another URL or a garbled signature", () => {
    expect(isValidTwilioSignature(TWILIO_URL, { ...TWILIO_PARAMS, From: "+33612345678" }, TWILIO_SIGNATURE)).toBe(false);
    expect(isValidTwilioSignature("https://evil.example/myapp.php?foo=1&bar=2", TWILIO_PARAMS, TWILIO_SIGNATURE)).toBe(false);
    expect(isValidTwilioSignature(TWILIO_URL, TWILIO_PARAMS, "")).toBe(false);
    expect(isValidTwilioSignature(TWILIO_URL, TWILIO_PARAMS, "0/KCTR6DLpKmkAf8muzZqo1nDgQ")).toBe(false);
  });
});

describe("customer links", () => {
  it("only accepts tokens in the generated format", () => {
    expect(isWellFormedToken("0123456789abcdef0123456789abcdef")).toBe(true);
    expect(isWellFormedToken("0123456789ABCDEF0123456789ABCDEF")).toBe(false);
    expect(isWellFormedToken("../../etc/passwd")).toBe(false);
    expect(isWellFormedToken("")).toBe(false);
  });
});

const JPEG = [0xff, 0xd8, 0xff, 0xe0];
const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const WEBP = [...Buffer.from("RIFF"), 0, 0, 0, 0, ...Buffer.from("WEBP")];

function photosForm(files: { bytes: number[] | Uint8Array; name: string; type: string }[]): FormData {
  const formData = new FormData();
  for (const file of files) formData.append("photos", new File([new Uint8Array(file.bytes)], file.name, { type: file.type }));
  return formData;
}

describe("customer photos", () => {
  it("accepts JPEG, PNG and WebP by their real content", async () => {
    const photos = await readPhotos(
      photosForm([
        { bytes: JPEG, name: "a.jpg", type: "image/jpeg" },
        { bytes: PNG, name: "b.png", type: "image/png" },
        { bytes: WEBP, name: "c.webp", type: "image/webp" },
      ]),
    );
    expect(Array.isArray(photos) && photos.map((photo) => photo.extension)).toEqual(["jpg", "png", "webp"]);
  });

  it("refuses a file that only pretends to be a photo", async () => {
    const result = await readPhotos(photosForm([{ bytes: [...Buffer.from("<script>alert(1)</script>")], name: "x.jpg", type: "image/jpeg" }]));
    expect(result).toEqual({ error: expect.stringContaining("JPEG, PNG ou WebP") });
  });

  it("refuses too many or too heavy photos", async () => {
    const tooMany = Array.from({ length: MAX_PHOTOS + 1 }, (_, index) => ({ bytes: JPEG, name: `${index}.jpg`, type: "image/jpeg" }));
    expect(await readPhotos(photosForm(tooMany))).toEqual({ error: expect.stringContaining(String(MAX_PHOTOS)) });

    const heavy = new Uint8Array(MAX_PHOTO_BYTES + 1);
    heavy.set(JPEG);
    expect(await readPhotos(photosForm([{ bytes: heavy, name: "big.jpg", type: "image/jpeg" }]))).toEqual({
      error: expect.stringContaining("trop lourde"),
    });
  });

  it("ignores empty file inputs", async () => {
    expect(await readPhotos(photosForm([{ bytes: [], name: "", type: "application/octet-stream" }]))).toEqual([]);
  });
});

describe("fictional numbers of test accounts", () => {
  it("stay in the ranges ARCEP reserves for fiction", () => {
    for (let index = 0; index < 50; index++) {
      expect(randomFictionLandline()).toMatch(/^\+3319900\d{4}$/);
      expect(randomFictionMobile()).toMatch(/^\+3363998\d{4}$/);
    }
  });

  it("give a mobile caller the SMS path and the Batrelio number a landline", () => {
    expect(isFrenchMobile(randomFictionMobile())).toBe(true);
    expect(isFrenchMobile(randomFictionLandline())).toBe(false);
  });
});
