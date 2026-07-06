import { describe, it, expect } from "vitest";
import {
  countSelectionPdfColumnUnits,
  decodeSelectionPdfExportQuery,
  encodeSelectionPdfExportQuery,
  resolveSelectionPdfExportPrefs,
  selectionPdfColumnHeaderLabel,
  selection_pdf_max_column_units,
} from "@/utils/selection_pdf_columns.js";
import {
  selectionPdfExportColumnKeys,
  selectionPdfExportEnabled,
  selectionPdfExportPricingKey,
} from "@/utils/selection_pdf_export_registry.js";
import { pdfShapeAbbreviation } from "@/suggestions/softgems/pdf_shape_abbreviations.js";
import { buildGemPdfDescriptionBlocks } from "@/utils/selection_pdf_description.js";

describe("selectionPdfExportEnabled", () => {
  it("enables memo out and excludes memo in", () => {
    expect(selectionPdfExportEnabled("memo out")).toBe(true);
    expect(selectionPdfExportEnabled("memo in")).toBe(false);
    expect(selectionPdfExportEnabled("simple")).toBe(false);
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

  it("resolves prefs from the registry only", () => {
    const prefs = resolveSelectionPdfExportPrefs("sale invoice");
    expect(prefs.metadata_keys).toEqual(
      selectionPdfExportColumnKeys("sale invoice")
    );
    expect(selectionPdfExportPricingKey("sale invoice")).toBe(
      "pf_invoiced_price"
    );
  });

  it("labels columns in English for PDF export", () => {
    expect(selectionPdfColumnHeaderLabel("$description")).toBe("Description");
    expect(selectionPdfColumnHeaderLabel("$per_carat")).toBe("$/ct");
    expect(selectionPdfColumnHeaderLabel("pf_invoiced_price", "USD")).toBe(
      "Total USD"
    );
  });

  it("encodes and decodes bank_footer_id in export query", () => {
    const query = encodeSelectionPdfExportQuery({
      metadata_keys: ["id", "$cover"],
      bank_footer_id: "bf_abc123",
    });
    expect(query).toContain("bank_footer_id=bf_abc123");
    const decoded = decodeSelectionPdfExportQuery({
      query: Object.fromEntries(new URLSearchParams(query)),
    });
    expect(decoded.bank_footer_id).toBe("bf_abc123");
  });

  it("decodes bank_footer_en from export query", () => {
    const decoded = decodeSelectionPdfExportQuery({
      query: {
        cols: "id",
        bank_footer_en: "Bank: Example\nIBAN: FR76…",
      },
    });
    expect(decoded.bank_footer_en).toBe("Bank: Example\nIBAN: FR76…");
  });
});

describe("pdf shape abbreviations", () => {
  it("maps known shapes and falls back for unknown values", () => {
    expect(pdfShapeAbbreviation("Round Brilliant")).toBe("RD");
    expect(pdfShapeAbbreviation("Oval")).toBe("OV");
    expect(pdfShapeAbbreviation("Cushion")).toBe("CN");
    expect(pdfShapeAbbreviation("Square Cushion")).toBe("SQ CN");
    expect(pdfShapeAbbreviation("Octagonal")).toBe("OCT");
    expect(pdfShapeAbbreviation("Octogonal")).toBe("OC");
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
