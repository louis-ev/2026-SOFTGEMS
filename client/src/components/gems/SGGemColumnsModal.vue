<template>
  <BaseModal2 :title="$t('sg_columns_modal_title')" @close="$emit('close')">
    <div class="_modalBody">
      <p class="_instructions">{{ $t("sg_columns_modal_instructions") }}</p>
      <div class="_bulkActions">
        <button
          type="button"
          class="u-button u-button_small"
          :disabled="enabled_columns_count === local_columns.length"
          @click="setAllColumnsEnabled(true)"
        >
          {{ $t("sg_check_all_columns") }}
        </button>
        <button
          type="button"
          class="u-button u-button_small"
          :disabled="enabled_columns_count === 0"
          @click="setAllColumnsEnabled(false)"
        >
          {{ $t("sg_uncheck_all_columns") }}
        </button>
      </div>

      <transition-group tag="div" class="_columnsList" name="columnsReorder">
        <div
          v-for="(column_item, index) in local_columns"
          :key="column_item.metadata_key"
          class="_columnGroup"
        >
          <div
            class="_dropZone"
            :class="{
              _dropZone_active: isDropZoneAvailable(index),
              _dropZone_hovered:
                drag_over_drop_index === index && isDropZoneAvailable(index),
            }"
            @dragover.prevent="handleDragOverDropZone(index)"
            @dragenter.prevent="handleDragEnterDropZone(index)"
            @dragleave="handleDragLeaveDropZone(index)"
            @drop.prevent="handleDropOnDropZone(index)"
          ></div>
          <div
            class="_columnRow"
            :class="{
              _isInactive: !column_item.is_enabled,
              'is--dragSource': dragged_column_index === index,
              _isLocked: column_item.is_locked,
              _dropTargetBefore: isRowDropTargetBefore(index),
              _dropTargetAfter: isRowDropTargetAfter(index),
            }"
            :draggable="!column_item.is_locked"
            @dragstart="handleDragStartColumn(index, $event)"
            @dragend="handleDragEndColumn"
            @dragover.prevent="handleDragOverRow(index, $event)"
            @dragenter.prevent="handleDragEnterRow(index, $event)"
            @drop.prevent="handleDropOnRow(index, $event)"
          >
            <label v-if="!column_item.is_locked" class="_toggleWrap">
              <input
                :checked="column_item.is_enabled"
                type="checkbox"
                :disabled="column_item.is_locked"
                @change="toggleColumn(column_item.metadata_key, $event)"
              />
            </label>
            <span v-else class="_fixedBadge">
              {{ $t("sg_fixed") }}
            </span>

            <span class="_columnLabel">
              <b-icon
                v-if="metadata_icons[column_item.metadata_key]"
                :icon="metadata_icons[column_item.metadata_key]"
                class="_columnIcon"
              />
              {{
                metadata_labels[column_item.metadata_key] ||
                column_item.metadata_key
              }}
            </span>
          </div>
        </div>
      </transition-group>
      <div
        v-if="local_columns.length > 0"
        class="_dropZone _dropZone_last"
        :class="{
          _dropZone_active: isDropZoneAvailable(local_columns.length),
          _dropZone_hovered:
            drag_over_drop_index === local_columns.length &&
            isDropZoneAvailable(local_columns.length),
        }"
        @dragover.prevent="handleDragOverDropZone(local_columns.length)"
        @dragenter.prevent="handleDragEnterDropZone(local_columns.length)"
        @dragleave="handleDragLeaveDropZone(local_columns.length)"
        @drop.prevent="handleDropOnDropZone(local_columns.length)"
      ></div>
    </div>

    <template slot="footer">
      <button type="button" class="u-button" @click="$emit('close')">
        {{ $t("cancel") }}
      </button>
      <button
        type="button"
        class="u-button u-button_bleuvert"
        :disabled="enabled_columns_count === 0"
        @click="save"
      >
        {{ $t("save") }}
      </button>
    </template>
  </BaseModal2>
</template>

<script>
const pinned_metadata_keys = ["id", "$cover"];

