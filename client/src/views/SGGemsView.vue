<template>
  <div class="_gemsView">
    <div class="_gemsView--content">
      <div class="_pageHeader">
        <h1 class="_pageTitle">{{ $t("sg_all_gems") }}</h1>
        <div class="_headerActions">
          <div
            class="_densityControls"
            role="group"
            aria-label="Gems list density"
          >
            <button
              v-for="density_option in density_options"
              :key="density_option.value"
              type="button"
              class="u-button u-button_icon _densityButton"
              :class="{ _active: view_density === density_option.value }"
              :title="density_option.label"
              :aria-label="density_option.label"
              :aria-pressed="view_density === density_option.value"
              @click="setViewDensity(density_option.value)"
            >
              <b-icon :icon="density_option.icon" />
            </button>
          </div>
          <router-link to="/gems/new" class="u-button u-button_bleuvert">
            <b-icon icon="plus-lg" />
            {{ $t("sg_create_gem") }}
          </router-link>
          <!-- <button
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
          </button> -->
          <!-- <button
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
          </button> -->
        </div>
      </div>

      <div v-if="is_loading">{{ $t("sg_loading_gems") }}</div>
      <div v-else-if="fetch_error" class="u-errorMsg">{{ fetch_error }}</div>
      <div v-else class="_tableSection">
        <SGGemsTable
          :gems="gems"
          :metadata_keys="metadata_keys"
          :metadata_labels="metadata_labels"
          :metadata_icons="metadata_icons"
          :field_editable_map="field_editable_map"
          :selected_gem_id="$route.params.gem_id"
          :is_gem_open="is_gem_open"
          :view_density="view_density"
          @rowClick="openGem"
          @editCell="onTableEditCell"
        />

        <GemCsvExportButton
          :gems="sorted_gems"
          :metadata_keys="metadata_keys"
          :metadata_labels="metadata_labels"
        />
      </div>
    </div>

    <transition name="fade">
      <div v-if="is_gem_open" class="_gemOverlay" @click.self="closeGemPanel">
        <section class="_gemPanel">
          <router-view :all_gems="gems" />
        </section>
      </div>
    </transition>

    <SGGemEditFieldModal
      v-if="editing_field && editing_gem"
      :field="editing_field"
      :current_value="editing_current_value"
      :gem_path="editing_gem.$path"
      :gem="editing_gem"
      @saved="onFieldSaved"
      @close="
        editing_field = null;
        editing_gem = null;
      "
    />
  </div>
</template>
<script>
import { buildGemFieldConfigs } from "@/components/gems/gem_field_configs";

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
  price_per_carat_pcb: 0,
  price_per_carat_pa: 0,
  pv_selling_price: 0,
  pvd_asking_price: 0,
  pc_to: 0,
  pf_invoiced_price: 0,
  price_per_carat_all: 0,
};
const view_density_localstorage_key = "sg_gems_view_density";
const available_view_densities = ["compact", "medium", "large"];

