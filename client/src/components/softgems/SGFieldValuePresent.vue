<template>
  <div class="sg-field-value-present" :class="{ _flashing: is_flashing }">
    <div class="_labelRow">
      <DLabel :str="label" :icon="icon || null" />
      <span v-if="pill_text" class="_linkRolePill">{{ pill_text }}</span>
      <slot name="label_append" />
    </div>
    <button
      v-if="!readonly"
      type="button"
      class="u-input _value"
      :class="{ _empty: is_empty }"
      :title="hint_title || undefined"
      @click="$emit('click')"
    >
      {{ display_value }}
    </button>
    <input
      v-else
      :value="display_value"
      class="u-input _value"
      :class="{ _empty: is_empty }"
      readonly
      :title="hint_title || undefined"
    />
  </div>
</template>

<script>
import { getNumberFormatLocale } from "@/utils/format_locale.js";
import { gemStatusLabel } from "@/utils/gem_status.js";

export default {
  name: "SGFieldValuePresent",
  props: {
    label: {
      type: String,
      required: true,
    },
    icon: {
      type: String,
      default: "",
    },
    value: {
      default: "",
    },
    readonly: {
      type: Boolean,
      default: false,
    },
    is_flashing: {
      type: Boolean,
      default: false,
    },
    pill_text: {
      type: String,
      default: "",
    },
    hint_title: {
      type: String,
      default: "",
    },
    /** When `"date"`, formats ISO / stored dates for display. */
    value_type: {
      type: String,
      default: "",
    },
  },
  computed: {
    is_empty() {
      const v = this.value;
      return v === null || v === undefined || v === "";
    },
    display_value() {
      if (this.is_empty) return "—";
      if (this.value_type === "gem_status") {
        return gemStatusLabel(this.$t.bind(this), this.value);
      }
      if (this.value_type === "date") {
        const formatted = this.formatDate(this.value, {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        });
        return formatted || String(this.value);
      }
      if (typeof this.value === "number")
        return Number.isFinite(this.value)
          ? this.value.toLocaleString(
              getNumberFormatLocale(this.$i18n?.locale),
              {
                maximumFractionDigits: 3,
              }
            )
          : "—";
      return String(this.value);
    },
  },
};
</script>

<style lang="scss" scoped>
.sg-field-value-present {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.sg-field-value-present._flashing ._value {
  animation: sg_field_value_present_flash 4s ease-out 1;
}

._labelRow {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: calc(var(--spacing) / 3);
}

._linkRolePill {
  flex-shrink: 0;
  margin-top: 2px;
  font-size: 0.62rem;
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--c-gris_fonce);
  background: var(--c-blanc);
  border: 1px solid var(--c-gris_clair);
  border-radius: 4px;
  padding: 3px 6px;
}

button._value {
  cursor: pointer;
  text-align: left;
}

._value._empty {
  color: var(--c-gris_fonce);
}

@keyframes sg_field_value_present_flash {
  0% {
    background: color-mix(in srgb, var(--c-bleuvert) 25%, var(--c-gris_clair));
    border-color: color-mix(in srgb, var(--c-bleuvert) 70%, transparent);
  }
  100% {
    background: var(--c-gris_clair);
    border-color: transparent;
  }
}
</style>
