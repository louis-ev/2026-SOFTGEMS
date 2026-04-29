<template>
  <section class="_gemOpenView">
    <button
      type="button"
      class="u-button u-button_icon _backButton"
      @click="goBack"
    >
      <b-icon icon="x-lg" />
    </button>
    <div class="_pageHeader">
      <h1 class="_pageTitle">{{ gem_title }}</h1>
    </div>

    <div v-if="is_loading">{{ $t("sg_loading_gem") }}</div>
    <div v-else-if="fetch_error" class="u-errorMsg">{{ fetch_error }}</div>
    <template v-else>
      <section class="_contentSection">
        <h2 class="_sectionTitle">Overview</h2>
        <div class="_coverFrame">
          <CoverField
            :context="'full'"
            :ratio="'4 / 3'"
            :cover="gem.$cover"
            :path="gem_path"
            :can_edit="can_edit"
          />
        </div>
        <div class="_actions">
          <button
            type="button"
            class="u-buttonLink"
            @click="show_remove_modal = true"
          >
            {{ $t("sg_remove_gem") }}
          </button>
          <RemoveMenu2
            v-if="show_remove_modal"
            :path="gem_path"
            :modal_title="$t('sg_remove_gem_confirm', { name: gem_title })"
            :success_notification="$t('removed_successfully')"
            @removedSuccessfully="onGemRemoved"
            @close="show_remove_modal = false"
          />
        </div>
      </section>

      <section class="_contentSection">
        <SGGemFilesList
          :path="gem_path"
          :can_edit="can_edit"
          :gem_files="gem ? gem.$files : []"
          @filesUpdated="fetchGem"
        />
      </section>

      <section class="_contentSection">
        <h2 class="_sectionTitle">{{ $t("sg_metadata") }}</h2>
        <dl class="_metaGrid">
          <div class="_metaItem" v-for="item in metadata_items" :key="item.key">
            <dt class="u-label">{{ item.label }}</dt>
            <dd>
              <SelectField
                v-if="item.editor === 'select'"
                :field_name="item.key"
                :show_label="false"
                :label="item.label"
                :content="item.raw_value"
                :options="item.options"
                :can_edit="can_edit"
                @update="saveMetaField(item.key, $event)"
              />
              <TitleField
                v-else-if="item.editor === 'titlefield'"
                :show_label="false"
                :label="item.label"
                :field_name="item.key"
                :content="item.editable_value"
                :input_type="item.input_type"
                :can_edit="can_edit"
                @save="saveMetaField(item.key, $event)"
              />
              <span v-else>{{ item.value }}</span>
            </dd>
          </div>
        </dl>
      </section>
    </template>
  </section>
</template>

<script>
const display_fields = [
  { key: "id", label_key: "sg_id", editor: null },
  {
    key: "status",
    label_key: "sg_status",
    editor: "select",
    options: [
      { key: "available", text: "available" },
      { key: "reserved", text: "reserved" },
      { key: "sold", text: "sold" },
    ],
  },
  { key: "gem_type", label_key: "sg_type", editor: "titlefield" },
  {
    key: "color",
    label_key: "sg_color",
    editor: "titlefield",
  },
  { key: "origin", label_key: "sg_origin", editor: "titlefield" },
  { key: "dimensions", label_key: "sg_dimensions", editor: "titlefield" },
  {
    key: "weight_carat",
    label_key: "sg_weight_carat",
    editor: "titlefield",
    input_type: "number",
  },
  {
    key: "piece_count",
    label_key: "sg_piece_count",
    editor: "titlefield",
    input_type: "number",
  },
  { key: "condition", label_key: "sg_condition", editor: "titlefield" },
  { key: "treatment", label_key: "sg_treatment", editor: "titlefield" },
  {
    key: "purchase_price_usd",
    label_key: "sg_purchase_price_usd",
    editor: "titlefield",
    input_type: "number",
  },
  {
    key: "sale_price_usd",
    label_key: "sg_sale_price_usd",
    editor: "titlefield",
    input_type: "number",
  },
  {
    key: "price_per_carat_usd",
    label_key: "sg_price_per_carat_usd",
    editor: "titlefield",
    input_type: "number",
  },
  { key: "supplier", label_key: "sg_supplier", editor: "titlefield" },
  {
    key: "acquisition_date",
    label_key: "sg_acquisition_date",
    editor: "titlefield",
    input_type: "date",
  },
  {
    key: "country_of_cut",
    label_key: "sg_country_of_cut",
    editor: "titlefield",
  },
  { key: "pair_gem_id", label_key: "sg_pair_gem_id", editor: "titlefield" },
  { key: "remarks", label_key: "sg_remarks", editor: "titlefield" },
  { key: "$path", label_key: "sg_path", editor: null },
  { key: "$date_created", label_key: "sg_created", editor: null },
  { key: "$date_modified", label_key: "sg_last_modified", editor: null },
];

