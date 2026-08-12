import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  SELECTION_PDF_EXPORT_PREFS_STORAGE_KEY,
  defaultSelectionPdfExportPrefs,
  normalizeSelectionPdfExportPrefs,
  readSelectionPdfExportPrefs,
  writeSelectionPdfExportPrefs,
} from "@/utils/selection_pdf_export_prefs.js";

describe("selection_pdf_export_prefs", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("returns type defaults when nothing saved", () => {
    const prefs = readSelectionPdfExportPrefs("sale invoice");
    expect(prefs.pricing_key).toBe("pf_invoiced_price");
    expect(prefs.show_customs_summary).toBe(false);
    expect(prefs.lang).toBe("en");
  });

  it("persists and restores prefs per selection type", () => {
    writeSelectionPdfExportPrefs("sale invoice", {
      lang: "fr",
      pricing_key: "pc_to",
      show_vat: true,
      vat_percent: 20,
      show_payment_line: false,
      show_customs_summary: true,
      bank_footer_id: "bf_1",
    });

    const sale = readSelectionPdfExportPrefs("sale invoice");
    expect(sale.lang).toBe("fr");
    expect(sale.pricing_key).toBe("pc_to");
    expect(sale.show_customs_summary).toBe(true);
    expect(sale.bank_footer_id).toBe("bf_1");

    const memo = readSelectionPdfExportPrefs("memo out");
    expect(memo.show_customs_summary).toBe(false);
    expect(memo.pricing_key).toBe(
      defaultSelectionPdfExportPrefs("memo out").pricing_key
    );
  });

  it("keeps empty pricing key as no price column", () => {
    const prefs = normalizeSelectionPdfExportPrefs(
      { pricing_key: "", show_customs_summary: true },
      "simple"
    );
    expect(prefs.pricing_key).toBe("");
    expect(prefs.show_customs_summary).toBe(true);
  });

  it("writes under the expected storage key", () => {
    writeSelectionPdfExportPrefs("importation", {
      show_customs_summary: true,
    });
    const raw = JSON.parse(
      localStorage.getItem(SELECTION_PDF_EXPORT_PREFS_STORAGE_KEY)
    );
    expect(raw.importation.show_customs_summary).toBe(true);
  });
});