export default {
  name: "SGGemsView",
  components: {
    SGGemEditFieldModal: () =>
      import("@/components/gems/SGGemEditFieldModal.vue"),
    SGGemsTable: () => import("@/components/gems/SGGemsTable.vue"),
    GemCsvExportButton: () =>
      import("@/components/gems/GemCsvExportButton.vue"),
  },
  data() {
    return {
      gems_path: "gems",
      gems: [],
      is_loading: false,
      is_generating_placeholders: false,
      is_removing_all_gems: false,
      fetch_error: "",
      editing_gem: null,
      editing_field: null,
      editing_current_value: "",
      view_density: "medium",
    };
  },
  created() {
    this.loadViewDensityFromStorage();
  },
  mounted() {
    this.fetchGems();
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
        "name",
        "title",
        "$path",
        "$date_created",
        "$date_modified",
        "$status",
        "$admins",
        "$contributors",
        "$files",
        "price_per_carat_pa_pcb",
      ]);
      const known_order = [
        "id",
        "$cover",
        "internal_name",
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
        "price_per_carat_pcb",
        "price_per_carat_pa",
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
      return [...this.gems].sort((a, b) =>
        this.getGemId(b).localeCompare(this.getGemId(a), undefined, {
          numeric: true,
          sensitivity: "base",
        })
      );
    },
    metadata_labels() {
      return this.metadata_keys.reduce((accumulator, metadata_key) => {
        accumulator[metadata_key] = this.getMetadataLabel(metadata_key);
        return accumulator;
      }, {});
    },
    metadata_icons() {
      return this.metadata_keys.reduce((accumulator, metadata_key) => {
        accumulator[metadata_key] = this.getMetadataIcon(metadata_key);
        return accumulator;
      }, {});
    },
    field_editable_map() {
      return this.metadata_keys.reduce((accumulator, metadata_key) => {
        accumulator[metadata_key] = this.isFieldEditable(metadata_key);
        return accumulator;
      }, {});
    },
    density_options() {
      return [
        {
          value: "compact",
          icon: "zoom-out",
          label: "Compact view",
        },
        {
          value: "medium",
          icon: "search",
          label: "Medium view",
        },
        {
          value: "large",
          icon: "zoom-in",
          label: "Large view",
        },
      ];
    },
  },
  methods: {
    loadViewDensityFromStorage() {
      try {
        const stored_density = localStorage.getItem(
          view_density_localstorage_key
        );
        if (!stored_density) return;
        if (!available_view_densities.includes(stored_density)) return;
        this.view_density = stored_density;
      } catch {
        // Keep default when storage is unavailable.
      }
    },
    persistViewDensityToStorage() {
      try {
        localStorage.setItem(view_density_localstorage_key, this.view_density);
      } catch {
        // Ignore storage write errors.
      }
    },
    setViewDensity(next_density) {
      if (!available_view_densities.includes(next_density)) return;
      this.view_density = next_density;
      this.persistViewDensityToStorage();
    },
    closeGemPanel() {
      this.$router.push("/gems");
    },
    async fetchGems() {
      this.is_loading = true;
      this.fetch_error = "";

      try {
        const fetched_gems = await this.$api.getFolders({
          path: this.gems_path,
        });
        this.gems = Array.isArray(fetched_gems) ? fetched_gems : [];
        this.gems.forEach((gem) => {
          this.ensureGemPricingFields(gem);
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
          const pv_selling_price = Number(
            (Math.random() * 2400 + 300).toFixed(2)
          );
          const pvd_asking_price = Number((pv_selling_price * 1.15).toFixed(2));

          await this.$api.createFolder({
            path: this.gems_path,
            additional_meta: {
              internal_name: `${placeholder_name} ${batch_id}`,
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
    getPairedGemOptions(excluded_gem_id) {
      return (Array.isArray(this.gems) ? this.gems : [])
        .filter((g) => g?.$path && !g.$path.endsWith(`/${excluded_gem_id}`))
        .map((g) => {
          const gem_id = this.getGemId(g);
          const gem_label =
            (g.internal_name && String(g.internal_name).trim()) ||
            (g.reference_supplier && String(g.reference_supplier).trim()) ||
            (g.reference_customer && String(g.reference_customer).trim()) ||
            gem_id;
          return { value: gem_id, label: gem_label };
        });
    },
    getFieldConfig(metadata_key, gem) {
      const gem_id = this.getGemId(gem);
      const configs = buildGemFieldConfigs(
        this.$t.bind(this),
        this.getPairedGemOptions(gem_id)
      );
      return configs[metadata_key] || null;
    },
    isFieldEditable(metadata_key) {
      if (metadata_key === "id" || metadata_key === "$cover") return false;
      const config = this.getFieldConfig(metadata_key, {});
      return config !== null && !config.readonly;
    },
    onTableEditCell({ gem, metadata_key }) {
      this.openCellEditModal(gem, metadata_key);
    },
    openCellEditModal(gem, metadata_key) {
      const field_config = this.getFieldConfig(metadata_key, gem);
      if (!field_config || field_config.readonly) return;
      const raw_value = gem?.[metadata_key];
      this.editing_current_value =
        raw_value !== undefined && raw_value !== null ? raw_value : "";
      this.editing_gem = gem;
      this.editing_field = field_config;
    },
    onFieldSaved({ key, value, changes }) {
      if (!this.editing_gem) return;
      const gem_path = this.editing_gem.$path;
      const index = this.gems.findIndex((g) => g.$path === gem_path);
      if (index !== -1) {
        const target_gem = this.gems[index];
        const next_changes =
          changes && typeof changes === "object" ? changes : { [key]: value };
        Object.keys(next_changes).forEach((change_key) => {
          this.$set(target_gem, change_key, next_changes[change_key]);
        });
        this.ensureGemPricingFields(target_gem);
      }
      this.editing_gem = null;
      this.editing_field = null;
    },
    ensureGemPricingFields(gem) {
      if (!gem || typeof gem !== "object") return;
      const weight_ct = this.toNumberOrDefault(gem.weight_ct);
      const legacy_per_carat = this.toNumberOrNull(gem.price_per_carat_pa_pcb);
      const base_price_pcb = this.toNumberOrDefault(gem.base_price_pcb);
      const purchased_price_pa = this.toNumberOrDefault(gem.purchased_price_pa);

      const price_per_carat_pcb = this.resolvePerCaratValue({
        explicit_value: gem.price_per_carat_pcb,
        legacy_value: legacy_per_carat,
        total_value: base_price_pcb,
        weight_ct,
      });
      const price_per_carat_pa = this.resolvePerCaratValue({
        explicit_value: gem.price_per_carat_pa,
        legacy_value: legacy_per_carat,
        total_value: purchased_price_pa,
        weight_ct,
      });

      this.$set(gem, "price_per_carat_pcb", price_per_carat_pcb);
      this.$set(gem, "price_per_carat_pa", price_per_carat_pa);
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
    computePerCarat({ total_value, weight_ct }) {
      if (!Number.isFinite(total_value)) return 0;
      if (!Number.isFinite(weight_ct) || weight_ct <= 0) return 0;
      return Number((total_value / weight_ct).toFixed(2));
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
    getMetadataIcon(metadata_key) {
      const metadata_to_icon = {
        id: "card-list",
        $cover: "images",
        internal_name: "pencil",
        reference_supplier: "archive",
        reference_customer: "person-circle",
        paired_gem: "link",
        number_of_pieces: "list-ol",
        stone_type: "gem",
        weight_ct: "rulers",
        color: "palette-fill",
        shape: "pentagon",
        origin_country: "pin-map",
        treatment_type: "tools",
        length_mm: "aspect-ratio",
        width_mm: "aspect-ratio",
        height_mm: "aspect-ratio",
        base_price_pcb: "tag",
        purchased_price_pa: "tag",
        price_per_carat_pcb: "diagram2",
        price_per_carat_pa: "diagram2",
        pv_selling_price: "tag",
        pvd_asking_price: "diagram2",
        pc_to: "file-earmark-text",
        pf_invoiced_price: "file-earmark-text",
        price_per_carat_all: "arrow-up",
      };
      return metadata_to_icon[metadata_key] || null;
    },
    getMetadataLabel(metadata_key) {
      const metadata_to_translation_key = {
        id: "sg_id",
        status: "sg_status",
        $cover: "sg_cover",
        internal_name: "sg_internal_name",
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
        price_per_carat_pcb: "sg_price_per_carat_pcb",
        price_per_carat_pa: "sg_price_per_carat_pa",
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
  padding: calc(var(--spacing) * 2) calc(var(--spacing) * 3)
    calc(var(--spacing) * 1);
}

._gemsView--content {
  position: relative;
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
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
  align-items: center;
  gap: calc(var(--spacing) / 2);
}

._densityControls {
  display: inline-flex;
  align-items: center;
  gap: calc(var(--spacing) / 4);
}

._densityButton {
  // min-width: 34px;
  padding: calc(var(--spacing) / 4);

  &._active {
    background: var(--c-bleuvert);
    color: var(--c-blanc);
    border-color: var(--c-bleuvert);
  }
}

._tableSection {
  min-height: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--spacing);
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
}
</style>
