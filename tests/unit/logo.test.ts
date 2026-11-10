import { describe, expect, it } from "vitest";
import { readLogoFile } from "@/lib/company/logo";
import { MAX_LOGO_BYTES, isOwnLogoPath, newLogoPath } from "@/lib/company/logo-file";

const COMPANY = "0b6f1c2e-6a4f-4d3b-9c1e-2f3a4b5c6d7e";
const PNG: Uint8Array<ArrayBuffer> = Uint8Array.from(Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64"));

const withFile = (bytes: Uint8Array<ArrayBuffer>, name: string, type: string) => {
  const form = new FormData();
  form.set("logo", new File([bytes], name, { type }));
  return form;
};

describe("company logo", () => {
  it("accepts a PNG, JPEG or WebP image, judged by its content", async () => {
    expect(await readLogoFile(withFile(PNG, "logo.png", "image/png"))).toMatchObject({ contentType: "image/png", extension: "png" });
    // Declared as a PNG, but it is not one.
    const fake = new TextEncoder().encode("<svg onload=alert(1)>");
    expect(await readLogoFile(withFile(fake, "logo.png", "image/png"))).toEqual({ error: "Le logo doit être une image PNG, JPEG ou WebP." });
  });

  it("refuses an empty or too heavy file", async () => {
    expect(await readLogoFile(new FormData())).toEqual({ error: "Choisissez une image." });
    const heavy = new Uint8Array(MAX_LOGO_BYTES + 1);
    heavy.set(PNG);
    expect(await readLogoFile(withFile(heavy, "logo.png", "image/png"))).toEqual({ error: "Ce logo est trop lourd (2 Mo maximum)." });
  });

  it("is stored as a new file in the company's own folder", () => {
    const path = newLogoPath(COMPANY, "png");
    expect(path).toMatch(new RegExp(`^${COMPANY}/[0-9a-f-]{36}\\.png$`));
    expect(newLogoPath(COMPANY, "png")).not.toBe(path);
    expect(isOwnLogoPath(COMPANY, path)).toBe(true);
    expect(isOwnLogoPath("11111111-2222-3333-4444-555555555555", path)).toBe(false);
    expect(isOwnLogoPath(COMPANY, `${COMPANY}/../autre.png`)).toBe(false);
  });
});
