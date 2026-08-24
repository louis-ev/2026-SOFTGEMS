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
      "Consignment No. 12"
    );
    expect(selectionPdfT("fr", "title_memo_out", { number: "12" })).toBe(
      "Consignation N\u00b012"
    );
    expect(selectionPdfT("en", "order_number")).toBe("Purchase order No.:");
    expect(selectionPdfT("fr", "order_number")).toBe("N\u00b0 Commande :");
  });

  it("interpolates the payment line with lowercase words and cents", () => {
    expect(
      selectionPdfT("en", "payment_line", {
        amount_words:
          "four hundred twenty-four thousand four hundred seventy-six",
        currency_name: "dollars",
        cents_clause: " and fifty cents",
        amount: "424\u00a0476.50",
        currency_code_display: "$US",
      })
    ).toBe(
      "Please kindly transfer four hundred twenty-four thousand four hundred seventy-six dollars and fifty cents (424\u00a0476.50 $US)."
    );
    expect(
      selectionPdfT("fr", "payment_line", {
        amount_words: "seize mille cent vingt-cinq",
        currency_name: "euros",
        cents_clause: "",
        amount: "16\u00a0125.00",
        currency_code_display: "\u20AC",
      })
    ).toBe(
      "Merci de bien vouloir virer seize mille cent vingt-cinq euros (16\u00a0125.00 \u20AC)."
    );
  });

  it("returns accented French footer lines", () => {
    const fr = selectionPdfFooterLines("fr");
    expect(fr[0]).toContain("SI\u00c8GE SOCIAL");
    expect(fr[1]).toContain("SAS AU CAPITAL");
    const en = selectionPdfFooterLines("en");
    expect(en[0]).toContain("Registered Office");
    expect(en[1]).toContain("SIRET No.");
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
