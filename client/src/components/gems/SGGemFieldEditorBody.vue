<template>
  <div class="_gemFieldEditorBody">
    <DLabel
      v-if="!active_pricing_pair"
      :str="field.label"
      :icon="field.icon"
    />

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
        @enterSubmit="onEnterSubmitFromShell"
      />
      <div v-else-if="active_pricing_pair" class="_pricingPairInputs">
        <p class="_pricingPairWeight" role="note">
          <span class="_pricingPairWeightLabel">{{ $t("sg_weight_ct") }}</span>
          <span class="_pricingPairWeightSep" aria-hidden="true">:</span>
          <span class="_pricingPairWeightValue">{{
            pair_editor_weight_display
          }}</span>
        </p>
        <div class="_pricingPairRow">
          <span class="_pricingPairLabel">{{
            $t("sg_pricing_cell_total")
          }}</span>
          <TextInput
            :content="pair_edit_total"
            :input_type="pair_field_configs.total.input_type || 'number'"
            :input_step="pair_field_configs.total.input_step"
            :instructions="pair_field_configs.total.instructions"
            :disabled="auxiliary_disable"
            :autofocus="pair_autofocus_total"
            @update:content="onPairTotalUpdate"
            @onEnter="onEnterSubmitFromShell"
          />
        </div>
        <div class="_pricingPairRow">
          <span class="_pricingPairLabel">{{
            $t("sg_pricing_cell_per_carat")
          }}</span>
          <TextInput
            :content="pair_edit_per_carat"
            :input_type="pair_field_configs.per.input_type || 'number'"
            :input_step="pair_field_configs.per.input_step"
            :instructions="pair_field_configs.per.instructions"
            :disabled="auxiliary_disable"
            :autofocus="pair_autofocus_per"
            @update:content="onPairPerCaratUpdate"
            @onEnter="onEnterSubmitFromShell"
          />
        </div>
      </div>
      <div v-else-if="active_dimensions_merged" class="_dimensionsMergedInputs">
        <div class="_pricingPairRow">
          <span class="_pricingPairLabel">{{
            axis_mm_configs.length_mm.label
          }}</span>
          <TextInput
            :content="dim_edit_length"
            :input_type="axis_mm_configs.length_mm.input_type || 'number'"
            :input_step="axis_mm_configs.length_mm.input_step"
            :instructions="axis_mm_configs.length_mm.instructions"
            :disabled="auxiliary_disable"
            :autofocus="true"
            @update:content="onDimLengthUpdate"
            @onEnter="onEnterSubmitFromShell"
          />
        </div>
        <div class="_pricingPairRow">
          <span class="_pricingPairLabel">{{
            axis_mm_configs.width_mm.label
          }}</span>
          <TextInput
            :content="dim_edit_width"
            :input_type="axis_mm_configs.width_mm.input_type || 'number'"
            :input_step="axis_mm_configs.width_mm.input_step"
            :instructions="axis_mm_configs.width_mm.instructions"
            :disabled="auxiliary_disable"
            @update:content="onDimWidthUpdate"
            @onEnter="onEnterSubmitFromShell"
          />
        </div>
        <div class="_pricingPairRow">
          <span class="_pricingPairLabel">{{
            axis_mm_configs.height_mm.label
          }}</span>
          <TextInput
            :content="dim_edit_height"
            :input_type="axis_mm_configs.height_mm.input_type || 'number'"
            :input_step="axis_mm_configs.height_mm.input_step"
            :instructions="axis_mm_configs.height_mm.instructions"
            :disabled="auxiliary_disable"
            @update:content="onDimHeightUpdate"
            @onEnter="onEnterSubmitFromShell"
          />
        </div>
      </div>
      <SGDateInput
        v-else-if="is_date_field"
        :value="edit_value"
        :autofocus="true"
        @input="onDateEditorInput"
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
        @onEnter="onEnterSubmitFromShell"
      />
      <p v-if="field_validation_error" class="_fieldError">
        {{ field_validation_error }}
      </p>
      <SGGemFieldPricingExtras :notice_message="affected_fields_notice" />
    </div>

    <p
      v-if="remote_update_notice"
      class="u-warning _remoteNotice"
      role="status"
    >
      {{ remote_update_notice }}
    </p>

    <div v-if="!meta_target_path" class="u-spacingBottom"></div>

    <SGFieldHistoryPanel
      v-if="!meta_target_path && !active_dimensions_merged"
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
import SGDateInput from "@/components/softgems/SGDateInput.vue";
import SGFieldHistoryPanel from "@/components/softgems/SGFieldHistoryPanel.vue";
import SGGemFieldPricingExtras from "@/components/gems/SGGemFieldPricingExtras.vue";
import GemPricing from "@/mixins/GemPricing";
import GemDimensions from "@/mixins/GemDimensions";
import { buildGemFieldConfigs } from "@/components/gems/gem_field_configs";
import { extract_field_entries } from "@/utils/field_history.js";
import { getNumberFormatLocale } from "@/utils/format_locale.js";
import { is_date_input_field, toDateInputValue } from "@/utils/date_input.js";

