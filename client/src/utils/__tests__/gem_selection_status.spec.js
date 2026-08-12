import { describe, expect, it } from "vitest";
import {
  gemStatusForSelectionType,
  gemStatusSlugForSelectionType,
  resolveGemStatusFromHistoryBeforeRemoval,
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
    expect(gemStatusSlugForSelectionType("importation return")).toBe(
      "importation-return"
    );
  });

  it("returns empty for types without status rule", () => {
    expect(gemStatusSlugForSelectionType("simple")).toBe("");
    expect(gemStatusSlugForSelectionType("boîte")).toBe("");
    expect(gemStatusSlugForSelectionType("importation")).toBe("");
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

describe("resolveGemStatusFromHistoryBeforeRemoval", () => {
  it("returns the status before the removed selection’s imposed slug", () => {
    const history = [
      {
        event: "updated",
        ts: "2026-06-02T12:00:00.000Z",
        field: "status",
        value: "memo-in",
      },
      {
        event: "updated",
        ts: "2026-05-01T10:00:00.000Z",
        field: "status",
        value: "reference",
      },
    ];
    expect(
      resolveGemStatusFromHistoryBeforeRemoval(
        history,
        "memo-in",
        "memo in"
      )
    ).toBe("reference");
  });

  it("does not restore when current status was edited away from the selection slug", () => {
    const history = [
      {
        event: "updated",
        ts: "2026-06-03T00:00:00.000Z",
        field: "status",
        value: "sale-invoice",
      },
      {
        event: "updated",
        ts: "2026-06-02T00:00:00.000Z",
        field: "status",
        value: "memo-in",
      },
    ];
    expect(
      resolveGemStatusFromHistoryBeforeRemoval(
        history,
        "sale-invoice",
        "memo in"
      )
    ).toBe("");
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
