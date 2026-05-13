<template>
  <section class="_gemCertificates">
    <header class="_header">
      <h2 class="_title">{{ $t("sg_section_certificates") }}</h2>
      <span class="_count">{{ gem_certificate_files.length }}</span>
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
    </header>

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
                :disabled="is_persisting || certificate_remove_modal_open"
                @click="openCertificateRemoveModal(certificate_file)"
              >
                {{ $t("sg_certificate_remove") }}
              </button>
            </div>

            <div class="_fieldsGrid">
              <div class="_field">
                <label class="_fieldLabel">{{
                  $t("sg_certificate_provider")
                }}</label>
                <SGSelectField
                  :value="certificate_file.provider_path || ''"
                  :options="contact_select_options"
                  :disabled="!can_edit || is_persisting || is_loading_contacts"
                  @input="
                    patchCertificateFile(certificate_file, {
                      provider_path: String($event || ''),
                    })
                  "
                />
              </div>
              <div class="_field">
                <label class="_fieldLabel">{{
                  $t("sg_certificate_reference")
                }}</label>
                <input
                  class="u-input"
                  type="text"
                  :disabled="!can_edit || is_persisting"
                  :value="certificate_file.certificate_reference || ''"
                  @change="
                    patchCertificateFile(certificate_file, {
                      certificate_reference: String($event.target.value || ''),
                    })
                  "
                />
              </div>
              <div class="_field">
                <label class="_fieldLabel">{{
                  $t("sg_certificate_date")
                }}</label>
                <input
                  class="u-input"
                  type="date"
                  :disabled="!can_edit || is_persisting"
                  :value="certificate_file.certificate_date || ''"
                  @change="
                    patchCertificateFile(certificate_file, {
                      certificate_date: String($event.target.value || ''),
                    })
                  "
                />
              </div>
              <div class="_field">
                <label class="_fieldLabel">{{
                  $t("sg_certificate_price")
                }}</label>
                <input
                  class="u-input"
                  type="number"
                  inputmode="decimal"
                  step="0.01"
                  :disabled="!can_edit || is_persisting"
                  :value="
                    certificate_file.certificate_price === null ||
                    certificate_file.certificate_price === undefined
                      ? ''
                      : certificate_file.certificate_price
                  "
                  @change="onCertificatePriceChange(certificate_file, $event)"
                />
              </div>
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
  </section>
</template>

<script>
import SGSelectField from "@/components/softgems/SGSelectField.vue";
import SGGemCertificateRemoveModal from "@/components/gems/SGGemCertificateRemoveModal.vue";
import UploadFiles from "@/adc-core/modals/UploadFiles.vue";

export default {
  name: "SGGemCertificatesSection",
  components: {
    SGSelectField,
    SGGemCertificateRemoveModal,
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
      contacts_list: [],
      is_loading_contacts: false,
      is_persisting: false,
      certificate_upload_meta: { is_gem_certificate: true },
      certificate_preview_resolution: 640,
      certificate_remove_modal_open: false,
      certificate_remove_path: "",
      certificate_remove_filename: "",
      upload_input_id: `sg_gem_certificate_upload_${(
        Math.random().toString(36) + "00000000000000000"
      ).slice(2, 7)}`,
    };
  },
  computed: {
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
    contact_select_options() {
      const rows = Array.isArray(this.contacts_list) ? this.contacts_list : [];
      return rows
        .map((contact_folder) => {
          const contact_path =
            typeof contact_folder?.$path === "string"
              ? contact_folder.$path.trim()
              : "";
          if (!contact_path) return null;
          const contact_name_raw =
            typeof contact_folder?.name === "string"
              ? contact_folder.name.trim()
              : "";
          const slug =
            typeof contact_folder?.$slug === "string"
              ? contact_folder.$slug.trim()
              : "";
          const label =
            contact_name_raw ||
            slug ||
            contact_path.split("/").filter(Boolean).pop() ||
            contact_path;
          return { value: contact_path, label };
        })
        .filter(Boolean);
    },
  },
  async mounted() {
    await this.refreshContacts();
  },
  methods: {
    async refreshContacts() {
      this.is_loading_contacts = true;
      try {
        const folders = await this.$api.getFolders({ path: "authors" });
        this.contacts_list = Array.isArray(folders) ? folders : [];
      } catch {
        this.contacts_list = [];
      } finally {
        this.is_loading_contacts = false;
      }
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
    async patchCertificateFile(certificate_file, patch) {
      if (!this.can_edit || !certificate_file?.$path) return;
      this.is_persisting = true;
      try {
        await this.$api.updateMeta({
          path: certificate_file.$path,
          new_meta: patch,
        });
      } catch ({ code }) {
        this.$alertify.delay(4000).error(code || this.$t("couldntbesaved"));
      } finally {
        this.is_persisting = false;
      }
    },
    onCertificatePriceChange(certificate_file, event) {
      const raw = event?.target?.value;
      const price_value =
        raw === null || raw === undefined || String(raw).trim() === ""
          ? null
          : Number(String(raw).trim().replace(",", "."));
      this.patchCertificateFile(certificate_file, {
        certificate_price: Number.isFinite(price_value) ? price_value : null,
      });
    },
    closeCertificateRemoveModal() {
      this.certificate_remove_modal_open = false;
      this.certificate_remove_path = "";
      this.certificate_remove_filename = "";
    },
    openCertificateRemoveModal(certificate_file) {
      if (!this.can_edit || !certificate_file?.$path) return;
      this.certificate_remove_path = certificate_file.$path;
      this.certificate_remove_filename =
        this.displayCertificateFilename(certificate_file);
      this.certificate_remove_modal_open = true;
    },
  },
};
</script>

<style lang="scss" scoped>
._header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: calc(var(--spacing) / 2);
}

._title {
  margin: 0;
}

._count {
  background: var(--c-gris_clair);
  border-radius: 999px;
  padding: 0 calc(var(--spacing) / 2);
  font-size: var(--sl-font-size-small);
}

._uploadRow {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: calc(var(--spacing) / 2);
}

._empty {
  margin: calc(var(--spacing) / 2) 0 0;
  color: var(--c-gris_fonce);
}

._list {
  list-style: none;
  margin: calc(var(--spacing) / 2) 0 0;
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

._fieldLabel {
  display: block;
  margin: 0 0 0.2rem 0;
  font-size: var(--sl-font-size-x-small);
  color: var(--c-gris_fonce);
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
