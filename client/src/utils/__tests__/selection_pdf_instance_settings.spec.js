import { describe, expect, it } from "vitest";
import {
  SELECTION_PDF_BANK_FOOTER_EN,
  SELECTION_PDF_BANK_FOOTER_NONE_ID,
  coerceSelectionPdfBankFooterSelection,
  createEmptySelectionPdfBankFooterPreset,
  defaultSelectionPdfBankFooterId,
  normalizeSelectionPdfBankFootersEn,
  readSelectionPdfBankFootersEn,
  resolveSelectionPdfBankFooterBody,
} from "@/utils/selection_pdf_instance_settings.js";

describe("selection pdf instance settings", () => {
  it("exposes the instance meta key constant", () => {
    expect(SELECTION_PDF_BANK_FOOTER_EN).toBe("selection_pdf_bank_footer_en");
  });

  it("normalizes preset arrays only", () => {
    expect(normalizeSelectionPdfBankFootersEn("legacy")).toEqual([]);
    expect(
      normalizeSelectionPdfBankFootersEn([
        { id: "bf_1", internal_name: "SG USD", body: "Bank: Example" },
        { id: "", internal_name: "Bad", body: "x" },
      ])
    ).toEqual([{ id: "bf_1", internal_name: "SG USD", body: "Bank: Example" }]);
  });

  it("reads presets from instance meta", () => {
    expect(
      readSelectionPdfBankFootersEn({
        selection_pdf_bank_footer_en: [
          { id: "bf_a", internal_name: "A", body: "Line 1" },
        ],
      })
    ).toEqual([{ id: "bf_a", internal_name: "A", body: "Line 1" }]);
  });

  it("resolves body by id and supports no footer", () => {
    const presets = [
      { id: "bf_a", internal_name: "A", body: "First" },
      { id: "bf_b", internal_name: "B", body: "Second" },
    ];
    expect(resolveSelectionPdfBankFooterBody(presets, { id: "bf_b" })).toBe(
      "Second"
    );
    expect(resolveSelectionPdfBankFooterBody(presets, { id: "missing" })).toBe(
      ""
    );
    expect(resolveSelectionPdfBankFooterBody(presets, { id: "" })).toBe("");
    expect(
      resolveSelectionPdfBankFooterBody(presets, {
        id: SELECTION_PDF_BANK_FOOTER_NONE_ID,
      })
    ).toBe("");
  });

  it("defaults bank footer selection to no footer", () => {
    const presets = [
      { id: "bf_a", internal_name: "A", body: "First" },
      { id: "bf_b", internal_name: "B", body: "Second" },
    ];
    expect(defaultSelectionPdfBankFooterId(presets)).toBe(
      SELECTION_PDF_BANK_FOOTER_NONE_ID
    );
  });

  it("coerces invalid or empty selection to no footer", () => {
    const presets = [
      { id: "bf_a", internal_name: "A", body: "First" },
      { id: "bf_b", internal_name: "B", body: "Second" },
    ];
    expect(coerceSelectionPdfBankFooterSelection(presets, "bf_b")).toBe("bf_b");
    expect(coerceSelectionPdfBankFooterSelection(presets, "missing")).toBe(
      SELECTION_PDF_BANK_FOOTER_NONE_ID
    );
    expect(coerceSelectionPdfBankFooterSelection(presets, "")).toBe(
      SELECTION_PDF_BANK_FOOTER_NONE_ID
    );
    expect(
      coerceSelectionPdfBankFooterSelection(
        presets,
        SELECTION_PDF_BANK_FOOTER_NONE_ID
      )
    ).toBe(SELECTION_PDF_BANK_FOOTER_NONE_ID);
  });

  it("creates empty presets with ids", () => {
    const preset = createEmptySelectionPdfBankFooterPreset();
    expect(preset.id).toMatch(/^bf_/);
    expect(preset.internal_name).toBe("");
    expect(preset.body).toBe("");
  });
});
