import { parseEnglishNumber } from "@/utils/format_locale.js";
import { gem_pricing_total_column_keys } from "@/mixins/GemPricing";

/** Enum (checkbox) column filters. */
export const GEMS_COLUMN_FILTER_ENUM_KEYS = Object.freeze([
  "status",
  "reference_supplier",
  "reference_customer",
  "stone_type",
  "color",
  "shape",
  "origin_country",
]);

/** Numeric (exact / range) column filters. */
export const GEMS_COLUMN_FILTER_NUMBER_KEYS = Object.freeze([
  "id",
  "number_of_pieces",
  "weight_ct",
  "dimensions_lwh",
  ...gem_pricing_total_column_keys,
]);

export const GEMS_COLUMN_FILTERABLE_KEYS = Object.freeze([
  ...GEMS_COLUMN_FILTER_ENUM_KEYS,
  ...GEMS_COLUMN_FILTER_NUMBER_KEYS,
]);

/** Alias (search token) ? metadata key. */
export const GEMS_COLUMN_FILTER_ALIAS_TO_KEY = Object.freeze({
  id: "id",
  status: "status",
  ref_supplier: "reference_supplier",
  reference_supplier: "reference_supplier",
  ref_customer: "reference_customer",
  reference_customer: "reference_customer",
  type: "stone_type",
  stone_type: "stone_type",
  color: "color",
  shape: "shape",
  origin: "origin_country",
  origin_country: "origin_country",
  pieces: "number_of_pieces",
  number_of_pieces: "number_of_pieces",
  weight: "weight_ct",
  weight_ct: "weight_ct",
  dimensions: "dimensions_lwh",
  dimensions_lwh: "dimensions_lwh",
  ...Object.fromEntries(
    gem_pricing_total_column_keys.map((key) => [key, key]),
  ),
});

/** Preferred short alias when writing a filter into the search string. */
export const GEMS_COLUMN_FILTER_SERIALIZE_ALIAS = Object.freeze({
  id: "id",
  status: "status",
  reference_supplier: "ref_supplier",
  reference_customer: "ref_customer",
  stone_type: "type",
  color: "color",
  shape: "shape",
  origin_country: "origin",
  number_of_pieces: "pieces",
  weight_ct: "weight",
  dimensions_lwh: "dimensions",
  ...Object.fromEntries(
    gem_pricing_total_column_keys.map((key) => [key, key]),
  ),
});

/**
 * @param {string} meta_key
 * @returns {"enum"|"number"|null}
 */
export function getGemsColumnFilterMode(meta_key) {
  if (GEMS_COLUMN_FILTER_ENUM_KEYS.includes(meta_key)) return "enum";
  if (GEMS_COLUMN_FILTER_NUMBER_KEYS.includes(meta_key)) return "number";
  return null;
}

/**
 * Find `alias=value` tokens. Values may be comma-separated and quoted.
 * @param {string} raw
 * @returns {{ alias: string, value: string, start: number, end: number }[]}
 */
export function findFieldFilterTokenSpans(raw) {
  const s = typeof raw === "string" ? raw : "";
  const spans = [];
  const start_re = /(?:^|\s)([a-zA-Z_][a-zA-Z0-9_]*)=/g;
  let m;
  while ((m = start_re.exec(s)) !== null) {
    const alias = m[1];
    const value_start = m.index + m[0].length;
    let i = value_start;
    let value = "";
    while (i < s.length) {
      if (s[i] === '"') {
        const close = s.indexOf('"', i + 1);
        if (close === -1) {
          value += s.slice(i);
          i = s.length;
          break;
        }
        value += s.slice(i, close + 1);
        i = close + 1;
        continue;
      }
      if (/\s/.test(s[i])) break;
      value += s[i];
      i += 1;
    }
    value = value.trim();
    if (!value) continue;
    const token_start = m[0].startsWith(" ") || m[0].startsWith("\t")
      ? m.index + 1
      : m.index;
    spans.push({
      alias,
      value,
      start: token_start,
      end: i,
    });
    start_re.lastIndex = i;
  }
  return spans;
}

