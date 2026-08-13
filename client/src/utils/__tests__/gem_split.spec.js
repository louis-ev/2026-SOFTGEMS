import { describe, expect, it } from "vitest";
import { GEM_STATUS_REFERENCE } from "@/utils/gem_status.js";
import {
  appendGemSplitRecord,
  buildGemSplitNewMeta,
  buildGemSplitOriginalMeta,
  canSplitGem,
  computeGemSplitPlan,
  formatGemSplitWeightInput,
  formatGemSplitsDisplay,
  gemSplitAcceptedPiecesRange,
  gemSplitCostPerCarat,
  listGemSplitComparisonRows,
  listGemSplitNewChanges,
  listGemSplitOriginalChanges,
  suggestedGemSplitWeight,
  validateGemSplitDraft,
  validateGemSplitPiecesDraft,
} from "@/utils/gem_split.js";

const t = (key) => key;

const parcel = {
  $path: "gems/12",
  weight_ct: 50,
  number_of_pieces: 20,
  base_price_pcb: 10000,
  import_price: 12000,
  pv_selling_price: 15000,
  status: "buying-invoice",
  paired_gem: "9",
};

describe("gemSplitCostPerCarat", () => {
  it("returns Cost /ct when weight and cost are set", () => {
    expect(gemSplitCostPerCarat(parcel)).toBe(200);
  });

  it("returns null when cost is missing", () => {
    expect(gemSplitCostPerCarat({ weight_ct: 10 })).toBe(null);
  });
});

describe("canSplitGem", () => {
  it("requires more than one piece", () => {
    expect(canSplitGem({ number_of_pieces: 2 })).toBe(true);
    expect(canSplitGem({ number_of_pieces: 1 })).toBe(false);
    expect(canSplitGem({ number_of_pieces: 0 })).toBe(false);
    expect(canSplitGem({})).toBe(false);
  });
});

describe("gemSplitAcceptedPiecesRange", () => {
  it("allows 1 through original minus 1", () => {
    expect(gemSplitAcceptedPiecesRange(parcel)).toEqual({ min: 1, max: 19 });
    expect(gemSplitAcceptedPiecesRange({ number_of_pieces: 2 })).toEqual({
      min: 1,
      max: 1,
    });
    expect(gemSplitAcceptedPiecesRange({ number_of_pieces: 1 })).toBe(null);
  });
});

describe("suggestedGemSplitWeight", () => {
  it("splits weight in proportion to pieces", () => {
    expect(suggestedGemSplitWeight(parcel, 4)).toBe(10);
    expect(suggestedGemSplitWeight(parcel, 1)).toBe(2.5);
    expect(suggestedGemSplitWeight(parcel, 20)).toBe(null);
    expect(formatGemSplitWeightInput(2.5)).toBe("2.5");
  });
});

describe("validateGemSplitPiecesDraft", () => {
  it("accepts a count that leaves at least one piece", () => {
    const draft = validateGemSplitPiecesDraft({
      gem: parcel,
      new_pieces_raw: "4",
    });
    expect(draft.ok).toBe(true);
    expect(draft.new_pieces).toBe(4);
    expect(draft.remaining_pieces).toBe(16);
  });

  it("rejects taking all remaining pieces", () => {
    const draft = validateGemSplitPiecesDraft({
      gem: parcel,
      new_pieces_raw: "20",
    });
    expect(draft.ok).toBe(false);
    expect(draft.errors).toContain("sg_split_gem_error_pieces_too_large");
  });
});

describe("validateGemSplitDraft", () => {
  it("accepts a weight and pieces split that leaves a remainder", () => {
    const draft = validateGemSplitDraft({
      gem: parcel,
      new_weight_raw: "10",
      new_pieces_raw: "4",
    });
    expect(draft.ok).toBe(true);
    expect(draft.new_weight).toBe(10);
    expect(draft.remaining_weight).toBe(40);
    expect(draft.new_pieces).toBe(4);
    expect(draft.remaining_pieces).toBe(16);
  });

  it("rejects a new weight that consumes the original", () => {
    const draft = validateGemSplitDraft({
      gem: parcel,
      new_weight_raw: "50",
      new_pieces_raw: "",
    });
    expect(draft.ok).toBe(false);
    expect(draft.errors).toContain("sg_split_gem_error_weight_too_large");
  });

  it("rejects pieces above the original count", () => {
    const draft = validateGemSplitDraft({
      gem: parcel,
      new_weight_raw: "10",
      new_pieces_raw: "21",
    });
    expect(draft.ok).toBe(false);
    expect(draft.errors).toContain("sg_split_gem_error_pieces_too_large");
  });

  it("rejects when the original has only one piece", () => {
    const draft = validateGemSplitDraft({
      gem: { $path: "gems/1", weight_ct: 8, number_of_pieces: 1 },
      new_weight_raw: "2",
      new_pieces_raw: "1",
    });
    expect(draft.ok).toBe(false);
    expect(draft.errors).toContain("sg_split_gem_error_original_pieces");
  });

  it("rejects taking all remaining pieces", () => {
    const draft = validateGemSplitDraft({
      gem: parcel,
      new_weight_raw: "10",
      new_pieces_raw: "20",
    });
    expect(draft.ok).toBe(false);
    expect(draft.errors).toContain("sg_split_gem_error_pieces_too_large");
  });
});

