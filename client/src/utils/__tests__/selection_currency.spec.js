import { describe, expect, it } from "vitest";
import {
  SELECTION_CURRENCY_OPTIONS,
  normalizeSelectionCurrency,
  resolveSelectionCurrency,
  selectionCurrencyLabel,
  selectionPdfCurrencyWording,
} from "@/utils/selection_currency.js";

describe("selection_currency", () => {
  it("select options are USD ($) and EUR (€)", () => {
    expect(SELECTION_CURRENCY_OPTIONS).toEqual([
      { value: "USD", label: "USD ($)" },
      { value: "EUR", label: "EUR (\u20AC)" },
    ]);
  });

  it("normalizes common currency inputs", () => {
    expect(normalizeSelectionCurrency("EUR")).toBe("EUR");
    expect(normalizeSelectionCurrency("euros")).toBe("EUR");
    expect(normalizeSelectionCurrency("EUR (\u20AC)")).toBe("EUR");
    expect(normalizeSelectionCurrency("USD")).toBe("USD");
    expect(normalizeSelectionCurrency("USD ($)")).toBe("USD");
    expect(normalizeSelectionCurrency("$")).toBe("USD");
    expect(normalizeSelectionCurrency("")).toBe("");
    expect(normalizeSelectionCurrency("CHF")).toBe("");
  });

  it("resolves empty currency to USD", () => {
    expect(resolveSelectionCurrency("")).toBe("USD");
    expect(resolveSelectionCurrency(null)).toBe("USD");
    expect(resolveSelectionCurrency("EUR")).toBe("EUR");
  });

  it("present label; empty defaults to USD ($)", () => {
    expect(selectionCurrencyLabel("EUR")).toBe("EUR (\u20AC)");
    expect(selectionCurrencyLabel("USD")).toBe("USD ($)");
    expect(selectionCurrencyLabel("")).toBe("USD ($)");
    expect(selectionCurrencyLabel("CHF")).toBe("CHF");
  });

  it("builds PDF wording from selection currency", () => {
    expect(selectionPdfCurrencyWording("en", "USD")).toEqual({
      currency_name: "dollars",
      currency_code_display: "$US",
      bank_currency: "US dollars",
    });
    expect(selectionPdfCurrencyWording("fr", "EUR")).toEqual({
      currency_name: "euros",
      currency_code_display: "\u20AC",
      bank_currency: "euros",
    });
    expect(selectionPdfCurrencyWording("en", "")).toEqual({
      currency_name: "dollars",
      currency_code_display: "$US",
      bank_currency: "US dollars",
    });
  });
});
