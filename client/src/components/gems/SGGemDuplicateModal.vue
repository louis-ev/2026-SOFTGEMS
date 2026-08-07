<template>
  <BaseModal2
    :title="$t('sg_duplicate_gem_modal_title')"
    @close="onCloseRequested"
  >
    <p class="_intro">
      {{ $t("sg_duplicate_gem_modal_intro", { name: gem_title }) }}
    </p>

    <p class="_sectionTitle">{{ $t("sg_duplicate_gem_changes_title") }}</p>
    <ul class="_changeList">
      <li v-for="row in change_rows" :key="row.key" class="_changeRow">
        <span class="_fieldLabel">{{ row.label }}</span>
        <span class="_changeArrow">
          <span
            class="_from"
            :class="{ _from_unchanged: row.from_label === row.to_label }"
            >{{ row.from_label }}</span
          >
          <span class="_arrow" aria-hidden="true">&rarr;</span>
          <span class="_to">{{ row.to_label }}</span>
        </span>
      </li>
    </ul>

    <p class="_sectionTitle">{{ $t("sg_duplicate_gem_kept_title") }}</p>
    <ul class="_keptList">
      <li>{{ $t("sg_duplicate_gem_kept_fields") }}</li>
      <li>{{ $t("sg_duplicate_gem_kept_media") }}</li>
    </ul>

    <p v-if="error_message" class="u-errorMsg _error">{{ error_message }}</p>

    <template slot="footer">
      <button
        class="u-button"
        type="button"
        :disabled="is_duplicating"
        @click="onCloseRequested"
      >
        <b-icon icon="x-circle" />
        {{ $t("cancel") }}
      </button>
      <button
        class="u-button u-button_black"
        type="button"
        autofocus
        :disabled="is_duplicating"
        @click="confirmDuplicate"
      >
        <b-icon icon="files" />
        {{
          is_duplicating
            ? $t("sg_duplicate_gem_in_progress")
            : $t("sg_duplicate_gem_confirm")
        }}
      </button>
      <LoaderSpinner v-if="is_duplicating" />
    </template>
  </BaseModal2>
</template>

<script>
import {
  buildGemDuplicateNewMeta,
  listGemDuplicateMetaChanges,
} from "@/utils/gem_duplicate.js";
import { getGemIdFromPath } from "@/utils/gem_pairing.js";

export default {
  name: "SGGemDuplicateModal",
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
  },
  data() {
    return {
      is_duplicating: false,
      error_message: "",
    };
  },
  computed: {
    gem_title() {
      return this.$t("sg_gem_title", { id: this.gem_id });
    },
    change_rows() {
      return listGemDuplicateMetaChanges(this.gem, this.$t.bind(this));
    },
  },
  methods: {
    onCloseRequested() {
      if (this.is_duplicating) return;
      this.$emit("close");
    },
    async confirmDuplicate() {
      if (!this.gem_path || this.is_duplicating) return;
      this.is_duplicating = true;
      this.error_message = "";
      try {
        const copy_folder_path = await this.$api.copyFolder({
          path: this.gem_path,
          path_to_destination_type: "gems",
          new_meta: buildGemDuplicateNewMeta(),
          is_copy_or_move: "copy",
        });
        const new_gem_id = getGemIdFromPath(copy_folder_path);
        // Do not delete api.store.gems here: SGGemsView holds that same array
        // reference. Wiping the store orphans it, so socket folderCreated pushes
        // into a new array the list never sees.
        this.$alertify
          .closeLogOnClick(true)
          .delay(4000)
          .success(
            this.$t("sg_duplicate_gem_success", {
              id: new_gem_id || copy_folder_path,
            })
          );
        this.$emit("duplicated", {
          copy_folder_path,
          new_gem_id,
        });
        this.$emit("close");
      } catch ({ code }) {
        this.error_message =
          code === "not_allowed_to_copy_folder"
            ? this.$t("sg_duplicate_gem_not_allowed")
            : code || this.$t("sg_duplicate_gem_failed");
      } finally {
        this.is_duplicating = false;
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

._changeList,
._keptList {
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

._from {
  text-decoration: line-through;
  opacity: 0.85;
}

._from_unchanged {
  text-decoration: none;
}

._arrow {
  opacity: 0.7;
}

._to {
  color: inherit;
  font-weight: 500;
  text-decoration: none;
  opacity: 1;
}

._error {
  margin: 0 0 calc(var(--spacing) * 0.5);
}

._keptList {
  margin-bottom: calc(var(--spacing) * 0.5);
}
</style>
