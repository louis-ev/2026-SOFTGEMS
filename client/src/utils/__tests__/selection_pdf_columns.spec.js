import { describe, it, expect } from "vitest";
import {
  countSelectionPdfColumnUnits,
  decodeSelectionPdfExportQuery,
  encodeSelectionPdfExportQuery,
  resolveSelectionPdfExportPrefs,
  resolveSelectionPdfShowPaymentLine,
  resolveSelectionPdfShowVat,
  selectionPdfColumnHeaderLabel,
  selectionPdfTableColPercents,
  selection_pdf_max_column_units,
} from "@/utils/selection_pdf_columns.js";
import {
  defaultSelectionPdfShowPaymentLine,
  defaultSelectionPdfShowVat,
  selectionPdfExportColumnKeys,
  selectionPdfExportEnabled,
  selectionPdfExportPricingKey,
} from "@/utils/selection_pdf_export_registry.js";
import { pdfShapeAbbreviation } from "@/suggestions/softgems/pdf_shape_abbreviations.js";
import { buildGemPdfDescriptionBlocks } from "@/utils/selection_pdf_description.js";

describe("selectionPdfExportEnabled", () => {
  it("enables all selection types including simple and memo in", () => {
    expect(selectionPdfExportEnabled("memo out")).toBe(true);
    expect(selectionPdfExportEnabled("simple")).toBe(true);
    expect(selectionPdfExportEnabled("boîte")).toBe(true);
    expect(selectionPdfExportEnabled("memo in")).toBe(true);
    expect(selectionPdfExportEnabled("importation")).toBe(true);
    expect(selectionPdfExportEnabled("")).toBe(false);
  });
});

describe("defaultSelectionPdfShowVat", () => {
  it("is on by default except memo out (off by default)", () => {
    expect(defaultSelectionPdfShowVat("memo out")).toBe(false);
    expect(defaultSelectionPdfShowVat("sale invoice")).toBe(true);
    expect(defaultSelectionPdfShowVat("return memo out")).toBe(true);
    expect(resolveSelectionPdfShowVat(null, "memo out")).toBe(false);
    expect(resolveSelectionPdfShowVat(null, "sale invoice")).toBe(true);
    expect(resolveSelectionPdfShowVat(true, "memo out")).toBe(true);
    expect(resolveSelectionPdfShowVat(false, "sale invoice")).toBe(false);
  });
});

describe("defaultSelectionPdfShowPaymentLine", () => {
  it("is on only for sale invoice and partner invoice", () => {
    expect(defaultSelectionPdfShowPaymentLine("sale invoice")).toBe(true);
    expect(defaultSelectionPdfShowPaymentLine("partner invoice")).toBe(true);
    expect(defaultSelectionPdfShowPaymentLine("memo out")).toBe(false);
    expect(defaultSelectionPdfShowPaymentLine("buying invoice")).toBe(false);
    expect(defaultSelectionPdfShowPaymentLine("credit note")).toBe(false);
    expect(resolveSelectionPdfShowPaymentLine(null, "sale invoice")).toBe(true);
    expect(resolveSelectionPdfShowPaymentLine(null, "memo out")).toBe(false);
    expect(resolveSelectionPdfShowPaymentLine(true, "memo out")).toBe(true);
  });
});

