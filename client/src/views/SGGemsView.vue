<template>
  <div class="_gemsView">
    <SGOverlaySidePanelLayout
      :panel_open="is_gem_open"
      @close="closeGemPanel"
    >
      <div class="_gemsView--content">
        <div class="_pageHeader">
          <h1 class="_pageTitle">{{ $t("sg_all_gems") }}</h1>
          <div class="_headerActions">
            <button
              type="button"
              class="u-button"
              @click="show_columns_modal = true"
            >
              <b-icon icon="layout-three-columns" />
              {{ $t("sg_customize_columns") }}
            </button>
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
          <div class="_gemsSearchBar">
            <SearchInput
              v-model="gems_quick_search"
              :search_placeholder="$t('sg_gems_search_placeholder')"
              :name="'gems_quick_search'"
            />
          </div>
          <p
            v-if="gems_quick_search_filter_caption"
            class="_gemsActiveFilters"
            role="status"
          >
            {{ gems_quick_search_filter_caption }}
          </p>
          <SGGemsTable
            :gems="filtered_gems"
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
            :gems_path="gems_path"
          />
        </div>
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

    <SGGemColumnsModal
      v-if="show_columns_modal"
      :all_metadata_keys="all_metadata_keys"
      :selected_metadata_keys="selected_metadata_keys"
      :metadata_labels="metadata_labels"
      :metadata_icons="metadata_icons"
      @save="onSaveColumnsSelection"
      @close="show_columns_modal = false"
    />
  </div>
</template>
<script>
import SearchInput from "@/adc-core/inputs/SearchInput.vue";
import { buildGemFieldConfigs } from "@/components/gems/gem_field_configs";
import GemPricing from "@/mixins/GemPricing";

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
  pv_selling_price: 0,
  pvd_asking_price: 0,
  pc_to: 0,
  pf_invoiced_price: 0,
  price_per_carat_all: 0,
};
const metadata_keys_localstorage_key = "sg_gems_metadata_keys";
const pinned_metadata_keys = ["id", "$cover"];
const gems_quick_search_debounce_ms = 200;

