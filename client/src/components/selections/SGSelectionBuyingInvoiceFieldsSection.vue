<template>
  <SGSectionPanel
    v-if="show_section"
    section_id="selection_buying_invoice_fields"
    :title="section_title"
  >
    <div class="_fieldsGrid">
      <div class="_checkboxField">
        <ToggleInput
          :label="partnership_checkbox_label"
          :content="partnership_purchase_checked"
          :disabled="!can_edit || is_saving_partnership_purchase"
          @update:content="onPartnershipPurchaseChange"
        />
      </div>

      <SGEditableMetaField
        v-if="show_percentage_field"
        :label="percentage_field_label"
        icon="percent"
        :value="purchased_percentage_display"
        :readonly="!can_edit"
        :modal_open="active_field === 'partnership_purchased_percentage'"
        :modal_title="field_modal_title(percentage_field_label)"
        :modal_is_loading="
          is_saving_field === 'partnership_purchased_percentage'
        "
        :editor_component="percentage_editor_component"
        :editor_props="percentage_editor_props"
        @presentClick="openField('partnership_purchased_percentage')"
        @close="closeField"
        @save="onPurchasedPercentageSave"
      />
    </div>
  </SGSectionPanel>
</template>

<script>
import ToggleInput from "@/adc-core/inputs/ToggleInput.vue";
import SGEditableMetaField from "@/components/softgems/SGEditableMetaField.vue";
import SGSectionPanel from "@/components/softgems/SGSectionPanel.vue";
import SGSelectionPercentageFieldEditor from "@/components/selections/SGSelectionPercentageFieldEditor.vue";
import {
  clampPartnershipPurchasedPercentage,
  formatPartnershipPurchasedPercentageDisplay,
} from "@/utils/selection_buying_invoice.js";

import { parseSelectionFolderPath } from "@/utils/selection_paths.js";

const BUYING_INVOICE_TYPE_SLUG = "buying-invoice";
const SALE_INVOICE_TYPE_SLUG = "sale-invoice";

export default {
  name: "SGSelectionBuyingInvoiceFieldsSection",
  components: {
    ToggleInput,
    SGEditableMetaField,
    SGSectionPanel,
  },
  props: {
    selection_folder_path: {
      type: String,
      required: true,
    },
    selection: {
      type: Object,
      required: true,
    },
    can_edit: {
      type: Boolean,
      default: false,
    },
    page_title: {
      type: String,
      default: "",
    },
  },
  data() {
    return {
      active_field: "",
      is_saving_field: "",
      is_saving_partnership_purchase: false,
      percentage_editor_component: SGSelectionPercentageFieldEditor,
    };
  },
  computed: {
    selection_type_slug() {
      return parseSelectionFolderPath(this.selection_folder_path).type_slug;
    },
    selection_type_value() {
      return String(this.selection?.selection_type || "").trim();
    },
    is_buying_invoice() {
      if (this.selection_type_slug === BUYING_INVOICE_TYPE_SLUG) return true;
      return this.selection_type_value === "buying invoice";
    },
    is_sale_invoice() {
      if (this.selection_type_slug === SALE_INVOICE_TYPE_SLUG) return true;
      return this.selection_type_value === "sale invoice";
    },
    show_section() {
      return this.is_buying_invoice || this.is_sale_invoice;
    },
    section_title() {
      if (this.is_sale_invoice) {
        return this.$t("sg_section_selection_sale_invoice");
      }
      return this.$t("sg_section_selection_buying_invoice");
    },
    partnership_checkbox_label() {
      if (this.is_sale_invoice) {
        return this.$t("sg_selection_partnership_invoice");
      }
      return this.$t("sg_selection_partnership_purchase");
    },
    percentage_field_label() {
      return this.$t("sg_selection_partnership_percentage");
    },
    partnership_purchase_checked() {
      return Boolean(this.selection?.partnership_purchase);
    },
    show_percentage_field() {
      return this.partnership_purchase_checked;
    },
    purchased_percentage_display() {
      return formatPartnershipPurchasedPercentageDisplay(
        this.selection?.partnership_purchased_percentage
      );
    },
    percentage_editor_props() {
      return {
        initial_value: this.selection?.partnership_purchased_percentage ?? "",
        label: this.percentage_field_label,
      };
    },
  },
  methods: {
    field_modal_title(label) {
      const title = String(this.page_title || "").trim();
      if (!title) return label;
      return `${title} — ${label}`;
    },
    openField(field_key) {
      if (!this.can_edit) return;
      this.active_field = field_key;
    },
    closeField() {
      this.active_field = "";
    },
    async onPartnershipPurchaseChange(is_checked) {
      if (!this.can_edit || this.is_saving_partnership_purchase) return;
      this.is_saving_partnership_purchase = true;
      try {
        const new_meta = { partnership_purchase: Boolean(is_checked) };
        if (!is_checked) {
          new_meta.partnership_purchased_percentage = null;
        }
        await this.$api.updateMeta({
          path: this.selection_folder_path,
          new_meta,
        });
        this.$alertify
          .delay(2500)
          .success(this.$t("sg_selection_field_saved"));
      } catch ({ code }) {
        this.$alertify.delay(4000).error(code || this.$t("sg_could_not_save"));
      } finally {
        this.is_saving_partnership_purchase = false;
      }
    },
    async onPurchasedPercentageSave({ value }) {
      const clamped = clampPartnershipPurchasedPercentage(value);
      await this.persistFields({
        partnership_purchased_percentage: clamped,
      });
    },
    async persistField(field_key, raw_value) {
      await this.persistFields({ [field_key]: raw_value });
    },
    async persistFields(new_meta) {
      if (!new_meta || typeof new_meta !== "object" || this.is_saving_field) {
        return;
      }
      const saving_key =
        Object.keys(new_meta).find(
          (key) => key === "partnership_purchased_percentage",
        ) || Object.keys(new_meta)[0] || "fields";
      this.is_saving_field = saving_key;
      try {
        await this.$api.updateMeta({
          path: this.selection_folder_path,
          new_meta,
        });
        this.closeField();
        this.$alertify
          .delay(2500)
          .success(this.$t("sg_selection_field_saved"));
      } catch ({ code }) {
        this.$alertify.delay(4000).error(code || this.$t("sg_could_not_save"));
      } finally {
        this.is_saving_field = "";
      }
    },
  },
};
</script>

<style lang="scss" scoped>
._fieldsGrid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: calc(var(--spacing) / 1.75);
  align-items: start;
}

._checkboxField {
  padding-top: calc(var(--spacing) * 0.15);
}
</style>
