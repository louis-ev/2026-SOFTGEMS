<template>
  <div class="_gemFieldEditorBody">
    <DLabel :str="field.label" :icon="field.icon" />

    <div class="_inputWrap">
      <template v-if="field.readonly">
        <input :value="edit_value" class="u-input" readonly />
        <p class="_readonlyNote">{{ $t("sg_readonly_field") }}</p>
      </template>
      <SGSelectField
        v-else-if="field.type === 'select'"
        v-model="edit_value"
        :options="field.options || []"
        :allow_empty="true"
        :disabled="auxiliary_disable"
        @input="onEditorInput"
      />
      <TextInput
        v-else
        :content.sync="edit_value"
        :input_type="field.input_type || 'text'"
        :input_step="field.input_step"
        :instructions="field.instructions"
        :disabled="auxiliary_disable"
        :autofocus="true"
        @update:content="onEditorInput"
      />
      <p v-if="field_validation_error" class="_fieldError">
        {{ field_validation_error }}
      </p>
      <SGGemFieldPricingExtras :notice_message="affected_fields_notice" />
    </div>

    <p v-if="remote_update_notice" class="u-warning _remoteNotice" role="status">
      {{ remote_update_notice }}
    </p>

    <div v-if="!meta_target_path" class="u-spacingBottom"></div>

    <SGFieldHistoryPanel
      v-if="!meta_target_path"
      :history_enabled="true"
      :show_history="show_history"
      :is_loading_history="is_loading_history"
      :field_history="field_history"
      :format_value="panelFormatHistoryValue"
      @toggle="toggleHistory"
      @pickEntry="copyHistoryValue"
    />
  </div>
</template>

<script>
import SGSelectField from "@/components/softgems/SGSelectField.vue";
import SGFieldHistoryPanel from "@/components/softgems/SGFieldHistoryPanel.vue";
import SGGemFieldPricingExtras from "@/components/gems/SGGemFieldPricingExtras.vue";
import GemPricing from "@/mixins/GemPricing";
import { extract_field_entries } from "@/utils/field_history.js";

