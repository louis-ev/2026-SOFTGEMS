import { parseEnglishNumber } from "@/utils/format_locale.js";
import { gem_pricing_total_column_keys } from "@/mixins/GemPricing";
import {
  gems_table_selection_nums_column_keys,
  isSelectionNumsColumnKey,
  listGemSelectionDocumentNumbersForType,
  selectionTypeSlugFromNumsColumnKey,
} from "@/utils/gem_selection_nums_columns.js";

/** Enum (checkbox) column filters. */
export const GEMS_COLUMN_FILTER_ENUM_KEYS = Object.freeze([
  "status",
  "reference_supplier",
  "reference_customer",
  "numero_de_mise_a_consommation",
  "stone_type",
  "color",
  "shape",
  "origin_country",
  "country_of_cut",
  "treatment_type",
]);

/** Per-axis dimension filters (mm). UI is on the merged `dimensions_lwh` column. */
export const GEMS_COLUMN_FILTER_DIMENSION_AXIS_KEYS = Object.freeze([
  "length_mm",
  "width_mm",
  "height_mm",
]);

/** Merged dimensions column — opens the L/W/H filter UI (not a search token itself). */
export const GEMS_COLUMN_FILTER_DIMENSIONS_UI_KEY = "dimensions_lwh";

/** Numeric (exact / range) column filters. */
export const GEMS_COLUMN_FILTER_NUMBER_KEYS = Object.freeze([
  "id",
  "paired_gem",
  "number_of_pieces",
  "weight_ct",
  ...GEMS_COLUMN_FILTER_DIMENSION_AXIS_KEYS,
  ...gem_pricing_total_column_keys,
  ...gems_table_selection_nums_column_keys,
]);

/** Date (from / to) column filters. Stored as ISO `YYYY-MM-DD`. */
export const GEMS_COLUMN_FILTER_DATE_KEYS = Object.freeze(["$date_modified"]);

export const GEMS_COLUMN_FILTERABLE_KEYS = Object.freeze([
  ...GEMS_COLUMN_FILTER_ENUM_KEYS,
  ...GEMS_COLUMN_FILTER_NUMBER_KEYS,
  ...GEMS_COLUMN_FILTER_DATE_KEYS,
  GEMS_COLUMN_FILTER_DIMENSIONS_UI_KEY,
]);

/** Sentinel stored in enum filter `values` for “field is empty”. */
export const GEMS_COLUMN_FILTER_EMPTY_VALUE = "__empty__";

/**
 * @param {string|null|undefined} value
 * @returns {boolean}
 */
export function isGemsColumnFilterEmptyValue(value) {
  return String(value ?? "").trim().toLowerCase() === GEMS_COLUMN_FILTER_EMPTY_VALUE;
}

/**
 * @param {*} gem
 * @param {string} meta_key
 * @returns {boolean}
 */
export function isGemEnumFieldEmpty(gem, meta_key) {
  const raw = gem?.[meta_key];
  if (raw === undefined || raw === null) return true;
  return String(raw).trim() === "";
}

/**
 * Missing / blank / non-numeric value for a number filter column.
 * @param {*} gem
 * @param {string} meta_key
 * @returns {boolean}
 */
export function isGemNumberFieldEmpty(gem, meta_key) {
  if (isSelectionNumsColumnKey(meta_key)) {
    const type_slug = selectionTypeSlugFromNumsColumnKey(meta_key);
    return listGemSelectionDocumentNumbersForType(gem, type_slug).length === 0;
  }
  if (meta_key === "id") {
    return !String(getGemIdFromPath(gem) || "").trim();
  }
  if (meta_key === "paired_gem") {
    return !String(gem?.paired_gem ?? "").trim();
  }
  const raw = gem?.[meta_key];
  if (raw === undefined || raw === null || raw === "") return true;
  if (typeof raw === "string" && raw.trim() === "") return true;
  return !Number.isFinite(Number(raw));
}

