<template>
  <div class="_bankFootersEditor">
    <div class="_bankFootersHeader">
      <span>{{ $t("sg_pdf_export_bank_footer_title") }}</span>
    </div>
    <p class="_bankFootersHint">
      {{ $t("sg_pdf_export_bank_footer_hint") }}
    </p>

    <p v-if="local_presets.length === 0 && !can_edit" class="_empty">
      {{ $t("sg_pdf_export_bank_footer_empty") }}
    </p>

    <div
      v-else
      class="_list"
      role="radiogroup"
      :aria-label="$t('sg_pdf_export_bank_footer_title')"
    >
      <article
        v-for="(preset, index) in local_presets"
        :key="preset.id"
        class="_card"
        :class="{ _card_selected: preset.id === selected_id }"
      >
        <label class="_radioCol">
          <input
            type="radio"
            name="bank_footer_preset"
            :value="preset.id"
            :checked="preset.id === selected_id"
            @change="selectPreset(preset.id)"
          />
        </label>

        <div class="_cardContent">
          <template v-if="isEditingPreset(preset.id)">
            <input
              v-model="edit_draft.internal_name"
              class="_internalNameInput u-input"
              type="text"
              :placeholder="$t('sg_pdf_export_bank_footer_internal_name_placeholder')"
            />
            <textarea
              v-model="edit_draft.body"
              class="_bodyInput"
              rows="6"
              :placeholder="$t('sg_pdf_export_bank_footer_placeholder')"
            />
            <div class="_cardActions">
              <button
                type="button"
                class="u-button u-button_verysmall u-button_bleuvert"
                :title="$t('sg_pdf_export_bank_footer_confirm_edit')"
                @click="confirmEdit"
              >
                <b-icon icon="check" />
                {{ $t("sg_pdf_export_bank_footer_confirm_edit") }}
              </button>
            </div>
          </template>

          <template v-else>
            <span class="_internalNameLabel">{{
              preset.internal_name || $t("sg_pdf_export_bank_footer_untitled")
            }}</span>
            <pre class="_bodyPre">{{ preset.body || "—" }}</pre>
            <div v-if="can_edit" class="_cardActions">
              <button
                type="button"
                class="u-buttonLink"
                @click="startEdit(preset.id)"
              >
                {{ $t("edit") }}
              </button>
              <button
                type="button"
                class="u-buttonLink"
                :disabled="index === 0"
                @click="movePreset(index, -1)"
              >
                {{ $t("sg_pdf_export_bank_footer_move_up") }}
              </button>
              <button
                type="button"
                class="u-buttonLink"
                :disabled="index === local_presets.length - 1"
                @click="movePreset(index, 1)"
              >
                {{ $t("sg_pdf_export_bank_footer_move_down") }}
              </button>
              <RemoveMenu
                :modal_title="$t('remove')"
                :modal_expl="$t('sg_pdf_export_bank_footer_remove_confirm')"
                @remove="removePreset(index)"
              >
                <template #trigger>
                  <button type="button" class="u-buttonLink u-buttonLink_red">
                    {{ $t("remove") }}
                  </button>
                </template>
              </RemoveMenu>
            </div>
          </template>
        </div>
      </article>

      <button
        v-if="can_edit"
        type="button"
        class="_addCard u-button u-button_verysmall"
        @click="addPreset"
      >
        {{ $t("sg_pdf_export_bank_footer_add") }}
      </button>
    </div>
  </div>
</template>

<script>
import { createEmptySelectionPdfBankFooterPreset } from "@/utils/selection_pdf_instance_settings.js";

