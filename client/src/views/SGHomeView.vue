<template>
  <div class="_sgHome">
    <div class="_header">
      <h1 class="_title">{{ $t("sg_inventory") }}</h1>
      <router-link to="/gems/new" class="u-buttonLink">
        {{ $t("sg_create_gem") }}
      </router-link>
    </div>

    <div v-if="is_loading">{{ $t("sg_loading_gems") }}</div>
    <div v-else-if="fetch_error" class="u-errorMsg">{{ fetch_error }}</div>
    <table v-else class="_table">
      <thead>
        <tr>
          <th v-for="metadata_key in metadata_keys" :key="metadata_key">
            {{ getMetadataLabel(metadata_key) }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="gems.length === 0">
          <td :colspan="metadata_keys.length">{{ $t("sg_no_gems_yet") }}</td>
        </tr>
        <tr
          v-for="gem in gems"
          :key="gem.$path"
          class="_clickableRow"
          @click="openGem(gem)"
        >
          <td
            v-for="metadata_key in metadata_keys"
            :key="`${gem.$path}-${metadata_key}`"
          >
            <code>{{
              formatValue(resolveMetadataValue(gem, metadata_key))
            }}</code>
          </td>
        </tr>
      </tbody>
    </table>
    <!-- <section class="_fontPreview">
      <h1>Typography Preview H1</h1>
      <h2>Typography Preview H2</h2>
      <h3>Typography Preview H3</h3>
      <p>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum sed
        dui turpis. Praesent finibus, arcu id feugiat facilisis, elit sem
        elementum justo, sed tempor neque justo eu mauris.
      </p>
      <p class="sg-content-emphasis">
        This line uses content emphasis style to preview Spectral 500.
      </p>
      <p class="sg-data-number">
        Numeric sample: 12.50 ct - $15,450.00 - 48 pieces
      </p>
    </section> -->
  </div>
</template>
<script>
export default {
  props: {},
  components: {},
  data() {
    return {
      gems_path: "gems",
      gems: [],
      is_loading: false,
      fetch_error: "",
    };
  },
  created() {
    this.fetchGems();
  },
  mounted() {
    this.$api.join({ room: this.gems_path });
  },
  beforeDestroy() {
    this.$api.leave({ room: this.gems_path });
  },
  watch: {},
  computed: {
    metadata_keys() {
      if (!Array.isArray(this.gems) || this.gems.length === 0) return [];

      const ignored_keys = new Set([
        "reference_id",
        "name",
        "title",
        "$path",
        "$date_created",
        "$date_modified",
        "$status",
        "$admins",
        "$contributors",
      ]);
      const known_order = [
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
      ];
      const metadata_key_set = new Set();

      this.gems.forEach((gem) => {
        Object.keys(gem || {}).forEach((key) => {
          if (!ignored_keys.has(key)) metadata_key_set.add(key);
        });
      });
      metadata_key_set.add("id");

      return Array.from(metadata_key_set).sort((a, b) => {
        const a_index = known_order.indexOf(a);
        const b_index = known_order.indexOf(b);
        const a_rank = a_index === -1 ? Number.MAX_SAFE_INTEGER : a_index;
        const b_rank = b_index === -1 ? Number.MAX_SAFE_INTEGER : b_index;
        if (a_rank !== b_rank) return a_rank - b_rank;
        return a.localeCompare(b);
      });
    },
  },
  methods: {
    async fetchGems() {
      this.is_loading = true;
      this.fetch_error = "";

      try {
        this.gems = await this.$api.getFolders({
          path: this.gems_path,
        });
      } catch ({ code }) {
        this.fetch_error = code || this.$t("sg_could_not_load_gems");
      } finally {
        this.is_loading = false;
      }
    },
    getGemId(gem) {
      const gem_path = gem?.$path || "";
      if (!gem_path) return "";
      const path_parts = gem_path.split("/");
      return path_parts[path_parts.length - 1] || "";
    },
    openGem(gem) {
      const gem_id = this.getGemId(gem);
      if (!gem_id) return;
      this.$router.push(`/gems/${gem_id}`);
    },
    formatValue(value) {
      if (value === null || value === undefined || value === "") return "-";
      if (typeof value === "number")
        return Number.isFinite(value) ? value : "-";
      if (typeof value === "object") return JSON.stringify(value);
      return String(value);
    },
    resolveMetadataValue(gem, metadata_key) {
      if (metadata_key === "id") return this.getGemId(gem);
      return gem?.[metadata_key];
    },
    getMetadataLabel(metadata_key) {
      const metadata_to_translation_key = {
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
      const translation_key = metadata_to_translation_key[metadata_key];
      if (!translation_key) return metadata_key;
      return this.$t(translation_key);
    },
  },
};
</script>
<style lang="scss" scoped>
._sgHome {
  // max-width: 960px;
  margin: 0 auto;
}

._title {
  margin: 0;
}

._header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--spacing);
  margin-bottom: calc(var(--spacing) * 1);
}

._table {
  width: 100%;
  border-collapse: collapse;
  display: block;
  overflow-x: auto;

  th,
  td {
    text-align: left;
    border-bottom: 1px solid var(--c-gris_clair);
    padding: calc(var(--spacing) / 2);
    vertical-align: top;
  }

  code {
    white-space: pre-wrap;
    word-break: break-word;
  }
}

._clickableRow {
  cursor: pointer;
}

._clickableRow:hover {
  background: var(--c-gris_clair);
}

._fontPreview {
  margin-top: calc(var(--spacing) * 2);
  padding-top: calc(var(--spacing) * 1.5);
  border-top: 1px solid var(--c-gris_clair);
}
</style>
