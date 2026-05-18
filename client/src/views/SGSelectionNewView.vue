<template>
  <section class="_selectionNewView">
    <button
      type="button"
      class="u-button u-button_icon _closeButton"
      @click="goBack"
    >
      <b-icon icon="x-lg" />
    </button>

    <div class="_pageHeader">
      <h1 class="_pageTitle">{{ $t("sg_create_selection_title") }}</h1>
    </div>

    <form class="_form" @submit.prevent="createSelection">
      <SGSectionPanel section_id="selection_identity" :title="$t('sg_section_contact_identity')">
        <div class="_fieldsGrid">
          <div>
            <DLabel :str="$t('sg_selection_internal_name')" icon="pencil" />
            <TextInput
              ref="name_input"
              :content.sync="new_internal_name"
              :required="true"
              @update:content="onNameInput"
            />
            <p v-if="name_error" class="_fieldError">{{ name_error }}</p>
          </div>
          <div>
            <DLabel :str="$t('sg_selection_type_label')" icon="tags" />
            <SGSelectField
              :value="new_selection_type"
              :options="selection_type_options"
              :allow_empty="false"
              @input="new_selection_type = $event"
            />
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
import SGSelectField from "@/components/softgems/SGSelectField.vue";
import SGSectionPanel from "@/components/softgems/SGSectionPanel.vue";
import { selectionDetailPath } from "@/utils/selection_urls.js";
import { selectionTypeSelectOptions } from "@/utils/selection_types.js";

export default {
  name: "SGSelectionNewView",
  components: {
    SGSelectField,
    SGSectionPanel,
  },
  data() {
    return {
      selections_root_path: "selections",
      new_internal_name: "",
      new_selection_type: "simple",
      name_touched: false,
      is_creating: false,
    };
  },
  computed: {
    selection_type_options() {
      return selectionTypeSelectOptions(this.$t.bind(this));
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
      return this.is_creating || !this.trimmed_name;
    },
  },
  methods: {
    onNameInput() {
      this.name_touched = true;
    },
    goBack() {
      this.$router.push("/selections");
    },
    cleanString(value) {
      if (value === null || value === undefined) return "";
      return String(value).trim();
    },
    async createSelection() {
      this.name_touched = true;
      if (!this.trimmed_name || this.is_creating) return;

      this.is_creating = true;
      try {
        const new_slug = await this.$api.createFolder({
          path: this.selections_root_path,
          additional_meta: {
            $status: "public",
            $admins: "everyone",
            $contributors: "everyone",
            internal_name: this.trimmed_name,
            selection_type: this.new_selection_type,
            selection_entries: [],
          },
        });
        if (new_slug) {
          const path = selectionDetailPath({
            folder_slug: new_slug,
            internal_name: this.trimmed_name,
          });
          this.$router.push(path);
        } else {
          this.$router.push("/selections");
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
  justify-content: space-between;
  align-items: center;
  gap: var(--spacing);
  margin-bottom: calc(var(--spacing) * 1);
}

._pageTitle {
  margin: 0;
}

._closeButton {
  position: absolute;
  top: 0;
  right: 0;
  z-index: 1000;
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