export default {
  name: "SGSelectionPdfBankFootersEditor",
  props: {
    presets: {
      type: Array,
      default: () => [],
    },
    selected_id: {
      type: String,
      default: "",
    },
    can_edit: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      local_presets: [],
      editing_preset_id: null,
      edit_draft: {
        internal_name: "",
        body: "",
      },
    };
  },
  watch: {
    presets: {
      immediate: true,
      deep: true,
      handler(next_presets) {
        this.local_presets = (Array.isArray(next_presets) ? next_presets : []).map(
          (preset) => ({ ...preset })
        );
        if (
          this.editing_preset_id &&
          !this.local_presets.some((preset) => preset.id === this.editing_preset_id)
        ) {
          this.cancelEdit();
        }
      },
    },
  },
  methods: {
    isEditingPreset(preset_id) {
      return this.can_edit && this.editing_preset_id === preset_id;
    },
    emitPresets() {
      this.$emit(
        "update:presets",
        this.local_presets.map((preset) => ({ ...preset }))
      );
    },
    selectPreset(preset_id) {
      this.$emit("update:selected_id", preset_id);
    },
    startEdit(preset_id) {
      const preset = this.local_presets.find((item) => item.id === preset_id);
      if (!preset) return;
      this.editing_preset_id = preset_id;
      this.edit_draft = {
        internal_name: preset.internal_name || "",
        body: preset.body || "",
      };
    },
    cancelEdit() {
      this.editing_preset_id = null;
      this.edit_draft = {
        internal_name: "",
        body: "",
      };
    },
    confirmEdit() {
      const index = this.local_presets.findIndex(
        (preset) => preset.id === this.editing_preset_id
      );
      if (index < 0) {
        this.cancelEdit();
        return;
      }
      const preset = this.local_presets[index];
      this.$set(preset, "internal_name", this.edit_draft.internal_name);
      this.$set(preset, "body", this.edit_draft.body);
      this.emitPresets();
      this.cancelEdit();
    },
    addPreset() {
      const preset = createEmptySelectionPdfBankFooterPreset();
      this.local_presets = [...this.local_presets, preset];
      this.$emit("update:selected_id", preset.id);
      this.startEdit(preset.id);
    },
    removePreset(index) {
      const removed = this.local_presets[index];
      if (removed?.id === this.editing_preset_id) {
        this.cancelEdit();
      }
      this.local_presets = this.local_presets.filter((_, i) => i !== index);
      this.emitPresets();
      if (removed?.id === this.selected_id) {
        this.$emit(
          "update:selected_id",
          this.local_presets[0]?.id || ""
        );
      }
    },
    movePreset(index, direction) {
      const target_index = index + direction;
      if (target_index < 0 || target_index >= this.local_presets.length) return;
      const next = [...this.local_presets];
      const [moved] = next.splice(index, 1);
      next.splice(target_index, 0, moved);
      this.local_presets = next;
      this.emitPresets();
    },
  },
};
</script>

<style lang="scss" scoped>
._bankFootersEditor {
  display: flex;
  flex-direction: column;
  gap: calc(var(--spacing) / 2);
  margin-top: calc(var(--spacing) / 2);
}

._bankFootersHeader {
  font-weight: 600;
}

._bankFootersHint {
  margin: 0 0 calc(var(--spacing) * 0.75);
  color: var(--c-gris_fonce);
  font-size: var(--sl-font-size-x-small);
}

._empty {
  margin: 0;
  color: var(--c-gris_fonce);
  font-style: italic;
}

._list {
  display: flex;
  flex-direction: column;
  gap: calc(var(--spacing) / 2);
  width: 100%;
}

._card {
  width: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: calc(var(--spacing) / 2);
  border: 1px solid var(--c-gris_clair);
  border-radius: 6px;
  padding: calc(var(--spacing) / 2);
  background: #fff;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

._card_selected {
  border-color: var(--c-bleuvert, #00857c);
  box-shadow: 0 0 0 1px var(--c-bleuvert, #00857c);
}

._radioCol {
  flex: 0 0 auto;
  display: flex;
  align-items: flex-start;
  padding-top: 0.15rem;
  cursor: pointer;
}

._radioCol input {
  margin: 0;
  cursor: pointer;
}

._cardContent {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: calc(var(--spacing) / 3);
}

._internalNameLabel {
  display: block;
  font-weight: 700;
  font-size: 0.95rem;
  line-height: 1.3;
}

._internalNameInput {
  width: 100%;
  font-weight: 600;
}

._bodyPre,
._bodyInput {
  margin: 0;
  width: 100%;
  box-sizing: border-box;
  min-height: 7rem;
  border: 1px solid var(--c-gris_clair);
  border-radius: 4px;
  padding: calc(var(--spacing) / 3);
  background: #fafafa;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
    "Liberation Mono", "Courier New", monospace;
  font-size: 0.82rem;
  line-height: 1.35;
  white-space: pre-wrap;
  resize: vertical;
}

._bodyPre {
  overflow: auto;
}

._cardActions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: calc(var(--spacing) / 3);
}

._addCard {
  width: 100%;
  box-sizing: border-box;
  border: 1px dashed var(--c-gris_clair);
  border-radius: 6px;
  padding: calc(var(--spacing) / 2);
  background: #fafafa;
  text-align: center;
}
</style>
