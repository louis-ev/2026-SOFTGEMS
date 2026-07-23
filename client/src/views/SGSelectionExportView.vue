<template>
  <div
    class="_selectionExportView"
    :class="{ 'is--serversidepreview': is_serversidepreview }"
  >
    <div v-if="is_loading" class="_loading">{{ $t("sg_pdf_export_loading") }}</div>
    <div v-else-if="fetch_error" class="_error">{{ fetch_error }}</div>
    <SGSelectionPdfDocument
      v-else-if="selection"
      :selection="selection"
      :gems="entry_gems_list"
      :metadata_keys="metadata_keys"
      :document_title="document_title"
      :date_line="date_line"
      :counterparty_block="counterparty_block"
      :legal_text="legal_text"
      :pricing_total_key="pricing_total_key"
      :order_number_line="order_number_line"
      :supplier_account_line="supplier_account_line"
      :bank_footer_en="bank_footer_en"
    />
  </div>
</template>

<script>
import SGSelectionPdfDocument from "@/components/selections/SGSelectionPdfDocument.vue";
import PublicationReady from "@/mixins/PublicationReady.js";
import FormatDates from "@/mixins/FormatDates.js";
import GemPricing from "@/mixins/GemPricing";
import {
  readSelectionPdfBankFootersEn,
  resolveSelectionPdfBankFooterBody,
} from "@/utils/selection_pdf_instance_settings.js";
import {
  decodeSelectionPdfExportQuery,
  resolveSelectionPdfPricingKey,
} from "@/utils/selection_pdf_columns.js";
import {
  selectionPdfExportColumnKeys,
  selectionPdfExportDefaults,
} from "@/utils/selection_pdf_export_registry.js";
import {
  formatAddressBookContactLabel,
  formatCounterpartyPersonLabel,
  formatPersonDisplayName,
  parseAddressBookPath,
  splitCounterpartyPath,
} from "@/utils/address_book_paths.js";
import { resolveCounterpartyPostalAddressLines } from "@/utils/contact_address.js";
import {
  normalizeSelectionGemPaths,
  sortSelectionGems,
} from "@/utils/selection_entries.js";

