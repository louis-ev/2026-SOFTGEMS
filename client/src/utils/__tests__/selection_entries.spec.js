import { describe, expect, it } from "vitest";
import {
  normalizeSelectionGemPaths,
  sortSelectionGems,
} from "@/utils/selection_entries.js";

describe("normalizeSelectionGemPaths", () => {
  it("accepts string paths and ignores duplicates", () => {
    expect(
      normalizeSelectionGemPaths(["gems/3", " gems/1 ", "gems/3", "gems/1"])
    ).toEqual(["gems/3", "gems/1"]);
  });

  it("ignores non-string entries", () => {
    expect(
      normalizeSelectionGemPaths([
        "gems/1",
        { gem_path: "gems/2" },
        null,
        42,
      ])
    ).toEqual(["gems/1"]);
  });
});

describe("sortSelectionGems", () => {
  it("sorts by stone type then weight ascending", () => {
    const gems = [
      { $path: "gems/4", stone_type: "Sapphire", weight_ct: 2 },
      { $path: "gems/1", stone_type: "Ruby", weight_ct: 3 },
      { $path: "gems/2", stone_type: "Ruby", weight_ct: 1 },
      { $path: "gems/3", stone_type: "Emerald", weight_ct: 5 },
    ];
    expect(sortSelectionGems(gems).map((g) => g.$path)).toEqual([
      "gems/3",
      "gems/2",
      "gems/1",
      "gems/4",
    ]);
  });

  it("puts missing stone type or weight last within their group", () => {
    const gems = [
      { $path: "gems/2", stone_type: "Ruby", weight_ct: null },
      { $path: "gems/1", stone_type: "Ruby", weight_ct: 1 },
      { $path: "gems/3", stone_type: "", weight_ct: 2 },
    ];
    expect(sortSelectionGems(gems).map((g) => g.$path)).toEqual([
      "gems/1",
      "gems/2",
      "gems/3",
    ]);
  });
});
