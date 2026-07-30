<template>
  <div class="_pairedGemEditor">
    <div class="_statusRow">
      <div class="_statusMain">
        <SGPairedGemShortcutCard
          v-if="draft_paired_gem_id"
          :gem_id="draft_paired_gem_id"
          :gem_path="draft_shortcut_gem_path"
          :cover="draft_shortcut_cover"
          :interactive="false"
          embedded
        />
        <p v-else class="_emptyState" role="status">
          {{ $t("sg_paired_gem_none_yet") }}
        </p>
      </div>

      <div class="_actions">
        <button
          v-if="!picker_open"
          type="button"
          class="u-button u-button_small u-button_bleuvert"
          :disabled="is_loading"
          @click="openPicker"
        >
          <b-icon :icon="draft_paired_gem_id ? 'arrow-repeat' : 'plus'" />
          {{ replace_pair_button_label }}
        </button>
        <button
          v-else
          type="button"
          class="u-button u-button_small"
          @click="closePicker"
        >
          {{ $t("cancel") }}
        </button>
        <button
          v-if="can_clear_pairing"
          type="button"
          class="u-button u-button_small"
          :disabled="is_loading || picker_open"
          @click="clearPairing"
        >
          {{ $t("sg_paired_gem_remove_pairing") }}
        </button>
      </div>
    </div>

    <p v-if="clear_reciprocal_hint" class="_impactNotice" role="note">
      {{ clear_reciprocal_hint }}
    </p>
    <p v-if="reciprocal_hint" class="_impactNotice" role="note">
      {{ reciprocal_hint }}
    </p>
    <p v-if="already_paired_warning" class="u-warning _warning" role="alert">
      {{ already_paired_warning }}
    </p>

    <template v-if="picker_open">
      <p v-if="is_loading" class="_hint">{{ $t("sg_loading_gems") }}</p>
      <p v-else-if="fetch_error" class="u-errorMsg">{{ fetch_error }}</p>
      <SGGemsInventoryTableSection
        v-else
        ref="gems_inventory_table"
        :gems="pairable_gems"
        :search_placeholder="$t('sg_selection_search_gems')"
        search_name="paired_gem_picker_search"
        :search_disabled="is_loading"
        show_search_how_to
        read_only_cells
        use_sorted_gems
        selection_pick_column
        :single_pick_selected_path="draft_paired_gem_path"
        table_shell_class="_pairedGemTableShell"
        @rowClick="onPickRowClick"
      />
    </template>
  </div>
</template>

<script>
import SGGemsInventoryTableSection from "@/components/gems/SGGemsInventoryTableSection.vue";
import SGPairedGemShortcutCard from "@/components/gems/SGPairedGemShortcutCard.vue";
import {
  getGemIdFromPath,
  getPairedGemConflict,
} from "@/utils/gem_pairing.js";