/**
 * @param {string} meta_key
 * @returns {boolean}
 */
export function isGemsColumnFilterableKey(meta_key) {
  return getGemsColumnFilterMode(meta_key) !== null;
}

/**
 * @param {*} gem
 * @returns {string}
 */
export function getGemIdFromPath(gem) {
  const gem_path = gem?.$path || "";
  if (!gem_path) return "";
  const path_parts = String(gem_path).split("/");
  return path_parts[path_parts.length - 1] || "";
}

/**
 * @param {string} str
 * @returns {number}
 */
export function normalizeGemsSearchNumber(str) {
  const raw = String(str ?? "").trim();
  if (!raw) return NaN;
  // Field-filter decimals may use comma as decimal separator (3,1).
  if (/^\d+[.,]\d+$/.test(raw) && !raw.includes(" ")) {
    const n = parseFloat(raw.replace(",", "."));
    return Number.isFinite(n) ? n : NaN;
  }
  const n = parseEnglishNumber(raw);
  return n === null ? NaN : n;
}

/**
 * @param {string} token
 * @returns {{ type: "range", min: number, max: number } | null}
 */
export function inferWeightSpecFromPlainNumberToken(token) {
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
}

/**
 * @param {string} raw_value
 * @returns {string[]}
 */
export function parseEnumFilterValues(raw_value) {
  const s = String(raw_value ?? "").trim();
  if (!s) return [];
  const values = [];
  const re = /"([^"]*)"|([^,]+)/g;
  let m;
  while ((m = re.exec(s)) !== null) {
    const part = (m[1] !== undefined ? m[1] : m[2] || "").trim();
    if (part) values.push(part);
  }
  return values;
}

/**
 * @param {string} raw_value
 * @returns {{ mode: "number", exact?: number, min?: number, max?: number } | null}
 */
export function parseNumberFilterValue(raw_value) {
  const s = String(raw_value ?? "").trim();
  if (!s) return null;

  const range_m = s.match(
    /^(\d+(?:[.,]\d+)?)\s*-\s*(\d+(?:[.,]\d+)?)$/,
  );
  if (range_m) {
    const min = normalizeGemsSearchNumber(range_m[1]);
    const max = normalizeGemsSearchNumber(range_m[2]);
    if (!Number.isFinite(min) || !Number.isFinite(max)) return null;
    return { mode: "number", min, max };
  }

  const exact = normalizeGemsSearchNumber(s);
  if (!Number.isFinite(exact)) return null;
  return { mode: "number", exact };
}

/**
 * @param {string} value
 * @returns {string}
 */
