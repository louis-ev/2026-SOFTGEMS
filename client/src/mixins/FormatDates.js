import {
  getDateFormatLocale,
  getNumberFormatLocale,
  withHourCycle24,
} from "@/utils/format_locale.js";

export default {
  computed: {},
  methods: {
    formatLocale() {
      return getDateFormatLocale(this.$i18n?.locale);
    },
    formatTime(date, options) {
      return new Date(date).toLocaleTimeString(
        this.formatLocale(),
        withHourCycle24(options)
      );
    },
    formatDate(date, options) {
      const opts = withHourCycle24(options);
      const includes_time =
        opts.hour != null ||
        opts.minute != null ||
        opts.second != null ||
        opts.timeStyle != null;
      // toLocaleDateString drops time in some engines; use toLocaleString when needed.
      if (includes_time) {
        return new Date(date).toLocaleString(this.formatLocale(), opts);
      }
      return new Date(date).toLocaleDateString(this.formatLocale(), opts);
    },
    formatDateToHuman(date) {
      if (new Date(date).toDateString() === new Date().toDateString()) {
        return this.$t("today");
      }

      return this.formatDate(date, {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    },
    formatDateTimeToHuman(date) {
      return this.formatDate(date, {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    },
    formatDateToPrecise(date) {
      return this.formatDate(date, {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
    },
    formatDateTimeToPrecise(date) {
      return this.formatDate(date, {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    },
    formatDateToHoursMinutesOnly(date) {
      return this.formatDate(date, {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    },
    formatDurationToHoursMinutesSeconds(seconds, round_zero = true) {
      const h = Math.floor(seconds / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      let s = Math.floor(seconds % 60);
      // dont display 00:00, round to 00:01
      if (round_zero && h === 0 && m === 0 && s === 0) s = 1;
      return [h, m > 9 ? m : h ? "0" + m : m || "0", s > 9 ? s : "0" + s]
        .filter(Boolean)
        .join(":");
    },
    formatDurationToHuman(duration) {
      const hours = Math.floor(duration / 3600);
      const minutes = Math.floor((duration % 3600) / 60);
      const seconds = Math.floor(duration % 60);
      const locale = getNumberFormatLocale(this.$i18n?.locale);

      const parts = [];
      if (hours > 0) {
        parts.push(
          new Intl.NumberFormat(locale, {
            style: "unit",
            unit: "hour",
            unitDisplay: "short",
          }).format(hours)
        );
      }
      if (minutes > 0 || hours > 0) {
        parts.push(
          new Intl.NumberFormat(locale, {
            style: "unit",
            unit: "minute",
            unitDisplay: "short",
          }).format(minutes)
        );
      }
      if (seconds > 0 || (hours === 0 && minutes === 0)) {
        parts.push(
          new Intl.NumberFormat(locale, {
            style: "unit",
            unit: "second",
            unitDisplay: "short",
          }).format(seconds)
        );
      }

      return parts.join(" ");
    },
    formatDurationToHoursMinutesSecondsDeciseconds(seconds) {
      const ds = (seconds % 1).toFixed(1).substring(1);
      return this.formatDurationToHoursMinutesSeconds(seconds, false) + ds;
    },
    datetimeLocal(datetime) {
      const dt = new Date(datetime);
      dt.setMinutes(dt.getMinutes() - dt.getTimezoneOffset());
      return dt.toISOString().slice(0, 16);
    },
    formatRecentDateTime(date) {
      const parsed_date = new Date(date);
      if (Number.isNaN(parsed_date.getTime())) return "";

      const now_date = new Date();
      const start_of_today = new Date(now_date);
      start_of_today.setHours(0, 0, 0, 0);

      const start_of_target_day = new Date(parsed_date);
      start_of_target_day.setHours(0, 0, 0, 0);

      const day_diff = Math.round(
        (start_of_today.getTime() - start_of_target_day.getTime()) /
          (24 * 60 * 60 * 1000)
      );

      const locale = this.formatLocale();

      if (day_diff === 0) {
        const diff_seconds = Math.round(
          (parsed_date.getTime() - now_date.getTime()) / 1000
        );
        const abs_diff_seconds = Math.abs(diff_seconds);
        const relative_time_formatter = new Intl.RelativeTimeFormat(locale, {
          numeric: "auto",
        });

        if (abs_diff_seconds < 60) {
          return this.$t("now");
        }
        if (abs_diff_seconds < 3600) {
          return relative_time_formatter.format(
            Math.round(diff_seconds / 60),
            "minute"
          );
        }
        return relative_time_formatter.format(
          Math.round(diff_seconds / 3600),
          "hour"
        );
      }

      if (day_diff === 1) {
        const time = this.formatTime(parsed_date, {
          hour: "2-digit",
          minute: "2-digit",
        });
        return this.$t("yesterday_at", { time });
      }

      return this.formatDateTimeToPrecise(parsed_date);
    },
  },
};