export default {
  name: "SGGemPairedGemEditor",
  components: {
    SGGemsInventoryTableSection,
    SGPairedGemShortcutCard,
  },
  props: {
    initial_value: {
      type: String,
      default: "",
    },
    current_gem_id: {
      type: String,
      default: "",
    },
  },
  data() {
    return {
      gems_path: "gems",
      all_gems: [],
      draft_paired_gem_id: this.cleanString(this.initial_value),
      picker_open: false,
      is_loading: false,
      fetch_error: "",
    };
  },
  computed: {
    is_footer_save_disabled() {
      const baseline = this.cleanString(this.initial_value);
      const draft = this.cleanString(this.draft_paired_gem_id);
      return draft === baseline;
    },
    replace_pair_button_label() {
      return this.draft_paired_gem_id
        ? this.$t("sg_paired_gem_replace_pair")
        : this.$t("sg_paired_gem_select_pair");
    },
    can_clear_pairing() {
      return Boolean(this.cleanString(this.draft_paired_gem_id));
    },
    pairable_gems() {
      const current_id = this.cleanString(this.current_gem_id);
      return (Array.isArray(this.all_gems) ? this.all_gems : []).filter(
        (gem) => {
          const gem_id = getGemIdFromPath(gem?.$path);
          return gem_id && gem_id !== current_id;
        }
      );
    },
    draft_paired_gem_path() {
      const draft_id = this.cleanString(this.draft_paired_gem_id);
      if (!draft_id) return "";
      return `${this.gems_path}/${draft_id}`;
    },
    draft_shortcut_gem() {
      const target_id = this.cleanString(this.draft_paired_gem_id);
      if (!target_id) return null;
      return (
        this.all_gems.find(
          (gem) => getGemIdFromPath(gem?.$path) === target_id
        ) || null
      );
    },
    draft_shortcut_gem_path() {
      return this.draft_shortcut_gem?.$path || this.draft_paired_gem_path;
    },
    draft_shortcut_cover() {
      return this.draft_shortcut_gem?.$cover || null;
    },
    selected_target_gem() {
      return this.draft_shortcut_gem;
    },
    reciprocal_hint() {
      const draft = this.cleanString(this.draft_paired_gem_id);
      const baseline = this.cleanString(this.initial_value);
      if (!draft || draft === baseline) return "";
      return this.$t("sg_paired_gem_reciprocal_hint", { id: draft });
    },
    clear_reciprocal_hint() {
      const draft = this.cleanString(this.draft_paired_gem_id);
      const baseline = this.cleanString(this.initial_value);
      if (draft || !baseline) return "";
      return this.$t("sg_paired_gem_clear_reciprocal_hint", { id: baseline });
    },
    already_paired_warning() {
      const draft = this.cleanString(this.draft_paired_gem_id);
      if (!draft) return "";
      const target_gem = this.selected_target_gem;
      if (!target_gem) return "";
      const conflict_id = getPairedGemConflict({
        target_gem,
        current_gem_id: this.current_gem_id,
      });
      if (!conflict_id) return "";
      return this.$t("sg_paired_gem_already_paired_warning", {
        target_id: draft,
        other_id: conflict_id,
      });
    },
  },
  watch: {
    initial_value(next_value) {
      this.draft_paired_gem_id = this.cleanString(next_value);
      this.picker_open = false;
    },
    draft_paired_gem_id() {
      this.emitFooterState();
    },
    is_footer_save_disabled() {
      this.emitFooterState();
    },
  },
  mounted() {
    this.emitFooterState();
    this.fetchGems();
  },
  methods: {
    cleanString(value) {
      if (value === null || value === undefined) return "";
      return String(value).trim();
    },
    openPicker() {
      this.picker_open = true;
      this.$nextTick(() => {
        this.$refs.gems_inventory_table?.focusSearchInput();
      });
    },
    closePicker() {
      this.picker_open = false;
    },
    clearPairing() {
      this.draft_paired_gem_id = "";
      this.picker_open = false;
    },
    onPickRowClick(gem) {
      const gem_id = getGemIdFromPath(gem?.$path);
      if (!gem_id) return;
      this.draft_paired_gem_id = gem_id;
      this.picker_open = false;
    },
    emitFooterState() {
      this.$emit("footerStateChange", {
        save_disabled: this.is_footer_save_disabled,
      });
    },
    async fetchGems() {
      this.is_loading = true;
      this.fetch_error = "";
      try {
        const fetched = await this.$api.getFolders({ path: this.gems_path });
        this.all_gems = Array.isArray(fetched) ? fetched : [];
      } catch ({ code }) {
        this.all_gems = [];
        this.fetch_error = code || this.$t("sg_could_not_load_gems");
      } finally {
        this.is_loading = false;
      }
    },
  },
};
</script>

<style lang="scss" scoped>
._pairedGemEditor {
  display: flex;
  flex-direction: column;
  gap: calc(var(--spacing) * 0.75);
  min-height: 0;
  padding: calc(var(--spacing) * 1);
}

._statusRow {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: calc(var(--spacing) * 0.65);
}

._statusMain {
  flex: 1 1 14rem;
  min-width: 0;
}

._emptyState {
  margin: 0;
  padding: calc(var(--spacing) * 0.55) calc(var(--spacing) * 0.7);
  border: 1px dashed color-mix(in srgb, var(--c-gris_fonce) 28%, transparent);
  border-radius: 6px;
  color: var(--c-gris_fonce);
  font-size: var(--sl-font-size-small);
  line-height: 1.35;
  background: color-mix(in srgb, var(--c-gris_clair) 35%, transparent);
}

._actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: calc(var(--spacing) * 0.35);
  flex: 0 0 auto;
}

._hint {
  margin: 0;
  color: var(--c-gris_fonce);
  font-size: var(--sl-font-size-x-small);
}

._impactNotice {
  margin: 0;
  color: var(--c-gris_fonce);
  font-size: var(--sl-font-size-x-small);
  line-height: 1.45;
}

._warning {
  margin: 0;
  font-size: var(--sl-font-size-x-small);
  line-height: 1.45;
}

::v-deep ._pairedGemTableShell {
  height: min(58vh, 560px);
  max-height: min(58vh, 560px);
}
</style>
