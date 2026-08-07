<template>
  <div class="_addressBookView">
    <SGOverlaySidePanelLayout
      :panel_open="is_address_book_panel_open"
      @close="closePanel"
    >
      <div class="_addressBookView--content">
        <div class="_pageHeader">
          <h1 class="_pageTitle">{{ $t("sg_address_book") }}</h1>
          <div class="_headerActions">
            <router-link
              to="/address-book/new"
              class="u-button u-button_bleuvert"
            >
              <b-icon icon="plus-lg" />
              {{ $t("sg_create_contact") }}
            </router-link>
          </div>
        </div>

        <div v-if="is_loading">{{ $t("sg_loading_address_book") }}</div>
        <div v-else-if="fetch_error" class="u-errorMsg">{{ fetch_error }}</div>
        <div v-else class="_listSection">
          <div class="_tableWrap">
            <table class="_table" :aria-label="$t('sg_address_book')">
              <thead>
                <tr>
                  <th scope="col" class="_colName">
                    {{ $t("sg_contact_name") }}
                  </th>
                  <th scope="col" class="_colType">
                    {{ $t("sg_contact_type") }}
                  </th>
                  <th scope="col" class="_colAddress">
                    {{ $t("sg_company_address") }}
                  </th>
                  <th scope="col" class="_colPhone">
                    {{ $t("sg_company_phone") }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="sorted_entries.length === 0" class="_emptyRow">
                  <td colspan="4" class="_emptyCell">
                    {{ $t("sg_address_book_empty") }}
                  </td>
                </tr>
                <template v-else>
                  <tr
                    v-for="contact in paginated_entries"
                    :key="contact.$path || contactIdFromPath(contact.$path)"
                    class="_dataRow"
                    :class="{
                      _selected:
                        selected_contact_slug ===
                        contactIdFromPath(contact.$path),
                    }"
                    tabindex="0"
                    role="button"
                    @click="openContact(contact)"
                    @keydown.enter.prevent="openContact(contact)"
                  >
                    <td class="_colName">
                      <span class="_nameText">{{ contactLabel(contact) }}</span>
                    </td>
                    <td class="_colType">
                      <span
                        v-if="contactTypeLabel(contact.contact_type)"
                        class="_typeBadge"
                      >
                        <b-icon
                          v-if="contactTypeIcon(contact.contact_type)"
                          :icon="contactTypeIcon(contact.contact_type)"
                          class="_typeIcon"
                        />
                        {{ contactTypeLabel(contact.contact_type) }}
                      </span>
                    </td>
                    <td class="_colAddress">
                      <span
                        class="_cellText"
                        :title="contactAddressDisplay(contact)"
                      >
                        {{ contactAddressDisplay(contact) }}
                      </span>
                    </td>
                    <td class="_colPhone">
                      <span
                        class="_cellText"
                        :title="contactFieldDisplay(contact, 'phone')"
                      >
                        {{ contactFieldDisplay(contact, "phone") }}
                      </span>
                    </td>
                  </tr>
                </template>
              </tbody>
            </table>
          </div>
          <SGTablePager
            :total_items="sorted_entries.length"
            :page_index="table_page_index"
            :page_count="table_page_count"
            :range_start="table_page_range_start"
            :range_end="table_page_range_end"
            :page_size="table_page_size"
            @pageChange="goToTablePage($event, sorted_entries)"
            @update:page_size="onTablePageSizeChange"
          />
        </div>
      </div>
      <template #panel>
        <router-view />
      </template>
    </SGOverlaySidePanelLayout>
  </div>
</template>

<script>
import SGOverlaySidePanelLayout from "@/components/softgems/SGOverlaySidePanelLayout.vue";
import SGTablePager from "@/components/softgems/SGTablePager.vue";
import { createTablePaginationMixin } from "@/mixins/TablePaginationMixin.js";
import { formatContactAddress } from "@/utils/contact_address.js";

