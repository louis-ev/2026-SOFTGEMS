<template>
  <BaseModal2
    :title="$t('sg_merge_gem_modal_title')"
    size="large"
    :is_closable="!is_merging"
    @close="onCloseRequested"
  >
    <template v-if="show_progress_view">
      <ol class="_progress" role="status" aria-live="polite">
        <li
          v-if="progress_selection_total > 0"
          class="_progressStep"
          :class="progressStepClass('selections')"
        >
          <b-icon
            :icon="progressStepIcon('selections')"
            class="_progressIcon"
          />
          {{
            $t("sg_merge_gem_progress_selections", {
              current: progress_selection_current,
              total: progress_selection_total,
            })
          }}
        </li>
        <li
          class="_progressStep"
          :class="progressStepClass('parent')"
        >
          <b-icon :icon="progressStepIcon('parent')" class="_progressIcon" />
          {{ $t("sg_merge_gem_progress_parent") }}
        </li>
        <li
          class="_progressStep"
          :class="progressStepClass('delete')"
        >
          <b-icon :icon="progressStepIcon('delete')" class="_progressIcon" />
          {{ $t("sg_merge_gem_progress_delete") }}
        </li>
      </ol>
    </template>

    <template v-else>
      <p v-if="parent_id" class="_intro">
        {{
          $t("sg_merge_gem_modal_intro", {
            child_id: gem_id,
            parent_id: parent_id,
          })
        }}
      </p>

      <p v-if="block_message" class="u-errorMsg _error">{{ block_message }}</p>

      <template v-else-if="plan.ok">
        <p class="_sectionTitle">{{ $t("sg_merge_gem_changes_title") }}</p>
        <p class="_legend">
          <span>{{ $t("sg_merge_gem_changes_legend_parent") }}</span>
          <span class="_plus" aria-hidden="true">+</span>
          <span>{{ $t("sg_merge_gem_changes_legend_child") }}</span>
          <span class="_arrow" aria-hidden="true">=</span>
          <span class="_to">{{ $t("sg_merge_gem_changes_legend_result") }}</span>
        </p>
        <ul class="_changeList">
          <li
            v-for="row in parent_change_rows"
            :key="row.key"
            class="_changeRow"
          >
            <span class="_fieldLabel">{{ row.label }}</span>
            <span class="_changeArrow">
              <span class="_from">{{ row.from_label }}</span>
              <span class="_plus" aria-hidden="true">+</span>
              <span class="_addend">{{ row.addend_label }}</span>
              <span class="_arrow" aria-hidden="true">=</span>
              <span class="_to">{{ row.to_label }}</span>
            </span>
          </li>
        </ul>

        <div class="u-notice _discardNotice">
          <b-icon icon="info-circle" />
          {{ $t("sg_merge_gem_discard_notice") }}
        </div>
      </template>
    </template>

    <p v-if="error_message" class="u-errorMsg _error">{{ error_message }}</p>

    <template slot="footer">
      <button
        class="u-button"
        type="button"
        :disabled="is_merging"
        @click="onCloseRequested"
      >
        <b-icon icon="x-circle" />
        {{ $t("cancel") }}
      </button>
      <button
        v-if="plan.ok"
        class="u-button u-button_red"
        type="button"
        autofocus
        :disabled="is_merging"
        @click="confirmMerge"
      >
        <b-icon icon="box-arrow-in-down" />
        {{
          is_merging
            ? $t("sg_merge_gem_in_progress")
            : $t("sg_merge_gem_confirm")
        }}
      </button>
      <LoaderSpinner v-if="is_merging" />
    </template>
  </BaseModal2>
</template>

<script>
import {
  computeGemMergePlan,
  listGemMergeParentChangeRows,
  listGemMergeSelectionPaths,
  runGemMerge,
} from "@/utils/gem_merge.js";
import {
  parseSelectionFolderPath,
  resolveSelectionType,
} from "@/utils/selection_paths.js";
import { selectionTypeLabel as selectionTypeLabelFn } from "@/utils/selection_types.js";

const PROGRESS_STEP_ORDER = Object.freeze(["selections", "parent", "delete"]);

