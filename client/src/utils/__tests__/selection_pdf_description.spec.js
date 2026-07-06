import { describe, expect, it } from "vitest";
import { buildGemPdfDescriptionBlocks } from "@/utils/selection_pdf_description.js";

const base_gem = {
  color: "Blue",
  stone_type: "Sapphire",
  shape: "oval",
  length_mm: 10,
  width_mm: 8,
  height_mm: 5,
  treatment_type: "Heat",
  origin_country: "Sri Lanka",
  country_of_cut: "Thailand",
  $path: "gems/42",
  $files: [
    {
      is_gem_certificate: true,
      provider_path: "GIA",
      certificate_reference: "12345",
      $media_filename: "cert.pdf",
      $path: "gems/42/files/cert-1",
    },
    {
      is_gem_media: true,
      $type: "video",
      $media_filename: "spin.mp4",
      $path: "gems/42/files/video-1",
    },
  ],
};

describe("buildGemPdfDescriptionBlocks", () => {
  it("places certificate links after text fields and videos", () => {
    const blocks = buildGemPdfDescriptionBlocks(
      base_gem,
      "http://localhost:8080"
    );
    const types = blocks.map((block) => block.type);
    const cert_index = blocks.findIndex((block) => block.is_certificate_link);
    const video_index = blocks.findIndex(
      (block) => block.text === "spin.mp4" && block.type === "link"
    );
    const origin_index = blocks.findIndex((block) =>
      block.text?.startsWith("Origin:")
    );

    expect(cert_index).toBeGreaterThan(origin_index);
    expect(cert_index).toBeGreaterThan(video_index);
    expect(types[cert_index]).toBe("link");
  });

  it("always emits certificate blocks as hyperlinks when path is available", () => {
    const blocks = buildGemPdfDescriptionBlocks(
      base_gem,
      "http://localhost:8080"
    );
    const certificate = blocks.find((block) => block.is_certificate_link);

    expect(certificate).toMatchObject({
      type: "link",
      text: "GIA 12345",
      href: "http://localhost:8080/gems/42/files/cert.pdf",
      is_certificate_link: true,
    });
  });

  it("skips certificate files without a resolvable path", () => {
    const blocks = buildGemPdfDescriptionBlocks({
      ...base_gem,
      $files: [{ is_gem_certificate: true, certificate_reference: "999" }],
    });

    expect(blocks.some((block) => block.is_certificate_link)).toBe(false);
  });
});
