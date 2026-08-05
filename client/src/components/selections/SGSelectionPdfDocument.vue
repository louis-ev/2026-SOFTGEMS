<template>
  <article class="_pdfDocument">
    <header class="_header">
      <div class="_logoRow">
        <AcfLogoMark class="_logoMark" />
      </div>

      <div class="_headerInfo">
        <div class="_headerLeft">
          <h1 class="_docTitle">
            {{ document_title_prefix }}<strong>{{ document_number }}</strong>
          </h1>
          <p class="_dateLine">{{ date_line }}</p>
        </div>
        <div v-if="counterparty_block" class="_headerRight">
          <p class="_counterpartyName">{{ counterparty_block.name }}</p>
          <p
            v-for="(line, line_index) in counterparty_address_lines"
            :key="'counterparty-address-' + line_index"
            class="_counterpartyAddressLine"
          >
            {{ line }}
          </p>
        </div>
      </div>

      <div
        v-if="show_order_number_line || show_supplier_account_line"
        class="_referenceLines"
      >
        <p v-if="show_order_number_line" class="_orderLine">
          <span class="_refLabel">{{ pdfT("order_number") }}</span>
          {{ order_number_display }}
        </p>
        <p v-if="show_supplier_account_line" class="_supplierLine">
          <span class="_refLabel">{{ pdfT("supplier_account_number") }}</span>
          {{ supplier_account_display }}
        </p>
      </div>
    </header>

    <table class="_gemsTable">
      <colgroup>
        <col
          v-for="col in table_col_widths"
          :key="col.key"
          :style="{ width: `${col.percent}%` }"
        />
      </colgroup>
      <thead>
        <tr>
          <th :class="columnClass('__no__')">{{ pdfT("col_no") }}</th>
          <th
            v-for="metadata_key in metadata_keys"
            :key="metadata_key"
            :class="columnClass(metadata_key)"
          >
            {{ columnLabel(metadata_key) }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(gem, index) in gems" :key="gem.$path || index">
          <td :class="columnClass('__no__')">{{ index + 1 }}</td>
          <td
            v-for="metadata_key in metadata_keys"
            :key="`${gem.$path}-${metadata_key}`"
            :class="columnClass(metadata_key)"
          >
            <div
              v-if="metadata_key === description_column_key"
              class="_descriptionCell"
            >
              <div
                v-for="(block, block_index) in descriptionTextBlocks(gem)"
                :key="'description-' + block_index"
                class="_descriptionLine"
              >
                {{ block.text }}
              </div>
              <div
                v-for="(link, link_index) in descriptionCertificateLinks(gem)"
                :key="'description-cert-' + link_index"
                class="_descriptionLine"
              >
                <a
                  v-if="link.href"
                  class="_descriptionLink"
                  :href="link.href"
                  target="_blank"
                  rel="noopener noreferrer"
                  >{{ link.text }}</a
                >
                <span v-else class="_descriptionLinkText">{{ link.text }}</span>
              </div>
            </div>
            <div
              v-else-if="metadata_key === photo_column_key"
              class="_photoCell"
            >
              <a
                v-if="coverUrl(gem) && coverLinkUrl(gem)"
                class="_coverLink"
                :href="coverLinkUrl(gem)"
                target="_blank"
                rel="noopener noreferrer"
              >
                <img class="_coverImg" :src="coverUrl(gem)" alt="" />
              </a>
              <img
                v-else-if="coverUrl(gem)"
                class="_coverImg"
                :src="coverUrl(gem)"
                alt=""
              />
              <div v-if="photoMediaLinks(gem).length" class="_photoMediaLinks">
                <template v-for="(link, link_index) in photoMediaLinks(gem)">
                  <a
                    v-if="link.href"
                    :key="'photo-media-' + link_index"
                    class="_descriptionLink"
                    :href="link.href"
                    target="_blank"
                    rel="noopener noreferrer"
                    >{{ link.text }}</a
                  >
                  <span
                    v-else
                    :key="'photo-media-text-' + link_index"
                    class="_descriptionLinkText"
                    >{{ link.text }}</span
                  >
                </template>
              </div>
            </div>
            <span v-else class="_cellText">{{
              formatCell(gem, metadata_key)
            }}</span>
          </td>
        </tr>
        <tr v-if="has_pricing" class="_totalRow">
          <td :colspan="total_label_colspan" class="_alignLeft">
            <span class="_totalLabel">{{ pdfT("total") }}</span>
          </td>
          <td
            v-for="metadata_key in total_row_trailing_keys"
            :key="`total-${metadata_key}`"
            :class="columnClass(metadata_key)"
          >
            <span v-if="metadata_key === photo_column_key" />
            <span v-else class="_cellText">{{
              formatTotalCell(metadata_key)
            }}</span>
          </td>
        </tr>
      </tbody>
    </table>

    <table v-if="has_pricing && show_vat" class="_vatBox">
      <tbody>
        <tr>
          <td class="_alignLeft">{{ pdfT("vat") }}</td>
          <td class="_alignCenter">{{ formatted_vat_percent }}</td>
          <td class="_alignRight">{{ formatted_vat_amount }}</td>
        </tr>
        <tr class="_grandTotalRow">
          <td class="_alignLeft">{{ pdfT("grand_total") }}</td>
          <td />
          <td class="_alignRight">{{ formatted_grand_total }}</td>
        </tr>
      </tbody>
    </table>

    <p
      v-if="has_pricing && show_payment_line && payment_line"
      class="_paymentLine"
    >
      {{ payment_line }}
    </p>

    <section v-if="has_notes" class="_notesBlock">
      <div class="_notesBody" v-html="notes_html" />
    </section>

    <p v-if="has_pricing && bank_footer_en" class="_bankIntro">
      {{ pdfT("bank_intro") }}
    </p>
    <div v-if="bank_footer_en" class="_bankBlock">{{ bank_footer_en }}</div>

    <p v-if="show_legal_text" class="_legal">{{ legal_text }}</p>

    <footer class="_footer">
      <p v-for="(line, index) in footer_lines" :key="index">{{ line }}</p>
    </footer>
  </article>
</template>

<script>
import AcfLogoMark from "@/components/selections/AcfLogoMark.vue";
import GemPricing from "@/mixins/GemPricing";
import {
  normalizeSelectionPdfVatPercent,
  selection_pdf_default_vat_percent,
  selectionPdfVatRateFromPercent,
} from "@/utils/selection_pdf_export_registry.js";
import {
  selection_pdf_description_column_key,
  selection_pdf_per_carat_column_key,
  selection_pdf_photo_column_key,
  selectionPdfColumnHeaderLabel,
  selectionPdfColumnTextAlign,
  selectionPdfTableColPercents,
} from "@/utils/selection_pdf_columns.js";
import { numberToWordsEnCapitalized } from "@/utils/number_to_words_en.js";
import { numberToWordsFrCapitalized } from "@/utils/number_to_words_fr.js";
import { resolveAppPublicOrigin } from "@/utils/app_public_url.js";
import {
  buildGemPdfDescriptionBlocks,
  buildGemPdfMediaLinkBlocks,
} from "@/utils/selection_pdf_description.js";
import {
  normalizeSelectionPdfLang,
  selectionPdfFooterLines,
  selectionPdfT,
} from "@/utils/selection_pdf_strings.js";
import { isEmptyRichText } from "@/utils/rich_text.js";
import {
  formatPdfCurrencyTotal,
  formatPdfNumber,
  formatPdfPerCarat,
  gemIdFromPath,
  resolveGemCoverThumbRelative,
  makeGemCoverViewerAbsoluteUrl,
  sumGemNumericField,
  sumGemPricingTotals,
  toAbsoluteAppUrl,
} from "@/utils/selection_pdf_gem_helpers.js";

export default {
  name: "SGSelectionPdfDocument",
  mixins: [GemPricing],
  components: {
    AcfLogoMark,
  },
  props: {
    selection: {
      type: Object,
      required: true,
    },
    gems: {
      type: Array,
      default: () => [],
    },
    metadata_keys: {
      type: Array,
      default: () => [],
    },
    document_title_prefix: {
      type: String,
      default: "",
    },
    document_number: {
      type: String,
      default: "—",
    },
    date_line: {
      type: String,
      default: "",
    },
    counterparty_block: {
      type: Object,
      default: null,
    },
    legal_text: {
      type: String,
      default: "",
    },
    always_show_legal: {
      type: Boolean,
      default: false,
    },
    pricing_total_key: {
      type: String,
      default: "",
    },
    order_number_line: {
      type: String,
      default: "",
    },
    supplier_account_line: {
      type: String,
      default: "",
    },
    bank_footer_en: {
      type: String,
      default: "",
    },
    certificate_provider_labels: {
      type: Object,
      default: () => ({}),
    },
    export_lang: {
      type: String,
      default: "en",
    },
    show_vat: {
      type: Boolean,
      default: false,
    },
    vat_percent: {
      type: Number,
      default: selection_pdf_default_vat_percent,
    },
    show_payment_line: {
      type: Boolean,
      default: true,
    },
  },
  data() {
    return {
      description_column_key: selection_pdf_description_column_key,
      photo_column_key: selection_pdf_photo_column_key,
      per_carat_column_key: selection_pdf_per_carat_column_key,
    };
  },
  computed: {
    table_col_widths() {
      return selectionPdfTableColPercents(this.metadata_keys);
    },
    total_label_colspan() {
      const keys = Array.isArray(this.metadata_keys) ? this.metadata_keys : [];
      return 1 + Math.min(2, keys.length);
    },
    total_row_trailing_keys() {
      const keys = Array.isArray(this.metadata_keys) ? this.metadata_keys : [];
      return keys.slice(Math.min(2, keys.length));
    },
    counterparty_address_lines() {
      const block = this.counterparty_block;
      if (!block) return [];
      if (Array.isArray(block.address_lines) && block.address_lines.length) {
        return block.address_lines
          .map((line) => String(line || "").trim())
          .filter(Boolean);
      }
      const raw_address =
        typeof block.address === "string" ? block.address.trim() : "";
      if (!raw_address) return [];
      return raw_address
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);
    },
    resolved_export_lang() {
      return normalizeSelectionPdfLang(this.export_lang);
    },
    order_number_display() {
      return this.cleanReferenceLine(this.order_number_line);
    },
    supplier_account_display() {
      return this.cleanReferenceLine(this.supplier_account_line);
    },
    show_order_number_line() {
      return Boolean(this.order_number_display);
    },
    show_supplier_account_line() {
      return Boolean(this.supplier_account_display);
    },
    footer_lines() {
      return selectionPdfFooterLines(this.resolved_export_lang);
    },
    currency() {
      return String(this.selection?.currency || "USD").trim() || "USD";
    },
    has_pricing() {
      return Boolean(this.pricing_total_key);
    },
    show_legal_text() {
      if (!this.legal_text) return false;
      if (this.always_show_legal) return true;
      return !this.has_pricing;
    },
    pricing_sum() {
      return sumGemPricingTotals(this.gems, this.pricing_total_key);
    },
    qty_sum() {
      return sumGemNumericField(this.gems, "number_of_pieces");
    },
    weight_sum() {
      return sumGemNumericField(this.gems, "weight_ct");
    },
    formatted_subtotal() {
      return formatPdfCurrencyTotal(this.pricing_sum, this.currency);
    },
    resolved_vat_percent() {
      return normalizeSelectionPdfVatPercent(this.vat_percent);
    },
    formatted_vat_percent() {
      const percent = this.resolved_vat_percent;
      const text =
        Number.isInteger(percent) || Math.abs(percent % 1) < 1e-9
          ? String(Math.round(percent))
          : String(percent);
      return `${text}%`;
    },
    vat_amount() {
      if (!Number.isFinite(this.pricing_sum)) return null;
      return (
        this.pricing_sum *
        selectionPdfVatRateFromPercent(this.resolved_vat_percent)
      );
    },
    formatted_vat_amount() {
      return formatPdfCurrencyTotal(this.vat_amount, this.currency);
    },
    grand_total_amount() {
      if (!Number.isFinite(this.pricing_sum)) return null;
      return this.pricing_sum + (this.vat_amount || 0);
    },
    formatted_grand_total() {
      return formatPdfCurrencyTotal(this.grand_total_amount, this.currency);
    },
    payment_amount() {
      if (this.show_vat) return this.grand_total_amount;
      return this.pricing_sum;
    },
    payment_line() {
      if (!Number.isFinite(this.payment_amount)) return "";
      const amount = formatPdfNumber(this.payment_amount, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      });
      const amount_words =
        this.resolved_export_lang === "fr"
          ? numberToWordsFrCapitalized(this.payment_amount)
          : numberToWordsEnCapitalized(this.payment_amount);
      return this.pdfT("payment_line", { amount, amount_words });
    },
    media_origin() {
      if (typeof window === "undefined") return "";
      return resolveAppPublicOrigin();
    },
    notes_html() {
      return typeof this.selection?.notes === "string"
        ? this.selection.notes
        : "";
    },
    has_notes() {
      return !isEmptyRichText(this.notes_html);
    },
  },
  methods: {
    pdfT(key, params = {}) {
      return selectionPdfT(this.resolved_export_lang, key, params);
    },
    cleanReferenceLine(value) {
      const trimmed = String(value || "").trim();
      if (!trimmed || trimmed === "—" || trimmed === "-") return "";
      return trimmed;
    },
    columnLabel(metadata_key) {
      return selectionPdfColumnHeaderLabel(
        metadata_key,
        this.resolved_export_lang
      );
    },
    columnClass(metadata_key) {
      const align = selectionPdfColumnTextAlign(metadata_key);
      if (align === "center") return "_alignCenter";
      if (align === "right") return "_alignRight";
      return "_alignLeft";
    },
    coverUrl(gem) {
      const relative = resolveGemCoverThumbRelative(gem);
      if (!relative) return "";
      return toAbsoluteAppUrl(relative, this.media_origin);
    },
    coverLinkUrl(gem) {
      const href = makeGemCoverViewerAbsoluteUrl(gem, this.media_origin);
      if (!href || !/^https?:\/\//i.test(href)) return "";
      return href;
    },
    descriptionBlocks(gem) {
      return buildGemPdfDescriptionBlocks(gem, this.media_origin, {
        provider_labels_by_path: this.certificate_provider_labels,
        lang: this.resolved_export_lang,
      });
    },
    descriptionTextBlocks(gem) {
      return this.descriptionBlocks(gem).filter(
        (block) => block.type === "text"
      );
    },
    descriptionCertificateLinks(gem) {
      return this.descriptionBlocks(gem).filter(
        (block) => block.type === "link" && block.is_certificate_link
      );
    },
    photoMediaLinks(gem) {
      return buildGemPdfMediaLinkBlocks(gem, this.media_origin, {
        lang: this.resolved_export_lang,
      });
    },
    formatWeight(value) {
      return formatPdfNumber(value, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    },
    formatCell(gem, metadata_key) {
      if (metadata_key === "id") return gemIdFromPath(gem);
      if (metadata_key === selection_pdf_photo_column_key) return "";
      if (metadata_key === selection_pdf_description_column_key) return "";

      if (metadata_key === selection_pdf_per_carat_column_key) {
        if (!this.pricing_total_key) return "—";
        const per = this.computeDisplayedPerCaratForGem(
          gem,
          this.pricing_total_key
        );
        const formatted = formatPdfPerCarat(per);
        if (formatted === "—") return formatted;
        return formatted;
      }

      if (this.isGemPricingTotalColumnKey(metadata_key)) {
        const raw_total = gem?.[metadata_key];
        const n = Number(raw_total);
        if (!Number.isFinite(n)) return "—";
        return formatPdfCurrencyTotal(n, this.currency);
      }

      if (metadata_key === "weight_ct") {
        return this.formatWeight(gem?.weight_ct);
      }

      if (metadata_key === "number_of_pieces") {
        return formatPdfNumber(gem?.number_of_pieces, {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        });
      }

      const raw_value = gem?.[metadata_key];
      if (raw_value === null || raw_value === undefined || raw_value === "") {
        return "—";
      }
      if (typeof raw_value === "object") return "";
      return String(raw_value);
    },
    formatTotalCell(metadata_key) {
      if (metadata_key === "number_of_pieces") {
        return formatPdfNumber(this.qty_sum, {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        });
      }
      if (metadata_key === "weight_ct") {
        return this.formatWeight(this.weight_sum);
      }
      if (metadata_key === selection_pdf_per_carat_column_key) {
        return "";
      }
      if (metadata_key === this.pricing_total_key) {
        return this.formatted_subtotal;
      }
      return "";
    },
  },
};
</script>

<style lang="scss" scoped>
$acf-brand-primary: #1c2b3a;
$acf-brand-light: #7b95a6;
/* Link blue: clearer than brand light, still navy-adjacent. */
$acf-pdf-link: #3a6fa0;
/* Table chrome from ACF INV N°20265: black hairlines, white cells. */
$acf-pdf-table-line: #000;

/*
  Metrics measured on the reference "ACF INV N°20265.pdf" (A4):
  side margins 17.8mm, single 8pt body size, ~1.4 line-height,
  logo ~27mm wide centered, first text line at 34mm from the top.
  Table: horizontal rules + outer left/right only (no column grid);
  VAT/Total is a separate right-aligned boxed grid.
*/

._pdfDocument {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  width: 210mm;
  min-height: 297mm;
  margin: 0 auto;
  padding: 14mm 17.8mm 14mm;
  font-family: "Inter", Arial, Helvetica, sans-serif;
  font-weight: 400;
  font-size: 8pt;
  line-height: 1.4;
  color: $acf-brand-primary;
  background: #fff;
}

._header {
  margin-bottom: 0;
}

._logoRow {
  display: flex;
  justify-content: center;
  margin-bottom: 12mm;
}

._logoMark {
  width: 27mm;
}

._headerInfo {
  display: flex;
  align-items: flex-start;
  margin-bottom: 7.5mm;
}

._headerLeft {
  /* Counterparty block starts at ~72% of the content width in the reference. */
  flex: 0 0 71.8%;
}

._docTitle {
  margin: 0;
  font-family: "Inter", Arial, Helvetica, sans-serif;
  font-size: 8pt;
  font-weight: 400;
  line-height: 1.4;

  strong {
    font-weight: 700;
  }
}

._dateLine {
  margin: 0;
  font-size: 8pt;
  font-weight: 400;
}

._referenceLines {
  p {
    margin: 0;
    font-size: 8pt;
    font-weight: 400;
  }
}

._orderLine,
._supplierLine {
  margin: 0;
}

._headerRight {
  flex: 1;
  text-align: left;
}

._counterpartyName {
  margin: 0;
  font-weight: 700;
  text-transform: uppercase;
}

._counterpartyAddressLine {
  margin: 0;
  line-height: 1.4;
  font-weight: 400;
}

._refLabel {
  font-weight: 400;
}

._gemsTable {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  margin-bottom: 0.25cm;
  border-left: 0.5pt solid $acf-pdf-table-line;
  border-right: 0.5pt solid $acf-pdf-table-line;
  background: #fff;
}

._gemsTable th,
._gemsTable td {
  border: none;
  border-bottom: 0.5pt solid $acf-pdf-table-line;
  padding: 1.2mm 1.4mm;
  vertical-align: top;
  word-break: break-word;
  background: #fff;
  color: #000;
}

._gemsTable thead th {
  border-top: 0.5pt solid $acf-pdf-table-line;
  font-family: "Inter", Arial, sans-serif;
  font-size: 8pt;
  font-weight: 700;
  background: #fff;
  color: #000;
}

._gemsTable tbody td {
  font-size: 8pt;
  font-weight: 400;
}

._vatBox {
  width: 35%;
  margin: 0 0 4mm auto;
  border-collapse: collapse;
  table-layout: fixed;
  background: #fff;
}

._vatBox td {
  border: 0.5pt solid $acf-pdf-table-line;
  padding: 1mm 1.4mm;
  vertical-align: middle;
  background: #fff;
  color: #000;
  font-size: 8pt;
  font-weight: 400;
}

._vatBox ._grandTotalRow td {
  font-weight: 700;
}

._alignLeft {
  text-align: left;
}

._alignCenter {
  text-align: center;
}

._alignRight {
  text-align: right;
}

._photoCell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.8mm;
}