describe("selection pdf fixed columns", () => {
  it("uses eight column units for priced layouts", () => {
    const keys = selectionPdfExportColumnKeys("memo out");
    expect(keys).toContain("$description");
    expect(keys).toContain("$per_carat");
    expect(keys).toContain("pc_to");
    expect(countSelectionPdfColumnUnits(keys)).toBe(
      selection_pdf_max_column_units
    );
  });

  it("omits pricing columns for box selections", () => {
    const keys = selectionPdfExportColumnKeys("boîte");
    expect(keys).not.toContain("$per_carat");
    expect(keys).not.toContain("pc_to");
  });

  it("builds columns from an explicit pricing override", () => {
    const keys = selectionPdfExportColumnKeys("boîte", "pv_selling_price");
    expect(keys).toContain("$per_carat");
    expect(keys).toContain("pv_selling_price");
    expect(selectionPdfExportColumnKeys("boîte", null)).toEqual(
      selectionPdfExportColumnKeys("boîte")
    );
    expect(selectionPdfExportColumnKeys("boîte", "")).toEqual(
      selectionPdfExportColumnKeys("boîte")
    );
  });

  it("resolves prefs from the registry only", () => {
    const prefs = resolveSelectionPdfExportPrefs("sale invoice");
    expect(prefs.metadata_keys).toEqual(
      selectionPdfExportColumnKeys("sale invoice")
    );
    expect(selectionPdfExportPricingKey("sale invoice")).toBe(
      "pf_invoiced_price"
    );
  });

  it("labels columns from column size.pdf", () => {
    expect(selectionPdfColumnHeaderLabel("$description")).toBe("Description");
    expect(selectionPdfColumnHeaderLabel("$per_carat")).toBe("Price /ct");
    expect(selectionPdfColumnHeaderLabel("pf_invoiced_price", "USD")).toBe(
      "Total"
    );
    expect(selectionPdfColumnHeaderLabel("weight_ct")).toBe("Weight");
    expect(selectionPdfColumnHeaderLabel("number_of_pieces")).toBe("Qty");
    expect(selectionPdfColumnHeaderLabel("id")).toBe("REF");
  });

  it("labels columns in French when lang is fr", () => {
    expect(selectionPdfColumnHeaderLabel("number_of_pieces", "fr")).toBe("Qté");
    expect(selectionPdfColumnHeaderLabel("weight_ct", "fr")).toBe("Poids");
    expect(selectionPdfColumnHeaderLabel("$per_carat", "fr")).toBe("Prix /ct");
  });

  it("assigns table column percents from column size.pdf (sum 100)", () => {
    const priced = selectionPdfTableColPercents(
      selectionPdfExportColumnKeys("memo out")
    );
    const priced_sum = priced.reduce((sum, col) => sum + col.percent, 0);
    expect(priced_sum).toBeCloseTo(100, 5);
    expect(priced.find((col) => col.key === "__no__")?.percent).toBeCloseTo(
      5,
      5
    );
    expect(priced.find((col) => col.key === "id")?.percent).toBeCloseTo(7.5, 5);
    expect(priced.find((col) => col.key === "$description")?.percent).toBeCloseTo(
      30,
      5
    );
    expect(priced.find((col) => col.key === "$cover")?.percent).toBeCloseTo(
      15,
      5
    );
    expect(
      priced.find((col) => col.key === "number_of_pieces")?.percent
    ).toBeCloseTo(7.5, 5);
    expect(priced.find((col) => col.key === "weight_ct")?.percent).toBeCloseTo(
      10,
      5
    );
    expect(priced.find((col) => col.key === "$per_carat")?.percent).toBeCloseTo(
      11,
      5
    );
    expect(priced.find((col) => col.key === "pc_to")?.percent).toBeCloseTo(
      14,
      5
    );

    const unpriced = selectionPdfTableColPercents(
      selectionPdfExportColumnKeys("boîte")
    );
    const unpriced_sum = unpriced.reduce((sum, col) => sum + col.percent, 0);
    expect(unpriced_sum).toBeCloseTo(100, 5);
    expect(
      unpriced.find((col) => col.key === "$description")?.percent
    ).toBeGreaterThan(priced.find((col) => col.key === "$description")?.percent);
  });

  it("encodes and decodes bank_footer_id in export query", () => {
    const query = encodeSelectionPdfExportQuery({
      metadata_keys: ["id", "$cover"],
      bank_footer_id: "bf_abc123",
    });
    expect(query).toContain("bank_footer_id=bf_abc123");
    expect(query).toContain("lang=en");
    const decoded = decodeSelectionPdfExportQuery({
      query: Object.fromEntries(new URLSearchParams(query)),
    });
    expect(decoded.bank_footer_id).toBe("bf_abc123");
    expect(decoded.lang).toBe("en");
  });

  it("encodes and decodes export language", () => {
    const query = encodeSelectionPdfExportQuery({
      metadata_keys: ["id"],
      lang: "fr",
    });
    expect(query).toContain("lang=fr");
    const decoded = decodeSelectionPdfExportQuery({
      query: Object.fromEntries(new URLSearchParams(query)),
    });
    expect(decoded.lang).toBe("fr");
  });

  it("encodes and decodes show_vat in export query", () => {
    const with_vat = encodeSelectionPdfExportQuery({
      metadata_keys: ["id"],
      show_vat: true,
    });
    expect(with_vat).toContain("show_vat=1");
    expect(
      decodeSelectionPdfExportQuery({
        query: Object.fromEntries(new URLSearchParams(with_vat)),
      }).show_vat
    ).toBe(true);

    const without_vat = encodeSelectionPdfExportQuery({
      metadata_keys: ["id"],
      show_vat: false,
    });
    expect(without_vat).toContain("show_vat=0");
    expect(
      decodeSelectionPdfExportQuery({
        query: Object.fromEntries(new URLSearchParams(without_vat)),
      }).show_vat
    ).toBe(false);

    expect(
      decodeSelectionPdfExportQuery({ query: { cols: "id" } }).show_vat
    ).toBeNull();
  });

  it("encodes and decodes vat_percent in export query", () => {
    const query = encodeSelectionPdfExportQuery({
      metadata_keys: ["id"],
      vat_percent: 5.5,
    });
    expect(query).toContain("vat_percent=5.5");
    expect(
      decodeSelectionPdfExportQuery({
        query: Object.fromEntries(new URLSearchParams(query)),
      }).vat_percent
    ).toBe(5.5);

    expect(
      decodeSelectionPdfExportQuery({ query: { cols: "id" } }).vat_percent
    ).toBe(20);
  });

  it("encodes and decodes show_payment_line in export query", () => {
    const enabled = encodeSelectionPdfExportQuery({
      metadata_keys: ["id"],
      show_payment_line: true,
    });
    expect(enabled).toContain("show_payment_line=1");
    expect(
      decodeSelectionPdfExportQuery({
        query: Object.fromEntries(new URLSearchParams(enabled)),
      }).show_payment_line
    ).toBe(true);

    const disabled = encodeSelectionPdfExportQuery({
      metadata_keys: ["id"],
      show_payment_line: false,
    });
    expect(disabled).toContain("show_payment_line=0");
    expect(
      decodeSelectionPdfExportQuery({
        query: Object.fromEntries(new URLSearchParams(disabled)),
      }).show_payment_line
    ).toBe(false);

    expect(
      decodeSelectionPdfExportQuery({ query: { cols: "id" } }).show_payment_line
    ).toBeNull();
  });

  it("encodes and decodes show_customs_summary in export query", () => {
    const enabled = encodeSelectionPdfExportQuery({
      metadata_keys: ["id"],
      show_customs_summary: true,
    });
    expect(enabled).toContain("show_customs_summary=1");
    expect(
      decodeSelectionPdfExportQuery({
        query: Object.fromEntries(new URLSearchParams(enabled)),
      }).show_customs_summary
    ).toBe(true);

    const disabled = encodeSelectionPdfExportQuery({
      metadata_keys: ["id"],
      show_customs_summary: false,
    });
    expect(disabled).toContain("show_customs_summary=0");
    expect(
      decodeSelectionPdfExportQuery({
        query: Object.fromEntries(new URLSearchParams(disabled)),
      }).show_customs_summary
    ).toBe(false);

    expect(
      decodeSelectionPdfExportQuery({ query: { cols: "id" } })
        .show_customs_summary
    ).toBe(false);
  });

  it("decodes bank_footer_en from export query", () => {
    const decoded = decodeSelectionPdfExportQuery({
      query: {
        cols: "id",
        bank_footer_en: "Bank: Example\nIBAN: FR76…",
      },
    });
    expect(decoded.bank_footer_en).toBe("Bank: Example\nIBAN: FR76…");
    expect(decoded.lang).toBe("en");
  });
});

