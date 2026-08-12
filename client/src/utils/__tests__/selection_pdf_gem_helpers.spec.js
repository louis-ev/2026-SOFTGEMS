import { afterEach, describe, expect, it } from "vitest";
import {
  makeGemMediaFileAbsoluteUrl,
  makeGemMediaViewerAbsoluteUrl,
  makeGemCoverViewerAbsoluteUrl,
  resolveGemCoverAbsoluteUrl,
  resolveGemCoverMediaRelative,
  resolveGemCoverThumbRelative,
  toAbsoluteAppUrl,
  formatPdfCurrencyTotal,
  formatPdfNumber,
  formatPdfPerCarat,
} from "@/utils/selection_pdf_gem_helpers.js";

describe("resolveGemCoverThumbRelative", () => {
  it("builds a thumb path from gem cover thumbs", () => {
    expect(
      resolveGemCoverThumbRelative({
        $path: "gems/12",
        $cover: { 320: "cover-320.jpg", 640: "cover-640.jpg" },
      })
    ).toBe("./thumbs/gems/12/cover-320.jpg");
  });

  it("returns empty when cover is missing", () => {
    expect(resolveGemCoverThumbRelative({ $path: "gems/12" })).toBe("");
  });
});

describe("resolveGemCoverMediaRelative", () => {
  it("builds a path to meta_cover.jpeg on the gem folder", () => {
    expect(
      resolveGemCoverMediaRelative({
        $path: "gems/42",
        $cover: { 320: "cover-320.jpg" },
      })
    ).toBe("/gems/42/meta_cover.jpeg");
  });

  it("preserves cache-busting query from cover.original", () => {
    expect(
      resolveGemCoverMediaRelative({
        $path: "gems/42",
        $cover: { original: "meta_cover.jpeg?v=123" },
      })
    ).toBe("/gems/42/meta_cover.jpeg?v=123");
  });
});

describe("resolveGemCoverAbsoluteUrl", () => {
  it("prefixes public_url origin on the cover media path", () => {
    expect(
      resolveGemCoverAbsoluteUrl(
        {
          $path: "gems/42",
          $cover: { 320: "cover-320.jpg" },
        },
        "https://softgems.example.com"
      )
    ).toBe("https://softgems.example.com/gems/42/meta_cover.jpeg");
  });
});

describe("toAbsoluteAppUrl", () => {
  it("prefixes origin on relative paths", () => {
    expect(
      toAbsoluteAppUrl("./thumbs/gems/12/cover.jpg", "http://localhost:8080")
    ).toBe("http://localhost:8080/thumbs/gems/12/cover.jpg");
  });
});

describe("makeGemMediaFileAbsoluteUrl", () => {
  const original_app_infos = window.app_infos;
  const original_origin = window.location.origin;

  afterEach(() => {
    window.app_infos = original_app_infos;
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { origin: original_origin },
    });
  });

  it("uses public_url from app_infos when origin is omitted", () => {
    window.app_infos = { public_url: "https://softgems.example.com" };
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { origin: "http://localhost:8080" },
    });

    expect(
      makeGemMediaFileAbsoluteUrl({
        $path: "gems/42/files/cert-1",
        $media_filename: "cert.pdf",
      })
    ).toBe("https://softgems.example.com/gems/42/files/cert.pdf");
  });
});

describe("makeGemMediaViewerAbsoluteUrl", () => {
  it("builds the HTML viewer URL with path_to_media and type", () => {
    expect(
      makeGemMediaViewerAbsoluteUrl(
        {
          $path: "gems/42/files/photo-1",
          $media_filename: "face.jpg",
          $type: "image",
        },
        "https://app.example.com"
      )
    ).toBe(
      "https://app.example.com/_previewmedia?path_to_media=%2Fgems%2F42%2Ffiles%2Fface.jpg&type=image"
    );
  });

  it("returns empty when media path or type is missing", () => {
    expect(
      makeGemMediaViewerAbsoluteUrl(
        { $path: "gems/42/files/photo-1" },
        "https://app.example.com"
      )
    ).toBe("");
    expect(makeGemMediaViewerAbsoluteUrl({}, "https://app.example.com")).toBe(
      ""
    );
  });
});

describe("makeGemCoverViewerAbsoluteUrl", () => {
  it("builds the HTML viewer URL for the gem cover image", () => {
    expect(
      makeGemCoverViewerAbsoluteUrl(
        {
          $path: "gems/42",
          $cover: { 320: "cover-320.jpg" },
        },
        "https://app.example.com"
      )
    ).toBe(
      "https://app.example.com/_previewmedia?path_to_media=%2Fgems%2F42%2Fmeta_cover.jpeg&type=image"
    );
  });

  it("returns empty when cover is missing", () => {
    expect(
      makeGemCoverViewerAbsoluteUrl({ $path: "gems/42" }, "https://app.example.com")
    ).toBe("");
  });
});

describe("pdf number formatting", () => {
  it("formats currency totals and dashes for missing values", () => {
    expect(formatPdfCurrencyTotal(16125, "USD")).toBe("$16\u00a0125.00");
    expect(formatPdfCurrencyTotal(424476, "USD")).toBe("$424\u00a0476.00");
    expect(formatPdfCurrencyTotal(16125, "EUR")).toBe("16\u00a0125.00 \u20AC");
    expect(formatPdfNumber(null)).toBe("—");
  });

  it("formats weights with a decimal dot", () => {
    expect(
      formatPdfNumber(2.15, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    ).toBe("2.15");
  });

  it("formats per-carat prices without thousands grouping", () => {
    expect(formatPdfPerCarat(7500)).toBe("7500.00");
    expect(formatPdfPerCarat(26500)).toBe("26500.00");
    expect(formatPdfPerCarat(null)).toBe("—");
  });
});
