<template>
  <nav
    class="sg-icon-sidebar"
    :class="`sg-icon-sidebar--${variant}`"
    :aria-label="aria_label"
  >
    <router-link
      v-for="item in items"
      :key="item.key"
      :to="item.to"
      class="sg-icon-sidebar__item"
      :class="{ 'is--active': item.active }"
      :title="item.title"
    >
      <b-icon :icon="item.icon" />
    </router-link>
  </nav>
</template>

<script>
export default {
  name: "SGIconSidebarNav",
  props: {
    aria_label: {
      type: String,
      required: true,
    },
    items: {
      type: Array,
      default() {
        return [];
      },
    },
    /** `primary` — main app nav; `secondary` — nested type nav */
    variant: {
      type: String,
      default: "primary",
      validator(value) {
        return ["primary", "secondary"].includes(value);
      },
    },
  },
};
</script>

<style lang="scss" scoped>
.sg-icon-sidebar {
  width: 56px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: calc(var(--spacing) / 2);
  padding: calc(var(--spacing) / 2);
}

.sg-icon-sidebar--primary {
  align-self: stretch;
  min-height: 0;
  background: var(--acf-brand-primary);
  z-index: 3;
}

.sg-icon-sidebar--secondary {
  flex: 0 0 56px;
  background: color-mix(in srgb, var(--acf-brand-primary) 78%, var(--acf-brand-light));
  z-index: 2;
  overflow-y: auto;
  min-height: 0;
}

.sg-icon-sidebar__item {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  background: transparent;
  font-size: var(--sl-font-size-large);
  transition: background-color 150ms ease, color 150ms ease;
}

.sg-icon-sidebar--primary .sg-icon-sidebar__item {
  color: var(--acf-brand-light);
}

.sg-icon-sidebar--secondary .sg-icon-sidebar__item {
  flex-shrink: 0;
  color: color-mix(in srgb, var(--acf-brand-cream) 80%, var(--acf-brand-light));
}

.sg-icon-sidebar__item:hover {
  background: rgba(255, 255, 255, 0.12);
  color: var(--acf-brand-cream);
}

.sg-icon-sidebar--primary .sg-icon-sidebar__item.is--active,
.sg-icon-sidebar--secondary .sg-icon-sidebar__item.is--active {
  background: var(--acf-brand-cream);
  color: var(--acf-brand-primary);
}
</style>
