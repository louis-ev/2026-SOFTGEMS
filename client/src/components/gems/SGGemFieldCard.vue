<template>
  <div class="_gemFieldCard" :class="{ _flashing: is_flashing }">
    <DLabel :str="label" :icon="icon" />
    <button
      v-if="!readonly"
      type="button"
      class="_value u-input"
      @click="$emit('click')"
    >
      <span :class="{ _empty: is_empty }">{{ display_value }}</span>
    </button>
    <div v-else class="_value u-input _readonly">
      <span :class="{ _empty: is_empty }">{{ display_value }}</span>
    </div>
  </div>
</template>

<script>
export default {
  name: "SGGemFieldCard",
  props: {
    label: {
      type: String,
      required: true,
    },
    icon: {
      type: String,
      default: null,
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
  },
  computed: {
    is_empty() {
      const v = this.value;
      return v === null || v === undefined || v === "";
    },
    display_value() {
      if (this.is_empty) return "—";
      if (typeof this.value === "number")
        return Number.isFinite(this.value)
          ? this.value.toLocaleString("fr-FR", {
              maximumFractionDigits: 3,
            })
          : "—";
      return String(this.value);
    },
  },
};
</script>

<style lang="scss" scoped>
._gemFieldCard {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

._gemFieldCard._flashing ._value {
  animation: _flashFieldCardFade 2s ease-out 1;
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
  transition: border-color 0.25s cubic-bezier(0.19, 1, 0.22, 1),
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

@keyframes _flashFieldCardFade {
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