export default {
  name: "SGGemMergeModal",
  props: {
    gem: {
      type: Object,
      default: null,
    },
    gem_path: {
      type: String,
      required: true,
    },
    gem_id: {
      type: String,
      required: true,
    },
    parent_gem: {
      type: Object,
      default: null,
    },
    gems_path: {
      type: String,
      default: "gems",
    },
  },
  data() {
    return {
      loaded_parent: null,
      parent_fetch_done: false,
      is_loading_parent: false,
      is_merging: false,
      error_message: "",
      selection_folders_by_path: {},
      progress_step: "",
      progress_selection_current: 0,
      progress_selection_total: 0,
    };
  },
  computed: {
    parent_id() {
      return String(this.gem?.parent_id || "").trim();
    },
    parent_path() {
      if (!this.parent_id) return "";
      return `${this.gems_path}/${this.parent_id}`;
    },
    resolved_parent() {
      if (this.loaded_parent) return this.loaded_parent;
      if (this.parent_fetch_done) return null;
      return this.parent_gem || null;
    },
    plan() {
      return computeGemMergePlan({
        child: this.gem,
        parent: this.resolved_parent,
      });
    },
    block_message() {
      if (this.is_loading_parent) return "";
      if (this.plan.ok) return "";
      const first = this.plan.errors[0];
      return first ? this.$t(first) : "";
    },
    parent_change_rows() {
      return listGemMergeParentChangeRows({
        plan: this.plan,
        parent: this.resolved_parent,
        child: this.gem,
        t: this.$t.bind(this),
      });
    },
    selection_paths() {
      return listGemMergeSelectionPaths(this.gem);
    },
    show_progress_view() {
      if (this.is_merging) return true;
      if (!this.error_message) return false;
      return Boolean(this.progress_step);
    },
  },
  created() {
    this.loadParent();
    this.loadSelectionFolders();
  },
  methods: {
    onCloseRequested() {
      if (this.is_merging) return;
      this.$emit("close");
    },
    selectionCheckboxLabel(path) {
      const folder = this.selection_folders_by_path[path] || { $path: path };
      const parsed = parseSelectionFolderPath(path);
      const type_value =
        resolveSelectionType(folder) || parsed.selection_type;
      const type_label = selectionTypeLabelFn(this.$t.bind(this), type_value);
      const id = String(parsed.folder_slug || "").trim();
      const name =
        typeof folder.internal_name === "string"
          ? folder.internal_name.trim()
          : "";
      const id_part = id ? `#${id}` : path;
      if (name) return `${type_label} ${id_part} ù ${name}`;
      return `${type_label} ${id_part}`;
    },
    progressStepIndex(step) {
      return PROGRESS_STEP_ORDER.indexOf(step);
    },
    progressStepState(step) {
      const current = this.progressStepIndex(this.progress_step);
      const index = this.progressStepIndex(step);
      if (current < 0 || index < 0) return "pending";
      if (index < current) return "done";
      if (index > current) return "pending";
      if (this.is_merging) return "current";
      return this.error_message ? "failed" : "done";
    },
    progressStepClass(step) {
      const state = this.progressStepState(step);
      return {
        "is--done": state === "done",
        "is--current": state === "current",
        "is--failed": state === "failed",
        "is--pending": state === "pending",
      };
    },
    progressStepIcon(step) {
      const state = this.progressStepState(step);
      if (state === "done") return "check-circle";
      if (state === "failed") return "exclamation-circle";
      if (state === "current") return "arrow-right-circle";
      return "circle";
    },
    async loadParent() {
      if (!this.parent_path) {
        this.parent_fetch_done = true;
        return;
      }
      this.is_loading_parent = true;
      try {
        this.loaded_parent = await this.$api.getFolder({
          path: this.parent_path,
          no_files: true,
        });
      } catch {
        this.loaded_parent = null;
      } finally {
        this.parent_fetch_done = true;
        this.is_loading_parent = false;
      }
    },
    async loadSelectionFolders() {
      const paths = this.selection_paths;
      if (!paths.length) return;
      const results = await Promise.all(
        paths.map(async (path) => {
          try {
            const folder = await this.$api.getFolder({ path });
            return [path, folder || { $path: path }];
          } catch {
            return [path, { $path: path }];
          }
        })
      );
      const by_path = {};
      for (const [path, folder] of results) {
        by_path[path] = folder;
      }
      this.selection_folders_by_path = by_path;
    },
    onMergeProgress(info) {
      if (!info || !info.step) return;
      this.progress_step = info.step;
      if (info.step === "selections") {
        this.progress_selection_current = info.current || 0;
        this.progress_selection_total = info.total || 0;
      }
    },
    async confirmMerge() {
      if (!this.gem_path || this.is_merging || !this.plan.ok) return;
      this.is_merging = true;
      this.error_message = "";
      this.progress_selection_total = this.selection_paths.length;
      this.progress_step = this.selection_paths.length
        ? "selections"
        : "parent";
      try {
        await runGemMerge({
          api: this.$api,
          child: this.gem,
          child_path: this.gem_path,
          child_id: this.gem_id,
          parent: this.resolved_parent,
          parent_path: this.parent_path,
          parent_id: this.parent_id,
          plan: this.plan,
          on_progress: this.onMergeProgress,
        });
        this.$alertify
          .closeLogOnClick(true)
          .delay(4000)
          .success(this.$t("sg_merge_gem_success", { id: this.parent_id }));
        this.$emit("merged", {
          parent_id: this.parent_id,
          parent_path: this.parent_path,
        });
        this.$emit("close");
      } catch (err) {
        const code = err && err.code;
        if (code === "merge_selection_failed") {
          this.error_message = this.$t("sg_merge_gem_selection_failed", {
            name: this.selectionCheckboxLabel(err.selection_path || ""),
          });
        } else if (code === "merge_pairing_failed") {
          this.error_message = this.$t("sg_merge_gem_pairing_failed");
        } else if (code === "merge_parent_update_failed") {
          this.error_message = this.$t("sg_merge_gem_parent_update_failed");
        } else if (code === "merge_delete_failed") {
          this.error_message = this.$t("sg_merge_gem_delete_failed", {
            id: this.gem_id,
          });
        } else {
          this.error_message = code || this.$t("sg_merge_gem_failed");
        }
      } finally {
        this.is_merging = false;
      }
    },
  },
};
</script>

