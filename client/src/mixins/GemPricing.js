/** Persisted totals only; virtual_per_carat_key is UI / table display, not stored. */
const price_field_pairs = [
  {
    total_key: "base_price_pcb",
    virtual_per_carat_key: "price_per_carat_pcb",
  },
  {
    total_key: "purchased_price_pa",
    virtual_per_carat_key: "price_per_carat_pa",
  },
  {
    total_key: "pv_selling_price",
    virtual_per_carat_key: "price_per_carat_pv",
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

export const gem_virtual_per_carat_column_keys = price_field_pairs
  .map((p) => p.virtual_per_carat_key)
  .concat(["price_per_carat_pvd"]);

/** One table column per line: total + derived /ct (includes read-only PVD). */
export const gem_pricing_total_column_keys = price_field_pairs
  .map((p) => p.total_key)
  .concat(["pvd_asking_price"]);

export default {
  methods: {
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
    computeDisplayedPerCaratForGem(gem, total_key) {
      const weight_ct = this.toNumberOrDefault(gem?.weight_ct);
      const total_value = this.toNumberOrDefault(gem?.[total_key]);
      return this.computePerCarat({ total_value, weight_ct });
    },
    gemFieldDisplayValue(gem, field_config) {
      if (!gem || !field_config) return "";
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
      if (value === null || value === undefined || value === "") return null;
      const normalized_value = String(value).trim().replace(",", ".");
      const number_value = Number(normalized_value);
      if (!Number.isFinite(number_value)) return null;
      return number_value;
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
