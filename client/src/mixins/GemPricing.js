import { parseEnglishNumber } from "@/utils/format_locale.js";

/** Stored meta key for base acquisition cost (UI label: “Cost”; legacy name PCb). */
export const gem_cost_total_field_key = "base_price_pcb";

/** Markup factor applied when syncing PVD from PV (PV + 15%). */
export const PVD_FROM_PV_FACTOR = 1.15;

/** Derive persisted PVD total from PV (`PV × 1.15`, 2 decimals). */
export function computePvdFromPv(pv) {
  const n = Number(pv);
  if (!Number.isFinite(n)) return 0;
  return Number((n * PVD_FROM_PV_FACTOR).toFixed(2));
}

/** Persisted totals only; virtual_per_carat_key is UI / table display, not stored. */
const price_field_pairs = [
  {
    total_key: gem_cost_total_field_key,
    virtual_per_carat_key: "price_per_carat_pcb",
  },
  {
    total_key: "import_price",
    virtual_per_carat_key: "price_per_carat_import",
  },
  {
    total_key: "pv_selling_price",
    virtual_per_carat_key: "price_per_carat_pv",
  },
  {
    total_key: "pvd_asking_price",
    virtual_per_carat_key: "price_per_carat_pvd",
  },
  {
    total_key: "pc_to",
    virtual_per_carat_key: "price_per_carat_pc",
  },
  {
    total_key: "pf_invoiced_price",
    virtual_per_carat_key: "price_per_carat_pf",
  },
];

export const gem_virtual_per_carat_column_keys = price_field_pairs.map(
  (p) => p.virtual_per_carat_key
);

/** One table column per line: total + derived /ct. */
export const gem_pricing_total_column_keys = price_field_pairs.map(
  (p) => p.total_key
);

export default {
  methods: {
    computePvdFromPv,
    getPriceFieldPairs() {
      return price_field_pairs;
    },
    isGemPricingTotalColumnKey(field_key) {
      return gem_pricing_total_column_keys.includes(field_key);
    },
    isPricingField(field_key) {
      return this.getPriceFieldPairs().some(
        ({ total_key, virtual_per_carat_key }) =>
          field_key === total_key || field_key === virtual_per_carat_key
      );
    },
    getPricingPairByFieldKey(field_key) {
      return (
        this.getPriceFieldPairs().find(
          ({ total_key, virtual_per_carat_key }) =>
            field_key === total_key || field_key === virtual_per_carat_key
        ) || null
      );
    },
    isVirtualPerCaratField(field_key) {
      const pair = this.getPricingPairByFieldKey(field_key);
      return Boolean(pair && field_key === pair.virtual_per_carat_key);
    },
    getVirtualPerCaratKeyForTotal(total_key) {
      const pair = this.getPriceFieldPairs().find(
        (p) => p.total_key === total_key
      );
      return pair ? pair.virtual_per_carat_key : null;
    },
    isUnsetGemNumberValue(value) {
      if (value === null || value === undefined || value === "") return true;
      if (typeof value === "string" && value.trim() === "") return true;
      return false;
    },
    computeDisplayedPerCaratForGem(gem, total_key) {
      const raw_total = gem?.[total_key];
      if (this.isUnsetGemNumberValue(raw_total)) {
        return null;
      }
      const weight_ct = this.toNumberOrDefault(gem?.weight_ct);
      const total_value = this.toNumberOrNull(raw_total);
      if (total_value === null) return null;
      return this.computePerCarat({ total_value, weight_ct });
    },
    gemFieldDisplayValue(gem, field_config) {
      if (!gem || !field_config) return "";
      if (field_config.type === "dimensions_merged") {
        return this.formatGemDimensionsInline(gem);
      }
      if (field_config.pricing_total_key) {
        return this.computeDisplayedPerCaratForGem(
          gem,
          field_config.pricing_total_key
        );
      }
      const raw = gem[field_config.key];
      if (raw === undefined || raw === null) return "";
      return raw;
    },
    expandPricingFlashKeys(field_keys) {
      if (!Array.isArray(field_keys)) return [];
      const expanded = new Set(field_keys.filter(Boolean));
      const includes_weight = expanded.has("weight_ct");
      this.getPriceFieldPairs().forEach(
        ({ total_key, virtual_per_carat_key }) => {
          if (expanded.has(total_key) || includes_weight)
            expanded.add(virtual_per_carat_key);
        }
      );
      return Array.from(expanded);
    },
    toNumberOrNull(value) {
      return parseEnglishNumber(value);
    },
    toNumberOrDefault(value, fallback_value = 0) {
      const number_value = this.toNumberOrNull(value);
      if (number_value === null) return fallback_value;
      return number_value;
    },
    computePerCarat({ total_value, weight_ct }) {
      if (!Number.isFinite(total_value)) return 0;
      if (!Number.isFinite(weight_ct) || weight_ct <= 0) return 0;
      return Number((total_value / weight_ct).toFixed(2));
    },
    computeTotal({ per_carat_value, weight_ct }) {
      if (!Number.isFinite(per_carat_value)) return 0;
      if (!Number.isFinite(weight_ct) || weight_ct <= 0) return 0;
      return Number((per_carat_value * weight_ct).toFixed(2));
    },
  },
};
