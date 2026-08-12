<template>
  <button
    type="button"
    class="_memoOutStatusCard"
    :title="card_title"
    @click="$emit('open')"
  >
    <span class="_icon" aria-hidden="true">
      <b-icon icon="box-arrow-up-right" />
    </span>
    <span class="_label">{{
      $t("sg_currently_on_memo_out", { id: document_number })
    }}</span>
  </button>
</template>

<script>
export default {
  name: "SGMemoOutStatusCard",
  props: {
    document_number: {
      type: String,
      required: true,
    },
  },
  computed: {
    card_title() {
      return this.$t("sg_memo_out_open_preview", { id: this.document_number });
    },
  },
};
</script>

<style lang="scss" scoped>
._memoOutStatusCard {
  display: flex;
  align-items: center;
  gap: calc(var(--spacing) * 0.55);
  margin-top: calc(var(--spacing) * 0.45);
  margin-bottom: calc(var(--spacing) * 0.35);
  padding: calc(var(--spacing) * 0.35) calc(var(--spacing) * 0.55);
  border: 1px solid color-mix(in srgb, var(--c-rouge) 35%, transparent);
  border-radius: 6px;
  background: color-mix(in srgb, var(--c-rouge) 8%, var(--c-blanc));
  cursor: pointer;
  text-align: left;
  color: var(--c-rouge);

  &:hover {
    border-color: color-mix(in srgb, var(--c-rouge) 55%, transparent);
    background: color-mix(in srgb, var(--c-rouge) 14%, var(--c-blanc));
  }
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