._coverLink {
  display: block;
  line-height: 0;
}

._coverImg {
  display: block;
  width: 17mm;
  height: 17mm;
  object-fit: cover;
  margin: 0 auto;
}

._photoMediaLinks {
  width: 100%;
  text-align: center;
  white-space: normal;
  word-break: break-word;
  font-size: 6.5pt;
  line-height: 1.25;

  > * + * {
    margin-left: 0.35em;
  }
}

._descriptionCell {
  display: flex;
  flex-direction: column;
}

._descriptionLine {
  display: block;
  font-size: 8pt;
  line-height: 1.4;
  font-weight: 400;
}

._descriptionLink {
  color: $acf-pdf-link;
  text-decoration: underline;
}

._cellText {
  display: block;
  font-size: 8pt;
  font-weight: 400;
}

._totalRow td {
  font-weight: 700;
  font-size: 8pt;
}

._totalLabel {
  font-weight: 700;
}

._paymentLine {
  margin: 0 0 4mm;
  font-size: 8pt;
  line-height: 1.4;
  font-weight: 400;
}

._notesBlock {
  margin: 4mm 0 5mm;
  font-size: 8pt;
  line-height: 1.4;
  font-weight: 400;
  color: $acf-brand-primary;
}

._notesBody {
  font-size: 8pt;
  line-height: 1.4;
  font-weight: 400;

  :deep(p) {
    margin: 0 0 1.5mm;
  }

  :deep(p:last-child) {
    margin-bottom: 0;
  }

  :deep(strong),
  :deep(b) {
    font-weight: 700;
  }

  :deep(em),
  :deep(i) {
    font-style: italic;
  }

  :deep(a) {
    color: $acf-pdf-link;
    text-decoration: underline;
  }
}