export default {
  name: "SGSelectionExportView",
  mixins: [PublicationReady, FormatDates, GemPricing],
  components: {
    SGSelectionPdfDocument,
  },
  props: {
    folder_slug: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      selections_root_path: "selections",
      gems_root_path: "gems",
      is_loading: true,
      fetch_error: "",
      selection: null,
      entry_gems_list: [],
      counterparty_block: null,
      instance_settings: null,
      is_serversidepreview: false,
      images_loaded: false,
    };
  },
  computed: {
    selection_folder_path() {
      const slug = this.cleanString(this.folder_slug);
      return slug ? `${this.selections_root_path}/${slug}` : "";
    },
    export_query() {
      return decodeSelectionPdfExportQuery(this.$route);
    },
    metadata_keys() {
      const keys = this.export_query.metadata_keys;
      if (keys.length > 0) return keys;
      if (!this.selection) return [];
      return selectionPdfExportColumnKeys(this.selection.selection_type);
    },
    pricing_total_key() {
      if (!this.selection) return "";
      return (
        resolveSelectionPdfPricingKey(
          this.selection.selection_type,
          this.metadata_keys
        ) || ""
      );
    },
    document_title() {
      if (!this.selection) return "";
      const defaults = selectionPdfExportDefaults(this.selection.selection_type);
      const number = this.cleanString(this.selection.document_number_name);
      return this.$t(defaults.document_title_key, { number: number || "—" });
    },
    date_line() {
      const raw = this.selection?.selection_date;
      const date_value = raw ? new Date(raw) : new Date();
      const formatted = this.formatDate(date_value, {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
      return `Paris, le ${formatted}`;
    },
    order_number_line() {
      const value = this.cleanString(this.selection?.reference_number);
      return value || "—";
    },
    supplier_account_line() {
      return "—";
    },
    bank_footer_en() {
      const from_query = this.export_query.bank_footer_en;
      if (from_query) return from_query;
      return resolveSelectionPdfBankFooterBody(
        readSelectionPdfBankFootersEn(this.instance_settings),
        { id: this.export_query.bank_footer_id }
      );
    },
    legal_text() {
      if (!this.selection) return "";
      const defaults = selectionPdfExportDefaults(this.selection.selection_type);
      return this.$t(defaults.legal_text_key);
    },
  },
  async mounted() {
    if (this.$route.query?.superadmintoken) {
      this.is_serversidepreview = true;
    }
    await this.loadExportData();
    await this.$nextTick();
    await this.waitForImages();
    this.setPublicationReadyState(true);
    this.is_loading = false;
    if (this.$root) this.$root.is_loading = false;
  },
  beforeDestroy() {
    this.setPublicationReadyState(false);
  },
  methods: {
    cleanString(value) {
      if (value === null || value === undefined) return "";
      return String(value).trim();
    },
    async getFolderPublic(path, { no_files = false } = {}) {
      const superadmintoken = this.$route.query?.superadmintoken;
      const is_root_path = String(path || "").trim() === "";
      if (superadmintoken && !is_root_path) {
        return this.$api.getPublicFolder({ path, superadmintoken });
      }
      return this.$api.getFolder({ path, no_files });
    },
    async loadExportData() {
      if (!this.selection_folder_path) {
        this.fetch_error = this.$t("sg_selection_invalid_path");
        this.is_loading = false;
        return;
      }
      try {
        this.selection = await this.getFolderPublic(this.selection_folder_path);
        await Promise.all([
          this.loadEntryGems(),
          this.resolveCounterpartyBlock(),
          this.loadInstanceSettings(),
        ]);
      } catch ({ code }) {
        this.fetch_error = code || this.$t("sg_pdf_export_load_error");
      }
    },
    async loadInstanceSettings() {
      try {
        this.instance_settings = await this.getFolderPublic("", {
          no_files: true,
        });
      } catch {
        this.instance_settings = null;
      }
    },
    async loadEntryGems() {
      const gem_paths = normalizeSelectionGemPaths(
        this.selection?.selection_entries
      );
      if (!gem_paths.length) {
        this.entry_gems_list = [];
        return;
      }
      const loaded = await Promise.all(
        gem_paths.map(async (gem_path) => {
          try {
            const gem = await this.getFolderPublic(gem_path);
            this.ensureGemPricingFields(gem);
            return gem;
          } catch {
            return { $path: gem_path };
          }
        })
      );
      this.entry_gems_list = sortSelectionGems(loaded);
    },
    ensureGemPricingFields(gem) {
      if (!gem || typeof gem !== "object") return;
      this.getPriceFieldPairs().forEach(
        ({ total_key, virtual_per_carat_key }) => {
          this.$set(
            gem,
            virtual_per_carat_key,
            this.computeDisplayedPerCaratForGem(gem, total_key)
          );
        }
      );
    },
    async resolveCounterpartyBlock() {
      const path = this.cleanString(this.selection?.counterparty_path);
      if (!path) {
        this.counterparty_block = null;
        return;
      }
      const { contact_path, person_path } = splitCounterpartyPath(path);
      let contact_name = "";
      let contact_folder = null;
      if (contact_path) {
        try {
          contact_folder = await this.getFolderPublic(contact_path);
          contact_name = formatAddressBookContactLabel(contact_folder);
        } catch {
          contact_name = contact_path.split("/").pop() || contact_path;
        }
      }
      let person_name = "";
      let person_folder = null;
      if (person_path) {
        try {
          person_folder = await this.getFolderPublic(person_path);
          person_name = formatPersonDisplayName(person_folder);
        } catch {
          person_name = person_path.split("/").pop() || person_path;
        }
      }
      const parsed = parseAddressBookPath(path);
      const name =
        parsed?.kind === "person"
          ? formatCounterpartyPersonLabel(contact_name, person_name)
          : contact_name || path;
      const address_lines = resolveCounterpartyPostalAddressLines({
        contact: contact_folder,
        person: person_folder,
      });
      this.counterparty_block = {
        name,
        address: address_lines.join("\n"),
        address_lines,
      };
    },
    waitForImages() {
      return new Promise((resolve) => {
        const images = this.$el.querySelectorAll("img");
        if (!images.length) {
          resolve();
          return;
        }
        let pending = images.length;
        const done = () => {
          pending -= 1;
          if (pending <= 0) resolve();
        };
        images.forEach((img) => {
          if (img.complete) done();
          else {
            img.addEventListener("load", done, { once: true });
            img.addEventListener("error", done, { once: true });
          }
        });
        setTimeout(resolve, 5000);
      });
    },
  },
};
</script>

<style lang="scss" scoped>
._selectionExportView {
  min-height: 100vh;
  background: #fff;
}

._selectionExportView.is--serversidepreview {
  background: #fff;
}

._loading,
._error {
  padding: 2rem;
  text-align: center;
}
</style>
