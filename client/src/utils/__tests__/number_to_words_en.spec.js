import { describe, it, expect } from "vitest";
import {
  numberToWordsEn,
  numberToWordsEnCapitalized,
} from "@/utils/number_to_words_en.js";

describe("numberToWordsEn", () => {
  it("spells out small numbers", () => {
    expect(numberToWordsEn(0)).toBe("zero");
    expect(numberToWordsEn(7)).toBe("seven");
    expect(numberToWordsEn(13)).toBe("thirteen");
    expect(numberToWordsEn(21)).toBe("twenty-one");
    expect(numberToWordsEn(90)).toBe("ninety");
    expect(numberToWordsEn(100)).toBe("one hundred");
    expect(numberToWordsEn(345)).toBe("three hundred forty-five");
  });

  it("matches the ACF reference amount", () => {
    expect(numberToWordsEn(424476)).toBe(
      "four hundred twenty-four thousand four hundred seventy-six"
    );
    expect(numberToWordsEnCapitalized(424476)).toBe(
      "Four hundred twenty-four thousand four hundred seventy-six"
    );
  });

  it("handles thousands and millions", () => {
    expect(numberToWordsEn(1000)).toBe("one thousand");
    expect(numberToWordsEn(16125)).toBe(
      "sixteen thousand one hundred twenty-five"
    );
    expect(numberToWordsEn(2000000)).toBe("two million");
    expect(numberToWordsEn(1234567)).toBe(
      "one million two hundred thirty-four thousand five hundred sixty-seven"
    );
  });

  it("rounds decimals and returns empty string for invalid input", () => {
    expect(numberToWordsEn(424475.6)).toBe(
      "four hundred twenty-four thousand four hundred seventy-six"
    );
    expect(numberToWordsEn(null)).toBe("");
    expect(numberToWordsEn(undefined)).toBe("");
    expect(numberToWordsEn(NaN)).toBe("");
  });
});
