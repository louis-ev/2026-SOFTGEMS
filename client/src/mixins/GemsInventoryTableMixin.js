import GemPricing from "@/mixins/GemPricing";
import GemDimensions from "@/mixins/GemDimensions";
import {
  buildGemsTableAllMetadataKeys,
  gems_table_gem_excluded_metadata_keys,
  normalizeGemsTableSelectedMetadataKeys,
  stripLinearDimensionKeys,
  stripVirtualPerCaratKeys,
} from "@/utils/gems_table_metadata.js";
import {
  gems_table_columns_storage_scopes,
  loadGemsMetadataKeysFromStorage,
  persistGemsMetadataKeysToStorage,
} from "@/utils/gems_table_columns_storage.js";

export {
  gems_metadata_keys_localstorage_key,
  gems_table_columns_storage_scopes,
  selections_gems_metadata_keys_localstorage_key,
} from "@/utils/gems_table_columns_storage.js";
export const gems_pinned_metadata_keys = ["id", "status"];
export const gem_excluded_metadata_keys = [...gems_table_gem_excluded_metadata_keys];

/** Shared gems table columns (same rules as SGGemsView). Host must expose `gems` (array). */
export default {
  mixins: [GemDimensions, GemPricing],
  data() {
    return {
      selected_metadata_keys: [],
    };
  },
  created() {
    this.loadGemsMetadataKeysFromStorage();
  },
  computed: {
    gems_metadata_keys_storage_scope() {
      return this.getGemsMetadataKeysStorageScope();
    },
    all_metadata_keys() {
      const gems = Array.isArray(this.gems) ? this.gems : [];
      return buildGemsTableAllMetadataKeys(gems);
    },
    metadata_keys() {
      const all_keys = this.all_metadata_keys;
      if (all_keys.length === 0) return [];
      if (!Array.isArray(this.selected_metadata_keys)) return all_keys;

      const selected_in_order = this.stripExcludedGemMetadataKeys(
        this.stripLinearDimensionKeys(
          this.stripVirtualPerCaratKeys(
            this.selected_metadata_keys.filter((metadata_key) =>
              all_keys.includes(metadata_key)
            )
          )
        )
      );
      const selected_or_default =
        selected_in_order.length > 0 ? selected_in_order : all_keys;
      return this.enforcePinnedGemsColumns(selected_or_default, all_keys);
    },
    sorted_gems() {
      if (!Array.isArray(this.filtered_gems)) return [];
      return [...this.filtered_gems].sort((a, b) =>
        this.getGemId(b).localeCompare(this.getGemId(a), undefined, {
          numeric: true,
          sensitivity: "base",
        })
      );
    },
    metadata_labels() {
      return this.all_metadata_keys.reduce((accumulator, metadata_key) => {
        accumulator[metadata_key] = this.getGemsMetadataLabel(metadata_key);
        return accumulator;
      }, {});
    },
    metadata_icons() {
      return this.all_metadata_keys.reduce((accumulator, metadata_key) => {
        accumulator[metadata_key] = this.getGemsMetadataIcon(metadata_key);
        return accumulator;
      }, {});
    },
  },
  watch: {
    all_metadata_keys: {
      immediate: true,
      handler() {
        this.syncSelectedGemsMetadataKeys();
      },
    },
    gems_metadata_keys_storage_scope: {
      handler(next_scope, previous_scope) {
        if (next_scope === previous_scope) return;
        this.reloadGemsMetadataKeysFromStorage();
      },
    },
  },
  methods: {
    getGemsMetadataKeysStorageScope() {
      return gems_table_columns_storage_scopes.all_gems;
    },
    stripLinearDimensionKeys,
    stripVirtualPerCaratKeys,
    stripExcludedGemMetadataKeys(metadata_keys) {
      if (!Array.isArray(metadata_keys)) return [];
      return metadata_keys.filter(
        (key) => !gem_excluded_metadata_keys.includes(key)
      );
    },
    reloadGemsMetadataKeysFromStorage() {
      const storage_scope = this.gems_metadata_keys_storage_scope;
      if (!storage_scope) {
        this.selected_metadata_keys = [];
        this.syncSelectedGemsMetadataKeys();
        return;
      }

      this.selected_metadata_keys = this.stripExcludedGemMetadataKeys(
        loadGemsMetadataKeysFromStorage(storage_scope)
      );
      this.syncSelectedGemsMetadataKeys();
    },
    loadGemsMetadataKeysFromStorage() {
      this.reloadGemsMetadataKeysFromStorage();
    },
    syncSelectedGemsMetadataKeys() {
      const all_keys = Array.isArray(this.all_metadata_keys)
        ? this.all_metadata_keys
        : [];
      if (all_keys.length === 0) {
        this.selected_metadata_keys = [];
        return;
      }

      const selected_keys = Array.isArray(this.selected_metadata_keys)
        ? this.stripExcludedGemMetadataKeys(
            normalizeGemsTableSelectedMetadataKeys(this.selected_metadata_keys)
          )
        : [];
      const selected_in_order = selected_keys.filter((metadata_key) =>
        all_keys.includes(metadata_key)
      );
      const next_selected_keys =
        selected_in_order.length > 0 ? [...selected_in_order] : [...all_keys];
      const normalized_selected_keys = this.enforcePinnedGemsColumns(
        next_selected_keys,
        all_keys
      );

      if (
        !this.areGemsMetadataKeyArraysEqual(
          normalized_selected_keys,
          this.selected_metadata_keys
        )
      ) {
        this.selected_metadata_keys = normalized_selected_keys;
      }
    },
    persistGemsMetadataKeysToStorage() {
      const storage_scope = this.gems_metadata_keys_storage_scope;
      if (!storage_scope) return;
      persistGemsMetadataKeysToStorage(
        storage_scope,
        this.selected_metadata_keys
      );
    },
    onSaveGemsColumnsSelection(next_selected_metadata_keys) {
      if (
        !Array.isArray(next_selected_metadata_keys) ||
        next_selected_metadata_keys.length === 0
      ) {
        return;
      }
      this.selected_metadata_keys = this.enforcePinnedGemsColumns(
        this.stripExcludedGemMetadataKeys(
          normalizeGemsTableSelectedMetadataKeys(next_selected_metadata_keys)
        ),
        this.all_metadata_keys
      );
      this.persistGemsMetadataKeysToStorage();
      this.show_columns_modal = false;
    },
    enforcePinnedGemsColumns(metadata_keys, all_keys = this.all_metadata_keys) {
      const available_keys = Array.isArray(all_keys) ? all_keys : [];
      const requested_keys = Array.isArray(metadata_keys) ? metadata_keys : [];

      const pinned_existing_keys = gems_pinned_metadata_keys.filter(
        (metadata_key) => available_keys.includes(metadata_key)
      );
      const ordered_non_pinned_keys = requested_keys.filter(
        (metadata_key) =>
          !gems_pinned_metadata_keys.includes(metadata_key) &&
          available_keys.includes(metadata_key)
      );

      return [...pinned_existing_keys, ...ordered_non_pinned_keys];
    },
    areGemsMetadataKeyArraysEqual(first_array, second_array) {
      if (!Array.isArray(first_array) || !Array.isArray(second_array)) {
        return false;
      }
      if (first_array.length !== second_array.length) return false;
      return first_array.every(
        (first_item, index) => first_item === second_array[index]
      );
    },
    ensureGemPricingFields(gem) {
      this.ensureGemsInventoryPricingFields(gem);
    },
    ensureGemsInventoryPricingFields(gem) {
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
    getGemsMetadataIcon(metadata_key) {
      const metadata_to_icon = {
        id: undefined,
        $cover: "images",
        $date_modified: "clock-history",
        status: "tag",
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
        import_price: "globe",
        pv_selling_price: "tag",
        pvd_asking_price: "diagram2",
        pc_to: "file-earmark-text",
        pf_invoiced_price: "file-earmark-text",
        dimensions_lwh: "aspect-ratio",
      };
      return metadata_to_icon[metadata_key] || null;
    },
    getGemsMetadataLabel(metadata_key) {
      const pricing_table_header_i18n = {
        base_price_pcb: "sg_gems_table_col_pcb",
        purchased_price_pa: "sg_gems_table_col_pa",
        import_price: "sg_gems_table_col_import",
        pv_selling_price: "sg_gems_table_col_pv",
        pvd_asking_price: "sg_gems_table_col_pvd",
        pc_to: "sg_gems_table_col_pc",
        pf_invoiced_price: "sg_gems_table_col_pf",
      };
      const pricing_header = pricing_table_header_i18n[metadata_key];
      if (pricing_header) return this.$t(pricing_header);

      const metadata_to_translation_key = {
        id: "sg_id",
        $date_modified: "sg_last_edited",
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
        pv_selling_price: "sg_pv_selling_price",
        import_price: "sg_import_price",
        pvd_asking_price: "sg_pvd_asking_price",
        pc_to: "sg_pc_to",
        pf_invoiced_price: "sg_pf_invoiced_price",
        dimensions_lwh: "sg_dimensions_lwh",
        $path: "sg_path",
        $date_created: "sg_created",
      };
      const translation_key = metadata_to_translation_key[metadata_key];
      if (!translation_key) return metadata_key;
      return this.$t(translation_key);
    },
  },
};
