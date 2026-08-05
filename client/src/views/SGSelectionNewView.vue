<template>
  <section class="_selectionNewView">
    <div class="_pageHeader">
      <h1 class="_pageTitle">{{ page_title }}</h1>
      <p v-if="active_type_label" class="_typeReadonly">
        {{ $t("sg_selection_type_label") }}:
        <strong>{{ active_type_label }}</strong>
      </p>
    </div>

    <form class="_form" @submit.prevent="createSelection">
      <SGSectionPanel
        section_id="selection_identity"
        :title="$t('sg_section_contact_identity')"
      >
        <div class="_fieldsGrid">
          <div>
            <DLabel :str="$t('sg_selection_internal_name')" icon="pencil" />
            <TextInput
              ref="name_input"
              :content.sync="new_internal_name"
              :required="true"
              :autofocus="true"
              @update:content="onNameInput"
            />
            <p v-if="name_error" class="_fieldError">{{ name_error }}</p>
          </div>
        </div>
      </SGSectionPanel>

      <div class="_actions">
        <button type="button" class="u-button" @click="goBack">
          {{ $t("sg_cancel") }}
        </button>
        <button
          type="submit"
          class="u-button u-button_bleuvert"
          :disabled="is_create_disabled"
        >
          {{
            is_creating
              ? $t("sg_create_selection_in_progress")
              : $t("sg_create_selection")
          }}
        </button>
      </div>
    </form>
  </section>
</template>

<script>
import SGSectionPanel from "@/components/softgems/SGSectionPanel.vue";
import { selectionTypeFromSlug } from "@/utils/selection_type_registry.js";
import {
  selectionDetailPath,
  selectionListPath,
} from "@/utils/selection_urls.js";
import { selectionTypeLabel as selectionTypeLabelFn } from "@/utils/selection_types.js";
import { selectionTypeRootPath } from "@/utils/selection_paths.js";
import { todayDateInputValue } from "@/utils/date_input.js";

export default {
  name: "SGSelectionNewView",
  components: {
    SGSectionPanel,
  },
  props: {
    type_slug: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      new_internal_name: "",
      name_touched: false,
      is_creating: false,
    };
  },
  computed: {
    new_selection_type() {
      return selectionTypeFromSlug(this.type_slug);
    },
    type_root_path() {
      return selectionTypeRootPath(this.type_slug);
    },
    active_type_label() {
      if (!this.new_selection_type) return "";
      return selectionTypeLabelFn(this.$t.bind(this), this.new_selection_type);
    },
    page_title() {
      if (!this.active_type_label) return this.$t("sg_create_selection_title");
      return this.$t("sg_create_selection_of_type", {
        type: this.active_type_label,
      });
    },
    trimmed_name() {
      return this.cleanString(this.new_internal_name);
    },
    name_error() {
      if (!this.name_touched) return "";
      if (!this.trimmed_name) return this.$t("sg_selection_name_required");
      return "";
    },
    is_create_disabled() {
      return this.is_creating || !this.trimmed_name || !this.new_selection_type;
    },
  },
  methods: {
    onNameInput() {
      this.name_touched = true;
    },
    goBack() {
      this.$router.push(selectionListPath(this.type_slug));
    },
    cleanString(value) {
      if (value === null || value === undefined) return "";
      return String(value).trim();
    },
    async createSelection() {
      this.name_touched = true;
      if (!this.trimmed_name || this.is_creating || !this.new_selection_type) {
        return;
      }

      this.is_creating = true;
      try {
        const additional_meta = {
          $status: "public",
          $admins: "everyone",
          $contributors: "everyone",
          internal_name: this.trimmed_name,
          selection_date: todayDateInputValue(),
          selection_entries: [],
        };
        // Partner invoice is always a partnership; percentage stays empty until set.
        if (this.new_selection_type === "partner invoice") {
          additional_meta.partnership_purchase = true;
        }
        const new_slug = await this.$api.createFolder({
          path: this.type_root_path,
          additional_meta,
        });
        if (new_slug) {
          const path = selectionDetailPath({
            type_slug: this.type_slug,
            folder_slug: new_slug,
          });
          this.$router.push(path);
        } else {
          this.$router.push(selectionListPath(this.type_slug));
        }
      } catch ({ code }) {
        this.$alertify
          .delay(4000)
          .error(code || this.$t("sg_could_not_create_selection"));
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
  padding: calc(var(--spacing) * 2) calc(var(--spacing) * 3);
}

._pageHeader {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: calc(var(--spacing) * 0.35);
  margin-bottom: calc(var(--spacing) * 1);
}

._pageTitle {
  margin: 0;
}

._typeReadonly {
  margin: 0;
  font-size: var(--sl-font-size-small);
  color: var(--c-gris_fonce);
}

._form {
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: calc(var(--spacing) * 1.1);
}

._fieldsGrid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: calc(var(--spacing) / 1.75);
}

._actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: calc(var(--spacing) / 2);
}

._fieldError {
  margin: calc(var(--spacing) / 6) 0 0;
  color: var(--c-rouge);
  font-size: var(--sl-font-size-x-small);
}
</style>
