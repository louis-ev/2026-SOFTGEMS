<template>
  <SGSectionPanel
    section_id="gem_selections"
    :title="$t('sg_section_gem_selections')"
  >
    <div v-if="is_loading">{{ $t("sg_loading_selections") }}</div>
    <div v-else-if="fetch_error" class="u-errorMsg">{{ fetch_error }}</div>
    <div v-else-if="membership_rows.length === 0" class="_empty">
      {{ $t("sg_gem_selections_empty") }}
    </div>
    <div v-else class="_tableWrap">
      <table class="_table" :aria-label="$t('sg_section_gem_selections')">
        <thead>
          <tr>
            <th scope="col">{{ $t("sg_selection_type_label") }}</th>
            <th scope="col">{{ $t("sg_selection_internal_name") }}</th>
            <th scope="col">{{ $t("sg_selection_date") }}</th>
            <th scope="col">{{ $t("sg_selection_reference_number") }}</th>
            <th scope="col">{{ $t("sg_selection_counterparty") }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in membership_rows" :key="row.$path">
            <td>
              <span class="_typeCell">
                <b-icon :icon="typeIcon(row)" class="_typeIcon" />
                <span>{{ formatSelectionType(row.selection_type) }}</span>
                <span
                  v-if="isCurrentBoxRow(row)"
                  class="_boxBadge"
                >
                  {{ $t("sg_gem_selections_current_box") }}
                </span>
              </span>
            </td>
            <td>
              <router-link class="u-buttonLink" :to="detailPath(row)">
                {{ selectionLabel(row) }}
              </router-link>
            </td>
            <td>{{ formatDateCell(row.selection_date) }}</td>
            <td>{{ displayText(row.reference_number) }}</td>
            <td>{{ counterpartyLabel(row.counterparty_path) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </SGSectionPanel>
</template>

<script>
import SGSectionPanel from "@/components/softgems/SGSectionPanel.vue";
import FormatDates from "@/mixins/FormatDates.js";
import {
  findGemSelectionMemberships,
  selectionFolderSlugFromPath,
  selectionMembershipTypeSlug,
} from "@/utils/gem_selection_memberships.js";
import { selectionTypeIconFromSlug } from "@/utils/selection_type_registry.js";
import { selectionDetailPath } from "@/utils/selection_urls.js";
import { selectionTypeLabel as selectionTypeLabelFn } from "@/utils/selection_types.js";

export default {
  name: "SGGemSelectionsSection",
  mixins: [FormatDates],
  components: {
    SGSectionPanel,
  },
  props: {
    gem_path: {
      type: String,
      required: true,
    },
    gem: {
      type: Object,
      default: null,
    },
  },
  data() {
    return {
      selections_root_path: "selections",
      selection_folders: [],
      counterparty_labels: {},
      is_loading: false,
      fetch_error: "",
    };
  },
  computed: {
    membership_rows() {
      return findGemSelectionMemberships({
        gem_path: this.gem_path,
        gem: this.gem,
        selection_folders: this.selection_folders,
      });
    },
  },
  watch: {
    gem_path: {
      immediate: true,
      handler() {
        this.loadMemberships();
      },
    },
    gem: {
      deep: true,
      handler() {
        this.loadMemberships();
      },
    },
  },
  methods: {
    formatSelectionType(value) {
      return selectionTypeLabelFn(this.$t.bind(this), value);
    },
    typeIcon(row) {
      const slug = selectionMembershipTypeSlug(row);
      return selectionTypeIconFromSlug(slug);
    },
    isCurrentBoxRow(row) {
      const box_path = String(this.gem?.box_selection_path || "").trim();
      return Boolean(box_path && row?.$path === box_path);
    },
    selectionLabel(row) {
      const raw =
        typeof row?.internal_name === "string" ? row.internal_name.trim() : "";
      if (raw) return raw;
      return (
        selectionFolderSlugFromPath(row?.$path) ||
        this.$t("sg_selection_untitled")
      );
    },
    detailPath(row) {
      const folder_slug = selectionFolderSlugFromPath(row?.$path);
      const type_slug = selectionMembershipTypeSlug(row);
      return selectionDetailPath({
        type_slug,
        folder_slug,
        internal_name: row?.internal_name,
        selection_type: row?.selection_type,
      });
    },
    displayText(value) {
      const raw = value === null || value === undefined ? "" : String(value).trim();
      return raw || "—";
    },
    formatDateCell(raw) {
      if (!raw) return "—";
      return this.formatDate(raw, {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
    },
    counterpartyLabel(path_raw) {
      const path = String(path_raw || "").trim();
      if (!path) return "—";
      return this.counterparty_labels[path] || path;
    },
    async loadMemberships() {
      if (!this.gem_path) return;
      this.is_loading = true;
      this.fetch_error = "";
      try {
        const fetched = await this.$api.getFolders({
          path: this.selections_root_path,
        });
        this.selection_folders = Array.isArray(fetched) ? fetched : [];
        await this.resolveCounterpartyLabels(this.membership_rows);
      } catch ({ code }) {
        this.fetch_error = code || this.$t("sg_could_not_load_selections");
        this.selection_folders = [];
      } finally {
        this.is_loading = false;
      }
    },
    async resolveCounterpartyLabels(rows) {
      const paths = [
        ...new Set(
          (Array.isArray(rows) ? rows : [])
            .map((row) => String(row?.counterparty_path || "").trim())
            .filter(Boolean)
        ),
      ];
      const next_labels = { ...this.counterparty_labels };
      await Promise.all(
        paths.map(async (path) => {
          const cached = this.$api.store?.[path];
          if (cached?.name) {
            next_labels[path] = String(cached.name).trim();
            return;
          }
          try {
            const folder = await this.$api.getFolder({ path });
            next_labels[path] =
              typeof folder?.name === "string"
                ? folder.name.trim()
                : path;
          } catch {
            next_labels[path] = path;
          }
        })
      );
      this.counterparty_labels = next_labels;
    },
  },
};
</script>

<style lang="scss" scoped>
._empty {
  color: var(--c-gris_fonce);
}

._tableWrap {
  overflow-x: auto;
}

._table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--sl-font-size-small);

  th,
  td {
    text-align: left;
    padding: calc(var(--spacing) * 0.65) calc(var(--spacing) * 0.85);
    border-bottom: 1px solid var(--c-gris_clair);
    vertical-align: middle;
  }

  thead th {
    font-weight: 600;
    font-size: var(--sl-font-size-x-small);
    color: var(--c-gris_fonce);
    border-bottom: 1px solid var(--c-gris);
  }
}

._typeCell {
  display: inline-flex;
  align-items: center;
  gap: calc(var(--spacing) * 0.35);
  white-space: nowrap;
}

._typeIcon {
  flex-shrink: 0;
}

._boxBadge {
  display: inline-block;
  margin-left: calc(var(--spacing) * 0.25);
  padding: 1px 6px;
  border-radius: 999px;
  font-size: 0.68rem;
  background: var(--c-gris_clair);
  color: var(--c-gris_fonce);
}
</style>
