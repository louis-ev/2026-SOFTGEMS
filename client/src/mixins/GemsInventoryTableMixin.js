import GemPricing, {
  gem_virtual_per_carat_column_keys,
} from "@/mixins/GemPricing";
import GemDimensions, {
  gem_linear_dimension_keys,
  gem_dimensions_merged_column_key,
} from "@/mixins/GemDimensions";

export const gems_metadata_keys_localstorage_key = "sg_gems_metadata_keys";
export const gems_pinned_metadata_keys = ["id", "$cover"];

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
    all_metadata_keys() {
      if (!Array.isArray(this.gems) || this.gems.length === 0) return [];

      const ignored_keys = new Set([
        "name",
        "title",
        "price_per_carat_pa_pcb",
        ...gem_virtual_per_carat_column_keys,
        ...gem_linear_dimension_keys,
      ]);
      const known_order = [
        "id",
        "$cover",
        "$date_modified",
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
        "dimensions_lwh",
        "base_price_pcb",
        "purchased_price_pa",
        "pv_selling_price",
        "pvd_asking_price",
        "pc_to",
        "pf_invoiced_price",
        "price_per_carat_all",
      ];
      const metadata_key_set = new Set();

      this.gems.forEach((gem) => {
        Object.keys(gem || {}).forEach((key) => {
          if (ignored_keys.has(key)) return;
          if (
            key.startsWith("$") &&
            key !== "$date_modified" &&
            key !== "$cover"
          )
            return;
          metadata_key_set.add(key);
        });
      });
      const gems_have_linear_dimensions = this.gems.some((gem) =>
        gem_linear_dimension_keys.some((dk) =>
          Object.prototype.hasOwnProperty.call(gem || {}, dk)
        )
      );
      if (gems_have_linear_dimensions) {
        metadata_key_set.add(gem_dimensions_merged_column_key);
      }
      metadata_key_set.add("id");
      metadata_key_set.add("$cover");
      metadata_key_set.add("$date_modified");

      return Array.from(metadata_key_set).sort((a, b) => {
        const a_index = known_order.indexOf(a);
        const b_index = known_order.indexOf(b);
        const a_rank = a_index === -1 ? Number.MAX_SAFE_INTEGER : a_index;
        const b_rank = b_index === -1 ? Number.MAX_SAFE_INTEGER : b_index;
        if (a_rank !== b_rank) return a_rank - b_rank;
        return a.localeCompare(b);
      });
    },
    metadata_keys() {
      const all_keys = this.all_metadata_keys;
      if (all_keys.length === 0) return [];
      if (!Array.isArray(this.selected_metadata_keys)) return all_keys;

      const selected_in_order = this.stripLinearDimensionKeys(
        this.stripVirtualPerCaratKeys(
          this.selected_metadata_keys.filter((metadata_key) =>
            all_keys.includes(metadata_key)
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
  },
  methods: {
    stripLinearDimensionKeys(metadata_keys) {
      if (!Array.isArray(metadata_keys)) return [];
      let inserted = false;
      const out = [];
      for (const key of metadata_keys) {
        if (gem_linear_dimension_keys.includes(key)) {
          if (!inserted) {
            out.push(gem_dimensions_merged_column_key);
            inserted = true;
          }
          continue;
        }
        out.push(key);
      }
      return out;
    },
    stripVirtualPerCaratKeys(metadata_keys) {
      if (!Array.isArray(metadata_keys)) return [];
      return metadata_keys.filter(
        (key) => !gem_virtual_per_carat_column_keys.includes(key)
      );
    },
    loadGemsMetadataKeysFromStorage() {
      try {
        const stored_keys_json = localStorage.getItem(
          gems_metadata_keys_localstorage_key
        );
        if (!stored_keys_json) return;
        const stored_keys = JSON.parse(stored_keys_json);
        if (!Array.isArray(stored_keys)) return;
        this.selected_metadata_keys = this.stripLinearDimensionKeys(
          stored_keys
            .filter((metadata_key) => typeof metadata_key === "string")
            .filter(
              (metadata_key) =>
                !gem_virtual_per_carat_column_keys.includes(metadata_key)
            )
        );
      } catch {
        // Keep defaults when storage is unavailable or invalid.
      }
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
        ? this.stripLinearDimensionKeys(
            this.stripVirtualPerCaratKeys(this.selected_metadata_keys)
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
        this.persistGemsMetadataKeysToStorage();
      }
    },
    persistGemsMetadataKeysToStorage() {
      try {
        localStorage.setItem(
          gems_metadata_keys_localstorage_key,
          JSON.stringify(this.selected_metadata_keys)
        );
      } catch {
        // Ignore storage write errors.
      }
    },
    onSaveGemsColumnsSelection(next_selected_metadata_keys) {
      if (
        !Array.isArray(next_selected_metadata_keys) ||
        next_selected_metadata_keys.length === 0
      ) {
        return;
      }
      this.selected_metadata_keys = this.enforcePinnedGemsColumns(
        this.stripLinearDimensionKeys(
          this.stripVirtualPerCaratKeys(next_selected_metadata_keys)
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
        price_per_carat_pv: "diagram2",
        pvd_asking_price: "diagram2",
        pc_to: "file-earmark-text",
        price_per_carat_pc: "diagram2",
        pf_invoiced_price: "file-earmark-text",
        price_per_carat_pf: "diagram2",
        price_per_carat_all: "arrow-up",
        dimensions_lwh: "aspect-ratio",
      };
      return metadata_to_icon[metadata_key] || null;
    },
    getGemsMetadataLabel(metadata_key) {
      const pricing_table_header_i18n = {
        base_price_pcb: "sg_price_per_carat_pcb",
        purchased_price_pa: "sg_price_per_carat_pa",
        pv_selling_price: "sg_price_per_carat_pv",
        pvd_asking_price: "sg_price_per_carat_pvd",
        pc_to: "sg_price_per_carat_pc",
        pf_invoiced_price: "sg_price_per_carat_pf",
      };
      const pricing_header = pricing_table_header_i18n[metadata_key];
      if (pricing_header) return this.$t(pricing_header);

      const metadata_to_translation_key = {
        id: "sg_id",
        $date_modified: "sg_last_edited",
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
        price_per_carat_pv: "sg_price_per_carat_pv",
        pvd_asking_price: "sg_pvd_asking_price",
        pc_to: "sg_pc_to",
        price_per_carat_pc: "sg_price_per_carat_pc",
        pf_invoiced_price: "sg_pf_invoiced_price",
        price_per_carat_pf: "sg_price_per_carat_pf",
        price_per_carat_all: "sg_price_per_carat_all",
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
