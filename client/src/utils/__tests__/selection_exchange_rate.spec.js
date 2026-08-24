import { describe, expect, it } from "vitest";
import {
  formatSelectionExchangeRateDisplay,
  normalizeSelectionExchangeRate,
  parseSelectionExchangeRate,
} from "@/utils/selection_exchange_rate.js";

describe("parseSelectionExchangeRate / normalizeSelectionExchangeRate", () => {
  it("parses dot and French comma decimals", () => {
    expect(parseSelectionExchangeRate(0.86)).toBe(0.86);
    expect(parseSelectionExchangeRate("0.86")).toBe(0.86);
    expect(parseSelectionExchangeRate("0,86")).toBe(0.86);
  });

  it("returns null for empty or invalid values", () => {
    expect(parseSelectionExchangeRate("")).toBeNull();
    expect(parseSelectionExchangeRate(0)).toBeNull();
    expect(parseSelectionExchangeRate(-1)).toBeNull();
    expect(parseSelectionExchangeRate("abc")).toBeNull();
  });

  it("rounds to four decimal places", () => {
    expect(normalizeSelectionExchangeRate(0.86123)).toBe(0.8612);
    expect(normalizeSelectionExchangeRate("0,86125")).toBe(0.8613);
  });
});

describe("formatSelectionExchangeRateDisplay", () => {
  it("formats stored rates for the header card", () => {
    expect(formatSelectionExchangeRateDisplay(0.86)).toBe("0.86");
    expect(formatSelectionExchangeRateDisplay(0.8612)).toBe("0.8612");
    expect(formatSelectionExchangeRateDisplay("")).toBe("");
  });
});
