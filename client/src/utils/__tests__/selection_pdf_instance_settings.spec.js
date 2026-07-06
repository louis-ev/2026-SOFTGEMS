import { describe, expect, it } from "vitest";
import {
  SELECTION_PDF_BANK_FOOTER_EN,
  parseSelectionPdfBankFooterLines,
  readSelectionPdfBankFooterEn,
} from "@/utils/selection_pdf_instance_settings.js";

describe("selection pdf instance settings", () => {
  it("exposes the instance meta key constant", () => {
    expect(SELECTION_PDF_BANK_FOOTER_EN).toBe("selection_pdf_bank_footer_en");
  });

  it("reads the bank footer from instance meta", () => {
    expect(
      readSelectionPdfBankFooterEn({
        selection_pdf_bank_footer_en: "Bank: Example\nIBAN: FR76…",
      })
    ).toBe("Bank: Example\nIBAN: FR76…");
  });

  it("parses non-empty footer lines", () => {
    expect(parseSelectionPdfBankFooterLines("Bank: A\n\nIBAN: X")).toEqual([
      "Bank: A",
      "IBAN: X",
    ]);
  });
});
