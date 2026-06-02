<template>
  <div class="_selectionsHub">
    <div class="_pageHeader">
      <h1 class="_pageTitle">{{ $t("sg_selections") }}</h1>
    </div>

    <div v-if="is_loading">{{ $t("sg_loading_selections") }}</div>
    <div v-else-if="fetch_error" class="u-errorMsg">{{ fetch_error }}</div>
    <div v-else class="_cardGrid" role="list">
      <button
        v-for="type_def in type_defs"
        :key="type_def.slug"
        type="button"
        class="_typeCard"
        role="listitem"
        :aria-label="cardAriaLabel(type_def)"
        @click="openTypeList(type_def.slug)"
        @keydown.enter.prevent="openTypeList(type_def.slug)"
      >
        <span class="_cardIconWrap">
          <b-icon :icon="type_def.icon" class="_cardIcon" />
        </span>
        <span class="_cardLabel">{{ typeLabel(type_def.value) }}</span>
        <span v-if="countForType(type_def.value) > 0" class="_cardCount">
          {{ countForType(type_def.value) }}
        </span>
      </button>
    </div>
  </div>
</template>

<script>
import { allSelectionTypes } from "@/utils/selection_type_registry.js";
import { selectionListPath } from "@/utils/selection_urls.js";
import { selectionTypeListLabel as selectionTypeListLabelFn } from "@/utils/selection_types.js";

export default {
  name: "SGSelectionsHubView",
  data() {
    return {
      selections_root_path: "selections",
      selection_folders: [],
      is_loading: false,
      fetch_error: "",
    };
  },
  computed: {
    type_defs() {
      return allSelectionTypes();
    },
  },
  mounted() {
    this.fetchSelections();
    this.$api.join({ room: this.selections_root_path });
  },
  beforeDestroy() {
    this.$api.leave({ room: this.selections_root_path });
  },
  methods: {
    typeLabel(value) {
      return selectionTypeListLabelFn(this.$t.bind(this), value);
    },
    countForType(selection_type) {
      if (!Array.isArray(this.selection_folders)) return 0;
      return this.selection_folders.filter(
        (row) => String(row?.selection_type || "") === selection_type
      ).length;
    },
    cardAriaLabel(type_def) {
      const label = this.typeLabel(type_def.value);
      const count = this.countForType(type_def.value);
      if (count > 0) {
        return `${label} (${count})`;
      }
      return label;
    },
    openTypeList(type_slug) {
      this.$router.push(selectionListPath(type_slug));
    },
    async fetchSelections() {
      this.is_loading = true;
      this.fetch_error = "";
      try {
        const fetched = await this.$api.getFolders({
          path: this.selections_root_path,
        });
        this.selection_folders = Array.isArray(fetched) ? fetched : [];
      } catch ({ code }) {
        this.fetch_error = code || this.$t("sg_could_not_load_selections");
        this.selection_folders = [];
      } finally {
        this.is_loading = false;
      }
    },
  },
};
</script>

<style lang="scss" scoped>
._selectionsHub {
  height: 100%;
  min-height: 0;
  overflow-y: auto;
  padding: calc(var(--spacing) * 2) calc(var(--spacing) * 3);
  box-sizing: border-box;
}

._pageTitle {
  margin: 0;
}

._pageHeader {
  margin-bottom: calc(var(--spacing) * 1.5);
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

._cardCount {
  position: absolute;
  top: 8px;
  right: 8px;
  min-width: 1.4em;
  padding: 2px 6px;
  border-radius: 999px;
  background: var(--c-vert);
  color: #fff;
  font-size: 0.7rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
</style>
