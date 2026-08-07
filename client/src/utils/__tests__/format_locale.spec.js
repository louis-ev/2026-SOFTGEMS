import { describe, it, expect } from "vitest";
import {
  parseEnglishNumber,
  formatDisplayNumber,
  number_group_separator,
  withHourCycle24,
  getDateFormatLocale,
  date_format_locale,
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

  describe("getDateFormatLocale", () => {
    it("uses day/month/year locale", () => {
      expect(getDateFormatLocale()).toBe(date_format_locale);
      expect(
        new Intl.DateTimeFormat(getDateFormatLocale(), {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }).format(new Date(2026, 6, 20))
      ).toBe("20/07/2026");
    });
  });

  describe("withHourCycle24", () => {
    it("forces hour12 false when time fields are present", () => {
      expect(
        withHourCycle24({
          dateStyle: "short",
          timeStyle: "short",
        })
      ).toEqual({
        dateStyle: "short",
        timeStyle: "short",
        hour12: false,
      });
      expect(
        withHourCycle24({
          hour: "2-digit",
          minute: "2-digit",
        }).hour12
      ).toBe(false);
    });

    it("leaves date-only options unchanged", () => {
      expect(
        withHourCycle24({
          year: "numeric",
          month: "numeric",
          day: "numeric",
        })
      ).toEqual({
        year: "numeric",
        month: "numeric",
        day: "numeric",
      });
    });
  });
});
