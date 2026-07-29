<template>
  <div class="_mainDocument">
    <p v-if="!main_document_file" class="_empty">
      {{ $t("sg_selection_main_document_empty") }}
    </p>

    <div v-else class="_fileRow">
      <SGSelectionFileThumb :file="main_document_file" />
      <div class="_fileMain">
        <p class="_fileName">{{ displayFilename(main_document_file) }}</p>
        <div v-if="downloadUrl(main_document_file)" class="_fileActions">
          <a
            class="u-buttonLink"
            :href="downloadUrl(main_document_file)"
            target="_blank"
            rel="noopener noreferrer"
          >
            {{ $t("sg_certificate_open_pdf") }}
          </a>
          <a
            class="u-buttonLink"
            :href="downloadUrl(main_document_file)"
            :download="displayFilename(main_document_file)"
          >
            {{ $t("sg_certificate_download_pdf") }}
          </a>
        </div>
      </div>
      <button
        v-if="can_edit"
        type="button"
        class="u-buttonLink u-buttonLink_red"
        :disabled="remove_modal_open"
        @click="openRemoveModal"
      >
        {{ $t("sg_certificate_remove") }}
      </button>
    </div>

    <div v-if="can_edit" class="_uploadRow">
      <input
        :id="upload_input_id"
        type="file"
        name="file"
        class="inputfile-2"
        accept="application/pdf,.pdf"
        @change="onPickPdf($event)"
      />
      <label
        :for="upload_input_id"
        class="u-button u-button_verysmall u-button_red"
      >
        {{
          main_document_file
            ? $t("sg_selection_main_document_replace")
            : $t("sg_selection_main_document_upload")
        }}
        <b-icon icon="upload" />
      </label>
      <UploadFiles
        v-if="pdf_files_queue.length > 0"
        :files_to_import="pdf_files_queue"
        :path="selection_path"
        :additional_meta="upload_meta"
        @close="onUploadClosed"
      />
    </div>

    <SGGemMediaRemoveModal
      v-if="remove_modal_open"
      :file_path="remove_file_path"
      :display_filename="remove_display_name"
      :can_delete="can_edit"
      @removedSuccessfully="onRemovedSuccessfully"
      @close="closeRemoveModal"
    />
  </div>
</template>

<script>
import Medias from "@/mixins/Medias.js";
import SGSelectionFileThumb from "@/components/selections/SGSelectionFileThumb.vue";
import SGGemMediaRemoveModal from "@/components/gems/SGGemMediaRemoveModal.vue";
import UploadFiles from "@/adc-core/modals/UploadFiles.vue";
import {
  findSelectionMainDocumentFile,
  isPdfFile,
} from "@/utils/selection_documents.js";

export default {
  name: "SGSelectionMainDocumentField",
  mixins: [Medias],
  components: {
    SGSelectionFileThumb,
    SGGemMediaRemoveModal,
    UploadFiles,
  },
  props: {
    selection_path: {
      type: String,
      required: true,
    },
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
      pdf_files_queue: [],
      upload_meta: {
        is_selection_main_document: true,
        is_selection_attachment: false,
      },
      replace_path: "",
      remove_modal_open: false,
      remove_file_path: "",
      remove_display_name: "",
      upload_input_id: `sg_sel_main_doc_${(
        Math.random().toString(36) + "00000000000000000"
      ).slice(2, 7)}`,
    };
  },
  computed: {
    main_document_file() {
      return findSelectionMainDocumentFile(this.selection_folder);
    },
  },
  methods: {
    displayFilename(file) {
      return file?.$media_filename || file?.$path?.split("/").pop() || "";
    },
    downloadUrl(file) {
      if (!file?.$path || !file?.$media_filename) return "";
      return this.makeMediaFileURL({
        $path: file.$path,
        $media_filename: file.$media_filename,
      });
    },
    onPickPdf(ev) {
      const input = ev?.target;
      const file = input?.files?.[0];
      if (!file) return;

      if (!isPdfFile(file)) {
        this.$alertify
          .delay(4000)
          .error(this.$t("sg_selection_main_document_pdf_only"));
        input.value = "";
        return;
      }

      this.replace_path = this.main_document_file?.$path || "";
      this.pdf_files_queue = [file];
      input.value = "";
    },
    async onUploadClosed() {
      const previous_path = this.replace_path;
      this.pdf_files_queue = [];
      this.replace_path = "";

      await this.$nextTick();

      const current_path = this.main_document_file?.$path || "";
      if (
        previous_path &&
        current_path &&
        previous_path !== current_path
      ) {
        try {
          await this.$api.deleteItem({ path: previous_path });
        } catch ({ code }) {
          this.$alertify
            .delay(4000)
            .error(code || this.$t("sg_could_not_save"));
        }
      }

      this.$emit("changed");
    },
    openRemoveModal() {
      const file = this.main_document_file;
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
._mainDocument {
  display: flex;
  flex-direction: column;
  gap: calc(var(--spacing) / 2);
}

._empty {
  margin: 0;
  color: var(--c-gris_fonce);
  font-size: var(--sl-font-size-small);
}

._fileRow {
  display: flex;
  gap: calc(var(--spacing) * 0.75);
  align-items: flex-start;
  justify-content: space-between;
  padding: calc(var(--spacing) * 0.75);
  border: 1px solid var(--c-gris_clair);
  border-radius: 8px;
  background: var(--c-blanc);
}

._fileMain {
  min-width: 0;
}

._fileName {
  margin: 0;
  font-size: var(--sl-font-size-small);
  word-break: break-word;
}

._fileActions {
  display: flex;
  flex-wrap: wrap;
  gap: calc(var(--spacing) / 2);
}

._uploadRow {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: calc(var(--spacing) / 2);
}
</style>
