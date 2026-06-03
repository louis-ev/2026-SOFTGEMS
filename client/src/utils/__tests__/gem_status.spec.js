import { describe, expect, it } from "vitest";
import {
  GEM_STATUS_REFERENCE,
  gemStatusLabel,
  normalizeGemStatusSlug,
} from "@/utils/gem_status.js";

const t = (key) => {
  const map = {
    sg_status_value_reference: "Reference",
    sg_selection_type_memo_in: "Memo in",
    sg_selection_type_buying_invoice: "Buying invoice",
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
  it("translates slugs via selection type labels", () => {
    expect(gemStatusLabel(t, "memo-in")).toBe("Memo in");
    expect(gemStatusLabel(t, "buying-invoice")).toBe("Buying invoice");
  });

  it("returns unknown stored values unchanged", () => {
    expect(gemStatusLabel(t, "purchase")).toBe("purchase");
  });
});
