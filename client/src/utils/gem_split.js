import {
  gem_cost_total_field_key,
  gem_pricing_total_column_keys,
} from "@/mixins/GemPricing.js";
import {
  buildGemDuplicateNewMeta,
  listGemDuplicateMetaChanges,
} from "@/utils/gem_duplicate.js";
import { formatDisplayNumber, parseEnglishNumber } from "@/utils/format_locale.js";
import { getGemIdFromPath } from "@/utils/gem_pairing.js";

const PRICE_LABEL_KEYS = Object.freeze({
  base_price_pcb: "sg_base_price_pcb",
  import_price: "sg_import_price",
  pv_selling_price: "sg_pv_selling_price",
  pvd_asking_price: "sg_pvd_asking_price",
  pc_to: "sg_pc_to",
  pf_invoiced_price: "sg_pf_invoiced_price",
});

function round_money(value) {
  return Number(value.toFixed(2));
}

function round_weight(value) {
  return Number(value.toFixed(3));
}

function clean_string(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function is_blank(value) {
  return value === null || value === undefined || String(value).trim() === "";
}

export function parseGemSplitWeight(raw) {
  return parseEnglishNumber(raw);
}

export function parseGemSplitPieces(raw) {
  if (is_blank(raw)) return null;
  const n = parseEnglishNumber(raw);
  if (n === null || !Number.isInteger(n)) return null;
  return n;
}

export function gemSplitOriginalWeight(gem) {
  return parseEnglishNumber(gem?.weight_ct);
}

export function gemSplitOriginalPieces(gem) {
  return parseEnglishNumber(gem?.number_of_pieces);
}

/** Split is only offered for parcels with more than one piece. */
export function canSplitGem(gem) {
  const pieces = gemSplitOriginalPieces(gem);
  return pieces !== null && pieces > 1;
}

/** Inclusive range of piece counts that can be split off the original. */
export function gemSplitAcceptedPiecesRange(gem) {
  const pieces = gemSplitOriginalPieces(gem);
  if (pieces === null || pieces < 2) return null;
  return { min: 1, max: pieces - 1 };
}

export function formatGemSplitWeightInput(value) {
  if (value === null || value === undefined) return "";
  const n = typeof value === "number" ? value : parseEnglishNumber(value);
  if (n === null || !Number.isFinite(n)) return "";
  return String(round_weight(n));
}

/** Weight for `new_pieces` using the original average weight per piece. */
export function suggestedGemSplitWeight(gem, new_pieces) {
  const original_weight = gemSplitOriginalWeight(gem);
  const original_pieces = gemSplitOriginalPieces(gem);
  if (
    original_weight === null ||
    original_weight <= 0 ||
    original_pieces === null ||
    original_pieces < 2 ||
    !Number.isInteger(new_pieces) ||
    new_pieces < 1 ||
    new_pieces >= original_pieces
  ) {
    return null;
  }
  return round_weight(original_weight * (new_pieces / original_pieces));
}

/** Cost /ct when Cost total and weight are both usable. */
export function gemSplitCostPerCarat(gem) {
  const weight = gemSplitOriginalWeight(gem);
  const cost = parseEnglishNumber(gem?.[gem_cost_total_field_key]);
  if (weight === null || weight <= 0 || cost === null) return null;
  return round_money(cost / weight);
}

export function scaleGemSplitPrices(gem, new_weight, remaining_weight) {
  const original_weight = gemSplitOriginalWeight(gem);
  const cost_per_carat = gemSplitCostPerCarat(gem);
  const new_prices = {};
  const original_prices = {};
  if (
    cost_per_carat === null ||
    original_weight === null ||
    original_weight <= 0 ||
    !Number.isFinite(new_weight) ||
    !Number.isFinite(remaining_weight)
  ) {
    return { new_prices, original_prices, scaled: false };
  }

  for (const total_key of gem_pricing_total_column_keys) {
    const total = parseEnglishNumber(gem?.[total_key]);
    if (total === null) continue;
    const per_carat = round_money(total / original_weight);
    new_prices[total_key] = round_money(per_carat * new_weight);
    original_prices[total_key] = round_money(per_carat * remaining_weight);
  }
  return { new_prices, original_prices, scaled: true };
}

/**
 * @param {{ gem: object, new_pieces_raw: * }} args
 */
export function validateGemSplitPiecesDraft({ gem, new_pieces_raw }) {
  const original_weight = gemSplitOriginalWeight(gem);
  const original_pieces = gemSplitOriginalPieces(gem);
  const pieces_input_blank = is_blank(new_pieces_raw);
  const new_pieces = pieces_input_blank
    ? null
    : parseGemSplitPieces(new_pieces_raw);
  const errors = [];

  if (original_weight === null || original_weight <= 0) {
    errors.push("sg_split_gem_error_original_weight");
  }
  if (!canSplitGem(gem)) {
    errors.push("sg_split_gem_error_original_pieces");
  }
  if (pieces_input_blank || new_pieces === null || new_pieces < 1) {
    errors.push("sg_split_gem_error_new_pieces");
  } else if (original_pieces !== null && new_pieces >= original_pieces) {
    errors.push("sg_split_gem_error_pieces_too_large");
  }

  const remaining_pieces =
    original_pieces !== null && new_pieces !== null
      ? original_pieces - new_pieces
      : null;

  return {
    ok:
      errors.length === 0 &&
      remaining_pieces !== null &&
      remaining_pieces >= 1,
    errors,
    original_weight,
    original_pieces,
    new_pieces,
    remaining_pieces,
  };
}

/**
 * @param {{ gem: object, new_weight_raw: *, new_pieces_raw: * }} args
 */
export function validateGemSplitDraft({ gem, new_weight_raw, new_pieces_raw }) {
  const pieces_draft = validateGemSplitPiecesDraft({ gem, new_pieces_raw });
  const original_weight = pieces_draft.original_weight;
  const new_weight = parseGemSplitWeight(new_weight_raw);
  const errors = [...pieces_draft.errors];

  if (new_weight === null || new_weight <= 0) {
    errors.push("sg_split_gem_error_new_weight");
  } else if (original_weight !== null && new_weight >= original_weight) {
    errors.push("sg_split_gem_error_weight_too_large");
  }

  const remaining_weight =
    original_weight !== null && new_weight !== null && new_weight > 0
      ? round_weight(original_weight - new_weight)
      : null;

  return {
    ok:
      errors.length === 0 &&
      remaining_weight !== null &&
      remaining_weight > 0 &&
      pieces_draft.remaining_pieces !== null &&
      pieces_draft.remaining_pieces >= 1,
    errors,
    original_weight,
    original_pieces: pieces_draft.original_pieces,
    new_weight:
      new_weight !== null && new_weight > 0 ? round_weight(new_weight) : null,
    new_pieces: pieces_draft.new_pieces,
    remaining_weight,
    remaining_pieces: pieces_draft.remaining_pieces,
  };
}

export function computeGemSplitPlan({ gem, new_weight_raw, new_pieces_raw }) {
  const draft = validateGemSplitDraft({
    gem,
    new_weight_raw,
    new_pieces_raw,
  });
  if (!draft.ok) {
    return {
      ...draft,
      new_prices: {},
      original_prices: {},
      prices_scaled: false,
    };
  }
  const { new_prices, original_prices, scaled } = scaleGemSplitPrices(
    gem,
    draft.new_weight,
    draft.remaining_weight
  );
  return {
    ...draft,
    new_prices,
    original_prices,
    prices_scaled: scaled,
  };
}

export function buildGemSplitNewMeta({ plan, parent_id }) {
  const meta = {
    ...buildGemDuplicateNewMeta(),
    parent_id: clean_string(parent_id),
    splits: [],
    weight_ct: plan.new_weight,
    ...plan.new_prices,
  };
  if (plan.new_pieces !== null) {
    meta.number_of_pieces = plan.new_pieces;
  }
  return meta;
}

export function buildGemSplitOriginalMeta(
  plan,
  { gem, new_gem_id, split_date } = {}
) {
  const meta = {
    weight_ct: plan.remaining_weight,
    ...plan.original_prices,
  };
  if (plan.remaining_pieces !== null) {
    meta.number_of_pieces = plan.remaining_pieces;
  }
  const id = clean_string(new_gem_id);
  if (id) {
    meta.splits = appendGemSplitRecord(gem?.splits, {
      id,
      date: split_date,
    });
  }
  return meta;
}

/** Split-off gems recorded on the original parcel, oldest first. */
export function normalizeGemSplits(raw) {
  if (!Array.isArray(raw)) return [];
  const seen = new Set();
  const rows = [];
  for (const entry of raw) {
    const id = clean_string(entry?.id);
    if (!id || seen.has(id)) continue;
    seen.add(id);
    rows.push({
      id,
      date: clean_string(entry?.date),
    });
  }
  return rows;
}

export function appendGemSplitRecord(existing, { id, date } = {}) {
  const id_clean = clean_string(id);
  if (!id_clean) return normalizeGemSplits(existing);
  const date_clean = clean_string(date) || new Date().toISOString();
  const rows = normalizeGemSplits(existing).filter((row) => row.id !== id_clean);
  rows.push({ id: id_clean, date: date_clean });
  return rows;
}

export function formatGemSplitsDisplay(splits, format_date) {
  return normalizeGemSplits(splits)
    .map((row) => {
      const date_label =
        row.date && typeof format_date === "function"
          ? format_date(row.date)
          : row.date;
      if (date_label) return `#${row.id} · ${date_label}`;
      return `#${row.id}`;
    })
    .join(", ");
}

function format_weight_label(value, t) {
  const formatted = formatDisplayNumber(value, { maximumFractionDigits: 3 });
  if (formatted === null) return t("sg_duplicate_gem_empty_value");
  return `${formatted} ct`;
}

function format_pieces_label(value, t) {
  if (value === null || value === undefined) {
    return t("sg_duplicate_gem_empty_value");
  }
  const formatted = formatDisplayNumber(value, {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  });
  return formatted === null ? t("sg_duplicate_gem_empty_value") : formatted;
}

function format_price_label(value, t) {
  const formatted = formatDisplayNumber(value, {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  });
  return formatted === null ? t("sg_duplicate_gem_empty_value") : formatted;
}

function list_weight_pieces_price_rows({ gem, plan, t, side }) {
  const rows = [];
  const is_new = side === "new";
  rows.push({
    key: "weight_ct",
    label: t("sg_weight_ct"),
    from_label: format_weight_label(plan.original_weight, t),
    to_label: format_weight_label(
      is_new ? plan.new_weight : plan.remaining_weight,
      t
    ),
  });
  if (plan.new_pieces !== null) {
    rows.push({
      key: "number_of_pieces",
      label: t("sg_number_of_pieces"),
      from_label: format_pieces_label(plan.original_pieces, t),
      to_label: format_pieces_label(
        is_new ? plan.new_pieces : plan.remaining_pieces,
        t
      ),
    });
  }
  if (!plan.prices_scaled) return rows;

  for (const total_key of gem_pricing_total_column_keys) {
    const from_total = parseEnglishNumber(gem?.[total_key]);
    if (from_total === null) continue;
    const to_total = is_new
      ? plan.new_prices[total_key]
      : plan.original_prices[total_key];
    if (to_total === undefined) continue;
    const label_key = PRICE_LABEL_KEYS[total_key] || total_key;
    rows.push({
      key: total_key,
      label: t(label_key),
      from_label: format_price_label(from_total, t),
      to_label: format_price_label(to_total, t),
    });
  }
  return rows;
}

export function listGemSplitOriginalChanges(gem, plan, t) {
  if (!plan?.ok) return [];
  return list_weight_pieces_price_rows({ gem, plan, t, side: "original" });
}

export function listGemSplitComparisonRows(gem, plan, t) {
  if (!plan?.ok) return [];
  const rows = [];
  if (plan.new_pieces !== null) {
    rows.push({
      key: "number_of_pieces",
      label: t("sg_number_of_pieces"),
      original_from: format_pieces_label(plan.original_pieces, t),
      original_to: format_pieces_label(plan.remaining_pieces, t),
      new_to: format_pieces_label(plan.new_pieces, t),
    });
  }
  rows.push({
    key: "weight_ct",
    label: t("sg_weight_ct"),
    original_from: format_weight_label(plan.original_weight, t),
    original_to: format_weight_label(plan.remaining_weight, t),
    new_to: format_weight_label(plan.new_weight, t),
  });
  if (!plan.prices_scaled) return rows;

  for (const total_key of gem_pricing_total_column_keys) {
    const from_total = parseEnglishNumber(gem?.[total_key]);
    if (from_total === null) continue;
    const new_total = plan.new_prices[total_key];
    const original_total = plan.original_prices[total_key];
    if (new_total === undefined || original_total === undefined) continue;
    const label_key = PRICE_LABEL_KEYS[total_key] || total_key;
    rows.push({
      key: total_key,
      label: t(label_key),
      original_from: format_price_label(from_total, t),
      original_to: format_price_label(original_total, t),
      new_to: format_price_label(new_total, t),
    });
  }
  return rows;
}

export function listGemSplitNewChanges(gem, plan, t) {
  const duplicate_rows = listGemDuplicateMetaChanges(gem, t);
  const id_row = duplicate_rows[0];
  const rest_rows = duplicate_rows.slice(1);
  const empty_label = t("sg_duplicate_gem_empty_value");
  const parent_id = clean_string(getGemIdFromPath(gem?.$path)) || empty_label;
  const split_rows = plan?.ok
    ? list_weight_pieces_price_rows({ gem, plan, t, side: "new" })
    : [];
  return [
    id_row,
    {
      key: "parent_id",
      label: t("sg_parent_id"),
      from_label: empty_label,
      to_label: parent_id,
    },
    ...split_rows,
    ...rest_rows,
  ].filter(Boolean);
}
