<template>
  <BaseModal2
    :title="modal_title_str"
    :is_loading="is_saving"
    @close="$emit('close')"
  >
    <SGSimpleMetaTextEditor
      ref="simple_editor_ref"
      :label="label"
      :label_icon="label_icon"
      :initial_value="initial_value"
      :required="required"
      :required_empty_hint="required_empty_hint"
      :stored_comparison_value="stored_comparison_value"
      :external_warning="external_warning"
      :history_path="history_path"
      :history_field_key="history_field_key"
      :is_saving="is_saving"
      @draftChange="$emit('draftChange')"
      @save="$emit('save', $event)"
      @footerStateChange="onFooterStateChange"
    />
    <template slot="footer">
      <button type="button" class="u-button" @click="$emit('close')">
        {{ $t("cancel") }}
      </button>
      <button
        type="button"
        class="u-button u-button_bleuvert"
        :disabled="footer_save_disabled"
        @click="onFooterSave"
      >
        {{ is_saving ? $t("saving") : $t("save") }}
      </button>
    </template>
  </BaseModal2>
</template>

<script>
import BaseModal2 from "@/adc-core/modals/BaseModal2.vue";
import SGSimpleMetaTextEditor from "@/components/softgems/SGSimpleMetaTextEditor.vue";

export default {
  name: "SGContactEditTextModal",
  components: {
    BaseModal2,
    SGSimpleMetaTextEditor,
  },
  props: {
    modal_title_str: {
      type: String,
      required: true,
    },
    label: {
      type: String,
      required: true,
    },
    label_icon: {
      type: String,
      default: "",
    },
    initial_value: {
      type: [String, Number],
      default: "",
    },
    required: {
      type: Boolean,
      default: false,
    },
    required_empty_hint: {
      type: String,
      default: "",
    },
    is_saving: {
      type: Boolean,
      default: false,
    },
    external_warning: {
      type: String,
      default: "",
    },
    stored_comparison_value: {
      type: String,
      default: "",
    },
    history_path: {
      type: String,
      default: "",
    },
    history_field_key: {
      type: String,
      default: "",
    },
  },
  data() {
    return {
      footer_save_disabled: true,
    };
  },
  methods: {
    onFooterStateChange(payload) {
      if (payload && Object.prototype.hasOwnProperty.call(payload, "save_disabled")) {
        this.footer_save_disabled = Boolean(payload.save_disabled);
      }
    },
    onFooterSave() {
      const ed = this.$refs.simple_editor_ref;
      if (ed && typeof ed.tryShellSave === "function") {
        ed.tryShellSave();
      }
    },
    focusInputSelect() {
      const ed = this.$refs.simple_editor_ref;
      if (ed && typeof ed.focusInputSelect === "function") {
        ed.focusInputSelect();
      }
    },
  },
};
</script>

<style lang="scss" scoped></style>
