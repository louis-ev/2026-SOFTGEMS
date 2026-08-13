<template>
  <component
    :is="root_tag"
    class="_splitStatusCard"
    :class="{ _from: is_from }"
    :type="root_tag === 'button' ? 'button' : undefined"
    :title="card_title"
    @click="onRootClick"
  >
    <div v-if="is_from" class="_preview">
      <CoverField
        :context="'tiny'"
        :ratio="'1 / 1'"
        :cover="cover"
        :path="gem_path"
        :can_edit="false"
      />
    </div>
    <span v-else class="_icon" aria-hidden="true">
      <b-icon icon="scissors" />
    </span>
    <span class="_label">{{ card_label }}</span>
  </component>
</template>

<script>
export default {
  name: "SGGemSplitStatusCard",
  components: {
    CoverField: () => import("@/adc-core/fields/CoverField.vue"),
  },
  props: {
    kind: {
      type: String,
      required: true,
      validator(value) {
        return value === "from" || value === "into";
      },
    },
    gem_id: {
      type: String,
      default: "",
    },
    gem_path: {
      type: String,
      default: "",
    },
    cover: {
      type: [Boolean, Object],
      default: null,
    },
    split_count: {
      type: Number,
      default: 0,
    },
  },
  computed: {
    is_from() {
      return this.kind === "from";
    },
    root_tag() {
      return "button";
    },
    card_label() {
      if (this.is_from) {
        return this.$t("sg_split_from_gem", { id: this.gem_id });
      }
      if (this.split_count > 1) {
        return this.$t("sg_gem_has_been_split_count", {
          count: this.split_count,
        });
      }
      return this.$t("sg_gem_has_been_split");
    },
    card_title() {
      if (this.is_from) {
        return this.$t("sg_split_from_open", { id: this.gem_id });
      }
      return this.$t("sg_split_history_open");
    },
  },
  methods: {
    onRootClick() {
      this.$emit("open");
    },
  },
};
</script>

<style lang="scss" scoped>
._splitStatusCard {
  display: flex;
  align-items: center;
  gap: calc(var(--spacing) * 0.55);
  margin-top: calc(var(--spacing) * 0.45);
  margin-bottom: calc(var(--spacing) * 0.35);
  padding: calc(var(--spacing) * 0.35) calc(var(--spacing) * 0.55);
  border: 1px solid color-mix(in srgb, var(--c-bleumarine) 28%, transparent);
  border-radius: 6px;
  background: color-mix(in srgb, var(--c-bleumarine) 8%, var(--c-blanc));
  cursor: pointer;
  text-align: left;
  color: var(--c-bleumarine);

  &:hover {
    border-color: color-mix(in srgb, var(--c-bleumarine) 50%, transparent);
    background: color-mix(in srgb, var(--c-bleumarine) 14%, var(--c-blanc));
  }
}

._splitStatusCard._from {
  padding-left: calc(var(--spacing) * 0.35);
}

._preview {
  flex: 0 0 auto;
  width: 32px;
  height: 32px;
  border-radius: 4px;
  overflow: hidden;
  background: var(--c-blanc);
}

._icon {
  flex: 0 0 auto;
  display: inline-flex;
  line-height: 1;
}

._label {
  font-size: var(--sl-font-size-small);
  line-height: 1.3;
  font-weight: 500;
}
</style>
