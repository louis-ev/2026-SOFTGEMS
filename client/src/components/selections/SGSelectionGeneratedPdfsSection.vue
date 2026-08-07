<template>
  <SGSectionPanel
    section_id="selection_generated_pdfs"
    :title="$t('sg_pdf_generated_section')"
    :count="generated_files.length"
  >
    <p v-if="generated_files.length === 0" class="_empty">
      {{ $t("sg_pdf_generated_empty") }}
    </p>
    <template v-else>
      <ul class="_list">
        <li
          v-for="file in visible_files"
          :key="file.$path"
          class="_row"
        >
          <div class="_rowBody">
            <SGSelectionFileThumb :file="file" />
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
          </div>
          <button
            v-if="can_edit"
            type="button"
            class="u-buttonLink u-buttonLink_red"
            :disabled="remove_modal_open"
            @click="openRemoveModal(file)"
          >
            {{ $t("sg_certificate_remove") }}
          </button>
        </li>
      </ul>
      <button
        v-if="has_hidden_generated"
        type="button"
        class="u-buttonLink _showAll"
        @click="showAllGenerated"
      >
        {{ $t("sg_pdf_generated_show_older") }}
      </button>
    </template>

    <SGGemMediaRemoveModal
      v-if="remove_modal_open"
      :file_path="remove_file_path"
      :display_filename="remove_display_name"
      :can_delete="can_edit"
      @removedSuccessfully="onRemovedSuccessfully"
      @close="closeRemoveModal"
    />
  </SGSectionPanel>
</template>

<script>
import SGSectionPanel from "@/components/softgems/SGSectionPanel.vue";
import SGSelectionFileThumb from "@/components/selections/SGSelectionFileThumb.vue";
import SGGemMediaRemoveModal from "@/components/gems/SGGemMediaRemoveModal.vue";
import Medias from "@/mixins/Medias.js";
import FormatDates from "@/mixins/FormatDates.js";
import { findSelectionGeneratedPdfFiles } from "@/utils/selection_documents.js";

export default {
  name: "SGSelectionGeneratedPdfsSection",
  mixins: [Medias, FormatDates],
  components: {
    SGSectionPanel,
    SGSelectionFileThumb,
    SGGemMediaRemoveModal,
  },
  props: {
    selection_folder: {
      type: Object,
      default: null,
    },
    can_edit: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      show_all_generated: false,
      remove_modal_open: false,
      remove_file_path: "",
      remove_display_name: "",
    };
  },
  computed: {
    generated_files() {
      return findSelectionGeneratedPdfFiles(this.selection_folder);
    },
    visible_files() {
      if (this.show_all_generated) return this.generated_files;
      return this.generated_files.slice(0, 3);
    },
    has_hidden_generated() {
      return (
        !this.show_all_generated && this.generated_files.length > 3
      );
    },
  },
  methods: {
    showAllGenerated() {
      this.show_all_generated = true;
    },
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
    openRemoveModal(file) {
      if (!file?.$path) return;
      this.remove_file_path = file.$path;
      this.remove_display_name = this.displayFilename(file);
      this.remove_modal_open = true;
    },
    closeRemoveModal() {
      this.remove_modal_open = false;
      this.remove_file_path = "";
      this.remove_display_name = "";
    },
    onRemovedSuccessfully() {
      this.closeRemoveModal();
      this.$emit("changed");
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
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: calc(var(--spacing) / 2);
  border: 1px solid var(--c-gris_clair);
  border-radius: 4px;
  padding: calc(var(--spacing) / 2);
}

._rowBody {
  display: flex;
  gap: calc(var(--spacing) * 0.75);
  min-width: 0;
  flex: 1;
}

._main {
  min-width: 0;
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

._showAll {
  margin-top: calc(var(--spacing) / 2);
  align-self: flex-start;
}
</style>
