import { describe, it, expect } from "vitest";
import {
  allSelectionTypes,
  isValidSelectionTypeSlug,
  selectionSlugFromType,
  selectionTypeFromSlug,
} from "@/utils/selection_type_registry.js";
import {
  defaultSelectionInternalName,
  SELECTION_TYPE_VALUES,
} from "@/utils/selection_types.js";
import {
  selectionDetailPath,
  selectionListPath,
} from "@/utils/selection_urls.js";

describe("selection_type_registry", () => {
  it("covers all CDC selection types", () => {
    expect(allSelectionTypes()).toHaveLength(SELECTION_TYPE_VALUES.length);
    for (const value of SELECTION_TYPE_VALUES) {
      expect(selectionSlugFromType(value)).not.toBe("");
    }
  });

  it("maps slugs back to stored values", () => {
    expect(selectionTypeFromSlug("memo-in")).toBe("memo in");
    expect(selectionTypeFromSlug("box")).toBe("boîte");
    expect(isValidSelectionTypeSlug("memo-in")).toBe(true);
    expect(isValidSelectionTypeSlug("42-acme")).toBe(false);
  });
});

describe("defaultSelectionInternalName", () => {
  const t = (key) =>
    ({
      sg_selection_type_simple: "Simple selection",
      sg_selection_type_box: "Box",
      sg_selection_type_memo_in: "Memo in",
      sg_selection_type_return_memo_in: "Return memo in",
      sg_selection_type_buying_invoice: "Buying invoice",
      sg_selection_type_memo_out: "Memo out",
      sg_selection_type_return_memo_out: "Return memo out",
      sg_selection_type_sale_invoice: "Sale invoice",
      sg_selection_type_credit_note: "Credit note",
      sg_selection_type_importation: "Importation",
      sg_selection_type_importation_return: "Importation return",
    })[key] || key;

  it("uses the type label and document number", () => {
    expect(defaultSelectionInternalName(t, "memo in", "12")).toBe(
      "Memo in #12"
    );
    expect(defaultSelectionInternalName(t, "boîte", 3)).toBe("Box #3");
    expect(defaultSelectionInternalName(t, "sale invoice", "7")).toBe(
      "Sale invoice #7"
    );
  });

  it("returns empty when type or number is missing", () => {
    expect(defaultSelectionInternalName(t, "memo in", "")).toBe("");
    expect(defaultSelectionInternalName(t, "", "12")).toBe("");
  });
});

describe("selection_urls typed paths", () => {
  it("builds list and detail paths", () => {
    expect(selectionListPath("memo-in")).toBe("/selections/memo-in");
    expect(
      selectionDetailPath({
        type_slug: "memo-in",
        folder_slug: "42",
        internal_name: "Acme Memo",
      })
    ).toBe("/selections/memo-in/42");
  });
});
