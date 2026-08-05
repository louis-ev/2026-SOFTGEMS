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
      :class="{
        _empty: is_empty,
        _hasTrailing: has_value_trailing,
        _richText: is_rich_text,
      }"
      :title="hint_title || undefined"
      @click="$emit('click')"
    >
      <span
        v-if="is_rich_text && !is_empty"
        class="_valueText _valueRichText"
        v-html="rich_text_html"
      />
      <span v-else class="_valueText">{{ display_value }}</span>
      <div v-if="has_value_trailing" class="_valueTrailing" @click.stop>
        <slot name="value_trailing" />
      </div>
    </button>
    <div
      v-else
      class="u-input _value _valueReadonly"
      :class="{
        _empty: is_empty,
        _hasTrailing: has_value_trailing,
        _richText: is_rich_text,
      }"
      :title="hint_title || undefined"
    >
      <span
        v-if="is_rich_text && !is_empty"
        class="_valueText _valueRichText"
        v-html="rich_text_html"
      />
      <span v-else class="_valueText">{{ display_value }}</span>
      <div v-if="has_value_trailing" class="_valueTrailing">
        <slot name="value_trailing" />
      </div>
    </div>
  </div>
</template>

<script>
import { formatDisplayNumber } from "@/utils/format_locale.js";
import { gemStatusLabel } from "@/utils/gem_status.js";
import { htmlToPlainText } from "@/utils/rich_text.js";

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
    /** When `"date"`, formats ISO / stored dates. When `"rich_text"`, renders HTML preview. */
    value_type: {
      type: String,
      default: "",
    },
  },
  computed: {
    has_value_trailing() {
      return Boolean(this.$slots.value_trailing);
    },
    is_rich_text() {
      return this.value_type === "rich_text";
    },
    is_empty() {
      const v = this.value;
      if (v === null || v === undefined || v === "") return true;
      if (this.is_rich_text) {
        return htmlToPlainText(v) === "";
      }
      return false;
    },
    rich_text_html() {
      if (!this.is_rich_text || this.is_empty) return "";
      return typeof this.value === "string" ? this.value : String(this.value);
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
      if (this.is_rich_text) {
        return htmlToPlainText(this.value) || "—";
      }
      if (typeof this.value === "number" || typeof this.value === "string") {
        const formatted = formatDisplayNumber(this.value, {
          maximumFractionDigits: 3,
        });
        if (formatted !== null) return formatted;
      }
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

._value._hasTrailing {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: calc(var(--spacing) * 0.35);
}

._valueText {
  flex: 1 1 auto;
  min-width: 0;
  font-weight: 400;
}

._value._richText {
  align-items: flex-start;
  min-height: calc(var(--spacing) * 2.5);
  height: auto;
  white-space: normal;
}

._valueRichText {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 6;
  overflow: hidden;
  line-height: 1.45;
  pointer-events: none;

  :deep(p) {
    margin: 0 0 0.35em;
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
    color: var(--c-bleuvert, #2a6f7a);
    text-decoration: underline;
  }
}

._valueTrailing {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
}

._value._empty {
  color: var(--c-gris_fonce);
}

._valueReadonly {
  cursor: default;
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
