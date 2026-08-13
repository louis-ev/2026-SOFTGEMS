<template>
  <BaseModal2
    :title="$t('sg_selection_add_gems_by_id_title')"
    :is_closable="!is_submitting"
    @close="onCloseRequested"
  >
    <p class="_hint">{{ $t("sg_selection_add_gems_by_id_hint") }}</p>
    <label class="_label" :for="textarea_id">
      {{ $t("sg_selection_add_gems_by_id_label") }}
    </label>
    <textarea
      :id="textarea_id"
      ref="ids_textarea"
      v-model="ids_text"
      class="_textarea"
      rows="6"
      :disabled="is_submitting"
      :placeholder="$t('sg_selection_add_gems_by_id_placeholder')"
      @keydown.meta.enter.prevent="submitIds"
      @keydown.ctrl.enter.prevent="submitIds"
    />
    <p
      v-if="is_submitting"
      class="_progress"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      {{ submit_label }}
    </p>
    <template v-else>
      <p v-if="new_ids.length > 0" class="_preview" role="status">
        {{
          $t("sg_selection_add_gems_by_id_preview", {
            count: new_ids.length,
          })
        }}
      </p>
      <SGInfoNotice
        v-if="already_included_ids.length > 0"
        class="_alreadyIncludedNotice"
        :message="
          $t('sg_selection_add_gems_by_id_already_included', {
            count: already_included_ids.length,
          })
        "
      />
    </template>
    <template slot="footer">
      <button
        type="button"
        class="u-button"
        :disabled="is_submitting"
        @click="onCloseRequested"
      >
        {{ $t("cancel") }}
      </button>
      <button
        type="button"
        class="u-button u-button_bleuvert"
        :disabled="is_submitting || new_ids.length === 0"
        @click="submitIds"
      >
        {{ submit_label }}
      </button>
    </template>
  </BaseModal2>
</template>

<script>
import BaseModal2 from "@/adc-core/modals/BaseModal2.vue";
import SGInfoNotice from "@/components/softgems/SGInfoNotice.vue";
import {
  parseGemIdsFromText,
  partitionGemIdsAgainstSelection,
} from "@/utils/selection_entries.js";

export default {
  name: "SGSelectionAddGemsByIdModal",
  components: {
    BaseModal2,
    SGInfoNotice,
  },
  props: {
    is_submitting: {
      type: Boolean,
      default: false,
    },
    adding_current: {
      type: Number,
      default: 0,
    },
    adding_total: {
      type: Number,
      default: 0,
    },
    selection_gem_paths: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return {
      ids_text: "",
      textarea_id: `selection-add-gems-by-id-${Math.random()
        .toString(36)
        .slice(2, 9)}`,
    };
  },
  computed: {
    parsed_ids() {
      return parseGemIdsFromText(this.ids_text);
    },
    partitioned_ids() {
      return partitionGemIdsAgainstSelection(
        this.parsed_ids,
        this.selection_gem_paths
      );
    },
    already_included_ids() {
      return this.partitioned_ids.already_included_ids;
    },
    new_ids() {
      return this.partitioned_ids.new_ids;
    },
    submit_label() {
      if (!this.is_submitting) {
        return this.$t("sg_selection_add_gems_by_id_submit");
      }
      if (this.adding_total > 0 && this.adding_current > 0) {
        return this.$t("sg_selection_add_gems_by_id_adding_progress", {
          current: this.adding_current,
          total: this.adding_total,
        });
      }
      return this.$t("sg_selection_add_gems_by_id_adding");
    },
  },
  mounted() {
    this.$nextTick(() => {
      this.$refs.ids_textarea?.focus();
    });
  },
  methods: {
    onCloseRequested() {
      if (this.is_submitting) return;
      this.$emit("close");
    },
    submitIds() {
      if (this.is_submitting) return;
      const gem_ids = this.parsed_ids;
      if (!gem_ids.length || this.new_ids.length === 0) return;
      this.$emit("submit", gem_ids);
    },
  },
};
</script>

<style lang="scss" scoped>
._hint {
  margin: 0 0 calc(var(--spacing) * 0.75);
  color: var(--c-gris_fonce);
  font-size: var(--sl-font-size-small);
  line-height: 1.45;
}

._label {
  display: block;
  margin: 0 0 calc(var(--spacing) / 3);
  font-size: var(--sl-font-size-small);
  font-weight: 600;
}

._textarea {
  display: block;
  width: 100%;
  min-height: 8rem;
  margin: 0;
  padding: calc(var(--spacing) / 2) calc(var(--spacing) * 0.65);
  border: 1px solid color-mix(in srgb, var(--c-gris_fonce) 28%, transparent);
  border-radius: 6px;
  background: var(--c-blanc);
  color: inherit;
  font: inherit;
  font-family: var(--sl-font-mono);
  font-size: var(--sl-font-size-small);
  line-height: 1.4;
  resize: vertical;
}

._textarea:focus {
  outline: 2px solid var(--c-bleuvert);
  outline-offset: 1px;
}

._preview,
._progress {
  margin: calc(var(--spacing) / 2) 0 0;
  color: var(--c-gris_fonce);
  font-size: var(--sl-font-size-x-small);
}

._progress {
  font-size: var(--sl-font-size-small);
  font-variant-numeric: tabular-nums;
  font-weight: 600;
  color: inherit;
}

._alreadyIncludedNotice {
  margin: calc(var(--spacing) / 2) 0 0;
}
</style>
