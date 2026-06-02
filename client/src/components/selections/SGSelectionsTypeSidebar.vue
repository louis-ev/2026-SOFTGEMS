<template>
  <SGIconSidebarNav
    :aria_label="$t('sg_selections_type_sidebar_aria')"
    variant="secondary"
    :items="sidebar_items"
  />
</template>

<script>
import SGIconSidebarNav from "@/components/softgems/SGIconSidebarNav.vue";
import { allSelectionTypes } from "@/utils/selection_type_registry.js";
import { selectionListPath } from "@/utils/selection_urls.js";
import { selectionTypeListLabel as selectionTypeListLabelFn } from "@/utils/selection_types.js";

export default {
  name: "SGSelectionsTypeSidebar",
  components: {
    SGIconSidebarNav,
  },
  computed: {
    type_defs() {
      return allSelectionTypes();
    },
    sidebar_items() {
      return this.type_defs.map((type_def) => ({
        key: type_def.slug,
        to: selectionListPath(type_def.slug),
        title: this.typeLabel(type_def.value),
        icon: type_def.icon,
        active: this.isTypeActive(type_def.slug),
      }));
    },
  },
  methods: {
    typeLabel(value) {
      return selectionTypeListLabelFn(this.$t.bind(this), value);
    },
    isTypeActive(type_slug) {
      const route_slug = String(this.$route.params.type_slug || "").trim();
      return route_slug === type_slug;
    },
  },
};
</script>