export default {
  name: "SGGemColumnsModal",
  props: {
    all_metadata_keys: {
      type: Array,
      default: () => [],
    },
    selected_metadata_keys: {
      type: Array,
      default: () => [],
    },
    metadata_labels: {
      type: Object,
      default: () => ({}),
    },
    metadata_icons: {
      type: Object,
      default: () => ({}),
    },
  },
  data() {
    return {
      local_columns: [],
      dragged_column_index: null,
      drag_over_drop_index: null,
    };
  },
  computed: {
    enabled_columns_count() {
      return this.local_columns.filter((column_item) => column_item.is_enabled)
        .length;
    },
  },
  watch: {
    all_metadata_keys: {
      immediate: true,
      handler() {
        this.syncLocalColumns();
      },
    },
    selected_metadata_keys: {
      immediate: true,
      handler() {
        this.syncLocalColumns();
      },
    },
  },
  methods: {
    syncLocalColumns() {
      const all_keys = Array.isArray(this.all_metadata_keys)
        ? this.all_metadata_keys
        : [];
      const selected_keys = Array.isArray(this.selected_metadata_keys)
        ? this.selected_metadata_keys
        : [];
      const selected_set = new Set(selected_keys);

      const columns = all_keys.map((metadata_key) => ({
        metadata_key,
        is_enabled: selected_set.has(metadata_key),
        is_locked: pinned_metadata_keys.includes(metadata_key),
      }));
      this.local_columns = this.normalizeColumns(columns);
    },
    toggleColumn(metadata_key, event) {
      const is_enabled = Boolean(event?.target?.checked);
      this.local_columns = this.local_columns.map((column_item) => {
        if (column_item.metadata_key !== metadata_key) return column_item;
        if (column_item.is_locked) return { ...column_item, is_enabled: true };
        return { ...column_item, is_enabled };
      });
    },
    setAllColumnsEnabled(is_enabled) {
      this.local_columns = this.local_columns.map((column_item) => ({
        ...column_item,
        is_enabled: column_item.is_locked ? true : is_enabled,
      }));
    },
    normalizeColumns(columns) {
      const pinned_columns = [];
      pinned_metadata_keys.forEach((metadata_key) => {
        const matching_column = (columns || []).find(
          (column_item) => column_item.metadata_key === metadata_key
        );
        if (!matching_column) return;
        pinned_columns.push({
          ...matching_column,
          is_enabled: true,
          is_locked: true,
        });
      });
      const regular_columns = (columns || []).filter(
        (column_item) =>
          !pinned_metadata_keys.includes(column_item.metadata_key)
      );
      return [...pinned_columns, ...regular_columns];
    },
    save() {
      const next_selected_metadata_keys = this.local_columns
        .filter((column_item) => column_item.is_enabled)
        .map((column_item) => column_item.metadata_key);
      this.$emit("save", next_selected_metadata_keys);
    },
    handleDragStartColumn(index, event) {
      const column_item = this.local_columns[index];
      if (!column_item || column_item.is_locked) return;
      if (event?.dataTransfer) {
        event.dataTransfer.effectAllowed = "move";
        // Needed for consistent HTML5 drag behavior across browsers.
        event.dataTransfer.setData("text/plain", column_item.metadata_key);
      }
      this.dragged_column_index = index;
      this.drag_over_drop_index = null;
    },
    handleDragEndColumn() {
      this.dragged_column_index = null;
      this.drag_over_drop_index = null;
    },
    handleDragOverDropZone(index) {
      if (!this.isDropZoneAvailable(index)) return;
      this.drag_over_drop_index = index;
    },
    handleDragEnterDropZone(index) {
      if (!this.isDropZoneAvailable(index)) return;
      this.drag_over_drop_index = index;
    },
    handleDragLeaveDropZone(index) {
      if (this.drag_over_drop_index === index) {
        this.drag_over_drop_index = null;
      }
    },
    getDropIndexForRow(index, event) {
      const row_element = event?.currentTarget;
      if (
        !row_element ||
        typeof row_element.getBoundingClientRect !== "function"
      ) {
        return index;
      }
      const rect = row_element.getBoundingClientRect();
      const middle_y = rect.top + rect.height / 2;
      return event.clientY < middle_y ? index : index + 1;
    },
    handleDragOverRow(index, event) {
      const drop_index = this.getDropIndexForRow(index, event);
      if (!this.isDropZoneAvailable(drop_index)) return;
      this.drag_over_drop_index = drop_index;
    },
    handleDragEnterRow(index, event) {
      const drop_index = this.getDropIndexForRow(index, event);
      if (!this.isDropZoneAvailable(drop_index)) return;
      this.drag_over_drop_index = drop_index;
    },
    handleDropOnRow(index, event) {
      const drop_index = this.getDropIndexForRow(index, event);
      this.handleDropOnDropZone(drop_index);
    },
    handleDropOnDropZone(drop_index) {
      if (!this.isDropZoneAvailable(drop_index)) {
        this.handleDragEndColumn();
        return;
      }

      let target_index = drop_index;
      if (target_index > this.dragged_column_index) target_index -= 1;
      if (target_index === this.dragged_column_index) {
        this.handleDragEndColumn();
        return;
      }

      const reordered_columns = [...this.local_columns];
      const dragged_column = reordered_columns[this.dragged_column_index];
      reordered_columns.splice(this.dragged_column_index, 1);
      reordered_columns.splice(target_index, 0, dragged_column);
      this.local_columns = this.normalizeColumns(reordered_columns);

      this.handleDragEndColumn();
    },
    isDropZoneAvailable(index) {
      if (this.dragged_column_index === null) return false;
      const pinned_count = pinned_metadata_keys.filter((metadata_key) =>
        this.local_columns.some(
          (column_item) => column_item.metadata_key === metadata_key
        )
      ).length;
      if (index < pinned_count) return false;
      return (
        index !== this.dragged_column_index &&
        index !== this.dragged_column_index + 1
      );
    },
    isRowDropTargetBefore(index) {
      return (
        this.drag_over_drop_index === index && this.isDropZoneAvailable(index)
      );
    },
    isRowDropTargetAfter(index) {
      const after_index = index + 1;
      return (
        this.drag_over_drop_index === after_index &&
        this.isDropZoneAvailable(after_index)
      );
    },
  },
};
</script>

