<template>
  <div class="_sgInfoNotice" role="note">
    <span class="_sgInfoNoticeIcon" aria-hidden="true">
      <b-icon :icon="icon" scale="1.25" />
    </span>
    <p class="_sgInfoNoticeText">
      <slot>
        <template v-if="message">{{ message }}</template>
        <span v-if="badge" class="_sgInfoNoticeBadge">{{ badge }}</span>
      </slot>
    </p>
  </div>
</template>

<script>
export default {
  name: "SGInfoNotice",
  props: {
    message: {
      type: String,
      default: "",
    },
    badge: {
      type: String,
      default: "",
    },
    icon: {
      type: String,
      default: "info-circle",
    },
  },
};
</script>

<style lang="scss" scoped>
._sgInfoNotice {
  display: flex;
  align-items: center;
  gap: calc(var(--spacing) * 0.85);
  margin: 0 0 calc(var(--spacing) * 0.95);
  padding: calc(var(--spacing) * 0.95) calc(var(--spacing) * 1.1);
  border-radius: 6px;
  background: var(--c-blanc);
  border: 1px solid color-mix(in srgb, var(--acf-brand-light) 35%, transparent);
  border-top: 3px solid var(--acf-brand-primary);
  box-shadow: 0 1px 2px color-mix(in srgb, var(--acf-brand-primary) 6%, transparent);
}

._sgInfoNoticeIcon {
  flex-shrink: 0;
  color: var(--acf-brand-primary);
  line-height: 1;
}

._sgInfoNoticeText {
  margin: 0;
  font-size: var(--sl-font-size-small);
  line-height: 1.5;
  color: var(--acf-brand-primary);
}

._sgInfoNoticeBadge {
  display: inline-block;
  margin-left: 0.25em;
  padding: 0.1em 0.55em;
  border-radius: 4px;
  font-weight: 700;
  letter-spacing: 0.01em;
  color: var(--acf-brand-primary);
  background: color-mix(in srgb, var(--acf-brand-light) 18%, white);
  border: 1px solid color-mix(in srgb, var(--acf-brand-light) 45%, transparent);
  white-space: nowrap;
}
</style>
