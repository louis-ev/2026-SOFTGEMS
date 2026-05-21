<template>
  <div class="_folderMetaPeek">
    <button type="button" class="u-buttonLink" @click="toggleMetaPeek">
      {{
        show_meta_peek ? $t("sg_hide_folder_meta") : $t("sg_show_folder_meta")
      }}
    </button>
    <div v-if="show_meta_peek" class="_folderMetaPeekPanel">
      <p class="_folderMetaPeekTitle">{{ resolved_panel_title }}</p>
      <pre class="_folderMetaPeekPre">{{ formatted_meta_json }}</pre>
    </div>
  </div>
</template>

<script>
import { formatFolderMetaJson } from "@/utils/format_folder_meta_json.js";

export default {
  name: "SGFolderMetaPeek",
  props: {
    folder_meta: {
      type: Object,
      default: null,
    },
    panel_title: {
      type: String,
      default: "",
    },
  },
  data() {
    return {
      show_meta_peek: false,
    };
  },
  computed: {
    resolved_panel_title() {
      return this.panel_title || this.$t("sg_folder_meta_peek_title");
    },
    formatted_meta_json() {
      return formatFolderMetaJson(this.folder_meta);
    },
  },
  methods: {
    toggleMetaPeek() {
      this.show_meta_peek = !this.show_meta_peek;
    },
  },
};
</script>

<style lang="scss" scoped>
._folderMetaPeek {
  margin-top: calc(var(--spacing) * 0.5);
}

._folderMetaPeekPanel {
  margin-top: calc(var(--spacing) * 0.75);
  border: 1px solid var(--c-gris_clair);
  border-radius: 8px;
  background: var(--c-bodybg);
  padding: calc(var(--spacing) / 2);
}

._folderMetaPeekTitle {
  margin: 0 0 calc(var(--spacing) / 4);
  font-size: var(--sl-font-size-small);
  color: var(--c-gris_fonce);
}

._folderMetaPeekPre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  font-size: var(--sl-font-size-x-small);
  font-family: var(--sl-font-mono);
  max-height: min(50vh, 480px);
  overflow: auto;
}
</style>
