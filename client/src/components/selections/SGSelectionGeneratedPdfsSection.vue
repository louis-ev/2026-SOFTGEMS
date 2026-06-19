<template>
  <SGSectionPanel
    section_id="selection_generated_pdfs"
    :title="$t('sg_pdf_generated_section')"
    :count="generated_files.length"
  >
    <p v-if="generated_files.length === 0" class="_empty">
      {{ $t("sg_pdf_generated_empty") }}
    </p>
    <ul v-else class="_list">
      <li
        v-for="file in generated_files"
        :key="file.$path"
        class="_row"
      >
        <div class="_main">
          <p class="_fileName">{{ displayFilename(file) }}</p>
          <p class="_generatedAt">
            {{ $t("sg_pdf_generated_on", { date: formatGeneratedDate(file) }) }}
          </p>
          <div v-if="openUrl(file)" class="_actions">
            <a
              class="u-buttonLink"
              :href="openUrl(file)"
              target="_blank"
              rel="noopener noreferrer"
            >
              {{ $t("open") }}
            </a>
            <a
              class="u-buttonLink"
              :href="openUrl(file)"
              :download="displayFilename(file)"
            >
              {{ $t("download") }}
            </a>
          </div>
        </div>
      </li>
    </ul>
  </SGSectionPanel>
</template>

<script>
import SGSectionPanel from "@/components/softgems/SGSectionPanel.vue";
import Medias from "@/mixins/Medias.js";
import FormatDates from "@/mixins/FormatDates.js";
import { findSelectionGeneratedPdfFiles } from "@/utils/selection_documents.js";

export default {
  name: "SGSelectionGeneratedPdfsSection",
  mixins: [Medias, FormatDates],
  components: {
    SGSectionPanel,
  },
  props: {
    selection_folder: {
      type: Object,
      default: null,
    },
  },
  computed: {
    generated_files() {
      return findSelectionGeneratedPdfFiles(this.selection_folder);
    },
  },
  methods: {
    displayFilename(file) {
      return file?.$media_filename || file?.$path?.split("/").pop() || "";
    },
    openUrl(file) {
      if (!file?.$path || !file?.$media_filename) return "";
      return this.makeMediaFileURL({
        $path: file.$path,
        $media_filename: file.$media_filename,
      });
    },
    formatGeneratedDate(file) {
      const raw = file?.$date_uploaded;
      if (!raw) return "—";
      return this.formatDate(raw, {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    },
  },
};
</script>

<style lang="scss" scoped>
._empty {
  margin: 0;
  color: var(--c-gris_fonce);
}

._list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: calc(var(--spacing) / 2);
}

._row {
  border: 1px solid var(--c-gris_clair);
  border-radius: 4px;
  padding: calc(var(--spacing) / 2);
}

._fileName {
  margin: 0 0 calc(var(--spacing) / 4);
  font-weight: 600;
}

._generatedAt {
  margin: 0 0 calc(var(--spacing) / 3);
  font-size: 0.9rem;
  color: var(--c-gris_fonce);
}

._actions {
  display: flex;
  gap: calc(var(--spacing) / 2);
}
</style>
