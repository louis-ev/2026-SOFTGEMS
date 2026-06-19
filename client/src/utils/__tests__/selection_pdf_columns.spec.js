import { describe, it, expect } from "vitest";
import {
  applySelectionPdfPricingKey,
  canAddSelectionPdfColumn,
  countSelectionPdfColumnUnits,
  selection_pdf_max_column_units,
} from "@/utils/selection_pdf_columns.js";
import { selectionPdfExportEnabled } from "@/utils/selection_pdf_export_registry.js";

describe("selectionPdfExportEnabled", () => {
  it("enables memo out and excludes memo in", () => {
    expect(selectionPdfExportEnabled("memo out")).toBe(true);
    expect(selectionPdfExportEnabled("memo in")).toBe(false);
    expect(selectionPdfExportEnabled("simple")).toBe(false);
  });
});

describe("selection pdf column units", () => {
  it("counts photo as two units", () => {
    expect(countSelectionPdfColumnUnits(["id", "$cover", "weight_ct"])).toBe(4);
  });

  it("blocks columns above the A4 cap", () => {
    const keys = ["id", "$cover", "stone_type", "weight_ct", "pc_to"];
    expect(countSelectionPdfColumnUnits(keys)).toBeLessThanOrEqual(
      selection_pdf_max_column_units
    );
    expect(canAddSelectionPdfColumn(keys, "color")).toBe(false);
  });

  it("applies pricing key within the cap", () => {
    const next = applySelectionPdfPricingKey(
      ["id", "stone_type", "weight_ct"],
      "pc_to"
    );
    expect(next).toContain("pc_to");
  });
});
