<template>
  <div class="_clickRevealRoot">
    <template v-if="!is_editing">
      <SGFieldValuePresent
        :label="label"
        :icon="label_icon"
        :value="present_value_raw"
        :readonly="readonly"
        @click="openEdit"
      />
    </template>
    <template v-else>
      <div class="_editingWrap">
        <div class="_labelRow">
          <DLabel :str="label" :icon="label_icon || null" />
        </div>
        <TextInput
          ref="field_input"
          :content.sync="draft"
          :required="required"
          :disabled="readonly"
          @update:content="onDraftUpdate"
        />
        <div class="_editActions">
          <button
            type="button"
            class="u-button"
            :disabled="is_saving"
            @click="cancelEdit"
          >
            {{ $t("cancel") }}
          </button>
          <button
            type="button"
            class="u-button u-button_bleuvert"
            :disabled="is_save_button_disabled"
            @click="emitSave"
          >
            {{ is_saving ? $t("saving") : $t("save") }}
          </button>
        </div>
      </div>
    </template>
  </div>
</template>

<script>
import SGFieldValuePresent from "@/components/softgems/SGFieldValuePresent.vue";
import TextInput from "@/adc-core/inputs/TextInput.vue";

export default {
  name: "SGClickRevealTextField",
  components: {
    SGFieldValuePresent,
    TextInput,
  },
  props: {
    label: {
      type: String,
      required: true,
    },
    label_icon: {
      type: String,
      default: "",
    },
    /** Display + sync target when collapsed (updates while editing draft are forwarded) */
    content: {
      type: [String, Number],
      default: "",
    },
    required: {
      type: Boolean,
      default: false,
    },
    readonly: {
      type: Boolean,
      default: false,
    },
    is_saving: {
      type: Boolean,
      default: false,
    },
    /** Parent-computed disable for Save — e.g. no changes vs stored */
    is_save_disabled_externally: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      is_editing: false,
      draft: "",
      open_snapshot: "",
    };
  },
  computed: {
    present_value_raw() {
      const c = this.content;
      if (c === null || c === undefined) return "";
      if (typeof c === "number") return String(c);
      return typeof c === "string" ? c : String(c);
    },
    trimmed_draft() {
      const d = typeof this.draft === "string" ? this.draft : "";
      return d.trim();
    },
    draft_valid() {
      if (!this.required) return true;
      return this.trimmed_draft !== "";
    },
    is_save_button_disabled() {
      return (
        this.readonly ||
        this.is_saving ||
        !this.draft_valid ||
        this.is_save_disabled_externally
      );
    },
  },
  methods: {
    openEdit() {
      if (this.readonly || this.is_saving) return;
      const start =
        typeof this.content === "string"
          ? this.content
          : this.content ?? "";
      this.open_snapshot =
        typeof start === "number" ? String(start) : start || "";
      this.draft =
        typeof this.content === "string"
          ? this.content
          : this.content ?? "";
      this.is_editing = true;
      this.$nextTick(() => {
        const input_el =
          this.$refs.field_input &&
          this.$refs.field_input.$el &&
          this.$refs.field_input.$el.querySelector("input");
        if (input_el) input_el.focus({ preventScroll: false });
      });
    },
    cancelEdit() {
      this.$emit("update:content", this.open_snapshot);
      this.is_editing = false;
    },
    emitSave() {
      if (this.is_save_button_disabled) return;
      this.$emit("save");
    },
    onDraftUpdate(v) {
      const next = typeof v === "string" ? v : v ?? "";
      this.draft = next;
      this.$emit("update:content", next);
    },
    /** Call from parent after a successful save */
    collapseAfterSave() {
      this.is_editing = false;
    },
    focusInnerInput() {
      this.$nextTick(() => {
        const input_el =
          this.$refs.field_input &&
          this.$refs.field_input.$el &&
          this.$refs.field_input.$el.querySelector("input");
        if (input_el) input_el.select();
      });
    },
  },
};
</script>

<style lang="scss" scoped>
._clickRevealRoot {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

._editingWrap {
  display: flex;
  flex-direction: column;
  gap: calc(var(--spacing) / 4);
}

._labelRow {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: calc(var(--spacing) / 3);
}

._editActions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: calc(var(--spacing) / 3);
  margin-top: calc(var(--spacing) / 3);
}
</style>
