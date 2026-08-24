<template>
  <section class="_selectionNewView">
    <div v-if="create_error" class="_errorBlock">
      <p class="u-errorMsg">{{ create_error }}</p>
      <div class="_actions">
        <button type="button" class="u-button" @click="goBack">
          {{ $t("sg_cancel") }}
        </button>
        <button
          type="button"
          class="u-button u-button_bleuvert"
          :disabled="is_creating"
          @click="createSelection"
        >
          {{
            is_creating
              ? $t("sg_create_selection_in_progress")
              : $t("sg_create_selection")
          }}
        </button>
      </div>
    </div>
    <div v-else>{{ $t("sg_create_selection_in_progress") }}</div>
  </section>
</template>

<script>
import { selectionTypeFromSlug } from "@/utils/selection_type_registry.js";
import { defaultSelectionInternalName } from "@/utils/selection_types.js";
import {
  selectionDetailPath,
  selectionListPath,
} from "@/utils/selection_urls.js";
import {
  selectionFolderPath,
  selectionTypeRootPath,
} from "@/utils/selection_paths.js";
import { todayDateInputValue } from "@/utils/date_input.js";

export default {
  name: "SGSelectionNewView",
  props: {
    type_slug: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      is_creating: false,
      create_error: "",
      did_start_create: false,
    };
  },
  computed: {
    new_selection_type() {
      return selectionTypeFromSlug(this.type_slug);
    },
    type_root_path() {
      return selectionTypeRootPath(this.type_slug);
    },
  },
  watch: {
    type_slug: {
      immediate: true,
      handler() {
        this.did_start_create = false;
        this.create_error = "";
        this.$nextTick(() => {
          this.createSelection();
        });
      },
    },
  },
  methods: {
    goBack() {
      this.$router.push(selectionListPath(this.type_slug));
    },
    async createSelection() {
      if (this.is_creating || this.did_start_create) return;
      if (!this.new_selection_type || !this.type_root_path) {
        this.create_error = this.$t("sg_could_not_create_selection");
        return;
      }

      this.did_start_create = true;
      this.is_creating = true;
      this.create_error = "";
      try {
        const additional_meta = {
          $status: "public",
          $admins: "everyone",
          $contributors: "everyone",
          internal_name: "",
          selection_date: todayDateInputValue(),
          selection_entries: [],
        };
        const new_slug = await this.$api.createFolder({
          path: this.type_root_path,
          additional_meta,
        });
        if (new_slug) {
          const folder_path = selectionFolderPath(this.type_slug, new_slug);
          const internal_name = defaultSelectionInternalName(
            this.$t.bind(this),
            this.new_selection_type,
            new_slug
          );
          if (internal_name && folder_path) {
            try {
              await this.$api.updateMeta({
                path: folder_path,
                new_meta: { internal_name },
              });
            } catch {
              /* Folder exists; name can be set on the open view. */
            }
          }
          this.$router.replace(
            selectionDetailPath({
              type_slug: this.type_slug,
              folder_slug: new_slug,
            })
          );
        } else {
          this.$router.replace(selectionListPath(this.type_slug));
        }
      } catch ({ code }) {
        this.create_error = code || this.$t("sg_could_not_create_selection");
        this.did_start_create = false;
      } finally {
        this.is_creating = false;
      }
    },
  },
};
</script>

<style lang="scss" scoped>
._selectionNewView {
  position: relative;
  @include sg-page-padding;
}

._errorBlock {
  display: flex;
  flex-direction: column;
  gap: calc(var(--spacing) * 1);
}

._actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: calc(var(--spacing) / 2);
}
</style>