/** Alias (search token) → metadata key. */
export const GEMS_COLUMN_FILTER_ALIAS_TO_KEY = Object.freeze({
  id: "id",
  status: "status",
  ref_supplier: "reference_supplier",
  reference_supplier: "reference_supplier",
  ref_customer: "reference_customer",
  reference_customer: "reference_customer",
  mac: "numero_de_mise_a_consommation",
  numero_de_mise_a_consommation: "numero_de_mise_a_consommation",
  paired: "paired_gem",
  paired_gem: "paired_gem",
  type: "stone_type",
  stone_type: "stone_type",
  color: "color",
  shape: "shape",
  origin: "origin_country",
  origin_country: "origin_country",
  coc: "country_of_cut",
  country_of_cut: "country_of_cut",
  treatment: "treatment_type",
  treatment_type: "treatment_type",
  edited: "$date_modified",
  last_edited: "$date_modified",
  date_modified: "$date_modified",
  pieces: "number_of_pieces",
  number_of_pieces: "number_of_pieces",
  weight: "weight_ct",
  weight_ct: "weight_ct",
  l: "length_mm",
  length: "length_mm",
  length_mm: "length_mm",
  w: "width_mm",
  width: "width_mm",
  width_mm: "width_mm",
  h: "height_mm",
  height: "height_mm",
  height_mm: "height_mm",
  ...Object.fromEntries(
    gem_pricing_total_column_keys.map((key) => [key, key]),
  ),
  ...Object.fromEntries(
    gems_table_selection_nums_column_keys.flatMap((key) => {
      const slug = selectionTypeSlugFromNumsColumnKey(key);
      const short = slug ? `sel_${slug.replace(/-/g, "_")}` : "";
      return short
        ? [
            [key, key],
            [short, key],
          ]
        : [[key, key]];
    }),
  ),
});

/** Preferred short alias when writing a filter into the search string. */
export const GEMS_COLUMN_FILTER_SERIALIZE_ALIAS = Object.freeze({
  id: "id",
  status: "status",
  reference_supplier: "ref_supplier",
  reference_customer: "ref_customer",
  numero_de_mise_a_consommation: "mac",
  paired_gem: "paired",
  stone_type: "type",
  color: "color",
  shape: "shape",
  origin_country: "origin",
  country_of_cut: "coc",
  treatment_type: "treatment",
  $date_modified: "edited",
  number_of_pieces: "pieces",
  weight_ct: "weight",
  length_mm: "l",
  width_mm: "w",
  height_mm: "h",
  ...Object.fromEntries(
    gem_pricing_total_column_keys.map((key) => [key, key]),
  ),
  ...Object.fromEntries(
    gems_table_selection_nums_column_keys.map((key) => {
      const slug = selectionTypeSlugFromNumsColumnKey(key);
      const short = slug ? `sel_${slug.replace(/-/g, "_")}` : key;
      return [key, short];
    }),
  ),
});

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * @param {string} meta_key
 * @returns {"enum"|"number"|"date"|"dimensions"|null}
 */
export function getGemsColumnFilterMode(meta_key) {
  if (meta_key === GEMS_COLUMN_FILTER_DIMENSIONS_UI_KEY) return "dimensions";
  if (GEMS_COLUMN_FILTER_ENUM_KEYS.includes(meta_key)) return "enum";
  if (GEMS_COLUMN_FILTER_NUMBER_KEYS.includes(meta_key)) return "number";
  if (GEMS_COLUMN_FILTER_DATE_KEYS.includes(meta_key)) return "date";
  return null;
}

/**
 * @param {string} meta_key
 * @returns {boolean}
 */
export function isGemsDimensionAxisFilterKey(meta_key) {
  return GEMS_COLUMN_FILTER_DIMENSION_AXIS_KEYS.includes(meta_key);
}

/**
 * @param {string} raw
 * @returns {boolean}
 */
