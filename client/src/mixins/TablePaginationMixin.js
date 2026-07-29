import {
  loadTablePageSize,
  persistTablePageSize,
  table_page_size_default,
} from "@/utils/table_page_size.js";

/** Client-side table pagination with scope-specific localStorage page size. */
export function createTablePaginationMixin(scope) {
  return {
    data() {
      return {
        table_page_index: 0,
        table_page_size: loadTablePageSize(scope),
      };
    },
    methods: {
      tableEffectivePageSize() {
        return Math.max(
          1,
          Number(this.table_page_size) || table_page_size_default
        );
      },
      tablePageCountForRows(rows) {
        const total = Array.isArray(rows) ? rows.length : 0;
        if (total <= 0) return 1;
        const size = this.tableEffectivePageSize();
        return Math.max(1, Math.ceil(total / size));
      },
      tablePageRangeStartForRows(rows) {
        const total = Array.isArray(rows) ? rows.length : 0;
        if (total <= 0) return 0;
        return this.table_page_index * this.tableEffectivePageSize() + 1;
      },
      tablePageRangeEndForRows(rows) {
        const total = Array.isArray(rows) ? rows.length : 0;
        if (total <= 0) return 0;
        const end = (this.table_page_index + 1) * this.tableEffectivePageSize();
        return Math.min(end, total);
      },
      paginateTableRows(rows) {
        const items = Array.isArray(rows) ? rows : [];
        const size = this.tableEffectivePageSize();
        const start = this.table_page_index * size;
        return items.slice(start, start + size);
      },
      clampTablePageIndexForRows(rows) {
        const max_index = Math.max(0, this.tablePageCountForRows(rows) - 1);
        if (this.table_page_index > max_index) this.table_page_index = max_index;
      },
      goToTablePage(delta, rows) {
        const page_count = this.tablePageCountForRows(rows);
        const next = this.table_page_index + delta;
        if (next < 0 || next >= page_count) return;
        this.table_page_index = next;
      },
      onTablePageSizeChange(next_size) {
        this.table_page_size = next_size;
        persistTablePageSize(next_size, scope);
        this.table_page_index = 0;
      },
      resetTablePageIndexOnRowCountChange(new_len, previous_len) {
        if (previous_len !== null && previous_len !== new_len) {
          this.table_page_index = 0;
        }
      },
    },
  };
}
