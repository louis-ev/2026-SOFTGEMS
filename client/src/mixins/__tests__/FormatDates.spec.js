import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import Vue from "vue";
import FormatDates from "../FormatDates";

describe("FormatDates mixin", () => {
  let vm;
  let i18n;

  beforeEach(() => {
    // Create a Vue instance with the mixin
    const Component = Vue.extend({
      mixins: [FormatDates],
    });
    vm = new Component();
    i18n = { locale: "en" };
    vm.$i18n = i18n;
    vm.$t = (key, values) => {
      const messages = {
        en: {
          now: "now",
          yesterday_at: "yesterday, at {time}",
        },
        fr: {
          now: "maintenant",
          yesterday_at: "Hier, à {time}",
        },
      };
      const locale = vm.$i18n?.locale || "en";
      let template = messages[locale]?.[key] || messages.en[key] || key;
      if (values) {
        Object.keys(values).forEach((name) => {
          template = template.replace(`{${name}}`, values[name]);
        });
      }
      return template;
    };
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("formatDurationToHuman", () => {
    it("should format seconds correctly", () => {
      expect(vm.formatDurationToHuman(31)).toBe("31 sec");
      expect(vm.formatDurationToHuman(59)).toBe("59 sec");
    });

    // it("should format minutes and seconds correctly", () => {
    //   expect(vm.formatDurationToHuman(91)).toBe("1 min 31\u202fs");
    // });

    // it("should format hours, minutes and seconds correctly", () => {
    //   expect(vm.formatDurationToHuman(3600)).toBe("1\u202fh 0min");
    //   expect(vm.formatDurationToHuman(3661)).toBe("1\u202fh 1 min 1\u202fs");
    //   expect(vm.formatDurationToHuman(3691)).toBe("1\u202fh 1 min 31\u202fs");
    // });

    it("should handle zero duration", () => {
      expect(vm.formatDurationToHuman(0)).toBe("0 sec");
    });
  });

  describe("formatDurationToHoursMinutesSeconds", () => {
    it("should format seconds correctly", () => {
      expect(vm.formatDurationToHoursMinutesSeconds(31)).toBe("0:31");
      expect(vm.formatDurationToHoursMinutesSeconds(59)).toBe("0:59");
    });

    it("should format minutes and seconds correctly", () => {
      expect(vm.formatDurationToHoursMinutesSeconds(91)).toBe("1:31");
      expect(vm.formatDurationToHoursMinutesSeconds(3599)).toBe("59:59");
    });

    it("should format hours, minutes and seconds correctly", () => {
      expect(vm.formatDurationToHoursMinutesSeconds(3691)).toBe("1:01:31");
      expect(vm.formatDurationToHoursMinutesSeconds(3661)).toBe("1:01:01");
      expect(vm.formatDurationToHoursMinutesSeconds(3600)).toBe("1:00:00");
    });

    it("should handle zero duration", () => {
      expect(vm.formatDurationToHoursMinutesSeconds(0)).toBe("0:01");
      expect(vm.formatDurationToHoursMinutesSeconds(0, false)).toBe("0:00");
    });
  });

  describe("formatDurationToHoursMinutesSecondsDeciseconds", () => {
    it("should format with deciseconds", () => {
      expect(vm.formatDurationToHoursMinutesSecondsDeciseconds(31.5)).toBe(
        "0:31.5"
      );
      expect(vm.formatDurationToHoursMinutesSecondsDeciseconds(91.7)).toBe(
        "1:31.7"
      );
      expect(vm.formatDurationToHoursMinutesSecondsDeciseconds(3691.9)).toBe(
        "1:01:31.9"
      );
    });

    it("should handle zero deciseconds", () => {
      expect(vm.formatDurationToHoursMinutesSecondsDeciseconds(31)).toBe(
        "0:31.0"
      );
    });
  });

  describe("date/time display conventions", () => {
    it("formats date-times without AM/PM", () => {
      const formatted = vm.formatDateTimeToPrecise("2026-05-06T14:05:06");
      expect(formatted).toMatch(/14/);
      expect(formatted).not.toMatch(/AM|PM/i);
    });

    it("formats dates as day/month/year", () => {
      const formatted = vm.formatDateToPrecise("2026-07-20T12:00:00");
      expect(formatted).toMatch(/^20\/07\/2026/);
      expect(formatted).not.toMatch(/^07\/20\/2026/);
    });
  });

  describe("formatRecentDateTime", () => {
    it("formats today dates with relative time", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-05-06T14:32:00"));

      const formatted = vm.formatRecentDateTime("2026-05-06T14:12:00");
      expect(formatted).toBe("20 minutes ago");
    });

    it("formats very recent dates as now", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-05-06T14:32:00"));

      const formatted = vm.formatRecentDateTime("2026-05-06T14:31:45");
      expect(formatted).toBe("now");
    });

    it("formats yesterday with a localized time", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-05-06T14:32:00"));

      const formatted = vm.formatRecentDateTime("2026-05-05T14:12:00");
      const time = vm.formatTime("2026-05-05T14:12:00", {
        hour: "2-digit",
        minute: "2-digit",
      });
      expect(formatted).toBe(`yesterday, at ${time}`);
    });

    it("formats yesterday in french when the UI locale is fr", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-05-06T14:32:00"));
      vm.$i18n.locale = "fr";

      const formatted = vm.formatRecentDateTime("2026-05-05T14:12:00");
      const time = vm.formatTime("2026-05-05T14:12:00", {
        hour: "2-digit",
        minute: "2-digit",
      });
      expect(formatted).toBe(`Hier, à ${time}`);
    });

    it("formats older dates with locale-aware date-time (not raw UTC ISO)", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-05-06T14:32:00.000Z"));

      const iso = "2026-05-02T10:11:12.000Z";
      const formatted = vm.formatRecentDateTime(iso);
      const expected = vm.formatDateTimeToPrecise(iso);
      expect(formatted).toBe(expected);
      expect(formatted).not.toMatch(/T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });
  });
});