export default {
  name: "SGGemFieldEditorBody",
  mixins: [GemDimensions, GemPricing],
  components: {
    SGSelectField,
    SGDateInput,
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
      pair_edit_total: "",
      pair_edit_per_carat: "",
      dim_edit_length: "",
      dim_edit_width: "",
      dim_edit_height: "",
      server_edit_baseline: null,
      remote_update_notice: "",
      is_committing: false,
      show_history: false,
      is_loading_history: false,
      field_history: [],
    };
  },
  created() {
    if (this.active_dimensions_merged) {
      this.initializeDimensionsStateFromGem();
      this.server_edit_baseline = this.serializeDimensionsBaselineFromGem();
    } else if (this.active_pricing_pair) {
      this.initializePricingPairStateFromGem();
      const pair = this.active_pricing_pair;
      this.server_edit_baseline = this.normalizeFieldValueWithConfig(
        this.gem?.[pair.total_key] ?? "",
        this.pair_field_configs.total
      );
    } else {
      this.edit_value = this.initialEditValue(this.current_value);
      this.server_edit_baseline = this.normalize_snapshot_value(
        this.current_value
      );
    }
  },
  mounted() {
    this.emitFooterState();
  },
  computed: {
    is_date_field() {
      return is_date_input_field(this.field);
    },
    active_dimensions_merged() {
      if (
        typeof this.meta_target_path === "string" &&
        this.meta_target_path.trim() !== ""
      ) {
        return false;
      }
      return this.field?.type === "dimensions_merged";
    },
    axis_mm_configs() {
      const cfgs = buildGemFieldConfigs(this.$t.bind(this), []);
      return {
        length_mm: cfgs.length_mm,
        width_mm: cfgs.width_mm,
        height_mm: cfgs.height_mm,
      };
    },
    active_pricing_pair() {
      if (
        typeof this.meta_target_path === "string" &&
        this.meta_target_path.trim() !== ""
      ) {
        return null;
      }
      if (!this.field || this.field.type !== "number" || this.field.readonly) {
        return null;
      }
      const pair = this.getPricingPairByFieldKey(this.field.key);
      if (!pair) return null;
      if (
        this.field.key !== pair.total_key &&
        this.field.key !== pair.virtual_per_carat_key
      ) {
        return null;
      }
      return pair;
    },
    pair_field_configs() {
      if (!this.active_pricing_pair) {
        return { total: null, per: null };
      }
      const configs = buildGemFieldConfigs(this.$t.bind(this), []);
      const pair = this.active_pricing_pair;
      return {
        total: configs[pair.total_key],
        per: configs[pair.virtual_per_carat_key],
      };
    },
    pair_autofocus_total() {
      if (!this.active_pricing_pair) return false;
      return this.field.key === this.active_pricing_pair.total_key;
    },
    pair_autofocus_per() {
      if (!this.active_pricing_pair) return false;
      return this.field.key === this.active_pricing_pair.virtual_per_carat_key;
    },
    pair_editor_weight_display() {
      const w = this.toNumberOrNull(this.gem?.weight_ct);
      if (w === null || !Number.isFinite(w)) return "—";
      return w.toLocaleString(getNumberFormatLocale(this.$i18n?.locale), {
        maximumFractionDigits: 3,
      });
    },
    history_field_key() {
      if (this.active_dimensions_merged) return "length_mm";
      return (
        (this.active_pricing_pair && this.active_pricing_pair.total_key) ||
        this.field.pricing_total_key ||
        this.field.key
      );
    },
    field_validation() {
      if (this.active_dimensions_merged) {
        const cfgs = this.axis_mm_configs;
        const checks = [
          this.validateFieldValueWithConfig(
            this.dim_edit_length,
            cfgs.length_mm
          ),
          this.validateFieldValueWithConfig(this.dim_edit_width, cfgs.width_mm),
          this.validateFieldValueWithConfig(
            this.dim_edit_height,
            cfgs.height_mm
          ),
        ];
        const failed = checks.find((c) => !c.is_valid);
        return failed || { is_valid: true, error_message: "" };
      }
      if (this.active_pricing_pair) {
        const { total, per } = this.pair_field_configs;
        const total_check = this.validateFieldValueWithConfig(
          this.pair_edit_total,
          total
        );
        if (!total_check.is_valid) return total_check;
        return this.validateFieldValueWithConfig(this.pair_edit_per_carat, per);
      }
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
      if (this.active_dimensions_merged) {
        if (!this.field_validation.is_valid) return "";
        return this.$t("sg_dimensions_merged_editor_hint");
      }
      if (this.active_pricing_pair) {
        if (!this.field_validation.is_valid) return "";
        return this.$t("sg_pricing_pair_editor_save_hint");
      }
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
        if (this.storedNumericValuesEqual(from_per_carat, to_per_carat)) {
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
      if (this.active_pricing_pair || this.active_dimensions_merged) return;
      this.on_server_value_changed(nv);
    },
    gem: {
      deep: true,
      handler() {
        if (this.is_committing) return;
        if (this.active_pricing_pair) {
          const pair = this.active_pricing_pair;
          const { total: total_cfg } = this.pair_field_configs;
          if (!pair || !total_cfg) return;
          const new_snap = this.normalizeFieldValueWithConfig(
            this.gem?.[pair.total_key] ?? "",
            total_cfg
          );
          if (
            this.storedNumericValuesEqual(new_snap, this.server_edit_baseline)
          )
            return;

          const had_unsaved_divergence = !this.pair_edit_matches_baseline();

          if (!had_unsaved_divergence) {
            this.initializePricingPairStateFromGem();
            this.remote_update_notice = "";
          } else if (
            !this.storedNumericValuesEqual(
              new_snap,
              this.normalizeFieldValueWithConfig(this.pair_edit_total, total_cfg)
            )
          ) {
            const msg = this.$t("sg_gem_field_updated_remotely");
            this.remote_update_notice =
              msg && msg !== "sg_gem_field_updated_remotely" ? msg : "";
          } else {
            this.remote_update_notice = "";
          }

          this.server_edit_baseline = new_snap;
          this.emitFooterState();
          return;
        }
        if (!this.active_dimensions_merged) return;
        const new_snap = this.serializeDimensionsBaselineFromGem();
        if (new_snap === this.server_edit_baseline) return;

        const had_unsaved_divergence = !this.dimensions_edit_matches_baseline();

        if (!had_unsaved_divergence) {
          this.initializeDimensionsStateFromGem();
          this.remote_update_notice = "";
        } else if (new_snap !== this.serializeDimensionsEditState()) {
          const msg = this.$t("sg_gem_field_updated_remotely");
          this.remote_update_notice =
            msg && msg !== "sg_gem_field_updated_remotely" ? msg : "";
        } else {
          this.remote_update_notice = "";
        }

        this.server_edit_baseline = new_snap;
        this.emitFooterState();
      },
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
    pair_edit_matches_baseline() {
      if (!this.active_pricing_pair) return true;
      const norm = this.normalizeFieldValueWithConfig(
        this.pair_edit_total,
        this.pair_field_configs.total
      );
      return this.storedNumericValuesEqual(norm, this.server_edit_baseline);
    },
    dimensions_edit_matches_baseline() {
      if (!this.active_dimensions_merged) return true;
      return (
        this.serializeDimensionsEditState() === this.server_edit_baseline
      );
    },
    initializeDimensionsStateFromGem() {
      const cfgs = this.axis_mm_configs;
      this.dim_edit_length = this.formatNumberForPairField(
        this.normalizeFieldValueWithConfig(
          this.gem?.length_mm ?? "",
          cfgs.length_mm
        ),
        cfgs.length_mm
      );
      this.dim_edit_width = this.formatNumberForPairField(
        this.normalizeFieldValueWithConfig(
          this.gem?.width_mm ?? "",
          cfgs.width_mm
        ),
        cfgs.width_mm
      );
      this.dim_edit_height = this.formatNumberForPairField(
        this.normalizeFieldValueWithConfig(
          this.gem?.height_mm ?? "",
          cfgs.height_mm
        ),
        cfgs.height_mm
      );
    },
    serializeDimensionsBaselineFromGem() {
      const cfgs = this.axis_mm_configs;
      return [
        this.normalizeFieldValueWithConfig(
          this.gem?.length_mm ?? "",
          cfgs.length_mm
        ),
        this.normalizeFieldValueWithConfig(
          this.gem?.width_mm ?? "",
          cfgs.width_mm
        ),
        this.normalizeFieldValueWithConfig(
          this.gem?.height_mm ?? "",
          cfgs.height_mm
        ),
      ].join("|");
    },
    serializeDimensionsEditState() {
      const cfgs = this.axis_mm_configs;
      return [
        this.normalizeFieldValueWithConfig(
          this.dim_edit_length,
          cfgs.length_mm
        ),
        this.normalizeFieldValueWithConfig(
          this.dim_edit_width,
          cfgs.width_mm
        ),
        this.normalizeFieldValueWithConfig(
          this.dim_edit_height,
          cfgs.height_mm
        ),
      ].join("|");
    },
    onDimLengthUpdate(val) {
      this.dim_edit_length = val;
      this.onEditorInput();
      this.emitFooterState();
    },
    onDimWidthUpdate(val) {
      this.dim_edit_width = val;
      this.onEditorInput();
      this.emitFooterState();
    },
    onDimHeightUpdate(val) {
      this.dim_edit_height = val;
      this.onEditorInput();
      this.emitFooterState();
    },
    initializePricingPairStateFromGem() {
      const pair = this.active_pricing_pair;
      if (!pair) return;
      const { total: t_cfg, per: p_cfg } = this.pair_field_configs;
      if (!t_cfg || !p_cfg) return;
      const total = this.normalizeFieldValueWithConfig(
        this.gem?.[pair.total_key] ?? "",
        t_cfg
      );
      const weight = this.toNumberOrDefault(this.gem?.weight_ct);
      const per = this.computePerCarat({
        total_value: total,
        weight_ct: weight,
      });
      this.pair_edit_total = this.formatNumberForPairField(total, t_cfg);
      this.pair_edit_per_carat = this.formatNumberForPairField(per, p_cfg);
    },
    onPairTotalUpdate(val) {
      this.pair_edit_total = val;
      this.onEditorInput();
      const total_cfg = this.pair_field_configs.total;
      const per_cfg = this.pair_field_configs.per;
      if (!total_cfg || !per_cfg) return;
      const validation = this.validateFieldValueWithConfig(val, total_cfg);
      if (!validation.is_valid) {
        this.emitFooterState();
        return;
      }
      const norm = this.normalizeFieldValueWithConfig(val, total_cfg);
      const weight = this.toNumberOrDefault(this.gem?.weight_ct);
      const per = this.computePerCarat({
        total_value: norm,
        weight_ct: weight,
      });
      this.pair_edit_per_carat = this.formatNumberForPairField(per, per_cfg);
      this.emitFooterState();
    },
    onPairPerCaratUpdate(val) {
      this.pair_edit_per_carat = val;
      this.onEditorInput();
      const total_cfg = this.pair_field_configs.total;
      const per_cfg = this.pair_field_configs.per;
      if (!total_cfg || !per_cfg) return;
      const validation = this.validateFieldValueWithConfig(val, per_cfg);
      if (!validation.is_valid) {
        this.emitFooterState();
        return;
      }
      const per_norm = this.normalizeFieldValueWithConfig(val, per_cfg);
      const weight = this.toNumberOrDefault(this.gem?.weight_ct);
      const raw_total = this.computeTotal({
        per_carat_value: per_norm,
        weight_ct: weight,
      });
      const norm_total = this.normalizeFieldValueWithConfig(
        raw_total,
        total_cfg
      );
      this.pair_edit_total = this.formatNumberForPairField(
        norm_total,
        total_cfg
      );
      this.emitFooterState();
    },
    formatNumberForPairField(n, field_config) {
      if (n === null || n === undefined || n === "") return "";
      const num = Number(n);
      if (!Number.isFinite(num)) return "";
      const dec = this.getAllowedDecimals(field_config?.input_step);
      if (dec === null) return String(num);
      if (dec === 0) return String(Math.round(num));
      return String(Number(num.toFixed(dec)));
    },
    normalizeFieldValueWithConfig(raw_value, field_config) {
      if (!field_config || field_config.type !== "number") return raw_value;
      if (raw_value === "" || raw_value === null || raw_value === undefined)
        return 0;
      const normalized_value = String(raw_value).trim().replace(",", ".");
      const number_value = Number(normalized_value);
      if (!Number.isFinite(number_value)) return 0;
      const dec = this.getAllowedDecimals(field_config.input_step);
      if (dec === null) return number_value;
      if (dec === 0) return Math.round(number_value);
      return Number(number_value.toFixed(dec));
    },
    validateFieldValueWithConfig(raw_value, field_config) {
      if (!field_config || field_config.type !== "number")
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
      const allowed_decimals = this.getAllowedDecimals(field_config.input_step);
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
    onEnterSubmitFromShell() {
      if ((this.field.input_type || "") === "editor") return;
      this.tryShellSave();
    },
    onEditorInput() {
      this.remote_update_notice = "";
    },
    initialEditValue(raw_value) {
      if (this.is_date_field) return toDateInputValue(raw_value);
      return raw_value;
    },
    onDateEditorInput(value) {
      this.edit_value = value;
      this.onEditorInput();
    },
    normalize_snapshot_value(v) {
      if (this.is_date_field) return toDateInputValue(v);
      if (this.field.type === "number") {
        return this.normalizeFieldValue(v);
      }
      if (v === null || v === undefined) return "";
      return v;
    },
    edit_matches_baseline(baseline) {
      if (this.active_dimensions_merged) {
        return this.serializeDimensionsEditState() === baseline;
      }
      if (this.active_pricing_pair) {
        const norm = this.normalizeFieldValueWithConfig(
          this.pair_edit_total,
          this.pair_field_configs.total
        );
        return this.storedNumericValuesEqual(norm, baseline);
      }
      if (this.field.type === "number") {
        return this.storedNumericValuesEqual(
          this.normalizeFieldValue(this.edit_value),
          baseline
        );
      }
      const b =
        baseline === null || baseline === undefined ? "" : String(baseline);
      const e =
        this.edit_value === null || this.edit_value === undefined
          ? ""
          : String(this.edit_value);
      return e === b;
    },
    on_server_value_changed(nv) {
      if (this.active_pricing_pair || this.active_dimensions_merged) return;
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
        this.edit_value = this.initialEditValue(nv);
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

      const targets_file_meta =
        typeof this.meta_target_path === "string" &&
        this.meta_target_path.trim() !== "";

      let meta_patch;
      let field_key_saved;

      if (this.active_dimensions_merged && !targets_file_meta) {
        field_key_saved = "dimensions_lwh";
        const cfgs = this.axis_mm_configs;
        meta_patch = {
          length_mm: this.normalizeFieldValueWithConfig(
            this.dim_edit_length,
            cfgs.length_mm
          ),
          width_mm: this.normalizeFieldValueWithConfig(
            this.dim_edit_width,
            cfgs.width_mm
          ),
          height_mm: this.normalizeFieldValueWithConfig(
            this.dim_edit_height,
            cfgs.height_mm
          ),
        };
      } else if (this.active_pricing_pair && !targets_file_meta) {
        field_key_saved = this.active_pricing_pair.total_key;
        const norm = this.normalizeFieldValueWithConfig(
          this.pair_edit_total,
          this.pair_field_configs.total
        );
        meta_patch = { [field_key_saved]: norm };
      } else {
        field_key_saved = this.field.key;
        if (targets_file_meta) {
          const raw = this.edit_value;
          if (
            this.field.persist_empty_number_as_null &&
            this.field.type === "number"
          ) {
            const is_empty = raw === "" || raw === null || raw === undefined;
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
      if (this.is_date_field) return toDateInputValue(raw_value);
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
      if (this.active_pricing_pair) {
        if (value === null || value === undefined || value === "") return "—";
        return this.formatAffectedFieldValue(this.toNumberOrDefault(value));
      }
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
      if (this.field.readonly || this.active_dimensions_merged) return;
      const raw =
        entry && Object.prototype.hasOwnProperty.call(entry, "value")
          ? entry.value
          : "";
      if (this.active_pricing_pair) {
        const total = this.toNumberOrDefault(raw);
        const t_cfg = this.pair_field_configs.total;
        const p_cfg = this.pair_field_configs.per;
        if (!t_cfg || !p_cfg) return;
        this.pair_edit_total = this.formatNumberForPairField(total, t_cfg);
        const weight = this.toNumberOrDefault(this.gem?.weight_ct);
        const per = this.computePerCarat({
          total_value: total,
          weight_ct: weight,
        });
        this.pair_edit_per_carat = this.formatNumberForPairField(per, p_cfg);
        this.onEditorInput();
        return;
      }
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
        return value.toLocaleString(getNumberFormatLocale(this.$i18n?.locale), {
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

._pricingPairInputs {
  display: flex;
  flex-direction: column;
  gap: calc(var(--spacing) * 0.75);
}

._pricingPairWeight {
  margin: 0;
  font-size: var(--sl-font-size-x-small);
  line-height: 1.35;
  color: color-mix(in srgb, var(--c-gris_fonce) 88%, transparent);
}

._pricingPairWeightLabel {
  font-weight: 600;
  margin-right: 0.2em;
}

._pricingPairWeightSep {
  margin-right: 0.35em;
}

._pricingPairWeightValue {
  font-family: var(--sl-font-mono);
}

._pricingPairRow {
  display: flex;
  flex-direction: column;
  gap: calc(var(--spacing) / 6);
}

._pricingPairLabel {
  font-size: var(--sl-font-size-x-small);
  font-weight: 600;
  color: color-mix(in srgb, var(--c-gris_fonce) 92%, transparent);
}
</style>
