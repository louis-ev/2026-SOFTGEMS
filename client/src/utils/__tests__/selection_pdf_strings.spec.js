import { describe, it, expect } from "vitest";
import {
  normalizeSelectionPdfLang,
  selectionPdfFooterLines,
  selectionPdfT,
} from "@/utils/selection_pdf_strings.js";

describe("selection_pdf_strings", () => {
  it("normalizes export language", () => {
    expect(normalizeSelectionPdfLang("fr")).toBe("fr");
    expect(normalizeSelectionPdfLang("FR")).toBe("fr");
    expect(normalizeSelectionPdfLang("en")).toBe("en");
    expect(normalizeSelectionPdfLang("")).toBe("en");
    expect(normalizeSelectionPdfLang("de")).toBe("en");
  });

  it("interpolates bilingual labels", () => {
    expect(selectionPdfT("en", "title_memo_out", { number: "12" })).toBe(
      "Consignment N\u00b012"
    );
    expect(selectionPdfT("fr", "title_memo_out", { number: "12" })).toBe(
      "Consignation N\u00b012"
    );
    expect(selectionPdfT("en", "order_number")).toBe("Purchase order N\u00b0 :");
    expect(selectionPdfT("fr", "order_number")).toBe("N\u00b0 Commande :");
  });

  it("returns accented French footer lines", () => {
    const fr = selectionPdfFooterLines("fr");
    expect(fr[0]).toContain("SI\u00c8GE SOCIAL");
    expect(fr[1]).toContain("SAS AU CAPITAL");
    const en = selectionPdfFooterLines("en");
    expect(en[0]).toContain("Registered Office");
    expect(en[1]).toContain("share capital");
  });

  it("has bilingual memo-out consignment legal text", () => {
    expect(selectionPdfT("en", "legal_memo_out")).toContain(
      "consignment (deposit) basis"
    );
    expect(selectionPdfT("en", "legal_memo_out")).toContain("Consignee");
    expect(selectionPdfT("fr", "legal_memo_out")).toContain(
      "titre de d\u00e9p\u00f4t (consignation)"
    );
    expect(selectionPdfT("fr", "legal_memo_out")).toContain(
      "valeur totale toutes taxes comprises"
    );
  });
});
