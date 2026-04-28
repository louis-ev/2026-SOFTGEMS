<template>
  <div class="_gemsView">
    <div class="_gemsView--content">
      <div class="_pageHeader">
        <h1 class="_pageTitle">{{ $t("sg_all_gems") }}</h1>
        <div class="_headerActions">
          <router-link to="/gems/new" class="u-buttonLink">
            {{ $t("sg_create_gem") }}
          </router-link>
          <button
            type="button"
            class="u-button"
            :disabled="is_generating_placeholders"
            @click="generatePlaceholderGems"
          >
            {{
              is_generating_placeholders
                ? $t("sg_generating_placeholder_gems")
                : $t("sg_generate_placeholder_gems")
            }}
          </button>
        </div>
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
          <tr v-if="sorted_gems.length === 0">
            <td :colspan="metadata_keys.length">{{ $t("sg_no_gems_yet") }}</td>
          </tr>
          <tr
            v-for="gem in sorted_gems"
            :key="gem.$path"
            class="_clickableRow"
            :class="{
              _selected: is_gem_open && getGemId(gem) === $route.params.gem_id,
            }"
            @click="openGem(gem)"
          >
            <td
              v-for="metadata_key in metadata_keys"
              :key="`${gem.$path}-${metadata_key}`"
            >
              <span class="_gemMetadataValue">{{
                formatValue(resolveMetadataValue(gem, metadata_key))
              }}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <transition name="fade_fast">
      <div v-if="is_gem_open" class="_gemOverlay" @click.self="closeGemPanel">
        <section class="_gemPanel">
          <router-view />
        </section>
      </div>
    </transition>
  </div>
</template>
<script>
import { default_gem_fields } from "@/utils/gemDefaults";

export default {
  name: "SGGemsView",
  data() {
    return {
      gems_path: "gems",
      gems: [],
      is_loading: false,
      is_generating_placeholders: false,
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
  computed: {
    is_gem_open() {
      return this.$route.name === "Open gem";
    },
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
    sorted_gems() {
      if (!Array.isArray(this.gems)) return [];
      return [...this.gems].sort(
        (a, b) => this.getGemTimestamp(b) - this.getGemTimestamp(a)
      );
    },
  },
  methods: {
    closeGemPanel() {
      this.$router.push("/gems");
    },
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
    async generatePlaceholderGems() {
      if (this.is_generating_placeholders) return;

      this.is_generating_placeholders = true;
      const batch_id = Date.now();

      try {
        for (let index = 1; index <= 10; index += 1) {
          const gem_number = String(index).padStart(2, "0");
          const placeholder_name = `Placeholder Gem ${gem_number}`;

          await this.$api.createFolder({
            path: this.gems_path,
            additional_meta: {
              title: `${placeholder_name} ${batch_id}`,
              name: `${placeholder_name} ${batch_id}`,
              $status: "public",
              $admins: "everyone",
              $contributors: "everyone",
              ...default_gem_fields,
              gem_type: "placeholder",
              color: "mixed",
              origin: "unknown",
              dimensions: "10 x 8 x 6 mm",
              weight_carat: Number((Math.random() * 4 + 0.8).toFixed(2)),
              purchase_price_usd: Number(
                (Math.random() * 1200 + 100).toFixed(2)
              ),
              sale_price_usd: Number((Math.random() * 2400 + 300).toFixed(2)),
              supplier: "Placeholder supplier",
              remarks: "Auto-generated placeholder gem",
            },
          });
        }

        await this.fetchGems();
        this.$alertify
          .delay(3500)
          .success(this.$t("sg_generated_placeholder_gems"));
      } catch ({ code }) {
        this.$alertify
          .delay(4000)
          .error(code || this.$t("sg_could_not_generate_placeholder_gems"));
      } finally {
        this.is_generating_placeholders = false;
      }
    },
    getGemId(gem) {
      const gem_path = gem?.$path || "";
      if (!gem_path) return "";
      const path_parts = gem_path.split("/");
      return path_parts[path_parts.length - 1] || "";
    },
    getGemTimestamp(gem) {
      const date_value = gem?.$date_modified || gem?.$date_created;
      const timestamp = date_value ? new Date(date_value).getTime() : 0;
      return Number.isFinite(timestamp) ? timestamp : 0;
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
._gemsView {
  position: relative;
  height: 100%;
  overflow-y: auto;
}

._gemsView--content {
  position: relative;
  min-height: 100%;
  padding: calc(var(--spacing) * 2) calc(var(--spacing) * 3);
}

._pageTitle {
  margin: 0;
}

._pageHeader {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--spacing);
  margin-bottom: calc(var(--spacing) * 1);
}

._headerActions {
  display: flex;
  gap: calc(var(--spacing) / 2);
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

  &._selected {
    background: var(--c-gris_clair);
  }
}

._clickableRow:hover {
  background: var(--c-gris_clair);
}

._gemOverlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.2);
  z-index: 30;
  padding-left: 15vw;
  overflow: hidden;
}

._gemPanel {
  width: 100%;

  background: var(--c-bodybg);
  height: 100dvh;
  overflow-y: auto;
  overflow-x: hidden;
  overscroll-behavior: contain;
  padding: calc(var(--spacing) * 1.25);
}

._gemMetadataValue {
  font-family: var(--sl-font-mono);
  font-size: var(--sl-font-size-x-small);
}
</style>
