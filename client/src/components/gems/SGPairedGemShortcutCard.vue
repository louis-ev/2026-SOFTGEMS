<template>
  <component
    :is="root_tag"
    class="_pairedGemShortcutCard"
    :class="{ _embedded: embedded, _static: !interactive }"
    :type="interactive ? 'button' : undefined"
    :title="interactive ? card_title : undefined"
    @click="onRootClick"
  >
    <div class="_preview">
      <CoverField
        :context="'tiny'"
        :ratio="'1 / 1'"
        :cover="cover"
        :path="gem_path"
        :can_edit="false"
      />
    </div>
    <span class="_label">{{ $t("sg_paired_with_gem", { id: gem_id }) }}</span>
  </component>
</template>

<script>
export default {
  name: "SGPairedGemShortcutCard",
  components: {
    CoverField: () => import("@/adc-core/fields/CoverField.vue"),
  },
  props: {
    gem_id: {
      type: String,
      required: true,
    },
    gem_path: {
      type: String,
      default: "",
    },
    cover: {
      type: [Boolean, Object],
      default: null,
    },
    interactive: {
      type: Boolean,
      default: true,
    },
    embedded: {
      type: Boolean,
      default: false,
    },
  },
  computed: {
    root_tag() {
      return this.interactive ? "button" : "div";
    },
    card_title() {
      return this.$t("sg_paired_gem_open_preview", { id: this.gem_id });
    },
  },
  methods: {
    onRootClick() {
      if (!this.interactive) return;
      this.$emit("open");
    },
  },
};
</script>

<style lang="scss" scoped>
._pairedGemShortcutCard {
  display: flex;
  align-items: center;
  gap: calc(var(--spacing) * 0.55);
  margin-top: calc(var(--spacing) * 0.45);
  margin-bottom: calc(var(--spacing) * 0.35);
  padding: calc(var(--spacing) * 0.35) calc(var(--spacing) * 0.55)
    calc(var(--spacing) * 0.35) calc(var(--spacing) * 0.35);
  border: 1px solid color-mix(in srgb, var(--c-gris_fonce) 22%, transparent);
  border-radius: 6px;
  background: color-mix(in srgb, var(--c-gris_clair) 45%, var(--c-blanc));
  cursor: pointer;
  text-align: left;

  &:hover {
    border-color: color-mix(in srgb, var(--c-bleuvert) 45%, transparent);
    background: color-mix(in srgb, var(--c-bleuvert) 8%, var(--c-blanc));
  }
}

._pairedGemShortcutCard._embedded {
  margin-top: 0;
  margin-bottom: 0;
  width: 100%;
}

._pairedGemShortcutCard._static {
  cursor: default;

  &:hover {
    border-color: color-mix(in srgb, var(--c-gris_fonce) 22%, transparent);
    background: color-mix(in srgb, var(--c-gris_clair) 45%, var(--c-blanc));
  }
}

._preview {
  flex: 0 0 auto;
  width: 32px;
  height: 32px;
  border-radius: 4px;
  overflow: hidden;
  background: var(--c-blanc);
}

._label {
  font-size: var(--sl-font-size-small);
  line-height: 1.3;
  color: var(--c-gris_fonce);
  font-weight: 500;
}
</style>
