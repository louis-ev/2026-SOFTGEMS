<template>
  <article class="_pdfDocument">
    <header class="_header">
      <div class="_logoRow" aria-hidden="true">
        <span class="_logoText">ACF</span>
      </div>

      <div class="_headerInfo">
        <div class="_headerLeft">
          <h1 class="_docTitle">{{ document_title }}</h1>
          <p class="_dateLine">{{ date_line }}</p>
          <p class="_orderLine">
            <span class="_refLabel">{{ $t("sg_pdf_order_number") }}</span>
            {{ order_number_line || "—" }}
          </p>
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
          <th :class="columnClass('__no__')">{{ $t("sg_pdf_col_no") }}</th>
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
                v-if="descriptionInlineLinks(gem).length"
                class="_descriptionLine _descriptionLinksLine"
              >
                <template
                  v-for="(link, link_index) in descriptionInlineLinks(gem)"
                >
                  <a
                    v-if="link.href"
                    :key="'description-link-' + link_index"
                    class="_descriptionLink"
                    :href="link.href"
                    target="_blank"
                    rel="noopener noreferrer"
                  >{{ link.text }}</a><span
                    v-else
                    :key="'description-text-' + link_index"
                  >{{ link.text }}</span><span
                    v-if="link_index < descriptionInlineLinks(gem).length - 1"
                    :key="'description-sep-' + link_index"
                    aria-hidden="true"
                  >  </span>
                </template>
              </div>
            </div>
            <a
              v-else-if="
                metadata_key === photo_column_key &&
                coverUrl(gem) &&
                coverLinkUrl(gem)
              "
              class="_coverLink"
              :href="coverLinkUrl(gem)"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                class="_coverImg"
                :src="coverUrl(gem)"
                alt=""
              />
            </a>
            <img
              v-else-if="metadata_key === photo_column_key && coverUrl(gem)"
              class="_coverImg"
              :src="coverUrl(gem)"
              alt=""
            />
            <span v-else class="_cellText">{{
              formatCell(gem, metadata_key)
            }}</span>
          </td>
        </tr>
        <tr v-if="has_pricing" class="_totalRow">
          <td :class="columnClass('__no__')" />
          <td
            v-for="metadata_key in metadata_keys"
            :key="`total-${metadata_key}`"
            :class="columnClass(metadata_key)"
          >
            <span
              v-if="metadata_key === description_column_key"
              class="_totalLabel"
            >
              {{ $t("sg_pdf_total") }}
            </span>
            <span v-else-if="metadata_key === photo_column_key" />
            <span v-else-if="metadata_key === 'id'" />
            <span v-else class="_cellText">{{
              formatTotalCell(metadata_key)
            }}</span>
          </td>
        </tr>
        <tr v-if="has_pricing" class="_vatRow">
          <td :class="columnClass('__no__')" />
          <td
            v-for="metadata_key in metadata_keys"
            :key="`vat-${metadata_key}`"
            :class="columnClass(metadata_key)"
          >
            <span
              v-if="metadata_key === description_column_key"
              class="_totalLabel"
            >
              {{ $t("sg_pdf_vat") }}
            </span>
            <span v-else-if="metadata_key === photo_column_key" />
            <span v-else-if="metadata_key === 'id'" />
            <span
              v-else-if="metadata_key === pricing_total_key"
              class="_cellText"
            >{{ formatted_vat_amount }}</span>
            <span
              v-else-if="metadata_key === per_carat_column_key"
              class="_cellText"
            >20%</span>
          </td>
        </tr>
        <tr v-if="has_pricing" class="_grandTotalRow">
          <td :class="columnClass('__no__')" />
          <td
            v-for="metadata_key in metadata_keys"
            :key="`grand-${metadata_key}`"
            :class="columnClass(metadata_key)"
          >
            <span
              v-if="metadata_key === description_column_key"
              class="_totalLabel"
            >
              {{ $t("sg_pdf_grand_total") }}
            </span>
            <span v-else-if="metadata_key === photo_column_key" />
            <span v-else-if="metadata_key === 'id'" />
            <span
              v-else-if="metadata_key === pricing_total_key"
              class="_cellText"
            >{{ formatted_grand_total }}</span>
          </td>
        </tr>
      </tbody>
    </table>

    <p v-if="has_pricing && payment_line" class="_paymentLine">
      {{ payment_line }}
    </p>

    <div v-if="bank_footer_en" class="_bankBlock">{{ bank_footer_en }}</div>

    <p class="_legal">{{ legal_text }}</p>

    <footer class="_footer">
      <p v-for="(line, index) in footer_lines" :key="index">{{ line }}</p>
    </footer>
  </article>
</template>

<script>
import GemPricing from "@/mixins/GemPricing";
import {
  SELECTION_PDF_ACF_FOOTER_LINES,
  selection_pdf_vat_rate,
} from "@/utils/selection_pdf_export_registry.js";
import {
  selection_pdf_description_column_key,
  selection_pdf_per_carat_column_key,
  selection_pdf_photo_column_key,
  selectionPdfColumnHeaderLabel,
  selectionPdfColumnTextAlign,
  selectionPdfTableColPercents,
} from "@/utils/selection_pdf_columns.js";
import { resolveAppPublicOrigin } from "@/utils/app_public_url.js";
import { buildGemPdfDescriptionBlocks } from "@/utils/selection_pdf_description.js";
import {
  formatPdfCurrencyAmount,
  formatPdfCurrencyTotal,
  formatPdfNumber,
  formatPdfPerCarat,
  gemIdFromPath,
  resolveGemCoverThumbRelative,
  resolveGemCoverAbsoluteUrl,
  sumGemNumericField,
  sumGemPricingTotals,
  toAbsoluteAppUrl,
} from "@/utils/selection_pdf_gem_helpers.js";

