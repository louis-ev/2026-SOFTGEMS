<template>
  <nav class="_selectionsTypeSidebar" aria-label="Selection types">
    <!-- <router-link
      :to="selection_hub_path"
      class="u-button u-button_icon _navItem"
      :class="{ 'is--active': is_hub_active }"
      :title="$t('sg_selections_hub_title')"
    >
      <b-icon icon="grid-3x3-gap" />
    </router-link> -->
    <router-link
      v-for="type_def in type_defs"
      :key="type_def.slug"
      :to="selectionListPath(type_def.slug)"
      class="u-button u-button_icon _navItem"
      :class="{ 'is--active': isTypeActive(type_def.slug) }"
      :title="typeLabel(type_def.value)"
    >
      <b-icon :icon="type_def.icon" />
    </router-link>
  </nav>
</template>

<script>
import { allSelectionTypes } from "@/utils/selection_type_registry.js";
import { selectionHubPath, selectionListPath } from "@/utils/selection_urls.js";
import { selectionTypeLabel as selectionTypeLabelFn } from "@/utils/selection_types.js";

export default {
  name: "SGSelectionsTypeSidebar",
  computed: {
    type_defs() {
      return allSelectionTypes();
    },
    selection_hub_path() {
      return selectionHubPath();
    },
    is_hub_active() {
      return this.$route.name === "Selections hub";
    },
  },
  methods: {
    selectionListPath,
    typeLabel(value) {
      return selectionTypeLabelFn(this.$t.bind(this), value);
    },
    isTypeActive(type_slug) {
      const route_slug = String(this.$route.params.type_slug || "").trim();
      if (route_slug === type_slug) return true;
      if (
        this.$route.name === "Open selection" ||
        this.$route.name === "Create selection"
      ) {
        return route_slug === type_slug;
      }
      return false;
    },
  },
};
</script>

<style lang="scss" scoped>
._selectionsTypeSidebar {
  width: 56px;
  flex: 0 0 56px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: calc(var(--spacing) / 2);
  padding: calc(var(--spacing) / 2);
  background: color-mix(in srgb, var(--c-vert) 70%, white);
  z-index: 2;
  overflow-y: auto;
  min-height: 0;
}

._navItem {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  flex-shrink: 0;
  transition: background-color 150ms ease, color 150ms ease;
}

._navItem:hover {
  background: rgba(255, 255, 255, 0.14);
}

._navItem.is--active {
  background: #ffffff;
  color: #111;
}
</style>
