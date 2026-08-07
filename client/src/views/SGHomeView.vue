<template>
  <div class="_sgHome">
    <h1 class="_pageTitle">Home</h1>

    <section class="_section" aria-label="Create">
      <div class="_cardGrid" role="list">
        <router-link
          class="_typeCard"
          role="listitem"
          to="/gems/new"
          :aria-label="$t('sg_create_gem_title')"
        >
          <span class="_cardIconWrap">
            <b-icon icon="gem" class="_cardIcon" />
          </span>
          <span class="_cardLabel">{{ $t("sg_create_gem_title") }}</span>
        </router-link>
        <router-link
          class="_typeCard"
          role="listitem"
          to="/address-book/new"
          :aria-label="$t('sg_create_contact_title')"
        >
          <span class="_cardIconWrap">
            <b-icon icon="people" class="_cardIcon" />
          </span>
          <span class="_cardLabel">{{ $t("sg_create_contact_title") }}</span>
        </router-link>
      </div>
    </section>

    <section class="_section" :aria-label="$t('sg_create_selection_title')">
      <h2 class="_sectionTitle">{{ $t("sg_create_selection_title") }}</h2>
      <div class="_cardGrid" role="list">
        <router-link
          v-for="type_def in type_defs"
          :key="type_def.slug"
          class="_typeCard"
          role="listitem"
          :to="selectionCreatePath(type_def.slug)"
          :aria-label="selectionCreateLabel(type_def.value)"
        >
          <span class="_cardIconWrap">
            <b-icon :icon="type_def.icon" class="_cardIcon" />
          </span>
          <span class="_cardLabel">{{
            selectionCreateLabel(type_def.value)
          }}</span>
        </router-link>
      </div>
    </section>

    <p class="_versionText">App version {{ app_version }}</p>
  </div>
</template>
<script>
import { allSelectionTypes } from "@/utils/selection_type_registry.js";
import { selectionNewPath } from "@/utils/selection_urls.js";
import { selectionTypeLabel as selectionTypeLabelFn } from "@/utils/selection_types.js";

export default {
  name: "SGHomeView",
  computed: {
    app_version() {
      return this.$root?.app_infos?.version || "unknown";
    },
    type_defs() {
      return allSelectionTypes();
    },
  },
  methods: {
    selectionCreatePath(type_slug) {
      return selectionNewPath(type_slug);
    },
    selectionCreateLabel(value) {
      const type_label = selectionTypeLabelFn(this.$t.bind(this), value);
      return this.$t("sg_create_selection_of_type", { type: type_label });
    },
  },
};
</script>
<style lang="scss" scoped>
._sgHome {
  height: 100%;
  overflow-y: auto;
  padding: calc(var(--spacing) * 2) calc(var(--spacing) * 3);
  box-sizing: border-box;
}

._pageTitle {
  margin: 0;
  margin-bottom: calc(var(--spacing) * 1.5);
}

._section {
  margin-bottom: calc(var(--spacing) * 2);
}

._sectionTitle {
  margin: 0 0 calc(var(--spacing) * 1);
  font-size: 1.1rem;
  font-weight: 600;
}

._cardGrid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: calc(var(--spacing) * 1);
}

._typeCard {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: calc(var(--spacing) * 0.65);
  min-height: 120px;
  padding: calc(var(--spacing) * 1);
  border: 1px solid var(--c-gris_clair);
  border-radius: 12px;
  background: var(--c-blanc);
  cursor: pointer;
  text-align: center;
  text-decoration: none;
  color: inherit;
  transition: border-color 150ms ease, box-shadow 150ms ease;

  &:hover {
    border-color: var(--c-gris);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  }

  &:focus {
    outline: 2px solid var(--c-orange);
    outline-offset: 2px;
  }
}

._cardIconWrap {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: var(--c-gris_clair);
  color: var(--c-gris_fonce);
}

._cardIcon {
  font-size: 1.35rem;
}

._cardLabel {
  font-size: var(--sl-font-size-small);
  font-weight: 600;
  line-height: 1.25;
}

._versionText {
  margin: calc(var(--spacing) / 4) 0 0;
  color: var(--c-gris_fonce);
}
</style>