._bankIntro {
  margin: 0;
  font-size: 8pt;
  font-weight: 700;
}

._bankBlock {
  margin: 0 0 5mm;
  font-size: 8pt;
  line-height: 1.4;
  white-space: pre-line;
  font-weight: 400;
}

._legal {
  margin: 0 0 5mm;
  font-size: 7pt;
  line-height: 1.45;
  text-align: justify;
  font-weight: 300;
  color: $acf-brand-primary;
}

._footer {
  margin-top: auto;
  padding-top: 2mm;
  font-family: "Inter", Arial, sans-serif;
  font-size: 7.3pt;
  line-height: 1.4;
  font-weight: 400;
  text-align: center;
  color: $acf-brand-primary;

  p {
    margin: 0;
  }
}

/*
  In print, per-page top/bottom margins and the repeated company footer
  come from the export pipeline (Puppeteer/Electron print options set in
  core2/api2.js: 14mm top, 22mm bottom, footerTemplate on every page).
*/
@media print {
  /* Block layout fragments across pages reliably (flex does not). */
  ._pdfDocument {
    display: block;
    min-height: 0;
    /* Vertical breathing room comes from the print-engine page margins. */
    padding-top: 0;
    padding-bottom: 0;
  }

  ._gemsTable thead {
    display: table-header-group;
  }

  ._gemsTable tr {
    break-inside: avoid;
    page-break-inside: avoid;
  }

  /* Rendered by the print engine's footer template instead. */
  ._footer {
    display: none;
  }
}
</style>
