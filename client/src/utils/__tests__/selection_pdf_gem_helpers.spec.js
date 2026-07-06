import { describe, expect, it } from "vitest";
import {
  resolveGemCoverThumbRelative,
  toAbsoluteAppUrl,
  formatPdfCurrencyTotal,
  formatPdfNumber,
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

describe("toAbsoluteAppUrl", () => {
  it("prefixes origin on relative paths", () => {
    expect(
      toAbsoluteAppUrl("./thumbs/gems/12/cover.jpg", "http://localhost:8080")
    ).toBe("http://localhost:8080/thumbs/gems/12/cover.jpg");
  });
});

describe("pdf number formatting", () => {
  it("formats currency totals and dashes for missing values", () => {
    expect(formatPdfCurrencyTotal(16125, "USD")).toBe("$16,125.00");
    expect(formatPdfNumber(null)).toBe("—");
  });
});
