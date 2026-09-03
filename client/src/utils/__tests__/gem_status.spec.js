import { describe, expect, it } from "vitest";
import {
  GEM_STATUS_REFERENCE,
  gemStatusLabel,
  normalizeGemStatusSlug,
} from "@/utils/gem_status.js";

const t = (key) => {
  const map = {
    sg_status_value_reference: "Reference",
    sg_status_value_memo_in: "Memo in",
    sg_status_value_purchased: "Purchased",
    sg_status_value_sold: "Sold",
    sg_status_value_returned: "Returned",
  };
  return map[key] || key;
};

describe("normalizeGemStatusSlug", () => {
  it("keeps reference and allowed status slugs", () => {
    expect(normalizeGemStatusSlug("")).toBe(GEM_STATUS_REFERENCE);
    expect(normalizeGemStatusSlug("reference")).toBe("reference");
    expect(normalizeGemStatusSlug("memo-in")).toBe("memo-in");
  });

  it("does not remap old stored values", () => {
    expect(normalizeGemStatusSlug("purchase")).toBe("purchase");
    expect(normalizeGemStatusSlug("memo in")).toBe("memo in");
  });
});

describe("gemStatusLabel", () => {
  it("uses inventory-oriented status labels", () => {
    expect(gemStatusLabel(t, "reference")).toBe("Reference");
    expect(gemStatusLabel(t, "memo-in")).toBe("Memo in");
    expect(gemStatusLabel(t, "buying-invoice")).toBe("Purchased");
    expect(gemStatusLabel(t, "sale-invoice")).toBe("Sold");
    expect(gemStatusLabel(t, "return-memo-in")).toBe("Returned");
    expect(gemStatusLabel(t, "importation-return")).toBe("Returned");
  });

  it("returns unknown stored values unchanged", () => {
    expect(gemStatusLabel(t, "purchase")).toBe("purchase");
  });
});