export default {
  name: "SGAddressBookView",
  mixins: [createTablePaginationMixin("address_book")],
  components: {
    SGOverlaySidePanelLayout,
    SGTablePager,
  },
  data() {
    return {
      address_book_path: "address_book",
      address_book_entries: [],
      is_loading: false,
      fetch_error: "",
      table_rows_previous_length: null,
    };
  },
  computed: {
    is_address_book_panel_open() {
      return ["Create contact", "Open contact"].includes(this.$route.name);
    },
    sorted_entries() {
      if (!Array.isArray(this.address_book_entries)) return [];
      return [...this.address_book_entries].sort((a, b) =>
        this.contactLabel(a).localeCompare(this.contactLabel(b), undefined, {
          sensitivity: "base",
        })
      );
    },
    paginated_entries() {
      return this.paginateTableRows(this.sorted_entries);
    },
    table_page_count() {
      return this.tablePageCountForRows(this.sorted_entries);
    },
    table_page_range_start() {
      return this.tablePageRangeStartForRows(this.sorted_entries);
    },
    table_page_range_end() {
      return this.tablePageRangeEndForRows(this.sorted_entries);
    },
    selected_contact_slug() {
      if (this.$route.name !== "Open contact") return "";
      return this.cleanString(this.$route.params.contact_slug);
    },
  },
  watch: {
    "$route.name": {
      immediate: true,
      handler(route_name) {
        if (route_name === "Address book") {
          this.fetchAddressBook();
        }
      },
    },
    sorted_entries: {
      handler(new_entries) {
        const new_len = Array.isArray(new_entries) ? new_entries.length : 0;
        this.resetTablePageIndexOnRowCountChange(
          new_len,
          this.table_rows_previous_length
        );
        this.table_rows_previous_length = new_len;
        this.clampTablePageIndexForRows(new_entries);
      },
    },
  },
  mounted() {
    this.$api.join({ room: this.address_book_path });
  },
  beforeDestroy() {
    this.$api.leave({ room: this.address_book_path });
  },
  methods: {
    contactIdFromPath(contact_path) {
      const cleaned = this.cleanString(contact_path);
      if (!cleaned) return "";
      const segments = cleaned.split("/");
      return segments[segments.length - 1] || "";
    },
    contactLabel(contact) {
      const raw = typeof contact?.name === "string" ? contact.name.trim() : "";
      if (raw) return raw;
      return (
        this.contactIdFromPath(contact?.$path) || this.$t("sg_contact_untitled")
      );
    },
    contactTypeLabel(contact_type) {
      if (contact_type === "company") return this.$t("sg_contact_type_company");
      if (contact_type === "individual")
        return this.$t("sg_contact_type_individual");
      return "";
    },
    contactTypeIcon(contact_type) {
      if (contact_type === "company") return "building";
      if (contact_type === "individual") return "person";
      return "";
    },
    contactFieldDisplay(contact, field_key) {
      if (!contact || !field_key) return "";
      const raw = contact[field_key];
      if (typeof raw !== "string") return "";
      return this.cleanString(raw);
    },
    contactAddressDisplay(contact) {
      return formatContactAddress(contact);
    },
    cleanString(value) {
      if (value === null || value === undefined) return "";
      return String(value).trim();
    },
    closePanel() {
      this.$router.push("/address-book");
    },
    openContact(contact) {
      const slug = this.contactIdFromPath(contact?.$path);
      if (!slug) return;
      this.$router.push(`/address-book/${encodeURIComponent(slug)}`);
    },
    async fetchAddressBook() {
      this.is_loading = true;
      this.fetch_error = "";

      try {
        const fetched = await this.$api.getFolders({
          path: this.address_book_path,
        });
        this.address_book_entries = Array.isArray(fetched) ? fetched : [];
      } catch ({ code }) {
        this.fetch_error = code || this.$t("sg_could_not_load_address_book");
        this.address_book_entries = [];
      } finally {
        this.is_loading = false;
      }
    },
  },
};
</script>

<style lang="scss" scoped>
@use "@/utils/sg_data_table.scss" as sg_data_table;

._addressBookView {
  position: relative;
  height: 100%;
  min-height: 0;
}

._addressBookView--content {
  position: relative;
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: calc(var(--spacing) * 2) calc(var(--spacing) * 3)
    calc(var(--spacing) * 1);
  box-sizing: border-box;
}

._pageTitle {
  margin: 0;
}

._pageHeader {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--spacing);
  margin-bottom: calc(var(--spacing) * 1);
}

._headerActions {
  display: flex;
  align-items: center;
  gap: calc(var(--spacing) / 2);
}

._listSection {
  min-height: 0;
  flex: 1;
  overflow-y: auto;
}

._tableWrap {
  @include sg_data_table.sg-data-table-wrap;
}

._table {
  @include sg_data_table.sg-data-table;
  width: 100%;
}

._colName {
  width: 26%;
}

._colType {
  width: 14%;
  white-space: nowrap;
}

._colAddress {
  width: 38%;
}

._colPhone {
  width: 22%;
  white-space: nowrap;
}

._nameText {
  font-size: var(--sl-font-size-small);
}

._emptyRow ._emptyCell {
  text-align: center;
  color: var(--c-gris_fonce);
  padding: calc(var(--spacing) * 2);
}

._typeBadge {
  display: inline-flex;
  align-items: center;
  gap: 0.35em;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 0.75rem;
  background: var(--c-gris_clair);
  white-space: nowrap;
}

._typeIcon {
  flex-shrink: 0;
}
</style>
