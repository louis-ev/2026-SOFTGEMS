<template>
  <BaseModal2
    :title="modal_title"
    :is_loading="editor_committing"
    @close="$emit('close')"
  >
    <SGGemFieldEditorBody
      ref="gemFieldBodyRef"
      :field="field"
      :current_value="current_value"
      :gem_path="gem_path"
      :gem="gem"
      :meta_target_path="meta_target_path"
      :auxiliary_disable="auxiliary_disable"
      @saved="onSaved"
      @footerStateChange="onFooterStateChange"
      @loadingChange="onLoadingChange"
    />
    <template slot="footer">
      <button type="button" class="u-button" @click="$emit('close')">
        {{ $t("cancel") }}
      </button>
      <button
        type="button"
        class="u-button u-button_bleuvert"
        :disabled="footer_save_disabled"
        @click="onSaveClick"
      >
        {{ editor_committing ? "…" : $t("save") }}
      </button>
    </template>
  </BaseModal2>
</template>

<script>
import SGGemFieldEditorBody from "@/components/gems/SGGemFieldEditorBody.vue";

export default {
  name: "SGGemEditFieldModal",
  components: {
    SGGemFieldEditorBody,
  },
  props: {
    field: {
      type: Object,
      required: true,
    },
    current_value: {
      default: "",
    },
    gem_path: {
      type: String,
      required: true,
    },
    gem: {
      type: Object,
      default: null,
    },
    meta_target_path: {
      type: String,
      default: "",
    },
    context_heading: {
      type: String,
      default: "",
    },
    auxiliary_disable: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      footer_save_disabled: true,
      editor_committing: false,
    };
  },
  computed: {
    gem_id() {
      const parts = this.gem_path.split("/");
      return parts[parts.length - 1] || this.gem_path;
    },
    modal_title() {
      const heading_line = String(this.context_heading || "").trim();
      if (heading_line) return heading_line;
      return this.$t("sg_gem_title", { id: this.gem_id });
    },
  },
  mounted() {
    this.$nextTick(() => this.syncFooterFromBody());
  },
  methods: {
    onFooterStateChange(payload) {
      if (payload && Object.prototype.hasOwnProperty.call(payload, "save_disabled")) {
        this.footer_save_disabled = Boolean(payload.save_disabled);
      }
    },
    onLoadingChange(v) {
      this.editor_committing = Boolean(v);
    },
    syncFooterFromBody() {
      const b = this.$refs.gemFieldBodyRef;
      if (b && typeof b.is_footer_save_disabled !== "undefined") {
        this.footer_save_disabled = Boolean(b.is_footer_save_disabled);
      }
    },
    async onSaveClick() {
      const body = this.$refs.gemFieldBodyRef;
      if (!body || typeof body.tryShellSave !== "function") return;
      await body.tryShellSave();
    },
    onSaved(payload) {
      this.$emit("saved", payload);
      this.$emit("close");
    },
  },
};
</script>

<style lang="scss" scoped></style>
