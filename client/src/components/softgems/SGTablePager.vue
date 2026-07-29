<template>
  <div
    v-if="total_items > 0"
    class="_tablePager"
    role="navigation"
    :aria-label="nav_label || $t('sg_table_page_nav_label')"
  >
    <div class="_tablePagerLeft">
      <button
        type="button"
        class="u-buttonLink _tablePagerLink"
        :disabled="page_index === 0"
        @click="$emit('pageChange', -1)"
      >
        {{ $t("sg_gems_page_previous") }}
      </button>
      <p class="_tablePagerStatus" role="status">
        {{
          $t("sg_gems_page_status", {
            start: range_start,
            end: range_end,
            total: total_items,
            page: page_index + 1,
            pages: page_count,
          })
        }}
      </p>
      <button
        type="button"
        class="u-buttonLink _tablePagerLink"
        :disabled="page_index >= page_count - 1"
        @click="$emit('pageChange', 1)"
      >
        {{ $t("sg_gems_page_next") }}
      </button>
    </div>
    <label class="_tablePageSize">
      <span class="_tablePageSizeLabel">{{
        $t("sg_table_page_size_label")
      }}</span>
      <select
        class="_tablePageSizeSelect"
        size="small"
        :value="page_size"
        :aria-label="$t('sg_table_page_size_aria')"
        @change="onPageSizeChange"
      >
        <option
          v-for="option in page_size_options"
          :key="option"
          :value="option"
        >
          {{ option }}
        </option>
      </select>
    </label>
  </div>
</template>

<script>
import { table_page_size_options } from "@/utils/table_page_size.js";

export default {
  name: "SGTablePager",
  props: {
    total_items: { type: Number, default: 0 },
    page_index: { type: Number, default: 0 },
    page_count: { type: Number, default: 1 },
    range_start: { type: Number, default: 0 },
    range_end: { type: Number, default: 0 },
    page_size: { type: Number, required: true },
    page_size_options: {
      type: Array,
      default: () => [...table_page_size_options],
    },
    nav_label: { type: String, default: "" },
  },
  methods: {
    onPageSizeChange(event) {
      const next_size = Number(event?.target?.value);
      if (!Number.isFinite(next_size) || next_size <= 0) return;
      this.$emit("update:page_size", next_size);
    },
  },
};
</script>

<style lang="scss" scoped>
._tablePager {
  display: flex;
  flex-flow: row wrap;
  justify-content: space-between;
  align-items: center;
  gap: calc(var(--spacing) / 3);
  padding: calc(var(--spacing) / 8) 0;
}

._tablePagerLeft {
  display: flex;
  flex-flow: row wrap;
  justify-content: flex-start;
  align-items: center;
  gap: calc(var(--spacing) / 3);
}

._tablePagerStatus {
  margin: 0;
  font-size: var(--sl-font-size-x-small);
  color: color-mix(in srgb, var(--c-gris_fonce) 88%, transparent);
  text-align: center;
  line-height: 1.25;
}

._tablePagerLink {
  flex-shrink: 0;
  font-size: var(--sl-font-size-x-small);
}

._tablePageSize {
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  gap: calc(var(--spacing) / 4);
  font-size: var(--sl-font-size-x-small);
  color: color-mix(in srgb, var(--c-gris_fonce) 88%, transparent);
}

._tablePageSizeLabel {
  flex-shrink: 0;
}

._tablePageSizeSelect {
  min-width: 4rem;
}
</style>
