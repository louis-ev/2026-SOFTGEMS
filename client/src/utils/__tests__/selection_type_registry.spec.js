import { describe, it, expect } from "vitest";
import {
  allSelectionTypes,
  isValidSelectionTypeSlug,
  selectionSlugFromType,
  selectionTypeFromSlug,
} from "@/utils/selection_type_registry.js";
import { SELECTION_TYPE_VALUES } from "@/utils/selection_types.js";
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