export function isIsoDateString(raw) {
  if (!ISO_DATE_RE.test(String(raw || "").trim())) return false;
  const t = Date.parse(`${String(raw).trim()}T00:00:00`);
  return Number.isFinite(t);
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
 * @returns {{ mode: "number", empty?: boolean, exact?: number, min?: number, max?: number } | null}
 */
export function parseNumberFilterValue(raw_value) {
  const s = String(raw_value ?? "").trim();
  if (!s) return null;

  let rest = s;
  let empty = false;
  if (isGemsColumnFilterEmptyValue(rest)) {
    return { mode: "number", empty: true };
  }
  const empty_prefix = new RegExp(
    `^${GEMS_COLUMN_FILTER_EMPTY_VALUE}\\s*,\\s*`,
    "i",
  );
  if (empty_prefix.test(rest)) {
    empty = true;
    rest = rest.replace(empty_prefix, "").trim();
    if (!rest) return { mode: "number", empty: true };
  }

  const range_m = rest.match(
    /^(\d+(?:[.,]\d+)?)\s*-\s*(\d+(?:[.,]\d+)?)$/,
  );
  if (range_m) {
    const min = normalizeGemsSearchNumber(range_m[1]);
    const max = normalizeGemsSearchNumber(range_m[2]);
    if (!Number.isFinite(min) || !Number.isFinite(max)) return null;
    return {
      mode: "number",
      ...(empty ? { empty: true } : {}),
      min,
      max,
    };
  }

  const exact = normalizeGemsSearchNumber(rest);
  if (!Number.isFinite(exact)) return null;
  return {
    mode: "number",
    ...(empty ? { empty: true } : {}),
    exact,
  };
}

/**
 * Date filter syntax: `2026-08-05` or `2026-01-01..2026-08-05`
 * (also `2026-01-01..` / `..2026-08-05` for open bounds).
 * @param {string} raw_value
 * @returns {{ mode: "date", exact?: string, min?: string, max?: string } | null}
 */
export function parseDateFilterValue(raw_value) {
  const s = String(raw_value ?? "").trim();
  if (!s) return null;

  const range_m = s.match(
    /^(\d{4}-\d{2}-\d{2})?\.\.(\d{4}-\d{2}-\d{2})?$/,
  );
  if (range_m && (range_m[1] || range_m[2])) {
    const min = range_m[1] || undefined;
    const max = range_m[2] || undefined;
    if (min && !isIsoDateString(min)) return null;
    if (max && !isIsoDateString(max)) return null;
    if (min && max && min > max) {
      return { mode: "date", min: max, max: min };
    }
    return {
      mode: "date",
      ...(min ? { min } : {}),
      ...(max ? { max } : {}),
    };
  }

  if (isIsoDateString(s)) {
    return { mode: "date", exact: s };
  }
  return null;
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
    const parts = [];
    if (filter.empty) parts.push(GEMS_COLUMN_FILTER_EMPTY_VALUE);
    if (Number.isFinite(filter.exact)) {
      parts.push(String(filter.exact));
    } else {
      const has_min = Number.isFinite(filter.min);
      const has_max = Number.isFinite(filter.max);
      if (has_min && has_max) parts.push(`${filter.min}-${filter.max}`);
      else if (has_min) parts.push(`${filter.min}-${filter.min}`);
      else if (has_max) parts.push(`${filter.max}-${filter.max}`);
    }
    if (!parts.length) return "";
    return `${alias}=${parts.join(",")}`;
  }
  if (filter.mode === "date") {
    if (filter.exact && isIsoDateString(filter.exact)) {
      return `${alias}=${filter.exact}`;
    }
    const min = filter.min && isIsoDateString(filter.min) ? filter.min : "";
    const max = filter.max && isIsoDateString(filter.max) ? filter.max : "";
    if (min && max) {
      if (min === max) return `${alias}=${min}`;
      return `${alias}=${min}..${max}`;
    }
    if (min) return `${alias}=${min}..`;
    if (max) return `${alias}=..${max}`;
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
    } else if (mode === "date") {
      const parsed = parseDateFilterValue(span.value);
      if (!parsed) return;
      field_filters[meta_key] = parsed;
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
/**
 * @param {*} gem
 * @param {string} meta_key
 * @returns {string} local calendar day `YYYY-MM-DD`, or ""
 */
function gemFieldLocalIsoDate(gem, meta_key) {
  const raw = gem?.[meta_key];
  if (!raw) return "";
  const t = Date.parse(raw);
  if (!Number.isFinite(t)) return "";
  const d = new Date(t);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function gemMatchesFieldFilter(gem, meta_key, filter) {
  if (!filter) return true;

  if (filter.mode === "enum") {
    const values = Array.isArray(filter.values) ? filter.values : [];
    if (!values.length) return true;
    const wants_empty = values.some((v) => isGemsColumnFilterEmptyValue(v));
    const concrete_values = values.filter(
      (v) => !isGemsColumnFilterEmptyValue(v),
    );
    if (isGemEnumFieldEmpty(gem, meta_key)) return wants_empty;
    if (!concrete_values.length) return false;
    const gem_value = String(gem?.[meta_key] ?? "")
      .trim()
      .toLowerCase();
    return concrete_values.some(
      (v) => String(v).trim().toLowerCase() === gem_value,
    );
  }

  if (filter.mode === "number") {
    if (isSelectionNumsColumnKey(meta_key)) {
      const type_slug = selectionTypeSlugFromNumsColumnKey(meta_key);
      const numbers = listGemSelectionDocumentNumbersForType(gem, type_slug)
        .map((doc) => Number(doc))
        .filter((n) => Number.isFinite(n));
      if (numbers.length === 0) return Boolean(filter.empty);

      const has_exact = Number.isFinite(filter.exact);
      const has_min = Number.isFinite(filter.min);
      const has_max = Number.isFinite(filter.max);
      if (!has_exact && !has_min && !has_max) return false;
      return numbers.some((n) => numberMatchesFilter(n, filter));
    }

    const field_empty = isGemNumberFieldEmpty(gem, meta_key);
    if (field_empty) return Boolean(filter.empty);

    const has_exact = Number.isFinite(filter.exact);
    const has_min = Number.isFinite(filter.min);
    const has_max = Number.isFinite(filter.max);
    if (!has_exact && !has_min && !has_max) {
      // Empty-only filter: filled values do not match.
      return false;
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
    if (meta_key === "paired_gem") {
      const paired_id = String(gem?.paired_gem ?? "").trim();
      const n = Number(paired_id);
      if (!Number.isFinite(n)) {
        if (Number.isFinite(filter.exact)) {
          return paired_id === String(filter.exact);
        }
        return false;
      }
      return numberMatchesFilter(n, filter);
    }
    const n = Number(gem?.[meta_key]);
    return numberMatchesFilter(n, filter);
  }

  if (filter.mode === "date") {
    const gem_day = gemFieldLocalIsoDate(gem, meta_key);
    if (!gem_day) return false;
    if (filter.exact && isIsoDateString(filter.exact)) {
      return gem_day === filter.exact;
    }
    if (filter.min && isIsoDateString(filter.min) && gem_day < filter.min) {
      return false;
    }
    if (filter.max && isIsoDateString(filter.max) && gem_day > filter.max) {
      return false;
    }
    return Boolean(
      (filter.min && isIsoDateString(filter.min)) ||
        (filter.max && isIsoDateString(filter.max)),
    );
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
 * Clone a parsed search with one field (and related legacy clauses) removed,
 * for faceted option availability.
 * @param {ReturnType<typeof parseGemsQuickSearchInput>} parsed
 * @param {string} except_meta_key
 * @returns {ReturnType<typeof parseGemsQuickSearchInput>}
 */
export function parsedQuickSearchExceptField(parsed, except_meta_key) {
  const base = parsed || parseGemsQuickSearchInput("");
  const next = {
    id_needle: base.id_needle || "",
    weight_spec: base.weight_spec || null,
    stone_families: Array.isArray(base.stone_families)
      ? [...base.stone_families]
      : [],
    stone_type_needle: base.stone_type_needle || "",
    field_filters: { ...(base.field_filters || {}) },
  };
  delete next.field_filters[except_meta_key];
  if (except_meta_key === "id") next.id_needle = "";
  if (except_meta_key === "weight_ct") next.weight_spec = null;
  if (except_meta_key === "stone_type") {
    next.stone_type_needle = "";
    next.stone_families = [];
  }
  return next;
}

/**
 * Lowercased field values present on gems that match all filters except
 * `except_meta_key` (used to disable zero-result checkbox options).
 * @param {object[]} gems
 * @param {ReturnType<typeof parseGemsQuickSearchInput>} parsed
 * @param {string} except_meta_key
 * @returns {Set<string>}
 */
export function collectAvailableEnumFilterValues(
  gems,
  parsed,
  except_meta_key,
) {
  const available = new Set();
  if (!except_meta_key || !Array.isArray(gems)) return available;
  const facet_parsed = parsedQuickSearchExceptField(parsed, except_meta_key);
  gems.forEach((gem) => {
    if (!gemMatchesQuickSearch(gem, facet_parsed)) return;
    if (isGemEnumFieldEmpty(gem, except_meta_key)) {
      available.add(GEMS_COLUMN_FILTER_EMPTY_VALUE);
      return;
    }
    const raw = gem?.[except_meta_key];
    available.add(String(raw).trim().toLowerCase());
  });
  return available;
}

/**
 * Whether any gem matching other filters has an empty value for a number column.
 * @param {object[]} gems
 * @param {ReturnType<typeof parseGemsQuickSearchInput>} parsed
 * @param {string} meta_key
 * @returns {boolean}
 */
export function hasAvailableEmptyNumberField(gems, parsed, meta_key) {
  if (!meta_key || !Array.isArray(gems)) return false;
  const facet_parsed = parsedQuickSearchExceptField(parsed, meta_key);
  return gems.some((gem) => {
    if (!gemMatchesQuickSearch(gem, facet_parsed)) return false;
    return isGemNumberFieldEmpty(gem, meta_key);
  });
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
      // Band around a decimal — rebuild midpoint-ish token poorly; keep min if equal band
      const mid = (ws.min + ws.max) / 2;
      remainder_parts.push(String(mid));
    }
  }

  const parts = [...remainder_parts, ...field_tokens].filter(Boolean);
  return parts.join(" ").trim();
}
