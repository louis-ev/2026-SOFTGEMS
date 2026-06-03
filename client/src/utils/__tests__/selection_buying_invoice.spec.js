import { describe, expect, it } from "vitest";
import {
  clampPartnershipPurchasedPercentage,
  formatPartnershipPurchasedPercentageDisplay,
} from "@/utils/selection_buying_invoice.js";

describe("clampPartnershipPurchasedPercentage", () => {
  it("clamps values to 0–100 integers", () => {
    expect(clampPartnershipPurchasedPercentage(42.7)).toBe(43);
    expect(clampPartnershipPurchasedPercentage(-5)).toBe(0);
    expect(clampPartnershipPurchasedPercentage(150)).toBe(100);
  });

  it("returns null for empty or invalid values", () => {
    expect(clampPartnershipPurchasedPercentage("")).toBeNull();
    expect(clampPartnershipPurchasedPercentage("abc")).toBeNull();
  });
});

describe("formatPartnershipPurchasedPercentageDisplay", () => {
  it("formats clamped percentages for display", () => {
    expect(formatPartnershipPurchasedPercentageDisplay(33)).toBe("33 %");
    expect(formatPartnershipPurchasedPercentageDisplay("")).toBe("");
  });
});