describe("computeGemSplitPlan", () => {
  it("scales every priced line from its own /ct when Cost /ct exists", () => {
    const plan = computeGemSplitPlan({
      gem: parcel,
      new_weight_raw: "10",
      new_pieces_raw: "4",
    });
    expect(plan.ok).toBe(true);
    expect(plan.prices_scaled).toBe(true);
    expect(plan.new_prices).toEqual({
      base_price_pcb: 2000,
      import_price: 2400,
      pv_selling_price: 3000,
    });
    expect(plan.original_prices).toEqual({
      base_price_pcb: 8000,
      import_price: 9600,
      pv_selling_price: 12000,
    });
  });

  it("does not scale prices when Cost /ct is unavailable", () => {
    const plan = computeGemSplitPlan({
      gem: {
        $path: "gems/1",
        weight_ct: 8,
        number_of_pieces: 4,
        pv_selling_price: 400,
      },
      new_weight_raw: "2",
      new_pieces_raw: "1",
    });
    expect(plan.ok).toBe(true);
    expect(plan.prices_scaled).toBe(false);
    expect(plan.new_prices).toEqual({});
    expect(plan.original_prices).toEqual({});
  });
});

describe("buildGemSplit meta", () => {
  it("applies duplicate resets plus split fields on the copy", () => {
    const plan = computeGemSplitPlan({
      gem: parcel,
      new_weight_raw: "10",
      new_pieces_raw: "4",
    });
    expect(buildGemSplitNewMeta({ plan, parent_id: "12" })).toEqual({
      paired_gem: "",
      box_selection_path: "",
      selection_membership_paths: {},
      status: GEM_STATUS_REFERENCE,
      splits: [],
      parent_id: "12",
      weight_ct: 10,
      number_of_pieces: 4,
      base_price_pcb: 2000,
      import_price: 2400,
      pv_selling_price: 3000,
    });
    expect(buildGemSplitOriginalMeta(plan)).toEqual({
      weight_ct: 40,
      number_of_pieces: 16,
      base_price_pcb: 8000,
      import_price: 9600,
      pv_selling_price: 12000,
    });
    expect(
      buildGemSplitOriginalMeta(plan, {
        gem: {
          splits: [{ id: "40", date: "2026-01-01T00:00:00.000Z" }],
        },
        new_gem_id: "45",
        split_date: "2026-08-13T18:00:00.000Z",
      })
    ).toMatchObject({
      splits: [
        { id: "40", date: "2026-01-01T00:00:00.000Z" },
        { id: "45", date: "2026-08-13T18:00:00.000Z" },
      ],
    });
  });
});

describe("listGemSplit changes", () => {
  it("lists original remainder and new-gem split plus duplicate resets", () => {
    const plan = computeGemSplitPlan({
      gem: parcel,
      new_weight_raw: "10",
      new_pieces_raw: "4",
    });
    const original_keys = listGemSplitOriginalChanges(parcel, plan, t).map(
      (row) => row.key
    );
    expect(original_keys).toEqual([
      "weight_ct",
      "number_of_pieces",
      "base_price_pcb",
      "import_price",
      "pv_selling_price",
    ]);
    const new_keys = listGemSplitNewChanges(parcel, plan, t).map(
      (row) => row.key
    );
    expect(new_keys[0]).toBe("id");
    expect(new_keys[1]).toBe("parent_id");
    expect(new_keys).toContain("weight_ct");
    expect(new_keys).toContain("status");
    expect(new_keys).toContain("history");

    const comparison = listGemSplitComparisonRows(parcel, plan, t);
    expect(comparison.map((row) => row.key)).toEqual([
      "number_of_pieces",
      "weight_ct",
      "base_price_pcb",
      "import_price",
      "pv_selling_price",
    ]);
    expect(comparison[0]).toMatchObject({
      original_from: "20",
      original_to: "16",
      new_to: "4",
    });
    expect(comparison[1]).toMatchObject({
      original_from: "50 ct",
      original_to: "40 ct",
      new_to: "10 ct",
    });
  });
});

describe("appendGemSplitRecord", () => {
  it("appends id and date without dropping earlier splits", () => {
    const next = appendGemSplitRecord(
      [{ id: "40", date: "2026-01-01T00:00:00.000Z" }],
      { id: "45", date: "2026-08-13T18:00:00.000Z" }
    );
    expect(next).toEqual([
      { id: "40", date: "2026-01-01T00:00:00.000Z" },
      { id: "45", date: "2026-08-13T18:00:00.000Z" },
    ]);
    expect(
      formatGemSplitsDisplay(next, () => "13/08/2026")
    ).toBe("#40 · 13/08/2026, #45 · 13/08/2026");
  });
});