export default {
  name: "SGGemOpenView",
  components: {
    SGGemFilesList: () => import("@/components/gems/SGGemFilesList.vue"),
  },
  props: {
    gem_id: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      gems_path: "gems",
      gem: null,
      is_loading: false,
      show_remove_modal: false,
      fetch_error: "",
    };
  },
  computed: {
    can_edit() {
      return true;
    },
    gem_path() {
      return `${this.gems_path}/${this.gem_id}`;
    },
    gem_title() {
      if (!this.gem) return this.$t("sg_open_gem_title");
      return this.gem.reference_id || this.gem_id;
    },
    metadata_items() {
      if (!this.gem) return [];
      return display_fields.map((field) => {
        const raw_value = this.getFieldValue(field.key);
        const editable_value = this.getEditableValue(field.key, raw_value);
        return {
          ...field,
          label: this.$t(field.label_key),
          raw_value,
          editable_value,
          value: this.formatValue(raw_value),
          input_type: field.input_type || "text",
          options: field.options || [],
        };
      });
    },
  },
  async created() {
    await this.fetchGem();
  },
  mounted() {
    this.$api.join({ room: this.gem_path });
  },
  beforeDestroy() {
    this.$api.leave({ room: this.gem_path });
  },
  methods: {
    goBack() {
      if (this.$route.path.startsWith("/gems/")) {
        this.$router.push("/gems");
        return;
      }
      this.$router.push("/");
    },
    async fetchGem() {
      this.is_loading = true;
      this.fetch_error = "";
      try {
        this.gem = await this.$api.getFolder({
          path: this.gem_path,
        });
      } catch ({ code }) {
        this.fetch_error = code || this.$t("sg_could_not_load_gem");
      } finally {
        this.is_loading = false;
      }
    },
    onGemRemoved() {
      this.show_remove_modal = false;
      this.$router.push("/gems");
    },
    async saveMetaField(field_key, field_value) {
      if (!this.gem) return;

      const normalized_field_value = this.normalizeFieldValue({
        field_key,
        field_value,
      });

      try {
        await this.$api.updateMeta({
          path: this.gem_path,
          new_meta: {
            [field_key]: normalized_field_value,
          },
        });

        this.gem = {
          ...this.gem,
          [field_key]: normalized_field_value,
        };
      } catch ({ code }) {
        this.$alertify.delay(4000).error(code || this.$t("couldntbesaved"));
      }
    },
    getFieldValue(field_key) {
      if (field_key === "id") return this.gem_id;
      return this.gem?.[field_key];
    },
    normalizeFieldValue({ field_key, field_value }) {
      const number_fields = [
        "weight_carat",
        "piece_count",
        "purchase_price_usd",
        "sale_price_usd",
        "price_per_carat_usd",
      ];
      if (number_fields.includes(field_key)) {
        const numeric_value = Number(field_value);
        if (Number.isFinite(numeric_value)) return numeric_value;
        return 0;
      }
      if (typeof field_value === "string") return field_value.trim();
      return field_value;
    },
    getEditableValue(field_key, field_value) {
      return field_value;
    },
    formatValue(value) {
      if (value === null || value === undefined || value === "") return "-";
      if (typeof value === "number")
        return Number.isFinite(value) ? value : "-";
      if (typeof value === "object") return JSON.stringify(value);
      return String(value);
    },
  },
};
</script>

<style lang="scss" scoped>
._gemOpenView {
  position: relative;
  height: 100%;
  overflow-y: auto;
  padding: calc(var(--spacing) * 2.5) calc(var(--spacing) * 3.5);
  max-width: 100%;
  margin: 0;
}

._pageHeader {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--spacing);
  margin-bottom: calc(var(--spacing) * 1.5);

  > * {
    flex: 1;
  }
}

._pageTitle {
  margin: 0;
}

._backButton {
  position: absolute;
  top: 0;
  right: 0;
  z-index: 1000;
}

._actions {
  display: flex;
  margin-top: var(--spacing);
}

._coverFrame {
  position: relative;
  width: min(340px, 100%);
  max-width: 100%;
  aspect-ratio: 4 / 3;
  border: 1px solid var(--c-gris_clair);
  border-radius: 8px;
  overflow: hidden;
  background: var(--c-blanc);
}

._contentSection {
  margin-bottom: calc(var(--spacing) * 1.5);
  padding: calc(var(--spacing) * 1.25);
  border: 1px solid var(--c-gris_clair);
  border-radius: 10px;
  background: var(--c-blanc);
}

._sectionTitle {
  margin: 0 0 var(--spacing);
}

._metaGrid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: calc(var(--spacing) / 1.25);
  margin: 0;
}

._metaItem {
  background: var(--c-blanc);
  border: 1px solid var(--c-gris_clair);
  border-radius: 8px;
  padding: calc(var(--spacing) / 1.3);
}

dt {
  // font-size: 0.8rem;
  // text-transform: uppercase;
  // color: var(--c-gris_fonce);
  // margin-bottom: 0.25rem;
}

dd {
  margin: 0;
}
</style>
