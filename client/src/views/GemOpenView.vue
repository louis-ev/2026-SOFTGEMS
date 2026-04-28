<template>
  <section class="_gemOpenView">
    <div class="u-sameRow u-spacingBottom">
      <h1>{{ gem_title }}</h1>
      <button type="button" class="u-button" @click="goHome">
        {{ $t("sg_back") }}
      </button>
    </div>

    <div v-if="is_loading">{{ $t("sg_loading_gem") }}</div>
    <div v-else-if="fetch_error" class="u-errorMsg">{{ fetch_error }}</div>
    <template v-else>
      <div class="_actions u-spacingBottom">
        <button
          type="button"
          class="u-button u-button_red"
          :disabled="is_removing"
          @click="removeGem"
        >
          {{
            is_removing ? $t("sg_remove_gem_in_progress") : $t("sg_remove_gem")
          }}
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
  id: "sg_id",
  status: "sg_status",
  gem_type: "sg_type",
  color: "sg_color",
  origin: "sg_origin",
  dimensions: "sg_dimensions",
  weight_carat: "sg_weight_carat",
  piece_count: "sg_piece_count",
  condition: "sg_condition",
  treatment: "sg_treatment",
  purchase_price_usd: "sg_purchase_price_usd",
  sale_price_usd: "sg_sale_price_usd",
  price_per_carat_usd: "sg_price_per_carat_usd",
  supplier: "sg_supplier",
  acquisition_date: "sg_acquisition_date",
  country_of_cut: "sg_country_of_cut",
  pair_gem_id: "sg_pair_gem_id",
  remarks: "sg_remarks",
  $path: "sg_path",
  $date_created: "sg_created",
  $date_modified: "sg_last_modified",
};

const display_order = [
  "id",
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
      if (!this.gem) return this.$t("sg_open_gem_title");
      return this.gem.name || this.gem.title || this.gem_id;
    },
    metadata_items() {
      if (!this.gem) return [];
      return display_order.map((key) => ({
        key,
        label: this.getFieldLabel(key),
        value: this.formatValue(this.getFieldValue(key)),
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
        this.fetch_error = code || this.$t("sg_could_not_load_gem");
      } finally {
        this.is_loading = false;
      }
    },
    async removeGem() {
      if (!this.gem || this.is_removing) return;

      const should_remove = window.confirm(
        this.$t("sg_remove_gem_confirm", { name: this.gem_title })
      );
      if (!should_remove) return;

      this.is_removing = true;
      try {
        await this.$api.deleteItem({
          path: this.gem_path,
        });
        this.$router.push("/");
      } catch ({ code }) {
        this.$alertify
          .delay(4000)
          .error(code || this.$t("sg_could_not_remove_gem"));
      } finally {
        this.is_removing = false;
      }
    },
    getFieldLabel(field_key) {
      const translation_key = field_labels[field_key];
      if (!translation_key) return field_key;
      return this.$t(translation_key);
    },
    getFieldValue(field_key) {
      if (field_key === "id") return this.gem_id;
      return this.gem?.[field_key];
    },
    formatValue(value) {
      if (value === null || value === undefined || value === "") return "-";
      if (typeof value === "number")
        return Number.isFinite(value) ? value : "-";
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