export default {
  name: "SGGemsView",
  mixins: [GemPricing],
  components: {
    SearchInput,
    SGOverlaySidePanelLayout: () =>
      import("@/components/softgems/SGOverlaySidePanelLayout.vue"),
    SGGemEditFieldModal: () =>
      import("@/components/gems/SGGemEditFieldModal.vue"),
    SGGemsTable: () => import("@/components/gems/SGGemsTable.vue"),
    GemCsvExportButton: () =>
      import("@/components/gems/GemCsvExportButton.vue"),
    SGGemColumnsModal: () => import("@/components/gems/SGGemColumnsModal.vue"),
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
      view_density: "compact",
      show_columns_modal: false,
      selected_metadata_keys: [],
      gems_quick_search: "",
      gems_quick_search_debounced: "",
      gems_quick_search_debounce_timer_id: null,
    };
  },
  created() {
    this.loadMetadataKeysFromStorage();
  },
  mounted() {
    this.fetchGems();
    this.$api.join({ room: this.gems_path });
  },
  beforeDestroy() {
    this.$api.leave({ room: this.gems_path });
    if (this.gems_quick_search_debounce_timer_id !== null) {
      clearTimeout(this.gems_quick_search_debounce_timer_id);
      this.gems_quick_search_debounce_timer_id = null;
    }
  },
  computed: {
    is_gem_open() {
      return ["Open gem", "Create gem"].includes(this.$route.name);
    },
    all_metadata_keys() {
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
        "price_per_carat_pv",
        "pvd_asking_price",
        "pc_to",
        "price_per_carat_pc",
        "pf_invoiced_price",
        "price_per_carat_pf",
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
    metadata_keys() {
      const all_keys = this.all_metadata_keys;
      if (all_keys.length === 0) return [];
      if (!Array.isArray(this.selected_metadata_keys)) return all_keys;

      const selected_in_order = this.selected_metadata_keys.filter(
        (metadata_key) => all_keys.includes(metadata_key)
      );
      const selected_or_default =
        selected_in_order.length > 0 ? selected_in_order : all_keys;
      return this.enforcePinnedColumns(selected_or_default, all_keys);
    },
    filtered_gems() {
      if (!Array.isArray(this.gems)) return [];
      const parsed = this.parseGemsQuickSearchInput(
        this.gems_quick_search_debounced
      );
      return this.gems.filter((gem) => this.gemMatchesQuickSearch(gem, parsed));
    },
    gems_quick_search_filter_lines() {
      const raw = this.gems_quick_search_debounced;
      if (!raw || !String(raw).trim()) return [];

      const parsed = this.parseGemsQuickSearchInput(raw);
      const lines = [];
      const locale = this.$i18n.locale;
      const fmt_weight = (n) =>
        Number.isFinite(n)
          ? n.toLocaleString(locale, {
              minimumFractionDigits: 0,
              maximumFractionDigits: 6,
            })
          : "";

      if (parsed.id_needle) {
        lines.push(
          this.$t("sg_gems_filter_id_starts_with", {
            needle: parsed.id_needle,
          })
        );
      }

      if (parsed.stone_families.length === 1) {
        if (parsed.stone_families[0] === "sapphire") {
          lines.push(this.$t("sg_gems_filter_stone_sapphire"));
        } else {
          lines.push(this.$t("sg_gems_filter_stone_ruby"));
        }
      } else if (parsed.stone_families.length >= 2) {
        lines.push(this.$t("sg_gems_filter_stone_sapphire_or_ruby"));
      }

      if (parsed.stone_type_needle) {
        const matching_labels = this.collectDistinctStoneTypesMatchingNeedle(
          parsed.stone_type_needle
        );
        lines.push(
          this.$t("sg_gems_filter_stone_text", {
            needle: parsed.stone_type_needle,
            matches: this.formatStoneTypeMatchesForFilterCaption(matching_labels),
          })
        );
      }

      const ws = parsed.weight_spec;
      if (ws) {
        if (ws.type === "exact") {
          lines.push(
            this.$t("sg_gems_filter_weight_exact", {
              value: fmt_weight(ws.value),
            })
          );
        } else if (ws.type === "range") {
          if (ws.max_exclusive) {
            lines.push(
              this.$t("sg_gems_filter_weight_half_open", {
                min: fmt_weight(ws.min),
                max: fmt_weight(ws.max),
              })
            );
          } else {
            lines.push(
              this.$t("sg_gems_filter_weight_range", {
                min: fmt_weight(ws.min),
                max: fmt_weight(ws.max),
              })
            );
          }
        }
      }

      return lines;
    },
    gems_quick_search_filter_caption() {
      const lines = this.gems_quick_search_filter_lines;
      if (!lines.length) return "";
      return this.$t("sg_gems_filter_caption", {
        clauses: lines.join(" · "),
        shown: this.filtered_gems.length,
        total: this.gems.length,
      });
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
        accumulator[metadata_key] = this.getMetadataLabel(metadata_key);
        return accumulator;
      }, {});
    },
    metadata_icons() {
      return this.all_metadata_keys.reduce((accumulator, metadata_key) => {
        accumulator[metadata_key] = this.getMetadataIcon(metadata_key);
        return accumulator;
      }, {});
    },
    field_editable_map() {
      return this.all_metadata_keys.reduce((accumulator, metadata_key) => {
        accumulator[metadata_key] = this.isFieldEditable(metadata_key);
        return accumulator;
      }, {});
    },
  },
  watch: {
    gems_quick_search(next_value) {
      if (this.gems_quick_search_debounce_timer_id !== null) {
        clearTimeout(this.gems_quick_search_debounce_timer_id);
        this.gems_quick_search_debounce_timer_id = null;
      }
      this.gems_quick_search_debounce_timer_id = setTimeout(() => {
        this.gems_quick_search_debounce_timer_id = null;
        this.gems_quick_search_debounced =
          typeof next_value === "string" ? next_value : "";
      }, gems_quick_search_debounce_ms);
    },
    all_metadata_keys: {
      immediate: true,
      handler() {
        this.syncSelectedMetadataKeys();
      },
    },
  },
  methods: {
    normalizeGemsSearchNumber(str) {
      if (str === undefined || str === null) return NaN;
      const s = String(str).trim().replace(",", ".");
      return parseFloat(s);
    },
    inferWeightSpecFromPlainNumberToken(token) {
      const normalized_token = String(token).trim();
      const with_dot = normalized_token.replace(",", ".");
      if (!/^\d+\.\d+$/.test(with_dot)) return null;
      const v = parseFloat(with_dot);
      if (!Number.isFinite(v)) return null;
      const frac = with_dot.split(".")[1] || "";
      const frac_len = frac.length;
      const tol = Math.pow(10, -frac_len);
      return {
        type: "range",
        min: v - tol,
        max: v + tol,
      };
    },
    parseGemsQuickSearchInput(raw) {
      const base = {
        id_needle: "",
        weight_spec: null,
        stone_families: [],
        stone_type_needle: "",
      };
      if (!raw || typeof raw !== "string") return { ...base };

      let s = raw.trim();
      if (!s) return { ...base };

      const stone_families = [];
      const addStone = (key) => {
        if (!stone_families.includes(key)) stone_families.push(key);
      };
      if (/\bsap\b/i.test(s)) {
        addStone("sapphire");
        s = s.replace(/\bsap\b/gi, " ");
      }
      if (/\brub\b/i.test(s)) {
        addStone("ruby");
        s = s.replace(/\brub\b/gi, " ");
      }
      s = s.replace(/\s+/g, " ").trim();

      const result = {
        id_needle: "",
        weight_spec: null,
        stone_families,
        stone_type_needle: "",
      };

      if (!s) return result;

      s = s
        .replace(/\s*\u00B1\s*/g, "\u00B1")
        .replace(/\s*\+\/-\s*/g, "\u00B1");

      let m = s.match(
        /^=?(\d+(?:[.,]\d+)?)\u00B1(\d+(?:[.,]\d+)?)\s*$/i
      );
      if (m) {
        const c = this.normalizeGemsSearchNumber(m[1]);
        const d = this.normalizeGemsSearchNumber(m[2]);
        if (Number.isFinite(c) && Number.isFinite(d) && d >= 0) {
          result.weight_spec = {
            type: "range",
            min: c - d,
            max: c + d,
          };
          return result;
        }
      }

      m = s.match(/^=\s*(\d+(?:[.,]\d+)?)\s*$/);
      if (m) {
        const v = this.normalizeGemsSearchNumber(m[1]);
        if (Number.isFinite(v)) {
          result.weight_spec = { type: "exact", value: v };
          return result;
        }
      }

      m = s.match(/^(\d+[.,]\d+)\s*$/);
      if (m) {
        const spec = this.inferWeightSpecFromPlainNumberToken(m[1]);
        if (spec) {
          result.weight_spec = spec;
          return result;
        }
      }

      m = s.match(/^(\d+)[.,]\s*$/);
      if (m) {
        const n = parseInt(m[1], 10);
        if (Number.isFinite(n) && n >= 0) {
          result.weight_spec = {
            type: "range",
            min: n,
            max: n + 1,
            max_exclusive: true,
          };
          return result;
        }
      }

      m = s.match(/^(\d+)\s*$/);
      if (m) {
        result.id_needle = m[1];
        return result;
      }

      const tokens = s.split(" ").filter(Boolean);
      const text_parts = [];
      const id_digit_parts = [];
      const weight_specs = [];

      tokens.forEach((token) => {
        if (/^=\s*\d+(?:[.,]\d+)?$/i.test(token)) {
          const v = this.normalizeGemsSearchNumber(
            token.replace(/^=\s*/i, "")
          );
          if (Number.isFinite(v)) {
            weight_specs.push({ type: "exact", value: v });
          }
          return;
        }
        const pm = token.match(/^(\d+(?:[.,]\d+)?)\u00B1(\d+(?:[.,]\d+)?)$/i);
        if (pm) {
          const c = this.normalizeGemsSearchNumber(pm[1]);
          const d = this.normalizeGemsSearchNumber(pm[2]);
          if (Number.isFinite(c) && Number.isFinite(d) && d >= 0) {
            weight_specs.push({
              type: "range",
              min: c - d,
              max: c + d,
            });
          }
          return;
        }
        if (/^\d+$/.test(token)) {
          id_digit_parts.push(token);
          return;
        }
        const trunc_weight = token.match(/^(\d+)[.,]\s*$/);
        if (trunc_weight) {
          const n = parseInt(trunc_weight[1], 10);
          if (Number.isFinite(n) && n >= 0) {
            weight_specs.push({
              type: "range",
              min: n,
              max: n + 1,
              max_exclusive: true,
            });
          }
          return;
        }
        if (/^\d+[.,]\d+$/.test(token)) {
          const spec = this.inferWeightSpecFromPlainNumberToken(token);
          if (spec) weight_specs.push(spec);
          return;
        }
        text_parts.push(token);
      });

      if (weight_specs.length > 0) {
        result.weight_spec = weight_specs[weight_specs.length - 1];
      }
      if (id_digit_parts.length > 0) {
        result.id_needle = id_digit_parts.join("");
      }
      const stone_text = text_parts.join(" ").trim();
      if (stone_text) {
        result.stone_type_needle = stone_text;
      }

      return result;
    },
    gemStoneMatchesTextNeedle(stone_type, needle) {
      if (!needle || typeof needle !== "string") return true;
      const n = needle.trim().toLowerCase();
      if (!n) return true;
      const st = String(stone_type || "").toLowerCase();
      return st.includes(n);
    },
    gemStoneMatchesQuickFamilies(stone_type, stone_families) {
      if (!stone_families || stone_families.length === 0) return true;
      const st = String(stone_type || "").toLowerCase();
      return stone_families.some((fam) => {
        if (fam === "sapphire") return st.includes("sapphire");
        if (fam === "ruby") return st.includes("ruby");
        return false;
      });
    },
    gemMatchesWeightQuickSpec(gem, weight_spec) {
      if (!weight_spec) return true;
      const w = Number(gem.weight_ct);
      if (!Number.isFinite(w)) return false;
      if (weight_spec.type === "exact") {
        return Math.abs(w - weight_spec.value) <= 1e-6;
      }
      if (weight_spec.type === "range") {
        const eps = 1e-9;
        if (weight_spec.max_exclusive) {
          return (
            w >= weight_spec.min - eps && w < weight_spec.max - eps
          );
        }
        return w >= weight_spec.min - eps && w <= weight_spec.max + eps;
      }
      return false;
    },
    gemMatchesQuickSearch(gem, parsed) {
      if (
        parsed.id_needle &&
        !this.getGemId(gem).toLowerCase().startsWith(parsed.id_needle.toLowerCase())
      ) {
        return false;
      }
      if (!this.gemStoneMatchesTextNeedle(gem.stone_type, parsed.stone_type_needle)) {
        return false;
      }
      if (!this.gemStoneMatchesQuickFamilies(gem.stone_type, parsed.stone_families)) {
        return false;
      }
      if (!this.gemMatchesWeightQuickSpec(gem, parsed.weight_spec)) {
        return false;
      }
      return true;
    },
    collectDistinctStoneTypesMatchingNeedle(needle) {
      if (!needle || typeof needle !== "string") return [];
      const n = needle.trim().toLowerCase();
      if (!n) return [];
      const seen = new Set();
      const labels = [];
      (Array.isArray(this.gems) ? this.gems : []).forEach((gem) => {
        const st = gem?.stone_type;
        if (st === undefined || st === null || st === "") return;
        const s = String(st);
        if (!s.toLowerCase().includes(n)) return;
        if (seen.has(s)) return;
        seen.add(s);
        labels.push(s);
      });
      labels.sort((a, b) =>
        a.localeCompare(b, undefined, { sensitivity: "base" })
      );
      return labels;
    },
    formatStoneTypeMatchesForFilterCaption(labels) {
      const max_shown = 6;
      if (!labels.length) {
        return this.$t("sg_gems_filter_stone_match_none");
      }
      const head = labels.slice(0, max_shown);
      const rest = labels.length - max_shown;
      if (rest > 0) {
        return `${head.join(", ")} ${this.$t("sg_gems_filter_stone_match_more", { n: rest })}`;
      }
      return head.join(", ");
    },
    loadMetadataKeysFromStorage() {
      try {
        const stored_keys_json = localStorage.getItem(
          metadata_keys_localstorage_key
        );
        if (!stored_keys_json) return;
        const stored_keys = JSON.parse(stored_keys_json);
        if (!Array.isArray(stored_keys)) return;
        this.selected_metadata_keys = stored_keys.filter(
          (metadata_key) => typeof metadata_key === "string"
        );
      } catch {
        // Keep defaults when storage is unavailable or invalid.
      }
    },
    persistMetadataKeysToStorage() {
      try {
        localStorage.setItem(
          metadata_keys_localstorage_key,
          JSON.stringify(this.selected_metadata_keys)
        );
      } catch {
        // Ignore storage write errors.
      }
    },
    syncSelectedMetadataKeys() {
      const all_keys = Array.isArray(this.all_metadata_keys)
        ? this.all_metadata_keys
        : [];
      if (all_keys.length === 0) {
        this.selected_metadata_keys = [];
        return;
      }

      const selected_keys = Array.isArray(this.selected_metadata_keys)
        ? this.selected_metadata_keys
        : [];
      const selected_in_order = selected_keys.filter((metadata_key) =>
        all_keys.includes(metadata_key)
      );
      const missing_keys = all_keys.filter(
        (metadata_key) => !selected_in_order.includes(metadata_key)
      );
      const next_selected_keys =
        selected_in_order.length > 0
          ? [...selected_in_order, ...missing_keys]
          : [...all_keys];
      const normalized_selected_keys = this.enforcePinnedColumns(
        next_selected_keys,
        all_keys
      );

      if (
        !this.areArraysEqual(
          normalized_selected_keys,
          this.selected_metadata_keys
        )
      ) {
        this.selected_metadata_keys = normalized_selected_keys;
        this.persistMetadataKeysToStorage();
      }
    },
    onSaveColumnsSelection(next_selected_metadata_keys) {
      if (
        !Array.isArray(next_selected_metadata_keys) ||
        next_selected_metadata_keys.length === 0
      ) {
        return;
      }
      this.selected_metadata_keys = this.enforcePinnedColumns(
        next_selected_metadata_keys,
        this.all_metadata_keys
      );
      this.persistMetadataKeysToStorage();
      this.show_columns_modal = false;
    },
    enforcePinnedColumns(metadata_keys, all_keys = this.all_metadata_keys) {
      const available_keys = Array.isArray(all_keys) ? all_keys : [];
      const requested_keys = Array.isArray(metadata_keys) ? metadata_keys : [];

      const pinned_existing_keys = pinned_metadata_keys.filter((metadata_key) =>
        available_keys.includes(metadata_key)
      );
      const ordered_non_pinned_keys = requested_keys.filter(
        (metadata_key) =>
          !pinned_metadata_keys.includes(metadata_key) &&
          available_keys.includes(metadata_key)
      );

      return [...pinned_existing_keys, ...ordered_non_pinned_keys];
    },
    areArraysEqual(first_array, second_array) {
      if (!Array.isArray(first_array) || !Array.isArray(second_array)) {
        return false;
      }
      if (first_array.length !== second_array.length) return false;
      return first_array.every(
        (first_item, index) => first_item === second_array[index]
      );
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
        price_per_carat_pv: "diagram2",
        pvd_asking_price: "diagram2",
        pc_to: "file-earmark-text",
        price_per_carat_pc: "diagram2",
        pf_invoiced_price: "file-earmark-text",
        price_per_carat_pf: "diagram2",
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
        price_per_carat_pv: "sg_price_per_carat_pv",
        pvd_asking_price: "sg_pvd_asking_price",
        pc_to: "sg_pc_to",
        price_per_carat_pc: "sg_price_per_carat_pc",
        pf_invoiced_price: "sg_pf_invoiced_price",
        price_per_carat_pf: "sg_price_per_carat_pf",
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

._tableSection {
  min-height: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--spacing);
}

._gemsSearchBar {
  flex: 0 0 auto;
  max-width: 52rem;
}

._gemsSearchBar ::v-deep ._searchInput {
  width: 100%;
  min-width: 12rem;
}

._gemsActiveFilters {
  flex: 0 0 auto;
  max-width: 100%;
  margin: 0;
  padding: 0;
  border: 0;
  background: transparent;
  font-size: var(--sl-font-size-x-small);
  line-height: 1.4;
  color: color-mix(in srgb, var(--c-gris_fonce) 82%, transparent);
  font-weight: 400;
}
</style>