export default {
  name: "SGSelectionPdfDocument",
  mixins: [GemPricing],
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
    document_title: {
      type: String,
      default: "",
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
    pricing_total_key: {
      type: String,
      default: "",
    },
    order_number_line: {
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
    footer_lines() {
      return SELECTION_PDF_ACF_FOOTER_LINES;
    },
    currency() {
      return String(this.selection?.currency || "USD").trim() || "USD";
    },
    has_pricing() {
      return Boolean(this.pricing_total_key);
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
    vat_amount() {
      if (!Number.isFinite(this.pricing_sum)) return null;
      return this.pricing_sum * selection_pdf_vat_rate;
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
    payment_line() {
      if (!Number.isFinite(this.grand_total_amount)) return "";
      const amount = formatPdfCurrencyAmount(
        this.grand_total_amount,
        this.currency
      );
      return this.$t("sg_pdf_payment_line", { amount });
    },
    media_origin() {
      if (typeof window === "undefined") return "";
      return resolveAppPublicOrigin();
    },
  },
  methods: {
    columnLabel(metadata_key) {
      return selectionPdfColumnHeaderLabel(metadata_key, this.currency);
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
      const href = resolveGemCoverAbsoluteUrl(gem, this.media_origin);
      if (!href || !/^https?:\/\//i.test(href)) return "";
      return href;
    },
    descriptionBlocks(gem) {
      return buildGemPdfDescriptionBlocks(gem, this.media_origin, {
        provider_labels_by_path: this.certificate_provider_labels,
      });
    },
    descriptionTextBlocks(gem) {
      return this.descriptionBlocks(gem).filter((block) => block.type === "text");
    },
    descriptionInlineLinks(gem) {
      return this.descriptionBlocks(gem).filter((block) => block.type === "link");
    },
    formatWeight(value) {
      const formatted = formatPdfNumber(value, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      if (formatted === "—") return formatted;
      return `${formatted} ct`;
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
        return `${formatted}/ct`;
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
        return "—";
      }
      if (metadata_key === this.pricing_total_key) {
        return this.formatted_subtotal;
      }
      return "—";
    },
  },
};
</script>

<style lang="scss" scoped>
._pdfDocument {
  box-sizing: border-box;
  width: 210mm;
  min-height: 297mm;
  margin: 0 auto;
  padding: 12mm 10mm 14mm;
  font-family: Arial, Helvetica, sans-serif;
  font-size: 9pt;
  line-height: 1.35;
  color: #111;
  background: #fff;
}

._header {
  margin-bottom: 8mm;
}

._logoRow {
  display: flex;
  justify-content: center;
  margin-bottom: 6mm;
}

._logoText {
  font-family: "Times New Roman", Times, serif;
  font-size: 28pt;
  font-weight: 400;
  letter-spacing: 0.12em;
  color: #111;
}

._headerInfo {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8mm;
}

._docTitle {
  margin: 0 0 2mm;
  font-size: 13pt;
  font-weight: 700;
}

._dateLine {
  margin: 0 0 2mm;
  font-size: 10pt;
}

._orderLine {
  margin: 0;
  font-size: 9pt;
}

._headerRight {
  text-align: right;
  max-width: 48%;
}

._counterpartyName {
  margin: 0 0 1mm;
  font-weight: 700;
  text-transform: uppercase;
}

._counterpartyAddressLine {
  margin: 0;
  line-height: 1.35;
}

._counterpartyAddressLine + ._counterpartyAddressLine {
  margin-top: 0.5mm;
}

._refLabel {
  font-weight: 700;
}

._gemsTable {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  margin-bottom: 4mm;
}

._gemsTable th,
._gemsTable td {
  padding: 1.5mm 0.8mm;
  vertical-align: top;
  word-break: break-word;
}

._gemsTable th {
  font-size: 8pt;
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

._coverLink {
  display: block;
  line-height: 0;
}

._coverImg {
  display: block;
  width: 14mm;
  height: 14mm;
  object-fit: cover;
  margin: 0 auto;
}

._descriptionCell {
  display: flex;
  flex-direction: column;
  gap: 0.8mm;
}

._descriptionLine {
  display: block;
  font-size: 8pt;
  line-height: 1.3;
}

._descriptionLink {
  color: #111;
  text-decoration: underline;
}

._descriptionLinksLine {
  white-space: pre-wrap;
  word-break: break-word;
}

._cellText {
  display: block;
  font-size: 8pt;
}

._totalRow td,
._vatRow td,
._grandTotalRow td {
  font-weight: 700;
  font-size: 9pt;
}

._totalLabel {
  text-align: left;
}

._paymentLine {
  margin: 0 0 3mm;
  font-size: 8.5pt;
  line-height: 1.4;
}

._bankBlock {
  margin: 0 0 4mm;
  font-size: 8pt;
  line-height: 1.45;
  white-space: pre-line;
}

._legal {
  margin: 0 0 5mm;
  font-size: 7pt;
  line-height: 1.45;
  text-align: justify;
}

._footer {
  margin-top: auto;
  padding-top: 3mm;
  border-top: 1px solid #ccc;
  font-size: 6.5pt;
  line-height: 1.4;
  color: #333;

  p {
    margin: 0 0 0.5mm;
  }
}
</style>