<style lang="scss" scoped>
._modalBody {
  display: flex;
  flex-direction: column;
  gap: calc(var(--spacing) / 2);
}

._instructions {
  margin: 0;
  color: var(--c-gris_fonce);
}

._bulkActions {
  display: flex;
  align-items: center;
  gap: calc(var(--spacing) / 4);
}

._columnsList {
  display: flex;
  flex-direction: column;
  gap: calc(var(--spacing) / 8);
  max-height: 50vh;
  overflow: auto;
}

._columnGroup {
  display: flex;
  flex-direction: column;
}

._columnRow {
  display: flex;
  align-items: center;
  gap: calc(var(--spacing) / 2);
  border: 1px solid var(--c-gris);
  border-radius: 6px;
  padding: calc(var(--spacing) / 2);
  background: var(--c-bodybg);
  cursor: grab;
  position: relative;
}

._columnRow._isInactive {
  opacity: 0.45;
}

._columnRow.is--dragSource {
  opacity: 0.35;
}

._columnRow._isLocked {
  cursor: default;
}

._columnRow._dropTargetBefore::before,
._columnRow._dropTargetAfter::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  border: none;
  pointer-events: none;
}

._columnRow._dropTargetBefore::before {
  top: -6px;
}

._columnRow._dropTargetAfter::after {
  bottom: -6px;
}

._dropZone {
  flex: 0 0 auto;
  height: 6px;
  transition: height 0.15s ease;
  pointer-events: auto;
  position: relative;
  border-radius: 6px;

  &::before {
    content: "";
    position: absolute;
    left: 0;
    right: 0;
    top: 50%;
    border-top: 2px dashed var(--c-bleuvert);
    opacity: 0;
    transform: translateY(-50%);
  }
}

._dropZone._dropZone_active {
  background: transparent;
}

._dropZone._dropZone_hovered {
  height: 16px;
  background: color-mix(in srgb, var(--c-bleuvert) 10%, transparent);

  &::before {
    opacity: 1;
  }
}

.columnsReorder-move {
  transition: transform 220ms ease;
}

._columnLabel {
  display: inline-flex;
  align-items: center;
  gap: calc(var(--spacing) / 4);
  flex: 1;
}

._columnIcon {
  opacity: 0.7;
}

._toggleWrap {
  display: inline-flex;
  align-items: center;
  gap: calc(var(--spacing) / 4);
  user-select: none;
}

._fixedBadge {
  display: inline-flex;
  align-items: center;
  gap: calc(var(--spacing) / 5);
  font-size: var(--sl-font-size-x-small);
  color: var(--c-gris_fonce);
  min-width: 72px;
}
</style>
