<template>
  <BaseModal2
    :title="modal_title"
    :is_loading="is_saving"
    @close="$emit('close')"
  >
    <div class="_body">
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
        />
        <TextInput
          v-else
          :content.sync="edit_value"
          :input_type="field.input_type || 'text'"
          :input_step="field.input_step"
          :instructions="field.instructions"
          :disabled="auxiliary_disable"
          :autofocus="true"
        />
        <p v-if="field_validation_error" class="_fieldError">
          {{ field_validation_error }}
        </p>
        <p v-if="affected_fields_notice" class="_impactNotice">
          {{ affected_fields_notice }}
        </p>
      </div>

      <div v-if="!meta_target_path" class="u-spacingBottom"></div>

      <template v-if="!meta_target_path">
        <button type="button" class="_historyToggle" @click="toggleHistory">
          <b-icon icon="clock-history" />
          <span>{{ $t("sg_field_history") }}</span>
          <b-icon
            :icon="show_history ? 'chevron-up' : 'chevron-down'"
            class="_chevron"
          />
        </button>

        <transition name="fade_fast">
          <div v-if="show_history" class="_historyPanel">
            <div v-if="is_loading_history" class="_historyLoading">
              <LoaderSpinner />
            </div>
            <p v-else-if="field_history.length === 0" class="_historyEmpty">
              {{ $t("sg_no_history") }}
            </p>
            <ul v-else class="_historyList">
              <li
                v-for="(entry, index) in field_history"
                :key="index"
                class="_historyEntry"
                @click="copyHistoryValue(entry)"
              >
                <span class="_historyValue">
                  {{ formatHistoryValue(entry.value) }}
                  <span v-if="entry.event === 'created'" class="_createdBadge">
                    initial
                  </span>
                </span>
                <span class="_historyMeta">
                  {{ $t("sg_history_changed_on") }}
                  <time :datetime="entry.ts">{{ formatDate(entry.ts) }}</time>
                  <template v-if="entry.author_path">
                    {{ $t("sg_history_by") }}
                    <strong>{{ formatAuthor(entry.author_path) }}</strong>
                  </template>
                </span>
              </li>
            </ul>
          </div>
        </transition>
      </template>
    </div>

    <template slot="footer">
      <button type="button" class="u-button" @click="$emit('close')">
        {{ $t("cancel") }}
      </button>
      <button
        type="button"
        class="u-button u-button_bleuvert"
        :disabled="is_save_disabled"
        @click="save"
      >
        {{ is_saving ? "…" : $t("save") }}
      </button>
    </template>
  </BaseModal2>
</template>

<script>
import SGSelectField from "@/components/softgems/SGSelectField.vue";
import GemPricing from "@/mixins/GemPricing";

