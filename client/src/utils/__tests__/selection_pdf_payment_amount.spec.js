import { describe, it, expect } from "vitest";
import {
  paymentAmountWordParts,
  splitAmountMajorAndCents,
} from "@/utils/selection_pdf_payment_amount.js";

describe("splitAmountMajorAndCents", () => {
  it("splits dollars and cents without rounding the major unit", () => {
    expect(splitAmountMajorAndCents(424476)).toEqual({
      major: 424476,
      cents: 0,
    });
    expect(splitAmountMajorAndCents(424476.5)).toEqual({
      major: 424476,
      cents: 50,
    });
    expect(splitAmountMajorAndCents(10.01)).toEqual({ major: 10, cents: 1 });
    expect(splitAmountMajorAndCents(19.99)).toEqual({ major: 19, cents: 99 });
  });

  it("returns null for invalid input", () => {
    expect(splitAmountMajorAndCents(null)).toBe(null);
    expect(splitAmountMajorAndCents(undefined)).toBe(null);
    expect(splitAmountMajorAndCents(NaN)).toBe(null);
  });
});

describe("paymentAmountWordParts", () => {
  it("keeps English words lowercase and omits zero cents", () => {
    expect(paymentAmountWordParts("en", 424476)).toEqual({
      amount_words:
        "four hundred twenty-four thousand four hundred seventy-six",
      cents_clause: "",
    });
    expect(paymentAmountWordParts("en", 424476.5)).toEqual({
      amount_words:
        "four hundred twenty-four thousand four hundred seventy-six",
      cents_clause: " and fifty cents",
    });
    expect(paymentAmountWordParts("en", 10.01)).toEqual({
      amount_words: "ten",
      cents_clause: " and one cent",
    });
  });

  it("keeps French words lowercase and omits zero centimes", () => {
    expect(paymentAmountWordParts("fr", 424476)).toEqual({
      amount_words:
        "quatre cent vingt-quatre mille quatre cent soixante-seize",
      cents_clause: "",
    });
    expect(paymentAmountWordParts("fr", 16125.5)).toEqual({
      amount_words: "seize mille cent vingt-cinq",
      cents_clause: " et cinquante centimes",
    });
    expect(paymentAmountWordParts("fr", 1.01)).toEqual({
      amount_words: "un",
      cents_clause: " et un centime",
    });
  });
});
