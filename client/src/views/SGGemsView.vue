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
            :disabled="is_generating_placeholders || is_removing_all_gems"
            @click="generatePlaceholderGems"
          >
            {{
              is_generating_placeholders
                ? $t("sg_generating_placeholder_gems")
                : $t("sg_generate_placeholder_gems")
            }}
          </button>
          <button
            type="button"
            class="u-button u-button_red"
            :disabled="is_generating_placeholders || is_removing_all_gems"
            @click="removeAllGems"
          >
            {{
              is_removing_all_gems
                ? $t("sg_removing_all_gems")
                : $t("sg_remove_all_gems")
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
              <div v-if="metadata_key === '$cover'" class="_coverCell">
                <CoverField
                  :context="'tiny'"
                  :ratio="'4 / 3'"
                  :cover="gem.$cover"
                  :path="gem.$path"
                  :can_edit="false"
                />
              </div>
              <span v-else class="_gemMetadataValue">{{
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
const placeholder_gem_fields_defaults = {
  status: "reference",
  reference_supplier: "",
  reference_customer: "",
  paired_gem: "",
  number_of_pieces: 1,
  stone_type: "",
  color: "",
  shape: "",
  origin_country: "",
  treatment_type: "",
  length_mm: 0,
  width_mm: 0,
  height_mm: 0,
  weight_ct: 0,
  base_price_pcb: 0,
  purchased_price_pa: 0,
  price_per_carat_pa_pcb: 0,
  pv_selling_price: 0,
  pvd_asking_price: 0,
  pc_to: 0,
  pf_invoiced_price: 0,
  price_per_carat_all: 0,
};

export default {
  name: "SGGemsView",
  data() {
    return {
      gems_path: "gems",
      gems: [],
      is_loading: false,
      is_generating_placeholders: false,
      is_removing_all_gems: false,
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
      return ["Open gem", "Create gem"].includes(this.$route.name);
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
        "$cover",
        "id",
        "status",
        "reference_supplier",
        "reference_customer",
        "paired_gem",
        "number_of_pieces",
        "stone_type",
        "weight_ct",
        "color",
        "shape",
        "origin_country",
        "treatment_type",
        "length_mm",
        "width_mm",
        "height_mm",
        "base_price_pcb",
        "purchased_price_pa",
        "price_per_carat_pa_pcb",
        "pv_selling_price",
        "pvd_asking_price",
        "pc_to",
        "pf_invoiced_price",
        "price_per_carat_all",
      ];
      const metadata_key_set = new Set();

      this.gems.forEach((gem) => {
        Object.keys(gem || {}).forEach((key) => {
          if (!ignored_keys.has(key)) metadata_key_set.add(key);
        });
      });
      metadata_key_set.add("id");
      metadata_key_set.add("$cover");

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
          const purchased_price_pa = Number(
            (Math.random() * 1200 + 100).toFixed(2)
          );
          const pv_selling_price = Number((Math.random() * 2400 + 300).toFixed(2));
          const pvd_asking_price = Number((pv_selling_price * 1.15).toFixed(2));

          await this.$api.createFolder({
            path: this.gems_path,
            additional_meta: {
              title: `${placeholder_name} ${batch_id}`,
              name: `${placeholder_name} ${batch_id}`,
              $status: "public",
              $admins: "everyone",
              $contributors: "everyone",
              ...placeholder_gem_fields_defaults,
              reference_supplier: "Placeholder supplier",
              stone_type: "Quartz",
              color: "Green",
              shape: "Oval",
              origin_country: "Unknown",
              treatment_type: "Natural",
              length_mm: Number((Math.random() * 6 + 6).toFixed(2)),
              width_mm: Number((Math.random() * 4 + 4).toFixed(2)),
              height_mm: Number((Math.random() * 3 + 3).toFixed(2)),
              weight_ct: Number((Math.random() * 4 + 0.8).toFixed(2)),
              purchased_price_pa,
              pv_selling_price,
              pvd_asking_price,
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
    async removeAllGems() {
      if (this.is_removing_all_gems) return;
      if (!Array.isArray(this.gems) || this.gems.length === 0) return;

      const should_remove_all = window.confirm(
        this.$t("sg_remove_all_gems_confirm", { count: this.gems.length })
      );
      if (!should_remove_all) return;

      this.is_removing_all_gems = true;
      try {
        const folder_slugs = this.gems
          .map((gem) => this.getGemId(gem))
          .filter((folder_slug) => Boolean(folder_slug));
        const { success } = await this.$api.deleteFolders({
          path: this.gems_path,
          folder_slugs,
        });
        await this.fetchGems();
        if (success.length > 0) {
          this.$alertify
            .delay(4000)
            .success(this.$t("sg_removed_all_gems_success"));
        } else {
          this.$alertify
            .delay(4000)
            .error(this.$t("sg_could_not_remove_all_gems"));
        }
      } catch ({ code }) {
        this.$alertify
          .delay(4000)
          .error(code || this.$t("sg_could_not_remove_all_gems"));
      } finally {
        this.is_removing_all_gems = false;
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
        $cover: "sg_cover",
        reference_supplier: "sg_reference_supplier",
        reference_customer: "sg_reference_customer",
        paired_gem: "sg_paired_gem",
        number_of_pieces: "sg_number_of_pieces",
        stone_type: "sg_stone_type",
        weight_ct: "sg_weight_ct",
        color: "sg_color",
        shape: "sg_shape",
        origin_country: "sg_origin_country",
        treatment_type: "sg_treatment_type",
        length_mm: "sg_length_mm",
        width_mm: "sg_width_mm",
        height_mm: "sg_height_mm",
        base_price_pcb: "sg_base_price_pcb",
        purchased_price_pa: "sg_purchased_price_pa",
        price_per_carat_pa_pcb: "sg_price_per_carat_pa_pcb",
        pv_selling_price: "sg_pv_selling_price",
        pvd_asking_price: "sg_pvd_asking_price",
        pc_to: "sg_pc_to",
        pf_invoiced_price: "sg_pf_invoiced_price",
        price_per_carat_all: "sg_price_per_carat_all",
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
  padding: calc(var(--spacing) * 2) calc(var(--spacing) * 3);
}

._gemsView--content {
  position: relative;
  height: 100%;
  overflow-y: auto;
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
  border-collapse: collapse;
  display: block;
  overflow-x: auto;
  border: 1px solid var(--c-gris_clair);

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
}

._gemPanel {
  width: 100%;

  background: var(--c-bodybg);
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  overscroll-behavior: contain;
  padding: calc(var(--spacing) * 1.25);
}

._gemMetadataValue {
  font-family: var(--sl-font-mono);
  font-size: var(--sl-font-size-x-small);
}

._coverCell {
  position: relative;
  width: 84px;
  min-width: 84px;
  aspect-ratio: 4 / 3;
}
</style>
