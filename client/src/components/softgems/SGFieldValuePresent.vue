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
      class="_value u-input"
      :title="hint_title || undefined"
      @click="$emit('click')"
    >
      <span :class="{ _empty: is_empty }">{{ display_value }}</span>
    </button>
    <div
      v-else
      class="_value u-input _readonly"
      :title="hint_title || undefined"
    >
      <span :class="{ _empty: is_empty }">{{ display_value }}</span>
    </div>
  </div>
</template>

<script>
import { getNumberFormatLocale } from "@/utils/format_locale.js";

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
          ? this.value.toLocaleString(getNumberFormatLocale(this.$i18n?.locale), {
              maximumFractionDigits: 3,
            })
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

._value {
  all: unset;
  box-sizing: border-box;
  display: block;
  width: 100%;
  padding: calc(var(--spacing) * 0.5);
  border: 2px solid transparent;
  border-radius: var(--input-border-radius);
  background-color: var(--c-gris_clair);
  line-height: inherit;
  cursor: pointer;
  text-align: inherit;
  font: inherit;
  transition:
    border-color 0.25s cubic-bezier(0.19, 1, 0.22, 1),
    background-color 0.25s cubic-bezier(0.19, 1, 0.22, 1);

  &:hover {
    border-color: var(--c-gris);
  }

  &._readonly {
    cursor: default;
    opacity: 0.7;

    &:hover {
      border-color: transparent;
    }
  }

  ._empty {
    color: var(--c-gris_fonce);
  }
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
