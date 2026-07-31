import { describe, expect, it } from "vitest";
import {
  buildGemPdfDescriptionBlocks,
  buildGemPdfMediaLinkBlocks,
  formatCertificateLinkLabel,
  selection_pdf_certificate_link_separator,
} from "@/utils/selection_pdf_description.js";

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
      provider_path: "address_book/7",
      certificate_reference: "12345",
      $media_filename: "cert.pdf",
      $path: "gems/42/files/cert-1",
    },
    {
      is_gem_certificate: true,
      provider_path: "address_book/8",
      certificate_reference: "4310",
      $media_filename: "cert-2.pdf",
      $path: "gems/42/files/cert-2",
    },
    {
      is_gem_media: true,
      $type: "video",
      $media_filename: "spin.mp4",
      $path: "gems/42/files/video-1",
    },
  ],
};

describe("formatCertificateLinkLabel", () => {
  it("joins provider label and reference with an en dash", () => {
    expect(
      formatCertificateLinkLabel(
        {
          provider_path: "address_book/7",
          certificate_reference: "4310",
        },
        { "address_book/7": "SSEF" }
      )
    ).toBe(`SSEF${selection_pdf_certificate_link_separator}4310`);
  });
});

describe("buildGemPdfDescriptionBlocks", () => {
  it("keeps certificates in description and omits media links", () => {
    const blocks = buildGemPdfDescriptionBlocks(
      base_gem,
      "http://localhost:8080",
      { provider_labels_by_path: { "address_book/7": "GIA", "address_book/8": "SSEF" } }
    );
    const certificates = blocks.filter((block) => block.is_certificate_link);
    const media = blocks.filter((block) => block.is_media_link);
    const origin_index = blocks.findIndex((block) =>
      block.text?.startsWith("Origin:")
    );
    const cert_index = blocks.findIndex((block) => block.is_certificate_link);

    expect(certificates).toHaveLength(2);
    expect(media).toHaveLength(0);
    expect(cert_index).toBeGreaterThan(origin_index);
    expect(blocks.some((block) => block.text === "spin.mp4")).toBe(false);
  });

  it("emits absolute certificate hyperlinks labeled Provider – ref", () => {
    const blocks = buildGemPdfDescriptionBlocks(
      base_gem,
      "http://localhost:8080",
      { provider_labels_by_path: { "address_book/7": "GIA", "address_book/8": "SSEF" } }
    );
    const certificates = blocks.filter((block) => block.is_certificate_link);

    expect(certificates).toHaveLength(2);
    expect(certificates[0]).toMatchObject({
      type: "link",
      text: `GIA${selection_pdf_certificate_link_separator}12345`,
      href: "http://localhost:8080/gems/42/files/cert.pdf",
      is_certificate_link: true,
    });
    expect(certificates[1]).toMatchObject({
      type: "link",
      text: `SSEF${selection_pdf_certificate_link_separator}4310`,
      href: "http://localhost:8080/gems/42/files/cert-2.pdf",
      is_certificate_link: true,
    });
  });

  it("skips certificate files without a resolvable media path", () => {
    const blocks = buildGemPdfDescriptionBlocks(
      {
        ...base_gem,
        $files: [{ is_gem_certificate: true, certificate_reference: "999" }],
      },
      "https://app.example.com"
    );

    expect(blocks.some((block) => block.is_certificate_link)).toBe(false);
  });

  it("builds absolute certificate urls from the export origin", () => {
    const blocks = buildGemPdfDescriptionBlocks(
      base_gem,
      "https://app.example.com",
      { provider_labels_by_path: { "address_book/7": "GIA" } }
    );
    const certificate = blocks.find((block) => block.is_certificate_link);

    expect(certificate?.href).toBe(
      "https://app.example.com/gems/42/files/cert.pdf"
    );
  });
});

describe("buildGemPdfMediaLinkBlocks", () => {
  it("emits photo and video links for the photo column", () => {
    const blocks = buildGemPdfMediaLinkBlocks(
      {
        ...base_gem,
        $files: [
          {
            is_gem_media: true,
            $type: "image",
            $media_filename: "face.jpg",
            $path: "gems/42/files/photo-1",
          },
          {
            is_gem_media: true,
            $type: "video",
            $media_filename: "spin.mp4",
            $path: "gems/42/files/video-1",
          },
        ],
      },
      "https://app.example.com"
    );

    expect(blocks).toEqual([
      {
        type: "link",
        text: "face.jpg",
        href: "https://app.example.com/_previewmedia?path_to_media=%2Fgems%2F42%2Ffiles%2Fface.jpg&type=image",
        is_media_link: true,
      },
      {
        type: "link",
        text: "spin.mp4",
        href: "https://app.example.com/_previewmedia?path_to_media=%2Fgems%2F42%2Ffiles%2Fspin.mp4&type=video",
        is_media_link: true,
      },
    ]);
  });

  it("excludes media files with dont_link_in_pdf", () => {
    const blocks = buildGemPdfMediaLinkBlocks(
      {
        ...base_gem,
        $files: [
          {
            is_gem_media: true,
            $type: "video",
            dont_link_in_pdf: true,
            $media_filename: "hidden.mp4",
            $path: "gems/42/files/video-hidden",
          },
          {
            is_gem_media: true,
            $type: "image",
            dont_link_in_pdf: true,
            $media_filename: "hidden.jpg",
            $path: "gems/42/files/photo-hidden",
          },
          {
            is_gem_media: true,
            $type: "video",
            $media_filename: "visible.mp4",
            $path: "gems/42/files/video-visible",
          },
        ],
      },
      "https://app.example.com"
    );

    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toMatchObject({
      text: "visible.mp4",
      href: "https://app.example.com/_previewmedia?path_to_media=%2Fgems%2F42%2Ffiles%2Fvisible.mp4&type=video",
      is_media_link: true,
    });
  });

  it("sorts media links alphabetically by filename", () => {
    const blocks = buildGemPdfMediaLinkBlocks(
      {
        ...base_gem,
        $files: [
          {
            is_gem_media: true,
            $type: "video",
            $media_filename: "zebra.mp4",
            $path: "gems/42/files/video-z",
          },
          {
            is_gem_media: true,
            $type: "image",
            $media_filename: "alpha.jpg",
            $path: "gems/42/files/photo-a",
          },
          {
            is_gem_media: true,
            $type: "image",
            $media_filename: "middle.jpg",
            $path: "gems/42/files/photo-m",
          },
        ],
      },
      "https://app.example.com"
    );

    expect(blocks.map((block) => block.text)).toEqual([
      "alpha.jpg",
      "middle.jpg",
      "zebra.mp4",
    ]);
  });
});
