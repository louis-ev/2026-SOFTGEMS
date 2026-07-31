import { describe, it, expect } from "vitest";
import {
  parseEnglishNumber,
  formatDisplayNumber,
  number_group_separator,
} from "../format_locale.js";

describe("format_locale", () => {
  describe("parseEnglishNumber", () => {
    it("parses plain and grouped numbers", () => {
      expect(parseEnglishNumber(5.034)).toBe(5.034);
      expect(parseEnglishNumber("5.034")).toBe(5.034);
      expect(parseEnglishNumber("10,060")).toBe(10060);
      expect(parseEnglishNumber("1,998.41")).toBe(1998.41);
      expect(parseEnglishNumber(`10${number_group_separator}060`)).toBe(10060);
      expect(parseEnglishNumber(`1${number_group_separator}998.41`)).toBe(
        1998.41
      );
      expect(parseEnglishNumber("1 998.41")).toBe(1998.41);
    });

    it("returns null for non-numeric values", () => {
      expect(parseEnglishNumber("")).toBe(null);
      expect(parseEnglishNumber("abc")).toBe(null);
    });
  });

  describe("formatDisplayNumber", () => {
    it("formats with space thousands separator and dot decimal", () => {
      expect(formatDisplayNumber(5.034)).toBe("5.034");
      expect(formatDisplayNumber(10060)).toBe(`10${number_group_separator}060`);
      expect(
        formatDisplayNumber(1998.41, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      ).toBe(`1${number_group_separator}998.41`);
    });

    it("formats numeric strings", () => {
      expect(formatDisplayNumber("10060")).toBe(
        `10${number_group_separator}060`
      );
    });
  });
});