export default {
  name: "SGGemFieldEditorBody",
  mixins: [GemPricing],
  components: {
    SGSelectField,
    SGFieldHistoryPanel,
    SGGemFieldPricingExtras,
  },
  props: {
    field: {
      type: Object,
      required: true,
    },
    current_value: {
      default: "",
    },
    gem_path: {
      type: String,
      required: true,
    },
    gem: {
      type: Object,
      default: null,
    },
    meta_target_path: {
      type: String,
      default: "",
    },
    auxiliary_disable: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      edit_value: "",
      server_edit_baseline: null,
      remote_update_notice: "",
      is_committing: false,
      show_history: false,
      is_loading_history: false,
      field_history: [],
    };
  },
  created() {
    this.edit_value = this.current_value;
    this.server_edit_baseline = this.normalize_snapshot_value(
      this.current_value
    );
  },
  mounted() {
    this.emitFooterState();
  },
  computed: {
    history_field_key() {
      return this.field.pricing_total_key || this.field.key;
    },
    field_validation() {
      return this.validateFieldValue(this.edit_value);
    },
    field_validation_error() {
      if (this.field_validation.is_valid) return "";
      return this.field_validation.error_message;
    },
    is_footer_save_disabled() {
      return (
        this.auxiliary_disable ||
        this.field.readonly ||
        this.is_committing ||
        !this.field_validation.is_valid
      );
    },
    affected_fields_notice() {
      if (this.meta_target_path) return "";
      const field_key = this.field.key;
      const touches_pricing =
        this.isPricingField(field_key) || field_key === "weight_ct";
      if (!touches_pricing) return "";
      if (!this.field_validation.is_valid) return "";

      const normalized_value = this.normalizeFieldValue(this.edit_value);
      const weight_label = this.$t("sg_weight_ct");
      const current_gem =
        this.gem && typeof this.gem === "object" ? this.gem : {};

      if (field_key === "weight_ct") {
        const from_weight = this.toNumberOrDefault(current_gem.weight_ct);
        const to_weight = this.toNumberOrDefault(normalized_value);
        if (this.storedNumericValuesEqual(from_weight, to_weight)) return "";
        return this.$t("sg_pricing_impact_editing_weight", {
          weight_label,
          from_weight: this.formatAffectedFieldValue(from_weight),
          to_weight: this.formatAffectedFieldValue(to_weight),
        });
      }

      if (this.isVirtualPerCaratField(field_key)) {
        const pair = this.getPricingPairByFieldKey(field_key);
        if (!pair) return "";
        const meta_patch = this.buildMetaPatch({
          field_key: this.field.key,
          normalized_value,
        });
        const new_total = meta_patch[pair.total_key];
        if (new_total === undefined) return "";
        const previous_total = this.toNumberOrDefault(
          current_gem[pair.total_key]
        );
        if (this.storedNumericValuesEqual(previous_total, new_total)) return "";
        const total_label = this.getPricingFieldLabel(pair.total_key);
        return this.$t("sg_pricing_impact_editing_per_carat", {
          total_label,
          from_value: this.formatAffectedFieldValue(previous_total),
          to_value: this.formatAffectedFieldValue(new_total),
          weight_label,
        });
      }

      const pair = this.getPricingPairByFieldKey(field_key);
      if (pair && field_key === pair.total_key) {
        const weight_ct = this.toNumberOrDefault(current_gem.weight_ct);
        const previous_total = this.toNumberOrDefault(
          current_gem[pair.total_key]
        );
        const new_total = this.toNumberOrDefault(normalized_value);
        if (this.storedNumericValuesEqual(previous_total, new_total)) return "";
        const from_per_carat = this.computePerCarat({
          total_value: previous_total,
          weight_ct,
        });
        const to_per_carat = this.computePerCarat({
          total_value: new_total,
          weight_ct,
        });
        if (
          this.storedNumericValuesEqual(from_per_carat, to_per_carat)
        ) {
          return "";
        }
        return this.$t("sg_pricing_impact_editing_total", {
          per_carat_label: this.getPricingFieldLabel(
            pair.virtual_per_carat_key
          ),
          from_per_carat: this.formatAffectedFieldValue(from_per_carat),
          to_per_carat: this.formatAffectedFieldValue(to_per_carat),
          total_label: this.getPricingFieldLabel(pair.total_key),
          weight_label,
        });
      }

      return "";
    },
    panelFormatHistoryValue() {
      return (value) => this.formatHistoryValue(value);
    },
  },
  watch: {
    current_value(nv) {
      this.on_server_value_changed(nv);
    },
    edit_value() {
      this.emitFooterState();
    },
    is_committing(v) {
      this.$emit("loadingChange", Boolean(v));
    },
    field: {
      deep: true,
      handler() {
        this.emitFooterState();
      },
    },
  },
  methods: {
    onEditorInput() {
      this.remote_update_notice = "";
    },
    normalize_snapshot_value(v) {
      if (this.field.type === "number") {
        return this.normalizeFieldValue(v);
      }
      if (v === null || v === undefined) return "";
      return v;
    },
    edit_matches_baseline(baseline) {
      if (this.field.type === "number") {
        return this.storedNumericValuesEqual(
          this.normalizeFieldValue(this.edit_value),
          baseline
        );
      }
      const b = baseline === null || baseline === undefined ? "" : String(baseline);
      const e =
        this.edit_value === null || this.edit_value === undefined
          ? ""
          : String(this.edit_value);
      return e === b;
    },
    on_server_value_changed(nv) {
      const new_snap = this.normalize_snapshot_value(nv);
      if (this.field.type === "number") {
        if (this.storedNumericValuesEqual(new_snap, this.server_edit_baseline))
          return;
      } else if (new_snap === this.server_edit_baseline) {
        return;
      }

      const had_unsaved_divergence = !this.edit_matches_baseline(
        this.server_edit_baseline
      );

      if (!had_unsaved_divergence) {
        this.edit_value = nv;
        this.remote_update_notice = "";
      } else if (!this.edit_matches_baseline(new_snap)) {
        const msg = this.$t("sg_gem_field_updated_remotely");
        this.remote_update_notice =
          msg && msg !== "sg_gem_field_updated_remotely" ? msg : "";
      } else {
        this.remote_update_notice = "";
      }

      this.server_edit_baseline = this.normalize_snapshot_value(nv);
      this.emitFooterState();
    },
    async toggleHistory() {
      this.show_history = !this.show_history;
      if (this.show_history && this.field_history.length === 0) {
        await this.fetchHistory();
      }
    },
    async fetchHistory() {
      this.is_loading_history = true;
      try {
        const entries = await this.$api.getFieldHistory({
          path: this.gem_path,
        });
        this.field_history = extract_field_entries(
          entries,
          this.history_field_key
        );
      } catch {
        this.field_history = [];
      } finally {
        this.is_loading_history = false;
      }
    },
    async commitSave() {
      if (
        this.field.readonly ||
        this.is_committing ||
        !this.field_validation.is_valid
      )
        return false;

      const field_key_saved = this.field.key;
      const targets_file_meta =
        typeof this.meta_target_path === "string" &&
        this.meta_target_path.trim() !== "";

      let meta_patch;
      if (targets_file_meta) {
        const raw = this.edit_value;
        if (
          this.field.persist_empty_number_as_null &&
          this.field.type === "number"
        ) {
          const is_empty =
            raw === "" || raw === null || raw === undefined;
          meta_patch = {
            [field_key_saved]: is_empty
              ? null
              : this.normalizeFieldValue(raw),
          };
        } else if (this.field.type === "number") {
          meta_patch = {
            [field_key_saved]: this.normalizeFieldValue(raw),
          };
        } else {
          meta_patch = { [field_key_saved]: raw };
        }
      } else {
        const normalized_value = this.normalizeFieldValue(this.edit_value);
        meta_patch = this.buildMetaPatch({
          field_key: field_key_saved,
          normalized_value,
        });
      }

      const update_path = targets_file_meta
        ? this.meta_target_path.trim()
        : this.gem_path;

      this.is_committing = true;
      try {
        const update_response = await this.$api.updateMeta({
          path: update_path,
          new_meta: meta_patch,
        });
        let saved_changes =
          update_response && update_response.changed_data
            ? update_response.changed_data
            : {};
        if (targets_file_meta && Object.keys(saved_changes).length === 0) {
          saved_changes = meta_patch;
        }

        const value_from_response = saved_changes[field_key_saved];
        this.$emit("saved", {
          changes: saved_changes,
          key: field_key_saved,
          value:
            value_from_response !== undefined
              ? value_from_response
              : meta_patch[field_key_saved],
          update_response,
        });
        return true;
      } catch ({ code }) {
        this.$alertify.delay(4000).error(code || this.$t("couldntbesaved"));
        return false;
      } finally {
        this.is_committing = false;
      }
    },
    buildMetaPatch({ field_key, normalized_value }) {
      const current_gem =
        this.gem && typeof this.gem === "object" ? this.gem : {};

      if (field_key === "weight_ct") {
        return { weight_ct: normalized_value };
      }

      if (this.isVirtualPerCaratField(field_key)) {
        const pair = this.getPricingPairByFieldKey(field_key);
        const weight_ct = this.toNumberOrDefault(current_gem.weight_ct);
        return {
          [pair.total_key]: this.computeTotal({
            per_carat_value: this.toNumberOrDefault(normalized_value),
            weight_ct,
          }),
        };
      }

      const next_meta = { [field_key]: normalized_value };
      if (!this.isPricingField(field_key)) return next_meta;

      return next_meta;
    },
    normalizeFieldValue(raw_value) {
      if (this.field.type !== "number") return raw_value;
      if (raw_value === "" || raw_value === null || raw_value === undefined)
        return 0;

      const normalized_value = String(raw_value).trim().replace(",", ".");
      const number_value = Number(normalized_value);
      if (Number.isFinite(number_value)) return number_value;
      return raw_value;
    },
    validateFieldValue(raw_value) {
      if (this.field.type !== "number")
        return { is_valid: true, error_message: "" };
      if (raw_value === null || raw_value === undefined || raw_value === "")
        return { is_valid: true, error_message: "" };

      const normalized_value = String(raw_value).trim().replace(",", ".");
      if (!/^-?\d+(?:\.\d+)?$/.test(normalized_value)) {
        return {
          is_valid: false,
          error_message: this.$t("sg_invalid_number"),
        };
      }

      const number_value = Number(normalized_value);
      if (!Number.isFinite(number_value)) {
        return {
          is_valid: false,
          error_message: this.$t("sg_invalid_number"),
        };
      }

      const allowed_decimals = this.getAllowedDecimals(this.field.input_step);
      if (allowed_decimals === null)
        return { is_valid: true, error_message: "" };

      const decimal_count = this.getDecimalCount(normalized_value);
      if (decimal_count <= allowed_decimals)
        return { is_valid: true, error_message: "" };

      return {
        is_valid: false,
        error_message:
          allowed_decimals === 0
            ? this.$t("sg_invalid_integer")
            : this.$t("sg_invalid_decimals", { decimals: allowed_decimals }),
      };
    },
    getAllowedDecimals(input_step) {
      if (input_step === null || input_step === undefined || input_step === "")
        return null;
      const step_value = String(input_step);
      if (step_value.includes(".")) return step_value.split(".")[1].length;
      return 0;
    },
    getDecimalCount(normalized_value) {
      if (!normalized_value.includes(".")) return 0;
      return normalized_value.split(".")[1].length;
    },
    formatHistoryValue(value) {
      if (value === null || value === undefined || value === "") return "—";
      if (this.field.pricing_total_key) {
        const weight_ct = this.toNumberOrDefault(this.gem?.weight_ct);
        const per_carat = this.computePerCarat({
          total_value: this.toNumberOrDefault(value),
          weight_ct,
        });
        return String(per_carat);
      }
      return String(value);
    },
    copyHistoryValue(entry) {
      if (this.field.readonly) return;
      const raw =
        entry && Object.prototype.hasOwnProperty.call(entry, "value")
          ? entry.value
          : "";
      if (this.field.pricing_total_key) {
        const weight_ct = this.toNumberOrDefault(this.gem?.weight_ct);
        this.edit_value = this.computePerCarat({
          total_value: this.toNumberOrDefault(raw),
          weight_ct,
        });
        return;
      }
      this.edit_value = raw;
      this.onEditorInput();
    },
    getPricingFieldLabel(field_key) {
      const field_to_i18n = {
        base_price_pcb: "sg_base_price_pcb",
        purchased_price_pa: "sg_purchased_price_pa",
        pv_selling_price: "sg_pv_selling_price",
        pc_to: "sg_pc_to",
        pf_invoiced_price: "sg_pf_invoiced_price",
        price_per_carat_pcb: "sg_price_per_carat_pcb",
        price_per_carat_pa: "sg_price_per_carat_pa",
        price_per_carat_pv: "sg_price_per_carat_pv",
        price_per_carat_pc: "sg_price_per_carat_pc",
        price_per_carat_pf: "sg_price_per_carat_pf",
        weight_ct: "sg_weight_ct",
      };
      const i18n_key = field_to_i18n[field_key];
      if (i18n_key) {
        const translated = this.$t(i18n_key);
        if (translated && translated !== i18n_key) return translated;
      }
      return field_key;
    },
    formatAffectedFieldValue(value) {
      if (value === null || value === undefined || value === "") return "—";
      if (typeof value === "number" && Number.isFinite(value)) {
        return value.toLocaleString(this.$i18n.locale, {
          maximumFractionDigits: 3,
        });
      }
      return String(value);
    },
    storedNumericValuesEqual(a, b) {
      return (
        Number(this.toNumberOrDefault(a).toFixed(2)) ===
        Number(this.toNumberOrDefault(b).toFixed(2))
      );
    },
    emitFooterState() {
      this.$nextTick(() => {
        this.$emit("footerStateChange", {
          save_disabled: this.is_footer_save_disabled,
        });
      });
    },
    async tryShellSave() {
      if (this.is_footer_save_disabled) return false;
      return await this.commitSave();
    },
  },
};
</script>

<style lang="scss" scoped>
._gemFieldEditorBody {
  display: flex;
  flex-direction: column;
}

._inputWrap {
  display: flex;
  flex-direction: column;
  gap: calc(var(--spacing) / 4);
}

._readonlyNote {
  margin: 0;
  font-size: var(--sl-font-size-x-small);
  color: var(--c-gris_fonce);
}

._fieldError {
  margin: calc(var(--spacing) / 6) 0 0;
  color: var(--c-rouge);
  font-size: var(--sl-font-size-x-small);
}

._remoteNotice {
  margin: 0;
  font-size: var(--sl-font-size-x-small);
}
</style>
