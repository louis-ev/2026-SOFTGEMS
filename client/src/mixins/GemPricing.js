const price_field_pairs = [
  {
    total_key: "base_price_pcb",
    per_carat_key: "price_per_carat_pcb",
  },
  {
    total_key: "purchased_price_pa",
    per_carat_key: "price_per_carat_pa",
  },
];

export default {
  methods: {
    getPriceFieldPairs() {
      return price_field_pairs;
    },
    isPricingField(field_key) {
      return this.getPriceFieldPairs().some(
        ({ total_key, per_carat_key }) =>
          field_key === total_key || field_key === per_carat_key
      );
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
    resolvePerCaratValue({
      explicit_value,
      legacy_value,
      total_value,
      weight_ct,
    }) {
      const explicit_number = this.toNumberOrNull(explicit_value);
      if (explicit_number !== null) return explicit_number;
      if (legacy_value !== null) return legacy_value;
      return this.computePerCarat({ total_value, weight_ct });
    },
  },
};