export function quoteFilterValueIfNeeded(value) {
  const s = String(value ?? "");
  if (!s) return '""';
  if (/[\s,"=]/.test(s)) return `"${s.replace(/"/g, "")}"`;
  return s;
}

/**
 * @param {string} meta_key
 * @param {{ mode: "enum"|"number", values?: string[], exact?: number, min?: number, max?: number }} filter
 * @returns {string}
 */
export function serializeFieldFilter(meta_key, filter) {
  if (!filter || !meta_key) return "";
  const alias =
    GEMS_COLUMN_FILTER_SERIALIZE_ALIAS[meta_key] || meta_key;
  if (filter.mode === "enum") {
    const values = Array.isArray(filter.values)
      ? filter.values.map((v) => String(v).trim()).filter(Boolean)
      : [];
    if (!values.length) return "";
    return `${alias}=${values.map(quoteFilterValueIfNeeded).join(",")}`;
  }
  if (filter.mode === "number") {
    if (Number.isFinite(filter.exact)) {
      return `${alias}=${filter.exact}`;
    }
    const has_min = Number.isFinite(filter.min);
    const has_max = Number.isFinite(filter.max);
    if (has_min && has_max) return `${alias}=${filter.min}-${filter.max}`;
    if (has_min) return `${alias}=${filter.min}-${filter.min}`;
    if (has_max) return `${alias}=${filter.max}-${filter.max}`;
  }
  return "";
}

/**
 * Strip all field-filter tokens for a metadata key (any alias) from raw search.
 * @param {string} raw
 * @param {string} meta_key
 * @returns {string}
 */
export function removeFieldFilterFromSearch(raw, meta_key) {
  const s = typeof raw === "string" ? raw : "";
  if (!s.trim() || !meta_key) return s.trim();

  const aliases = Object.entries(GEMS_COLUMN_FILTER_ALIAS_TO_KEY)
    .filter(([, key]) => key === meta_key)
    .map(([alias]) => alias);
  if (!aliases.length) return s.trim();

  const alias_set = new Set(aliases.map((a) => a.toLowerCase()));
  let out = s;
  const matches = findFieldFilterTokenSpans(s).filter((span) =>
    alias_set.has(span.alias.toLowerCase()),
  );
  for (let i = matches.length - 1; i >= 0; i--) {
    const { start, end } = matches[i];
    out = out.slice(0, start) + " " + out.slice(end);
  }
  return out.replace(/\s+/g, " ").trim();
}

/**
 * @param {string} raw
 * @param {string} meta_key
 * @param {{ mode: "enum"|"number", values?: string[], exact?: number, min?: number, max?: number } | null} filter
 * @returns {string}
 */
export function upsertFieldFilterInSearch(raw, meta_key, filter) {
  let next = removeFieldFilterFromSearch(raw, meta_key);
  if (!filter) return next;
  const token = serializeFieldFilter(meta_key, filter);
  if (!token) return next;
  return next ? `${next} ${token}` : token;
}

/**
 * @param {string} raw
 * @returns {{
 *   remainder: string,
 *   field_filters: Record<string, { mode: "enum"|"number", values?: string[], exact?: number, min?: number, max?: number }>
 * }}
 */
export function extractFieldFiltersFromSearch(raw) {
  const field_filters = {};
  const s = typeof raw === "string" ? raw : "";
  if (!s.trim()) return { remainder: "", field_filters };

  const remove_spans = [];
  findFieldFilterTokenSpans(s).forEach((span) => {
    const meta_key =
      GEMS_COLUMN_FILTER_ALIAS_TO_KEY[span.alias.toLowerCase()];
    if (!meta_key) return;
    const mode = getGemsColumnFilterMode(meta_key);
    if (!mode) return;

    if (mode === "enum") {
      const values = parseEnumFilterValues(span.value);
      if (!values.length) return;
      field_filters[meta_key] = { mode: "enum", values };
    } else {
      const parsed = parseNumberFilterValue(span.value);
      if (!parsed) return;
      field_filters[meta_key] = parsed;
    }
    remove_spans.push({ start: span.start, end: span.end });
  });

  let remainder = s;
  for (let i = remove_spans.length - 1; i >= 0; i--) {
    const { start, end } = remove_spans[i];
    remainder = remainder.slice(0, start) + " " + remainder.slice(end);
  }
  remainder = remainder.replace(/\s+/g, " ").trim();
  return { remainder, field_filters };
}

/**
 * @param {string} raw
 * @returns {{
 *   id_needle: string,
 *   weight_spec: null | { type: "exact", value: number } | { type: "range", min: number, max: number, max_exclusive?: boolean },
 *   stone_families: string[],
 *   stone_type_needle: string,
 *   field_filters: Record<string, object>
 * }}
 */
export function parseGemsQuickSearchInput(raw) {
  const empty = {
    id_needle: "",
    weight_spec: null,
    stone_families: [],
    stone_type_needle: "",
    field_filters: {},
  };
  if (!raw || typeof raw !== "string") return { ...empty, field_filters: {} };

  const extracted = extractFieldFiltersFromSearch(raw.trim());
  const field_filters = extracted.field_filters;
  let s = extracted.remainder;
  if (!s) {
    return { ...empty, field_filters };
  }

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
    field_filters,
  };

  if (!s) return result;

  let m = s.match(/^=\s*(\d+(?:[.,]\d+)?)\s*$/);
  if (m) {
    const v = normalizeGemsSearchNumber(m[1]);
    if (Number.isFinite(v)) {
      result.weight_spec = { type: "exact", value: v };
      if (field_filters.weight_ct) result.weight_spec = null;
      return result;
    }
  }

  m = s.match(/^(\d+[.,]\d+)\s*$/);
  if (m) {
    const spec = inferWeightSpecFromPlainNumberToken(m[1]);
    if (spec) {
      result.weight_spec = field_filters.weight_ct ? null : spec;
      return result;
    }
  }

  m = s.match(/^(\d+)[.,]\s*$/);
  if (m) {
    const n = parseInt(m[1], 10);
    if (Number.isFinite(n) && n >= 0) {
      result.weight_spec = field_filters.weight_ct
        ? null
        : {
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
    if (!field_filters.id) result.id_needle = m[1];
    return result;
  }

  const tokens = s.split(" ").filter(Boolean);
  const text_parts = [];
  const id_digit_parts = [];
  const weight_specs = [];

  tokens.forEach((token) => {
    if (/^=\s*\d+(?:[.,]\d+)?$/i.test(token)) {
      const v = normalizeGemsSearchNumber(token.replace(/^=\s*/i, ""));
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
      const spec = inferWeightSpecFromPlainNumberToken(token);
      if (spec) weight_specs.push(spec);
      return;
    }
    text_parts.push(token);
  });

  if (weight_specs.length > 0 && !field_filters.weight_ct) {
    result.weight_spec = weight_specs[weight_specs.length - 1];
  }
  if (id_digit_parts.length > 0 && !field_filters.id) {
    result.id_needle = id_digit_parts.join("");
  }
  const stone_text = text_parts.join(" ").trim();
  if (stone_text) {
    result.stone_type_needle = stone_text;
  }

  return result;
}

/**
 * @param {string} stone_type
 * @param {string} needle
 * @returns {boolean}
 */
export function gemStoneMatchesTextNeedle(stone_type, needle) {
  if (!needle || typeof needle !== "string") return true;
  const n = needle.trim().toLowerCase();
  if (!n) return true;
  const st = String(stone_type || "").toLowerCase();
  return st.includes(n);
}

/**
 * @param {string} stone_type
 * @param {string[]} stone_families
 * @returns {boolean}
 */
export function gemStoneMatchesQuickFamilies(stone_type, stone_families) {
  if (!stone_families || stone_families.length === 0) return true;
  const st = String(stone_type || "").toLowerCase();
  return stone_families.some((fam) => {
    if (fam === "sapphire") return st.includes("sapphire");
    if (fam === "ruby") return st.includes("ruby");
    return false;
  });
}

/**
 * @param {*} gem
 * @param {*} weight_spec
 * @returns {boolean}
 */
export function gemMatchesWeightQuickSpec(gem, weight_spec) {
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
}

/**
 * @param {number} value
 * @param {{ exact?: number, min?: number, max?: number }} filter
 * @returns {boolean}
 */
function numberMatchesFilter(value, filter) {
  if (!Number.isFinite(value)) return false;
  const eps = 1e-9;
  if (Number.isFinite(filter.exact)) {
    return Math.abs(value - filter.exact) <= 1e-6;
  }
  const has_min = Number.isFinite(filter.min);
  const has_max = Number.isFinite(filter.max);
  if (has_min && value < filter.min - eps) return false;
  if (has_max && value > filter.max + eps) return false;
  return has_min || has_max;
}

/**
 * @param {*} gem
 * @param {string} meta_key
 * @param {{ mode: "enum"|"number", values?: string[], exact?: number, min?: number, max?: number }} filter
 * @returns {boolean}
 */
export function gemMatchesFieldFilter(gem, meta_key, filter) {
  if (!filter) return true;

  if (filter.mode === "enum") {
    const values = Array.isArray(filter.values) ? filter.values : [];
    if (!values.length) return true;
    const raw = gem?.[meta_key];
    const gem_value = String(raw ?? "").trim().toLowerCase();
    if (!gem_value) return false;
    return values.some((v) => String(v).trim().toLowerCase() === gem_value);
  }

  if (filter.mode === "number") {
    if (meta_key === "dimensions_lwh") {
      const axes = [gem?.length_mm, gem?.width_mm, gem?.height_mm]
        .map((v) => Number(v))
        .filter((n) => Number.isFinite(n));
      if (!axes.length) return false;
      return axes.some((n) => numberMatchesFilter(n, filter));
    }
    if (meta_key === "id") {
      const gem_id = getGemIdFromPath(gem);
      const n = Number(gem_id);
      if (!Number.isFinite(n)) {
        // Non-numeric folder ids: exact string match only.
        if (Number.isFinite(filter.exact)) {
          return gem_id === String(filter.exact);
        }
        return false;
      }
      return numberMatchesFilter(n, filter);
    }
    const n = Number(gem?.[meta_key]);
    return numberMatchesFilter(n, filter);
  }

  return true;
}

/**
 * @param {*} gem
 * @param {ReturnType<typeof parseGemsQuickSearchInput>} parsed
 * @returns {boolean}
 */
export function gemMatchesQuickSearch(gem, parsed) {
  if (!parsed) return true;

  if (
    parsed.id_needle &&
    getGemIdFromPath(gem).toLowerCase() !==
      String(parsed.id_needle).toLowerCase()
  ) {
    return false;
  }
  if (
    !gemStoneMatchesTextNeedle(gem?.stone_type, parsed.stone_type_needle)
  ) {
    return false;
  }
  if (
    !gemStoneMatchesQuickFamilies(gem?.stone_type, parsed.stone_families)
  ) {
    return false;
  }
  if (!gemMatchesWeightQuickSpec(gem, parsed.weight_spec)) {
    return false;
  }

  const field_filters = parsed.field_filters || {};
  for (const [meta_key, filter] of Object.entries(field_filters)) {
    if (!gemMatchesFieldFilter(gem, meta_key, filter)) return false;
  }
  return true;
}

/**
 * Remove a legacy quick-search clause from the raw string.
 * @param {string} raw
 * @param {"id"|"stone_families"|"stone_type_needle"|"weight_legacy"} legacy_kind
 * @returns {string}
 */
export function removeLegacyFilterFromSearch(raw, legacy_kind) {
  const parsed = parseGemsQuickSearchInput(raw);
  const field_tokens = [];
  Object.entries(parsed.field_filters || {}).forEach(([meta_key, filter]) => {
    const token = serializeFieldFilter(meta_key, filter);
    if (token) field_tokens.push(token);
  });

  let remainder_parts = [];

  if (legacy_kind !== "id" && parsed.id_needle) {
    remainder_parts.push(parsed.id_needle);
  }
  if (legacy_kind !== "stone_families") {
    if (parsed.stone_families.includes("sapphire")) remainder_parts.push("sap");
    if (parsed.stone_families.includes("ruby")) remainder_parts.push("rub");
  }
  if (legacy_kind !== "stone_type_needle" && parsed.stone_type_needle) {
    remainder_parts.push(parsed.stone_type_needle);
  }
  if (legacy_kind !== "weight_legacy" && parsed.weight_spec) {
    const ws = parsed.weight_spec;
    if (ws.type === "exact") {
      remainder_parts.push(`=${ws.value}`);
    } else if (ws.type === "range" && ws.max_exclusive) {
      remainder_parts.push(`${ws.min}.`);
    } else if (ws.type === "range") {
      // Band around a decimal ù rebuild midpoint-ish token poorly; keep min if equal band
      const mid = (ws.min + ws.max) / 2;
      remainder_parts.push(String(mid));
    }
  }

  const parts = [...remainder_parts, ...field_tokens].filter(Boolean);
  return parts.join(" ").trim();
}
