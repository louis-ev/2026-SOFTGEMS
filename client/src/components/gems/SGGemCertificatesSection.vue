<template>
  <SGSectionPanel
    section_id="certificates"
    :title="$t('sg_section_certificates')"
    :count="gem_certificate_files.length"
  >
    <template #actions>
      <div v-if="can_edit" class="_uploadRow">
        <input
          :id="upload_input_id"
          type="file"
          name="file"
          class="inputfile-2"
          accept="application/pdf,.pdf"
          multiple="multiple"
          @change="onPickPdfs($event)"
        />
        <label
          :for="upload_input_id"
          class="u-button u-button_verysmall u-button_red"
        >
          {{ $t("sg_certificate_upload") }}
          <b-icon icon="upload" :label="$t('sg_certificate_upload')" />
        </label>
        <UploadFiles
          v-if="pdf_files_queue.length > 0"
          :files_to_import="pdf_files_queue"
          :path="gem_path"
          :additional_meta="certificate_upload_meta"
          @close="onCertificateUploadClosed"
        />
      </div>
    </template>

    <p v-if="gem_certificate_files.length === 0" class="_empty">
      {{ $t("sg_no_certificates_yet") }}
    </p>

    <ul v-else class="_list">
      <li
        v-for="certificate_file in gem_certificate_files"
        :key="certificate_file.$path"
        class="_row"
      >
        <div
          class="_rowBody"
          :class="{
            _rowBody_withPreview: !!getCertificateDownloadUrl(certificate_file),
          }"
        >
          <div
            v-if="getCertificateDownloadUrl(certificate_file)"
            class="_certificatePreview"
          >
            <MediaContent
              :file="certificate_file"
              context="preview"
              :resolution="certificate_preview_resolution"
            />
          </div>
          <div class="_certificateMain">
            <div class="_rowTop">
              <div class="_fileBlock">
                <p class="_fileName">
                  {{ displayCertificateFilename(certificate_file) }}
                </p>
                <div
                  v-if="getCertificateDownloadUrl(certificate_file)"
                  class="_fileActions"
                >
                  <a
                    class="u-buttonLink"
                    :href="getCertificateDownloadUrl(certificate_file)"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {{ $t("sg_certificate_open_pdf") }}
                  </a>
                  <a
                    class="u-buttonLink"
                    :href="getCertificateDownloadUrl(certificate_file)"
                    :download="
                      certificate_file.$media_filename ||
                      displayCertificateFilename(certificate_file)
                    "
                  >
                    {{ $t("sg_certificate_download_pdf") }}
                  </a>
                </div>
              </div>

              <button
                v-if="can_edit"
                type="button"
                class="u-buttonLink u-buttonLink_red"
                :disabled="certificate_remove_modal_open"
                @click="openCertificateRemoveModal(certificate_file)"
              >
                {{ $t("sg_certificate_remove") }}
              </button>
            </div>

            <div class="_fieldsGrid">
              <SGGemFieldCard
                :label="$t('sg_certificate_provider')"
                icon="person-badge"
                :value="
                  displayCertificateProviderLabel(certificate_file)
                "
                :readonly="!can_edit"
                @click="
                  openCertificateFieldModal(certificate_file, 'provider_path')
                "
              />
              <SGGemFieldCard
                :label="$t('sg_certificate_reference')"
                icon="file-earmark-text"
                :value="certificate_file.certificate_reference || ''"
                :readonly="!can_edit"
                @click="
                  openCertificateFieldModal(
                    certificate_file,
                    'certificate_reference'
                  )
                "
              />
              <SGGemFieldCard
                :label="$t('sg_certificate_date')"
                icon="calendar3"
                value_type="date"
                :value="certificate_file.certificate_date || ''"
                :readonly="!can_edit"
                @click="
                  openCertificateFieldModal(
                    certificate_file,
                    'certificate_date'
                  )
                "
              />
              <SGGemFieldCard
                :label="$t('sg_certificate_price')"
                icon="tag"
                :value="
                  certificatePriceForFieldCard(certificate_file)
                "
                :readonly="!can_edit"
                @click="
                  openCertificateFieldModal(
                    certificate_file,
                    'certificate_price'
                  )
                "
              />
            </div>
          </div>
        </div>
      </li>
    </ul>

    <SGGemCertificateRemoveModal
      v-if="certificate_remove_modal_open"
      :file_path="certificate_remove_path"
      :display_filename="certificate_remove_filename"
      :can_delete="can_edit"
      @close="closeCertificateRemoveModal"
    />

    <SGGemEditFieldModal
      v-if="certificate_field_edit !== null"
      :key="certificate_field_edit_modal_key"
      :field="certificate_field_edit.field"
      :current_value="certificate_field_edit.current_value"
      :gem_path="gem_path"
      :gem="gem"
      :meta_target_path="certificate_field_edit.meta_target_path"
      :context_heading="certificate_field_edit.context_heading"
      @saved="closeCertificateFieldModal"
      @close="closeCertificateFieldModal"
    />
  </SGSectionPanel>
