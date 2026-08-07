<template>
  <div class="_gemsView">
    <SGOverlaySidePanelLayout :panel_open="is_gem_open" @close="closeGemPanel">
      <div class="_gemsView--content">
        <div class="_pageHeader">
          <h1 class="_pageTitle">{{ $t("sg_all_gems") }}</h1>
          <div class="_headerActions">
            <button
              type="button"
              class="u-button u-button_small"
              @click="openColumnsModal"
            >
              <b-icon icon="layout-three-columns" />
              {{ $t("sg_customize_columns") }}
            </button>
            <router-link
              to="/gems/new"
              class="u-button u-button_small u-button_bleuvert"
            >
              <b-icon icon="plus-lg" />
              {{ $t("sg_create_gem") }}
            </router-link>
            <DropDown
              v-if="!is_loading && !fetch_error"
              class="_gemsExportDropdown"
              :right="true"
              :show_label="false"
            >
              <GemCsvExportButton
                menu_mode
                :gems="sorted_gems_for_export"
                :metadata_keys="gems_metadata_keys"
                :metadata_labels="gems_metadata_labels"
                :gems_path="gems_path"
              />
            </DropDown>
            <SGGemBulkPerfSeedPanel
              v-if="false"
              :gems_path="gems_path"
              :disabled="is_loading || Boolean(fetch_error)"
              @finished="onBulkPerfSeedFinished"
            />
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

        <SGGemsInventoryTableSection
          ref="gems_inventory_table"
          class="_tableSection"
          :gems="gems"
          :is_loading="is_loading"
          :fetch_error="fetch_error"
          :selected_gem_id="$route.params.gem_id"
          :is_gem_open="is_gem_open"
          :field_editable_map="field_editable_map"
          enable_column_customizer
          @rowClick="openGem"
          @editCell="onTableEditCell"
          @sortedGemsChange="onSortedGemsChange"
          @metadataKeysChange="onMetadataKeysChange"
        />
      </div>
      <template #panel>
        <router-view :all_gems="gems" />
      </template>
    </SGOverlaySidePanelLayout>

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
import DropDown from "@/adc-core/ui/DropDown.vue";
import SGGemsInventoryTableSection from "@/components/gems/SGGemsInventoryTableSection.vue";
import { buildGemFieldConfigs } from "@/components/gems/gem_field_configs";
import { applyPairedGemPartnerUpdates } from "@/utils/gem_pairing.js";
import GemPricing, {
  computePvdFromPv,
  gem_virtual_per_carat_column_keys,
} from "@/mixins/GemPricing";
import GemDimensions, {
  gem_linear_dimension_keys,
  gem_dimensions_merged_column_key,
} from "@/mixins/GemDimensions";

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
  import_price: 0,
  pv_selling_price: 0,
  pvd_asking_price: 0,
  pc_to: 0,
  pf_invoiced_price: 0,
};
export default {
  name: "SGGemsView",
  mixins: [GemDimensions, GemPricing],
  components: {
    DropDown,
    SGGemsInventoryTableSection,
    SGOverlaySidePanelLayout: () =>
      import("@/components/softgems/SGOverlaySidePanelLayout.vue"),
    SGGemEditFieldModal: () =>
      import("@/components/gems/SGGemEditFieldModal.vue"),
    GemCsvExportButton: () =>
      import("@/components/gems/GemCsvExportButton.vue"),
    SGGemBulkPerfSeedPanel: () =>
      import("@/components/gems/SGGemBulkPerfSeedPanel.vue"),
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
      sorted_gems_for_export: [],
      gems_metadata_keys: [],
      gems_metadata_labels: {},
    };
  },
  async mounted() {
    // Same pattern as do•doc lists (PublicationsList, SpacesList, …):
    // bind `gems` to the api.store array, join the type room, then
    // socket `folderCreated` / `folderRemoved` mutate that array in place.
    this.$api.join({ room: this.gems_path });
    await this.fetchGems();
  },
  beforeDestroy() {
    this.$api.leave({ room: this.gems_path });
  },
  computed: {
    is_gem_open() {
      return ["Open gem", "Create gem"].includes(this.$route.name);
    },
    field_editable_map() {
      const accumulator = this.gems_metadata_keys.reduce(
        (acc, metadata_key) => {
          acc[metadata_key] = this.isFieldEditable(metadata_key);
          return acc;
        },
        {}
      );
      this.getPriceFieldPairs().forEach(({ virtual_per_carat_key }) => {
        accumulator[virtual_per_carat_key] = this.isFieldEditable(
          virtual_per_carat_key
        );
      });
      return accumulator;
    },
  },
  methods: {
    openColumnsModal() {
      this.$refs.gems_inventory_table?.openColumnsModal();
    },
    onSortedGemsChange(gems) {
      this.sorted_gems_for_export = Array.isArray(gems) ? gems : [];
    },
    onMetadataKeysChange(keys) {
      this.gems_metadata_keys = Array.isArray(keys) ? keys : [];
      const section = this.$refs.gems_inventory_table;
      this.gems_metadata_labels = section?.metadata_labels || {};
    },
    closeGemPanel() {
      this.$router.push("/gems");
    },
    onBulkPerfSeedFinished() {
      // Perf seed intentionally deletes store.gems; re-bind after bulk copy.
      this.fetchGems();
    },
    async fetchGems() {
      this.is_loading = true;
      this.fetch_error = "";

      try {
        // Returns api.store.gems (same array reference folderCreated pushes into).
        const fetched_gems = await this.$api.getFolders({
          path: this.gems_path,
        });
        this.gems = Array.isArray(fetched_gems) ? fetched_gems : [];
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
          const purchased_price_pa = Number(
            (Math.random() * 1200 + 100).toFixed(2)
          );
          const pv_selling_price = Number(
            (Math.random() * 2400 + 300).toFixed(2)
          );
          const pvd_asking_price = computePvdFromPv(pv_selling_price);

          await this.$api.createFolder({
            path: this.gems_path,
            additional_meta: {
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
    getGemTimestamp(gem) {
      const date_value = gem?.$date_modified || gem?.$date_created;
      const timestamp = date_value ? new Date(date_value).getTime() : 0;
      return Number.isFinite(timestamp) ? timestamp : 0;
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
    getFieldConfig(metadata_key, gem) {
      const configs = buildGemFieldConfigs(this.$t.bind(this));
      return configs[metadata_key] || null;
    },
    isFieldEditable(metadata_key) {
      if (!this.connected_as) return false;
      if (metadata_key === "id" || metadata_key === "$cover") return false;
      const config = this.getFieldConfig(metadata_key, {});
      return config !== null && !config.readonly;
    },
    onTableEditCell({ gem, metadata_key }) {
      this.openCellEditModal(gem, metadata_key);
    },
    openCellEditModal(gem, metadata_key) {
      if (!this.connected_as) return;
      const field_config = this.getFieldConfig(metadata_key, gem);
      if (!field_config || field_config.readonly) return;
      const raw_value = this.gemFieldDisplayValue(gem, field_config);
      this.editing_current_value =
        raw_value !== undefined && raw_value !== null && raw_value !== ""
          ? raw_value
          : raw_value === 0
          ? 0
          : "";
      this.editing_gem = gem;
      this.editing_field = field_config;
    },
    onFieldSaved({ key, value, changes, paired_gem_partner_updates }) {
      if (!this.editing_gem) return;
      const gem_path = this.editing_gem.$path;
      let scroll_metadata_key =
        key != null && String(key).trim() !== "" ? String(key) : "";
      if (gem_linear_dimension_keys.includes(scroll_metadata_key)) {
        scroll_metadata_key = gem_dimensions_merged_column_key;
      }
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
      applyPairedGemPartnerUpdates(
        this.gems,
        paired_gem_partner_updates,
        this.$set.bind(this)
      );
      this.editing_gem = null;
      this.editing_field = null;
      if (gem_path && scroll_metadata_key) {
        this.$nextTick(() => {
          this.$refs.gems_inventory_table?.scrollGemCellIntoView({
            gem_path,
            metadata_key: scroll_metadata_key,
          });
        });
      }
    },
    ensureGemPricingFields(gem) {
      if (!gem || typeof gem !== "object") return;
      this.getPriceFieldPairs().forEach(
        ({ total_key, virtual_per_carat_key }) => {
          this.$set(
            gem,
            virtual_per_carat_key,
            this.computeDisplayedPerCaratForGem(gem, total_key)
          );
        }
      );
    },
  },
};
</script>
<style lang="scss" scoped>
._gemsView {
  position: relative;
  height: 100%;
  min-height: 0;
}

._gemsView--content {
  position: relative;
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: calc(var(--spacing) * 2) calc(var(--spacing) * 3)
    calc(var(--spacing) * 1);
  box-sizing: border-box;
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

._gemsExportDropdown {
  flex-shrink: 0;
}

._tableSection {
  min-height: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--spacing);
}
</style>
