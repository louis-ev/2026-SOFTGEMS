import { describe, it, expect } from "vitest";
import {
  numberToWordsFr,
  numberToWordsFrCapitalized,
} from "@/utils/number_to_words_fr.js";

describe("numberToWordsFr", () => {
  it("spells out small numbers", () => {
    expect(numberToWordsFr(0)).toBe("zéro");
    expect(numberToWordsFr(7)).toBe("sept");
    expect(numberToWordsFr(21)).toBe("vingt-et-un");
    expect(numberToWordsFr(71)).toBe("soixante-et-onze");
    expect(numberToWordsFr(80)).toBe("quatre-vingts");
    expect(numberToWordsFr(81)).toBe("quatre-vingt-un");
    expect(numberToWordsFr(100)).toBe("cent");
    expect(numberToWordsFr(200)).toBe("deux cents");
    expect(numberToWordsFr(201)).toBe("deux cent un");
  });

  it("handles thousands", () => {
    expect(numberToWordsFr(1000)).toBe("mille");
    expect(numberToWordsFr(16125)).toBe(
      "seize mille cent vingt-cinq"
    );
    expect(numberToWordsFrCapitalized(424476)).toBe(
      "Quatre cent vingt-quatre mille quatre cent soixante-seize"
    );
  });

  it("returns empty string for invalid input", () => {
    expect(numberToWordsFr(null)).toBe("");
    expect(numberToWordsFr(undefined)).toBe("");
    expect(numberToWordsFr(NaN)).toBe("");
  });
});