</template>

<script>
import SGSectionPanel from "@/components/softgems/SGSectionPanel.vue";
import SGGemCertificateRemoveModal from "@/components/gems/SGGemCertificateRemoveModal.vue";
import SGGemEditFieldModal from "@/components/gems/SGGemEditFieldModal.vue";
import SGGemFieldCard from "@/components/gems/SGGemFieldCard.vue";
import UploadFiles from "@/adc-core/modals/UploadFiles.vue";
import { resolveAddressBookPathLabels } from "@/utils/address_book_paths.js";

export default {
  name: "SGGemCertificatesSection",
  components: {
    SGSectionPanel,
    SGGemCertificateRemoveModal,
    SGGemEditFieldModal,
    SGGemFieldCard,
    UploadFiles,
  },
  props: {
    gem_path: {
      type: String,
      required: true,
    },
    gem: {
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
      provider_labels: {},
      certificate_upload_meta: { is_gem_certificate: true },
      certificate_preview_resolution: 640,
      certificate_remove_modal_open: false,
      certificate_remove_path: "",
      certificate_remove_filename: "",
      certificate_field_edit: null,
      upload_input_id: `sg_gem_certificate_upload_${(
        Math.random().toString(36) + "00000000000000000"
      ).slice(2, 7)}`,
    };
  },
  computed: {
    certificate_field_edit_modal_key() {
      if (!this.certificate_field_edit) return "closed";
      return `${this.certificate_field_edit.meta_target_path}::${this.certificate_field_edit.field.key}`;
    },
    gem_certificate_files() {
      const files = Array.isArray(this.gem?.$files) ? this.gem.$files : [];
      return files
        .filter((f) => f && f.is_gem_certificate === true)
        .slice()
        .sort(
          (a, b) =>
            +new Date(b?.$date_uploaded || 0) -
            +new Date(a?.$date_uploaded || 0)
        );
    },
  },
  watch: {
    gem_certificate_files: {
      handler() {
        this.refreshProviderLabels();
      },
      immediate: true,
    },
  },
  methods: {
    getCertificateFieldConfig(field_key) {
      const map = {
        provider_path: {
          key: "provider_path",
          label: this.$t("sg_certificate_provider"),
          icon: "person-badge",
          type: "address_book_counterparty",
        },
        certificate_reference: {
          key: "certificate_reference",
          label: this.$t("sg_certificate_reference"),
          icon: "file-earmark-text",
          type: "text",
        },
        certificate_date: {
          key: "certificate_date",
          label: this.$t("sg_certificate_date"),
          icon: "calendar3",
          type: "date",
        },
        certificate_price: {
          key: "certificate_price",
          label: this.$t("sg_certificate_price"),
          icon: "tag",
          type: "number",
          input_step: 0.01,
          persist_empty_number_as_null: true,
        },
      };
      return map[field_key] || null;
    },
    certificatePriceForFieldCard(certificate_file) {
      const raw = certificate_file?.certificate_price;
      if (raw === null || raw === undefined) return "";
      const n = typeof raw === "number" ? raw : Number(raw);
      return Number.isFinite(n) ? n : "";
    },
    displayCertificateProviderLabel(certificate_file) {
      const path_raw = certificate_file?.provider_path;
      const path_str = typeof path_raw === "string" ? path_raw.trim() : "";
      if (!path_str) return "";
      const label = this.provider_labels[path_str];
      if (label) return String(label);
      return path_str;
    },
    async refreshProviderLabels() {
      const paths = this.gem_certificate_files
        .map((certificate_file) => certificate_file?.provider_path)
        .filter((path) => typeof path === "string" && path.trim() !== "");
      if (!paths.length) {
        this.provider_labels = {};
        return;
      }
      try {
        this.provider_labels = await resolveAddressBookPathLabels(
          this.$api,
          paths
        );
      } catch {
        this.provider_labels = {};
      }
    },
    openCertificateFieldModal(certificate_file, field_key) {
      if (
        !this.can_edit ||
        !certificate_file ||
        !certificate_file.$path ||
        this.certificate_remove_modal_open
      )
        return;
      const field_def = this.getCertificateFieldConfig(field_key);
      if (!field_def) return;

      let current_value =
        certificate_file[field_key] === null ||
        certificate_file[field_key] === undefined
          ? ""
          : certificate_file[field_key];
      if (field_key === "certificate_price") {
        current_value =
          certificate_file.certificate_price === null ||
          certificate_file.certificate_price === undefined
            ? ""
            : certificate_file.certificate_price;
      }

      this.certificate_field_edit = {
        field: field_def,
        current_value,
        meta_target_path: certificate_file.$path,
        context_heading: this.displayCertificateFilename(certificate_file),
      };
    },
    closeCertificateFieldModal() {
      this.certificate_field_edit = null;
    },
    displayCertificateFilename(certificate_file) {
      const name =
        certificate_file?.$media_filename &&
        String(certificate_file.$media_filename).trim() !== ""
          ? String(certificate_file.$media_filename).trim()
          : "";
      if (name) return name;
      const path_slug = String(certificate_file?.$path || "")
        .split("/")
        .filter(Boolean)
        .pop();
      return path_slug || "—";
    },
    getCertificateDownloadUrl(certificate_file) {
      if (!certificate_file?.$path || !certificate_file?.$media_filename)
        return "";
      return this.makeMediaFileURL({
        $path: certificate_file.$path,
        $media_filename: certificate_file.$media_filename,
      });
    },
    onPickPdfs(event) {
      const file_list = event?.target?.files;
      const picked = file_list ? Array.from(file_list) : [];
      if (picked.length === 0) return;

      const invalid = picked.filter((f) => {
        const name = String(f?.name || "").toLowerCase();
        const mime = String(f?.type || "").toLowerCase();
        return mime !== "application/pdf" && !name.endsWith(".pdf");
      });
      if (invalid.length > 0) {
        this.$alertify.delay(4000).error(this.$t("sg_certificate_pdf_only"));
        event.target.value = "";
        return;
      }

      this.pdf_files_queue = picked;
      event.target.value = "";
    },
    onCertificateUploadClosed() {
      this.pdf_files_queue = [];
    },
    closeCertificateRemoveModal() {
      this.certificate_remove_modal_open = false;
      this.certificate_remove_path = "";
      this.certificate_remove_filename = "";
    },
    openCertificateRemoveModal(certificate_file) {
      if (
        !this.can_edit ||
        !certificate_file?.$path ||
        this.certificate_field_edit !== null
      )
        return;
      this.certificate_remove_path = certificate_file.$path;
      this.certificate_remove_filename =
        this.displayCertificateFilename(certificate_file);
      this.certificate_remove_modal_open = true;
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
  border: 1px solid var(--c-gris_clair);
  border-radius: 8px;
  padding: calc(var(--spacing) * 0.6);
  background: var(--c-bodybg);
}

._rowBody {
  display: grid;
  gap: calc(var(--spacing) * 0.75);
  grid-template-columns: 1fr;
  align-items: start;
}

._rowBody_withPreview {
  grid-template-columns: minmax(160px, 220px) minmax(0, 1fr);
}

._certificatePreview {
  border: 1px solid var(--c-gris_clair);
  border-radius: 8px;
  overflow: hidden;
  background: var(--c-gris_clair);
}

._certificatePreview :deep(._mediaContent) {
  display: flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: 1 / 1;
  max-width: 220px;
  margin-inline: auto;
}

._certificatePreview :deep(img._mediaContent--image) {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

._certificatePreview :deep(._fileName) {
  padding: calc(var(--spacing) / 2);
}

._certificateMain {
  min-width: 0;
}

._rowTop {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: calc(var(--spacing) / 2);
}

._fileBlock {
  min-width: 0;
}

._fileName {
  margin: 0;
  font-size: var(--sl-font-size-small);
  font-weight: 600;
  word-break: break-word;
}

._fileActions {
  margin-top: calc(var(--spacing) / 3);
  display: flex;
  flex-wrap: wrap;
  gap: calc(var(--spacing) / 2);
}

._fieldsGrid {
  margin-top: calc(var(--spacing) * 0.6);
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: calc(var(--spacing) / 1.5);
}

@media (max-width: 720px) {
  ._rowBody_withPreview {
    grid-template-columns: 1fr;
  }

  ._certificatePreview {
    max-width: min(220px, 100%);
    margin-inline: auto;
  }
}
</style>
