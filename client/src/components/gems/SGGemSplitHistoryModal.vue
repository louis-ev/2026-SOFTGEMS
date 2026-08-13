<template>
  <BaseModal2
    :title="$t('sg_split_history_modal_title')"
    @close="$emit('close')"
  >
    <p class="_intro">{{ $t("sg_split_history_modal_intro") }}</p>
    <ul class="_list">
      <li v-for="row in history_rows" :key="row.id">
        <button
          type="button"
          class="_row"
          :title="$t('sg_split_history_open_gem', { id: row.id })"
          @click="openGem(row.id)"
        >
          <div class="_preview">
            <CoverField
              :context="'tiny'"
              :ratio="'1 / 1'"
              :cover="previewCover(row.id)"
              :path="gemPath(row.id)"
              :can_edit="false"
            />
          </div>
          <span class="_meta">
            <span class="_id">{{ $t("sg_gem_title", { id: row.id }) }}</span>
            <span v-if="row.date_label" class="_date">{{ row.date_label }}</span>
          </span>
        </button>
      </li>
    </ul>
    <template slot="footer">
      <button class="u-button" type="button" @click="$emit('close')">
        <b-icon icon="x-circle" />
        {{ $t("close") }}
      </button>
    </template>
  </BaseModal2>
</template>

<script>
import { date_format_locale } from "@/utils/format_locale.js";
import { normalizeGemSplits } from "@/utils/gem_split.js";

export default {
  name: "SGGemSplitHistoryModal",
  components: {
    CoverField: () => import("@/adc-core/fields/CoverField.vue"),
  },
  props: {
    splits: {
      type: Array,
      default: () => [],
    },
    gems_path: {
      type: String,
      default: "gems",
    },
  },
  data() {
    return {
      gem_previews: {},
    };
  },
  computed: {
    history_rows() {
      return [...normalizeGemSplits(this.splits)].reverse().map((row) => ({
        id: row.id,
        date_label: this.formatSplitDate(row.date),
      }));
    },
  },
  created() {
    this.fetchPreviews();
  },
  methods: {
    gemPath(gem_id) {
      return `${this.gems_path}/${gem_id}`;
    },
    previewCover(gem_id) {
      const preview = this.gem_previews[gem_id];
      return preview && preview.$cover ? preview.$cover : null;
    },
    formatSplitDate(iso) {
      if (!iso) return "";
      const parsed = new Date(iso);
      if (Number.isNaN(parsed.getTime())) return "";
      return parsed.toLocaleDateString(date_format_locale, {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
    },
    async fetchPreviews() {
      const rows = normalizeGemSplits(this.splits);
      const entries = await Promise.all(
        rows.map(async (row) => {
          try {
            const gem = await this.$api.getFolder({
              path: this.gemPath(row.id),
              no_files: true,
            });
            return [row.id, gem];
          } catch {
            return [row.id, null];
          }
        })
      );
      this.gem_previews = Object.fromEntries(entries);
    },
    openGem(gem_id) {
      this.$emit("openGem", gem_id);
    },
  },
};
</script>

<style lang="scss" scoped>
._intro {
  margin: 0 0 calc(var(--spacing) * 1);
  font-size: var(--sl-font-size-small);
  line-height: 1.45;
}

._list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: calc(var(--spacing) * 0.45);
}

._row {
  display: flex;
  align-items: center;
  gap: calc(var(--spacing) * 0.65);
  width: 100%;
  padding: calc(var(--spacing) * 0.35) calc(var(--spacing) * 0.45);
  border: 1px solid color-mix(in srgb, var(--c-gris_fonce) 18%, transparent);
  border-radius: 6px;
  background: color-mix(in srgb, var(--c-gris_clair) 40%, var(--c-blanc));
  cursor: pointer;
  text-align: left;

  &:hover {
    border-color: color-mix(in srgb, var(--c-bleumarine) 45%, transparent);
    background: color-mix(in srgb, var(--c-bleumarine) 8%, var(--c-blanc));
  }
}

._preview {
  flex: 0 0 auto;
  width: 40px;
  height: 40px;
  border-radius: 4px;
  overflow: hidden;
  background: var(--c-blanc);
}

._meta {
  display: flex;
  flex-direction: column;
  gap: 0.1em;
  min-width: 0;
}

._id {
  font-size: var(--sl-font-size-small);
  font-weight: 600;
  line-height: 1.3;
}

._date {
  font-size: var(--sl-font-size-x-small);
  color: var(--c-gris_fonce);
}
</style>
