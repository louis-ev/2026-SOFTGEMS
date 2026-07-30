<template>
  <SGSectionPanel
    section_id="selection_attachments"
    :title="$t('sg_selection_attachments')"
    :count="attachment_files.length"
  >
    <template #actions>
      <div v-if="can_edit" class="_uploadRow">
        <input
          :id="upload_input_id"
          type="file"
          name="file"
          class="inputfile-2"
          accept="application/pdf,image/*"
          multiple="multiple"
          @change="onPickFiles($event)"
        />
        <label
          :for="upload_input_id"
          class="u-button u-button_verysmall u-button_red"
        >
          {{ $t("sg_selection_upload_files") }}
          <b-icon icon="upload" :label="$t('sg_selection_upload_files')" />
        </label>
        <UploadFiles
          v-if="files_queue.length > 0"
          :files_to_import="files_queue"
          :path="selection_path"
          :additional_meta="upload_meta"
          @close="onUploadClosed"
        />
      </div>
    </template>

    <p v-if="attachment_files.length === 0" class="_empty">
      {{ $t("sg_selection_no_files") }}
    </p>

    <ul v-else class="_list">
      <li v-for="file in attachment_files" :key="file.$path" class="_row">
        <div class="_rowBody">
          <SGSelectionFileThumb :file="file" />
          <div class="_main">
            <p class="_fileName">{{ displayFilename(file) }}</p>
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
import Medias from "@/mixins/Medias.js";
import SGGemMediaRemoveModal from "@/components/gems/SGGemMediaRemoveModal.vue";
import UploadFiles from "@/adc-core/modals/UploadFiles.vue";
import { isSelectionAttachmentFile } from "@/utils/selection_documents.js";

export default {
  name: "SGSelectionFilesSection",
  mixins: [Medias],
  components: {
    SGSectionPanel,
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
      files_queue: [],
      upload_meta: {
        is_selection_attachment: true,
        is_selection_main_document: false,
      },
      remove_modal_open: false,
      remove_file_path: "",
      remove_display_name: "",
      upload_input_id: `sg_sel_files_${(
        Math.random().toString(36) + "00000000000000000"
      ).slice(2, 7)}`,
    };
  },
  computed: {
    attachment_files() {
      const files = Array.isArray(this.selection_folder?.$files)
        ? this.selection_folder.$files
        : [];
      return files
        .filter((f) => f && isSelectionAttachmentFile(f))
        .slice()
        .sort(
          (a, b) =>
            +new Date(b?.$date_uploaded || 0) -
            +new Date(a?.$date_uploaded || 0)
        );
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
    onPickFiles(ev) {
      const input = ev?.target;
      if (!input || !input.files || input.files.length === 0) return;
      const next = Array.from(input.files);
      this.files_queue = next;
      input.value = "";
    },
    onUploadClosed() {
      this.files_queue = [];
      this.$emit("changed");
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
._uploadRow {
  display: flex;
  align-items: center;
  gap: calc(var(--spacing) / 2);
}

._empty {
  margin: 0;
  color: var(--c-gris_fonce);
  // font-size: var(--sl-font-size-small);
}

._list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: calc(var(--spacing) * 0.75);
}

._row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: calc(var(--spacing) / 2);
  padding: calc(var(--spacing) * 0.75);
  border: 1px solid var(--c-gris_clair);
  border-radius: 8px;
  background: var(--c-blanc);
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
  font-size: var(--sl-font-size-small);
  word-break: break-word;
}

._actions {
  display: flex;
  flex-wrap: wrap;
  gap: calc(var(--spacing) / 2);
}
</style>