export default {
  name: "SGGemEditFieldModal",
  mixins: [GemPricing],
  components: {
    SGSelectField,
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
    /** When set, save patches this path (gem file meta) instead of gem folder meta */
    meta_target_path: {
      type: String,
      default: "",
    },
    /** First line for modal title (e.g. certificate filename) when editing file meta */
    context_heading: {
      type: String,
      default: "",
    },
    auxiliary_disable: {
      type: Boolean,
      default: false,
    },
  },
  computed: {
    gem_id() {
      const parts = this.gem_path.split("/");
      return parts[parts.length - 1] || this.gem_path;
    },
    modal_title() {
      const heading_line = String(this.context_heading || "").trim();
      if (heading_line) {
        return `${heading_line} — ${this.field.label}`;
      }
      return `${this.$t("sg_gem_title", { id: this.gem_id })} — ${
        this.field.label
      }`;
    },
    field_validation() {
      return this.validateFieldValue(this.edit_value);
    },
    field_validation_error() {
      if (this.field_validation.is_valid) return "";
      return this.field_validation.error_message;
    },
    is_save_disabled() {
      return (
        this.auxiliary_disable ||
        this.field.readonly ||
        this.is_saving ||
        !this.field_validation.is_valid
      );
    },
    history_field_key() {
      return this.field.pricing_total_key || this.field.key;
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
  },
  data() {
    return {
      edit_value: this.current_value,
      show_history: false,
      is_loading_history: false,
      is_saving: false,
      field_history: [],
    };
  },
  methods: {
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
        this.field_history = this.extractFieldEntries(
          entries,
          this.history_field_key
        );
      } catch {
        this.field_history = [];
      } finally {
        this.is_loading_history = false;
      }
    },
    // Extracts all history entries relevant to a single field from the flat
    // log. The "created" event gives us the initial state; "updated" events
    // give subsequent changes. Returned newest-first for display.
    extractFieldEntries(entries, field_key) {
      const result = [];
      for (const entry of entries) {
        if (
          entry.event === "created" &&
          entry.fields &&
          Object.prototype.hasOwnProperty.call(entry.fields, field_key)
        ) {
          result.push({
            ts: entry.ts,
            value: entry.fields[field_key],
            author_path: entry.author || "",
            event: "created",
          });
        } else if (entry.event === "updated" && entry.field === field_key) {
          result.push({
            ts: entry.ts,
            value: entry.value,
            author_path: entry.author || "",
            event: "updated",
          });
        }
      }
      return result.reverse();
    },
    async save() {
      if (
        this.field.readonly ||
        this.is_saving ||
        !this.field_validation.is_valid
      )
        return;

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

      this.is_saving = true;
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
        this.$emit("close");
      } catch ({ code }) {
        this.$alertify.delay(4000).error(code || this.$t("couldntbesaved"));
      } finally {
        this.is_saving = false;
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
    },
    formatDate(iso_string) {
      if (!iso_string) return "";
      return new Date(iso_string).toLocaleString();
    },
    formatAuthor(author_path) {
      if (!author_path) return "";
      const author = this.getAuthor(author_path);
      if (author) return author.name;
      const parts = String(author_path).split("/");
      return parts[parts.length - 1] || author_path;
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
        return value.toLocaleString("fr-FR", {
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
  },
};
</script>

<style lang="scss" scoped>
._body {
  display: flex;
  flex-direction: column;
  // gap: calc(var(--spacing) * 0.6);
  // padding-bottom: calc(var(--spacing) * 0.5);
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

._impactNotice {
  margin: calc(var(--spacing) / 6) 0 0;
  color: var(--c-gris_fonce);
  font-size: var(--sl-font-size-x-small);
}

._historyToggle {
  all: unset;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: calc(var(--spacing) / 4);
  font-size: var(--sl-font-size-x-small);
  color: var(--c-gris_fonce);
  padding: calc(var(--spacing) / 4) 0;
  // border-top: 1px solid var(--c-gris_clair);
  width: 100%;

  &:hover {
    color: var(--c-noir);
  }

  ._chevron {
    margin-left: auto;
  }
}

._historyPanel {
  background: var(--c-gris_clair);
  border-radius: 6px;
  padding: calc(var(--spacing) * 0.6);
}

._historyLoading {
  display: flex;
  justify-content: center;
  padding: calc(var(--spacing) / 2);
}

._historyEmpty {
  margin: 0;
  font-size: var(--sl-font-size-x-small);
  color: var(--c-gris_fonce);
}

._historyList {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: calc(var(--spacing) / 3);
}

._historyEntry {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: calc(var(--spacing) / 4) calc(var(--spacing) / 3);
  background: var(--c-blanc);
  border-radius: 4px;
  border-left: 2px solid var(--c-gris);
  cursor: pointer;
  transition: background-color 0.15s ease;

  &:hover {
    background: var(--c-gris_clair);
  }
}

._historyValue {
  font-family: var(--sl-font-mono);
  font-size: var(--sl-font-size-x-small);
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: calc(var(--spacing) / 4);
}

._createdBadge {
  font-family: var(--sl-font-sans);
  font-size: 0.7em;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--c-gris_fonce);
  border: 1px solid var(--c-gris);
  border-radius: 3px;
  padding: 0 3px;
}

._historyMeta {
  font-size: var(--sl-font-size-x-small);
  color: var(--c-gris_fonce);
}
</style>
