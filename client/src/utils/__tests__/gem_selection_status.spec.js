import { describe, expect, it } from "vitest";
import {
  gemStatusForSelectionType,
  gemStatusSlugForSelectionType,
  resolveGemStatusFromMemberships,
  selectionTypeAffectsGemStatus,
} from "@/utils/gem_selection_status.js";

describe("gemStatusSlugForSelectionType", () => {
  it("maps selection types to stored status slugs", () => {
    expect(gemStatusSlugForSelectionType("memo in")).toBe("memo-in");
    expect(gemStatusSlugForSelectionType("buying invoice")).toBe(
      "buying-invoice"
    );
    expect(gemStatusSlugForSelectionType("sale invoice")).toBe("sale-invoice");
    expect(gemStatusSlugForSelectionType("return memo in")).toBe(
      "return-memo-in"
    );
    expect(gemStatusSlugForSelectionType("return memo out")).toBe(
      "return-memo-out"
    );
  });

  it("returns empty for types without status rule", () => {
    expect(gemStatusSlugForSelectionType("simple")).toBe("");
    expect(gemStatusSlugForSelectionType("boîte")).toBe("");
  });

  it("keeps gemStatusForSelectionType as an alias", () => {
    expect(gemStatusForSelectionType("sale invoice")).toBe("sale-invoice");
  });
});

describe("selectionTypeAffectsGemStatus", () => {
  it("is true only when a mapped status exists", () => {
    expect(selectionTypeAffectsGemStatus("memo in")).toBe(true);
    expect(selectionTypeAffectsGemStatus("simple")).toBe(false);
  });
});

describe("resolveGemStatusFromMemberships", () => {
  it("picks status from the most recently added selection", () => {
    const memberships = [
      {
        $path: "selections/1",
        selection_type: "memo in",
        selection_date: "2026-01-01",
      },
      {
        $path: "selections/2",
        selection_type: "sale invoice",
        selection_date: "2026-02-01",
      },
    ];
    const added_at_map = {
      "selections/1": "2026-06-01T10:00:00.000Z",
      "selections/2": "2026-06-02T10:00:00.000Z",
    };
    expect(
      resolveGemStatusFromMemberships(memberships, added_at_map)
    ).toBe("sale-invoice");
  });
});