<style lang="scss" scoped>
._intro {
  margin: 0 0 calc(var(--spacing) * 1.25);
  font-size: var(--sl-font-size-small);
  line-height: 1.45;
}

._sectionTitle {
  margin: 0 0 calc(var(--spacing) * 0.5);
  font-size: var(--sl-font-size-small);
  font-weight: 600;
}

._legend {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.35em;
  margin: 0 0 calc(var(--spacing) * 0.75);
  font-size: var(--sl-font-size-x-small, 0.75rem);
  line-height: 1.4;
  color: var(--color-gray, #666);
  font-style: italic;
}

._changeList {
  margin: 0 0 calc(var(--spacing) * 1.25);
  padding-left: 1.2em;
  font-size: var(--sl-font-size-small);
  line-height: 1.45;
}

._changeRow {
  margin-bottom: 0.35em;
}

._fieldLabel {
  display: block;
  font-weight: 600;
}

._changeArrow {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.35em;
  color: var(--color-gray, #666);
}

._from,
._addend {
  opacity: 0.9;
}

._plus,
._arrow {
  opacity: 0.7;
}

._to {
  color: inherit;
  font-weight: 600;
  text-decoration: none;
  opacity: 1;
}

._discardNotice {
  margin-top: calc(var(--spacing) * 0.25);
}

._progress {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: calc(var(--spacing) * 0.65);
}

._progressStep {
  display: flex;
  align-items: center;
  gap: calc(var(--spacing) * 0.45);
  font-size: var(--sl-font-size-small);
  line-height: 1.4;
  color: var(--color-gray, #666);
}

._progressStep.is--current {
  color: inherit;
  font-weight: 600;
}

._progressStep.is--done {
  color: inherit;
}

._progressStep.is--failed {
  color: var(--c-rouge, #b00020);
  font-weight: 600;
}

._progressIcon {
  flex-shrink: 0;
}

._error {
  margin: 0 0 calc(var(--spacing) * 0.5);
}
</style>