describe("pdf shape abbreviations", () => {
  it("maps known shapes and falls back for unknown values", () => {
    expect(pdfShapeAbbreviation("Round Brilliant")).toBe("RD");
    expect(pdfShapeAbbreviation("Oval")).toBe("OV");
    expect(pdfShapeAbbreviation("Cushion")).toBe("CN");
    expect(pdfShapeAbbreviation("Square Cushion")).toBe("SQ CN");
    expect(pdfShapeAbbreviation("Octagonal")).toBe("OCT");
    expect(pdfShapeAbbreviation("Octogonal")).toBe("OCT");
    expect(pdfShapeAbbreviation("Cabochon")).toBe("CAB");
    expect(pdfShapeAbbreviation("Custom Fancy")).toBe("CF");
  });
});

describe("pdf description blocks", () => {
  it("builds title, origin, and country of cut lines", () => {
    const blocks = buildGemPdfDescriptionBlocks({
      color: "Blue",
      stone_type: "sapphire",
      shape: "Oval",
      origin_country: "Sri Lanka",
      country_of_cut: "Thailand",
      treatment_type: "No heat",
    });
    expect(blocks[0].text).toBe("Blue sapphire OV");
    expect(blocks.some((b) => b.text === "Origin: Sri Lanka")).toBe(true);
    expect(blocks.some((b) => b.text === "Country of cut: Thailand")).toBe(
      true
    );
  });
});
