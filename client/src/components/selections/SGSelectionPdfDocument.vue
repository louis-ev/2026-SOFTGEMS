<template>
  <article class="_pdfDocument">
    <header class="_header">
      <div class="_headerLeft">
        <h1 class="_docTitle">{{ document_title }}</h1>
        <p class="_dateLine">{{ date_line }}</p>
      </div>
      <div v-if="counterparty_block" class="_headerRight">
        <p class="_counterpartyName">{{ counterparty_block.name }}</p>
        <p v-if="counterparty_block.address" class="_counterpartyAddress">
          {{ counterparty_block.address }}
        </p>
      </div>
    </header>

    <table class="_gemsTable">
      <thead>
        <tr>
          <th class="_colNo">{{ $t("sg_pdf_col_no") }}</th>
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
          <td class="_colNo">{{ index + 1 }}</td>
          <td
            v-for="metadata_key in metadata_keys"
            :key="`${gem.$path}-${metadata_key}`"
            :class="columnClass(metadata_key)"
          >
            <img
              v-if="metadata_key === '$cover' && coverUrl(gem)"
              class="_coverImg"
              :src="coverUrl(gem)"
              alt=""
            />
            <span v-else class="_cellText">{{
              formatCell(gem, metadata_key)
            }}</span>
          </td>
        </tr>
        <tr
          v-if="pricing_total_key && pricing_total_column_index >= 0"
          class="_totalRow"
        >
          <td :colspan="total_label_colspan" class="_totalLabel">
            {{ $t("sg_pdf_total") }}
          </td>
          <td class="_totalValue">{{ formatted_total }}</td>
          <td
            v-if="total_trailing_colspan > 0"
            :colspan="total_trailing_colspan"
          />
        </tr>
      </tbody>
    </table>

    <p class="_legal">{{ legal_text }}</p>

    <footer class="_footer">
      <p v-for="(line, index) in footer_lines" :key="index">{{ line }}</p>
    </footer>
  </article>
</template>

<script>
import GemPricing from "@/mixins/GemPricing";
import GemDimensions from "@/mixins/GemDimensions";
import { SELECTION_PDF_ACF_FOOTER_LINES } from "@/utils/selection_pdf_export_registry.js";
import {
  formatPdfCurrencyTotal,
  gemIdFromPath,
  resolveGemCoverThumbRelative,
  sumGemPricingTotals,
  toAbsoluteAppUrl,
} from "@/utils/selection_pdf_gem_helpers.js";
import { selection_pdf_photo_column_key } from "@/utils/selection_pdf_columns.js";

export default {
  name: "SGSelectionPdfDocument",
  mixins: [GemPricing, GemDimensions],
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
    metadata_labels: {
      type: Object,
      default: () => ({}),
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
  },
  computed: {
    footer_lines() {
      return SELECTION_PDF_ACF_FOOTER_LINES;
    },
    pricing_sum() {
      return sumGemPricingTotals(this.gems, this.pricing_total_key);
    },
    formatted_total() {
      const currency = this.selection?.currency || "USD";
      return formatPdfCurrencyTotal(this.pricing_sum, currency);
    },
    pricing_total_column_index() {
      if (!this.pricing_total_key) return -1;
      return this.metadata_keys.indexOf(this.pricing_total_key);
    },
    total_label_colspan() {
      const idx = this.pricing_total_column_index;
      if (idx < 0) return 1 + this.metadata_keys.length;
      return 1 + idx;
    },
    total_trailing_colspan() {
      const idx = this.pricing_total_column_index;
      if (idx < 0) return 0;
      return Math.max(0, this.metadata_keys.length - idx - 1);
    },
  },
  methods: {
    columnLabel(metadata_key) {
      return this.metadata_labels[metadata_key] || metadata_key;
    },
    columnClass(metadata_key) {
      if (metadata_key === selection_pdf_photo_column_key) return "_colPhoto";
      if (this.isGemPricingTotalColumnKey(metadata_key)) return "_colPrice";
      return "_colDefault";
    },
    coverUrl(gem) {
      const relative = resolveGemCoverThumbRelative(gem);
      if (!relative) return "";
      if (typeof window === "undefined") return relative;
      return toAbsoluteAppUrl(relative, window.location.origin);
    },
    formatCell(gem, metadata_key) {
      if (metadata_key === "id") return gemIdFromPath(gem);
      if (metadata_key === "$cover") return "";

      if (this.isGemPricingTotalColumnKey(metadata_key)) {
        const raw_total = gem?.[metadata_key];
        const total_str =
          raw_total === null || raw_total === undefined || raw_total === ""
            ? "—"
            : String(raw_total);
        const w = this.toNumberOrDefault(gem?.weight_ct);
        if (!Number.isFinite(w) || w <= 0) return total_str;
        const per = this.computeDisplayedPerCaratForGem(gem, metadata_key);
        return `${total_str} | ${per} /ct`;
      }

      if (this.isGemDimensionsMergedColumnKey(metadata_key)) {
        return this.formatGemDimensionsInline(gem);
      }

      const raw_value = gem?.[metadata_key];
      if (raw_value === null || raw_value === undefined) return "";
      if (typeof raw_value === "object") return "";
      return String(raw_value);
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
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8mm;
  margin-bottom: 6mm;
}

._docTitle {
  margin: 0 0 2mm;
  font-size: 13pt;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

._dateLine {
  margin: 0;
  font-size: 10pt;
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

._counterpartyAddress {
  margin: 0;
  white-space: pre-line;
}

._gemsTable {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  margin-bottom: 5mm;
}

._gemsTable th,
._gemsTable td {
  border: 1px solid #333;
  padding: 1.5mm 1.2mm;
  vertical-align: top;
  word-break: break-word;
}

._gemsTable th {
  font-size: 7.5pt;
  font-weight: 700;
  text-transform: uppercase;
  background: #f4f4f4;
}

._colNo {
  width: 7mm;
  text-align: center;
}

._colPhoto {
  width: 16mm;
  text-align: center;
}

._colPrice {
  width: 22mm;
}

._coverImg {
  display: block;
  width: 14mm;
  height: 14mm;
  object-fit: cover;
  margin: 0 auto;
}

._cellText {
  display: block;
  font-size: 8pt;
}

._totalRow td {
  font-weight: 700;
  font-size: 9pt;
}

._totalLabel {
  text-align: right;
  text-transform: uppercase;
}

._totalValue {
  text-align: right;
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
  color: #444;
}

._footer p {
  margin: 0 0 0.8mm;
}

@media print {
  ._pdfDocument {
    width: auto;
    min-height: auto;
    margin: 0;
    padding: 10mm 8mm 12mm;
  }

  ._gemsTable thead {
    display: table-header-group;
  }

  ._gemsTable tr {
    page-break-inside: avoid;
  }
}
</style>
