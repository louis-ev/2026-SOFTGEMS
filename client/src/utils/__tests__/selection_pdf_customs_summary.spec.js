import { describe, it, expect } from "vitest";
import {
  buildCustomsSummaryGroups,
  CUSTOMS_HS_CODE_PF,
  CUSTOMS_HS_CODE_RSE,
  isRseStoneType,
  resolveGemImportationGroupPath,
} from "@/utils/selection_pdf_customs_summary.js";

describe("isRseStoneType", () => {
  it("matches ruby, sapphire, emerald and star variants", () => {
    expect(isRseStoneType("Ruby")).toBe(true);
    expect(isRseStoneType("Sapphire")).toBe(true);
    expect(isRseStoneType("Emerald")).toBe(true);
    expect(isRseStoneType("Star Ruby")).toBe(true);
    expect(isRseStoneType("Star Sapphire")).toBe(true);
    expect(isRseStoneType("EMERALD")).toBe(true);
  });

  it("treats other stones as PF", () => {
    expect(isRseStoneType("Spinel")).toBe(false);
    expect(isRseStoneType("Corundum")).toBe(false);
    expect(isRseStoneType("Tourmaline")).toBe(false);
    expect(isRseStoneType("")).toBe(false);
    expect(isRseStoneType(null)).toBe(false);
  });
});

describe("resolveGemImportationGroupPath", () => {
  it("returns empty when no importation membership", () => {
    expect(
      resolveGemImportationGroupPath({
        selection_membership_paths: { "memo-out/1": "2024-01-01T00:00:00.000Z" },
      })
    ).toBe("");
  });

  it("ignores importation-return paths", () => {
    expect(
      resolveGemImportationGroupPath({
        selection_membership_paths: {
          "importation-return/2": "2024-06-01T00:00:00.000Z",
        },
      })
    ).toBe("");
  });

  it("picks the most recently added importation", () => {
    expect(
      resolveGemImportationGroupPath({
        selection_membership_paths: {
          "importation/1": "2024-01-01T00:00:00.000Z",
          "importation/3": "2024-06-01T00:00:00.000Z",
          "sale-invoice/9": "2025-01-01T00:00:00.000Z",
        },
      })
    ).toBe("importation/3");
  });
});

describe("buildCustomsSummaryGroups", () => {
  it("groups by importation and splits RSE vs PF", () => {
    const groups = buildCustomsSummaryGroups(
      [
        {
          stone_type: "Ruby",
          number_of_pieces: 1,
          weight_ct: 2,
          pf_invoiced_price: 100,
          selection_membership_paths: {
            "importation/2": "2024-01-01T00:00:00.000Z",
          },
        },
        {
          stone_type: "Spinel",
          number_of_pieces: 2,
          weight_ct: 3,
          pf_invoiced_price: 50,
          selection_membership_paths: {
            "importation/2": "2024-01-01T00:00:00.000Z",
          },
        },
        {
          stone_type: "Sapphire",
          number_of_pieces: 1,
          weight_ct: 1.5,
          pf_invoiced_price: 200,
          selection_membership_paths: {},
        },
      ],
      "pf_invoiced_price"
    );

    expect(groups).toHaveLength(2);
    expect(groups[0].importation_path).toBe("importation/2");
    expect(groups[0].document_number).toBe("2");
    expect(groups[0].rse).toEqual({
      quantity: 1,
      weight: 2,
      total: 100,
    });
    expect(groups[0].pf).toEqual({
      quantity: 2,
      weight: 3,
      total: 50,
    });
    expect(groups[0].group_total).toEqual({
      quantity: 3,
      weight: 5,
      total: 150,
    });

    expect(groups[1].importation_path).toBe("");
    expect(groups[1].rse).toEqual({
      quantity: 1,
      weight: 1.5,
      total: 200,
    });
    expect(groups[1].pf).toEqual({
      quantity: null,
      weight: null,
      total: null,
    });
  });

  it("omits price totals when no pricing key", () => {
    const groups = buildCustomsSummaryGroups(
      [
        {
          stone_type: "Emerald",
          number_of_pieces: 1,
          weight_ct: 1,
          import_price: 99,
        },
      ],
      ""
    );
    expect(groups[0].rse.total).toBeNull();
    expect(groups[0].group_total.total).toBeNull();
  });

  it("exposes HS code constants", () => {
    expect(CUSTOMS_HS_CODE_RSE).toBe("710 391");
    expect(CUSTOMS_HS_CODE_PF).toBe("710 399");
  });
});
