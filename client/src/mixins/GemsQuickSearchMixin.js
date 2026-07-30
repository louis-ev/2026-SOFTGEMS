/** Shared quick search for gems inventory (same rules as SGGemsView). Host must expose `gems` (array). */

import { formatDisplayNumber, parseEnglishNumber } from "@/utils/format_locale.js";

const gems_quick_search_debounce_ms = 200;

export default {
  data() {
    return {
      gems_quick_search: "",
      gems_quick_search_debounced: "",
      gems_quick_search_debounce_timer_id: null,
    };
  },
  watch: {
    gems_quick_search(next_value) {
      if (this.gems_quick_search_debounce_timer_id !== null) {
        clearTimeout(this.gems_quick_search_debounce_timer_id);
        this.gems_quick_search_debounce_timer_id = null;
      }
      this.gems_quick_search_debounce_timer_id = setTimeout(() => {
        this.gems_quick_search_debounce_timer_id = null;
        this.gems_quick_search_debounced =
          typeof next_value === "string" ? next_value : "";
      }, gems_quick_search_debounce_ms);
    },
  },
  computed: {
    filtered_gems() {
      if (!Array.isArray(this.gems)) return [];
      const parsed = this.parseGemsQuickSearchInput(
        this.gems_quick_search_debounced,
      );
      return this.gems.filter((gem) => this.gemMatchesQuickSearch(gem, parsed));
    },
    gems_quick_search_filter_lines() {
      const raw = this.gems_quick_search_debounced;
      if (!raw || !String(raw).trim()) return [];

      const parsed = this.parseGemsQuickSearchInput(raw);
      const lines = [];
      const fmt_weight = (n) =>
        formatDisplayNumber(n, {
          minimumFractionDigits: 0,
          maximumFractionDigits: 6,
        }) ?? "";

      if (parsed.id_needle) {
        lines.push(
          this.$t("sg_gems_filter_id_exact", {
            needle: parsed.id_needle,
          }),
        );
      }

      if (parsed.stone_families.length === 1) {
        if (parsed.stone_families[0] === "sapphire") {
          lines.push(this.$t("sg_gems_filter_stone_sapphire"));
        } else {
          lines.push(this.$t("sg_gems_filter_stone_ruby"));
        }
      } else if (parsed.stone_families.length >= 2) {
        lines.push(this.$t("sg_gems_filter_stone_sapphire_or_ruby"));
      }

      if (parsed.stone_type_needle) {
        const matching_labels = this.collectDistinctStoneTypesMatchingNeedle(
          parsed.stone_type_needle,
        );
        lines.push(
          this.$t("sg_gems_filter_stone_text", {
            needle: parsed.stone_type_needle,
            matches:
              this.formatStoneTypeMatchesForFilterCaption(matching_labels),
          }),
        );
      }

      const ws = parsed.weight_spec;
      if (ws) {
        if (ws.type === "exact") {
          lines.push(
            this.$t("sg_gems_filter_weight_exact", {
              value: fmt_weight(ws.value),
            }),
          );
        } else if (ws.type === "range") {
          if (ws.max_exclusive) {
            lines.push(
              this.$t("sg_gems_filter_weight_half_open", {
                min: fmt_weight(ws.min),
                max: fmt_weight(ws.max),
              }),
            );
          } else {
            lines.push(
              this.$t("sg_gems_filter_weight_range", {
                min: fmt_weight(ws.min),
                max: fmt_weight(ws.max),
              }),
            );
          }
        }
      }

      return lines;
    },
    gems_quick_search_filter_caption() {
      const lines = this.gems_quick_search_filter_lines;
      if (!lines.length) return "";
      return this.$t("sg_gems_filter_caption", {
        clauses: lines.join(" · "),
        shown: this.filtered_gems.length,
        total: Array.isArray(this.gems) ? this.gems.length : 0,
      });
    },
  },
  beforeDestroy() {
    if (this.gems_quick_search_debounce_timer_id !== null) {
      clearTimeout(this.gems_quick_search_debounce_timer_id);
      this.gems_quick_search_debounce_timer_id = null;
    }
  },
  methods: {
    getGemId(gem) {
      const gem_path = gem?.$path || "";
      if (!gem_path) return "";
      const path_parts = gem_path.split("/");
      return path_parts[path_parts.length - 1] || "";
    },
    normalizeGemsSearchNumber(str) {
      const n = parseEnglishNumber(str);
      return n === null ? NaN : n;
    },
    inferWeightSpecFromPlainNumberToken(token) {
      const normalized_token = String(token).trim();
      const with_dot = normalized_token.replace(",", ".");
      if (!/^\d+\.\d+$/.test(with_dot)) return null;
      const v = parseFloat(with_dot);
      if (!Number.isFinite(v)) return null;
      const frac = with_dot.split(".")[1] || "";
      const frac_len = frac.length;
      const tol = Math.pow(10, -frac_len);
      return {
        type: "range",
        min: v - tol,
        max: v + tol,
      };
    },
    parseGemsQuickSearchInput(raw) {
      const base = {
        id_needle: "",
        weight_spec: null,
        stone_families: [],
        stone_type_needle: "",
      };
      if (!raw || typeof raw !== "string") return { ...base };

      let s = raw.trim();
      if (!s) return { ...base };

      const stone_families = [];
      const addStone = (key) => {
        if (!stone_families.includes(key)) stone_families.push(key);
      };
      if (/\bsap\b/i.test(s)) {
        addStone("sapphire");
        s = s.replace(/\bsap\b/gi, " ");
      }
      if (/\brub\b/i.test(s)) {
        addStone("ruby");
        s = s.replace(/\brub\b/gi, " ");
      }
      s = s.replace(/\s+/g, " ").trim();

      const result = {
        id_needle: "",
        weight_spec: null,
        stone_families,
        stone_type_needle: "",
      };

      if (!s) return result;

      let m = s.match(/^=\s*(\d+(?:[.,]\d+)?)\s*$/);
      if (m) {
        const v = this.normalizeGemsSearchNumber(m[1]);
        if (Number.isFinite(v)) {
          result.weight_spec = { type: "exact", value: v };
          return result;
        }
      }

      m = s.match(/^(\d+[.,]\d+)\s*$/);
      if (m) {
        const spec = this.inferWeightSpecFromPlainNumberToken(m[1]);
        if (spec) {
          result.weight_spec = spec;
          return result;
        }
      }

      m = s.match(/^(\d+)[.,]\s*$/);
      if (m) {
        const n = parseInt(m[1], 10);
        if (Number.isFinite(n) && n >= 0) {
          result.weight_spec = {
            type: "range",
            min: n,
            max: n + 1,
            max_exclusive: true,
          };
          return result;
        }
      }

      m = s.match(/^(\d+)\s*$/);
      if (m) {
        result.id_needle = m[1];
        return result;
      }

      const tokens = s.split(" ").filter(Boolean);
      const text_parts = [];
      const id_digit_parts = [];
      const weight_specs = [];

      tokens.forEach((token) => {
        if (/^=\s*\d+(?:[.,]\d+)?$/i.test(token)) {
          const v = this.normalizeGemsSearchNumber(token.replace(/^=\s*/i, ""));
          if (Number.isFinite(v)) {
            weight_specs.push({ type: "exact", value: v });
          }
          return;
        }
        if (/^\d+$/.test(token)) {
          id_digit_parts.push(token);
          return;
        }
        const trunc_weight = token.match(/^(\d+)[.,]\s*$/);
        if (trunc_weight) {
          const n = parseInt(trunc_weight[1], 10);
          if (Number.isFinite(n) && n >= 0) {
            weight_specs.push({
              type: "range",
              min: n,
              max: n + 1,
              max_exclusive: true,
            });
          }
          return;
        }
        if (/^\d+[.,]\d+$/.test(token)) {
          const spec = this.inferWeightSpecFromPlainNumberToken(token);
          if (spec) weight_specs.push(spec);
          return;
        }
        text_parts.push(token);
      });

      if (weight_specs.length > 0) {
        result.weight_spec = weight_specs[weight_specs.length - 1];
      }
      if (id_digit_parts.length > 0) {
        result.id_needle = id_digit_parts.join("");
      }
      const stone_text = text_parts.join(" ").trim();
      if (stone_text) {
        result.stone_type_needle = stone_text;
      }

      return result;
    },
    gemStoneMatchesTextNeedle(stone_type, needle) {
      if (!needle || typeof needle !== "string") return true;
      const n = needle.trim().toLowerCase();
      if (!n) return true;
      const st = String(stone_type || "").toLowerCase();
      return st.includes(n);
    },
    gemStoneMatchesQuickFamilies(stone_type, stone_families) {
      if (!stone_families || stone_families.length === 0) return true;
      const st = String(stone_type || "").toLowerCase();
      return stone_families.some((fam) => {
        if (fam === "sapphire") return st.includes("sapphire");
        if (fam === "ruby") return st.includes("ruby");
        return false;
      });
    },
    gemMatchesWeightQuickSpec(gem, weight_spec) {
      if (!weight_spec) return true;
      const w = Number(gem.weight_ct);
      if (!Number.isFinite(w)) return false;
      if (weight_spec.type === "exact") {
        return Math.abs(w - weight_spec.value) <= 1e-6;
      }
      if (weight_spec.type === "range") {
        const eps = 1e-9;
        if (weight_spec.max_exclusive) {
          return w >= weight_spec.min - eps && w < weight_spec.max - eps;
        }
        return w >= weight_spec.min - eps && w <= weight_spec.max + eps;
      }
      return false;
    },
    gemMatchesQuickSearch(gem, parsed) {
      if (
        parsed.id_needle &&
        this.getGemId(gem).toLowerCase() !== parsed.id_needle.toLowerCase()
      ) {
        return false;
      }
      if (
        !this.gemStoneMatchesTextNeedle(
          gem.stone_type,
          parsed.stone_type_needle,
        )
      ) {
        return false;
      }
      if (
        !this.gemStoneMatchesQuickFamilies(
          gem.stone_type,
          parsed.stone_families,
        )
      ) {
        return false;
      }
      if (!this.gemMatchesWeightQuickSpec(gem, parsed.weight_spec)) {
        return false;
      }
      return true;
    },
    collectDistinctStoneTypesMatchingNeedle(needle) {
      if (!needle || typeof needle !== "string") return [];
      const n = needle.trim().toLowerCase();
      if (!n) return [];
      const seen = new Set();
      const labels = [];
      (Array.isArray(this.gems) ? this.gems : []).forEach((gem) => {
        const st = gem?.stone_type;
        if (st === undefined || st === null || st === "") return;
        const s = String(st);
        if (!s.toLowerCase().includes(n)) return;
        if (seen.has(s)) return;
        seen.add(s);
        labels.push(s);
      });
      labels.sort((a, b) =>
        a.localeCompare(b, undefined, { sensitivity: "base" }),
      );
      return labels;
    },
    formatStoneTypeMatchesForFilterCaption(labels) {
      const max_shown = 6;
      if (!labels.length) {
        return this.$t("sg_gems_filter_stone_match_none");
      }
      const head = labels.slice(0, max_shown);
      const rest = labels.length - max_shown;
      if (rest > 0) {
        return `${head.join(", ")} ${this.$t(
          "sg_gems_filter_stone_match_more",
          { n: rest },
        )}`;
      }
      return head.join(", ");
    },
  },
};
