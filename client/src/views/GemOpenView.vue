<template>
  <section class="_gemOpenView">
    <div class="u-sameRow u-spacingBottom">
      <h1>{{ gem_title }}</h1>
      <button type="button" class="u-button" @click="goHome">Back</button>
    </div>

    <div v-if="is_loading">Loading gem...</div>
    <div v-else-if="fetch_error" class="u-errorMsg">{{ fetch_error }}</div>
    <template v-else>
      <div class="_actions u-spacingBottom">
        <button
          type="button"
          class="u-button u-button_red"
          :disabled="is_removing"
          @click="removeGem"
        >
          {{ is_removing ? "Removing..." : "Remove gem" }}
        </button>
      </div>

      <dl class="_metaGrid">
        <div class="_metaItem" v-for="item in metadata_items" :key="item.key">
          <dt>{{ item.label }}</dt>
          <dd>{{ item.value }}</dd>
        </div>
      </dl>
    </template>
  </section>
</template>

<script>
const field_labels = {
  reference_id: "Reference ID",
  status: "Status",
  gem_type: "Type",
  color: "Color",
  origin: "Origin",
  dimensions: "Dimensions",
  weight_carat: "Weight (ct)",
  piece_count: "Piece count",
  condition: "Condition",
  treatment: "Treatment",
  purchase_price_usd: "Purchase price (USD)",
  sale_price_usd: "Sale price (USD)",
  price_per_carat_usd: "Price per carat (USD)",
  supplier: "Supplier",
  acquisition_date: "Acquisition date",
  country_of_cut: "Country of cut (COC)",
  pair_gem_id: "Pair gem ID",
  remarks: "Remarks",
  $path: "Path",
  $date_created: "Created",
  $date_modified: "Last modified",
};

const display_order = [
  "reference_id",
  "status",
  "gem_type",
  "color",
  "origin",
  "dimensions",
  "weight_carat",
  "piece_count",
  "condition",
  "treatment",
  "purchase_price_usd",
  "sale_price_usd",
  "price_per_carat_usd",
  "supplier",
  "acquisition_date",
  "country_of_cut",
  "pair_gem_id",
  "remarks",
  "$path",
  "$date_created",
  "$date_modified",
];

export default {
  props: {
    gem_id: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      gems_path: "gems",
      gem: null,
      is_loading: false,
      is_removing: false,
      fetch_error: "",
    };
  },
  computed: {
    gem_path() {
      return `${this.gems_path}/${this.gem_id}`;
    },
    gem_title() {
      if (!this.gem) return "Gem";
      return this.gem.name || this.gem.title || this.gem_id;
    },
    metadata_items() {
      if (!this.gem) return [];
      return display_order.map((key) => ({
        key,
        label: field_labels[key] || key,
        value: this.formatValue(this.gem[key]),
      }));
    },
  },
  async created() {
    await this.fetchGem();
  },
  mounted() {
    this.$api.join({ room: this.gem_path });
  },
  beforeDestroy() {
    this.$api.leave({ room: this.gem_path });
  },
  methods: {
    goHome() {
      this.$router.push("/");
    },
    async fetchGem() {
      this.is_loading = true;
      this.fetch_error = "";
      try {
        this.gem = await this.$api.getFolder({
          path: this.gem_path,
        });
      } catch ({ code }) {
        this.fetch_error = code || "Could not load gem.";
      } finally {
        this.is_loading = false;
      }
    },
    async removeGem() {
      if (!this.gem || this.is_removing) return;

      const should_remove = window.confirm(
        `Remove "${this.gem_title}" permanently?`
      );
      if (!should_remove) return;

      this.is_removing = true;
      try {
        await this.$api.deleteItem({
          path: this.gem_path,
        });
        this.$router.push("/");
      } catch ({ code }) {
        this.$alertify.delay(4000).error(code || "Could not remove gem.");
      } finally {
        this.is_removing = false;
      }
    },
    formatValue(value) {
      if (value === null || value === undefined || value === "") return "-";
      if (typeof value === "number") return Number.isFinite(value) ? value : "-";
      if (typeof value === "object") return JSON.stringify(value);
      return String(value);
    },
  },
};
</script>

<style lang="scss" scoped>
._gemOpenView {
  max-width: 900px;
  margin: 0 auto;
}

._actions {
  display: flex;
  justify-content: flex-end;
}

._metaGrid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: calc(var(--spacing) / 1.5);
  margin: 0;
}

._metaItem {
  background: var(--c-blanc);
  border: 1px solid var(--c-gris_clair);
  border-radius: 8px;
  padding: calc(var(--spacing) / 1.75);
}

dt {
  font-size: 0.8rem;
  text-transform: uppercase;
  color: var(--c-gris_fonce);
  margin-bottom: 0.25rem;
}

dd {
  margin: 0;
}
</style>
