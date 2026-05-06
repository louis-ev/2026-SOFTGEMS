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
    <div v-else-if="gem" class="_content">
      <!-- Overview: cover + files -->
      <section class="_formSection">
        <div class="_coverFrame">
          <CoverField
            :context="'full'"
            :ratio="'4 / 3'"
            :cover="gem.$cover"
            :path="gem_path"
            :can_edit="can_edit"
          />
        </div>
        <SGGemFilesList
          :path="gem_path"
          :can_edit="can_edit"
          :gem_files="gem.$files || []"
          @filesUpdated="fetchGem"
        />
        <div class="_dangerZone">
          <button
            type="button"
            class="u-buttonLink u-buttonLink_red"
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

      <!-- Section: Identification -->
      <section class="_formSection">
        <h2 class="_sectionTitle">{{ $t("sg_section_identification") }}</h2>
        <div class="_fieldsGrid">
          <SGGemFieldCard
            :label="$t('sg_status')"
            :value="gem.status"
            @click="openEditModal(status_field)"
          />
          <SGGemFieldCard
            :label="$t('sg_reference_supplier')"
            icon="archive"
            :value="gem.reference_supplier"
            @click="openEditModal(reference_supplier_field)"
          />
          <SGGemFieldCard
            :label="$t('sg_reference_customer')"
            icon="person-circle"
            :value="gem.reference_customer"
            @click="openEditModal(reference_customer_field)"
          />
          <SGGemFieldCard
            :label="$t('sg_paired_gem')"
            icon="link"
            :value="gem.paired_gem"
            @click="openEditModal(paired_gem_field)"
          />
        </div>
      </section>

      <!-- Section: Stone characteristics -->
      <section class="_formSection">
        <h2 class="_sectionTitle">
          {{ $t("sg_section_stone_characteristics") }}
        </h2>
        <div class="_fieldsGrid">
          <SGGemFieldCard
            :label="$t('sg_number_of_pieces')"
            icon="list-ol"
            :value="gem.number_of_pieces"
            @click="openEditModal(number_of_pieces_field)"
          />
          <SGGemFieldCard
            :label="$t('sg_stone_type')"
            icon="gem"
            :value="gem.stone_type"
            @click="openEditModal(stone_type_field)"
          />
          <SGGemFieldCard
            :label="$t('sg_weight_ct')"
            icon="rulers"
            :value="gem.weight_ct"
            @click="openEditModal(weight_ct_field)"
          />
          <SGGemFieldCard
            :label="$t('sg_color')"
            icon="palette-fill"
            :value="gem.color"
            @click="openEditModal(color_field)"
          />
          <SGGemFieldCard
            :label="$t('sg_shape')"
            icon="pentagon"
            :value="gem.shape"
            @click="openEditModal(shape_field)"
          />
          <SGGemFieldCard
            :label="$t('sg_origin_country')"
            icon="pin-map"
            :value="gem.origin_country"
            @click="openEditModal(origin_country_field)"
          />
          <SGGemFieldCard
            :label="$t('sg_treatment_type')"
            icon="tools"
            :value="gem.treatment_type"
            @click="openEditModal(treatment_type_field)"
          />
          <SGGemFieldCard
            :label="$t('sg_length_mm')"
            icon="aspect-ratio"
            :value="gem.length_mm"
            @click="openEditModal(length_mm_field)"
          />
          <SGGemFieldCard
            :label="$t('sg_width_mm')"
            icon="aspect-ratio"
            :value="gem.width_mm"
            @click="openEditModal(width_mm_field)"
          />
          <SGGemFieldCard
            :label="$t('sg_height_mm')"
            icon="aspect-ratio"
            :value="gem.height_mm"
            @click="openEditModal(height_mm_field)"
          />
        </div>
      </section>

      <!-- Section: Pricing -->
      <section class="_formSection">
        <h2 class="_sectionTitle">{{ $t("sg_section_pricing") }}</h2>
        <div class="_fieldsGrid">
          <SGGemFieldCard
            :label="$t('sg_base_price_pcb')"
            icon="tag"
            :value="gem.base_price_pcb"
            @click="openEditModal(base_price_pcb_field)"
          />
          <SGGemFieldCard
            :label="$t('sg_purchased_price_pa')"
            icon="tag"
            :value="gem.purchased_price_pa"
            @click="openEditModal(purchased_price_pa_field)"
          />
          <SGGemFieldCard
            :label="$t('sg_price_per_carat_pa_pcb')"
            icon="diagram2"
            :value="gem.price_per_carat_pa_pcb"
            @click="openEditModal(price_per_carat_pa_pcb_field)"
          />
          <SGGemFieldCard
            :label="$t('sg_pv_selling_price')"
            icon="tag"
            :value="gem.pv_selling_price"
            @click="openEditModal(pv_selling_price_field)"
          />
          <SGGemFieldCard
            :label="$t('sg_pvd_asking_price')"
            icon="diagram2"
            :value="pvd_asking_price_computed"
            :readonly="true"
          />
          <SGGemFieldCard
            :label="$t('sg_pc_to')"
            icon="file-earmark-text"
            :value="gem.pc_to"
            @click="openEditModal(pc_to_field)"
          />
          <SGGemFieldCard
            :label="$t('sg_pf_invoiced_price')"
            icon="file-earmark-text"
            :value="gem.pf_invoiced_price"
            @click="openEditModal(pf_invoiced_price_field)"
          />
          <SGGemFieldCard
            :label="$t('sg_price_per_carat_all')"
            icon="arrow-up"
            :value="gem.price_per_carat_all"
            @click="openEditModal(price_per_carat_all_field)"
          />
        </div>
      </section>
    </div>

    <SGGemEditFieldModal
      v-if="editing_field"
      :field="editing_field"
      :current_value="editing_current_value"
      :gem_path="gem_path"
      @saved="onFieldSaved"
      @close="editing_field = null"
    />
  </section>
</template>

<script>
import {
  color_suggestions,
  origin_country_suggestions,
  shape_suggestions,
  stone_type_suggestions,
  treatment_type_suggestions,
} from "@/suggestions/softgems";

export default {
  name: "SGGemOpenView",
  components: {
    SGGemFilesList: () => import("@/components/gems/SGGemFilesList.vue"),
    SGGemEditFieldModal: () =>
      import("@/components/gems/SGGemEditFieldModal.vue"),
    SGGemFieldCard: () => import("@/components/gems/SGGemFieldCard.vue"),
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
      paired_gem_options: [],
      editing_field: null,
      editing_current_value: "",
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
      return this.$t("sg_gem_title", { id: this.gem_id });
    },
    pvd_asking_price_computed() {
      const pv = Number(this.gem?.pv_selling_price);
      if (!Number.isFinite(pv)) return 0;
      return Number((pv * 1.15).toFixed(2));
    },
    // ── Field configs ────────────────────────────────────────────────────────
    status_field() {
      return {
        key: "status",
        label: this.$t("sg_status"),
        icon: null,
        type: "select",
        options: [
          { value: "reference", label: "reference" },
          { value: "available", label: "available" },
          { value: "reserved", label: "reserved" },
          { value: "sold", label: "sold" },
        ],
      };
    },
    reference_supplier_field() {
      return {
        key: "reference_supplier",
        label: this.$t("sg_reference_supplier"),
        icon: "archive",
        type: "text",
      };
    },
    reference_customer_field() {
      return {
        key: "reference_customer",
        label: this.$t("sg_reference_customer"),
        icon: "person-circle",
        type: "text",
      };
    },
    paired_gem_field() {
      return {
        key: "paired_gem",
        label: this.$t("sg_paired_gem"),
        icon: "link",
        type: "select",
        options: this.paired_gem_options,
      };
    },
    number_of_pieces_field() {
      return {
        key: "number_of_pieces",
        label: this.$t("sg_number_of_pieces"),
        icon: "list-ol",
        type: "number",
        input_type: "number",
      };
    },
    stone_type_field() {
      return {
        key: "stone_type",
        label: this.$t("sg_stone_type"),
        icon: "gem",
        type: "select",
        options: stone_type_suggestions,
      };
    },
    weight_ct_field() {
      return {
        key: "weight_ct",
        label: this.$t("sg_weight_ct"),
        icon: "rulers",
        type: "number",
        input_type: "number",
      };
    },
    color_field() {
      return {
        key: "color",
        label: this.$t("sg_color"),
        icon: "palette-fill",
        type: "select",
        options: color_suggestions,
      };
    },
    shape_field() {
      return {
        key: "shape",
        label: this.$t("sg_shape"),
        icon: "pentagon",
        type: "select",
        options: shape_suggestions,
      };
    },
    origin_country_field() {
      return {
        key: "origin_country",
        label: this.$t("sg_origin_country"),
        icon: "pin-map",
        type: "select",
        options: origin_country_suggestions,
      };
    },
    treatment_type_field() {
      return {
        key: "treatment_type",
        label: this.$t("sg_treatment_type"),
        icon: "tools",
        type: "select",
        options: treatment_type_suggestions,
      };
    },
    length_mm_field() {
      return {
        key: "length_mm",
        label: this.$t("sg_length_mm"),
        icon: "aspect-ratio",
        type: "number",
        input_type: "number",
      };
    },
    width_mm_field() {
      return {
        key: "width_mm",
        label: this.$t("sg_width_mm"),
        icon: "aspect-ratio",
        type: "number",
        input_type: "number",
      };
    },
    height_mm_field() {
      return {
        key: "height_mm",
        label: this.$t("sg_height_mm"),
        icon: "aspect-ratio",
        type: "number",
        input_type: "number",
      };
    },
    base_price_pcb_field() {
      return {
        key: "base_price_pcb",
        label: this.$t("sg_base_price_pcb"),
        icon: "tag",
        type: "number",
        input_type: "number",
      };
    },
    purchased_price_pa_field() {
      return {
        key: "purchased_price_pa",
        label: this.$t("sg_purchased_price_pa"),
        icon: "tag",
        type: "number",
        input_type: "number",
      };
    },
    price_per_carat_pa_pcb_field() {
      return {
        key: "price_per_carat_pa_pcb",
        label: this.$t("sg_price_per_carat_pa_pcb"),
        icon: "diagram2",
        type: "number",
        input_type: "number",
      };
    },
    pv_selling_price_field() {
      return {
        key: "pv_selling_price",
        label: this.$t("sg_pv_selling_price"),
        icon: "tag",
        type: "number",
        input_type: "number",
      };
    },
    pvd_asking_price_field() {
      return {
        key: "pvd_asking_price",
        label: this.$t("sg_pvd_asking_price"),
        icon: "diagram2",
        type: "number",
        readonly: true,
      };
    },
    pc_to_field() {
      return {
        key: "pc_to",
        label: this.$t("sg_pc_to"),
        icon: "file-earmark-text",
        type: "number",
        input_type: "number",
      };
    },
    pf_invoiced_price_field() {
      return {
        key: "pf_invoiced_price",
        label: this.$t("sg_pf_invoiced_price"),
        icon: "file-earmark-text",
        type: "number",
        input_type: "number",
      };
    },
    price_per_carat_all_field() {
      return {
        key: "price_per_carat_all",
        label: this.$t("sg_price_per_carat_all"),
        icon: "arrow-up",
        type: "number",
        input_type: "number",
      };
    },
  },
  async created() {
    await this.fetchGem();
    this.fetchPairableGems();
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
        this.gem = await this.$api.getFolder({ path: this.gem_path });
      } catch ({ code }) {
        this.fetch_error = code || this.$t("sg_could_not_load_gem");
      } finally {
        this.is_loading = false;
      }
    },
    async fetchPairableGems() {
      try {
        const gems = await this.$api.getFolders({ path: this.gems_path });
        this.paired_gem_options = (Array.isArray(gems) ? gems : [])
          .filter((g) => g?.$path && !g.$path.endsWith(this.gem_id))
          .map((g) => {
            const parts = String(g.$path || "").split("/");
            const gem_slug = parts[parts.length - 1] || "";
            const gem_label =
              this.cleanString(g.reference_supplier) ||
              this.cleanString(g.reference_customer) ||
              gem_slug;
            return { value: gem_slug, label: gem_label };
          });
      } catch {
        this.paired_gem_options = [];
      }
    },
    openEditModal(field_config) {
      const raw_value = this.gem?.[field_config.key];
      this.editing_current_value =
        raw_value !== undefined && raw_value !== null ? raw_value : "";
      this.editing_field = field_config;
    },
    onFieldSaved({ key, value }) {
      if (!this.gem) return;
      this.gem = { ...this.gem, [key]: value };
    },
    onGemRemoved() {
      this.show_remove_modal = false;
      this.$router.push("/gems");
    },
    cleanString(value) {
      if (value === null || value === undefined) return "";
      return String(value).trim();
    },
  },
};
</script>

<style lang="scss" scoped>
._gemOpenView {
  position: relative;
  min-height: 100%;
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

._backButton {
  position: absolute;
  top: 0;
  right: 0;
  z-index: 1000;
}

._content {
  max-width: 720px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: calc(var(--spacing) / 1.5);
}

._formSection {
  border: 1px solid var(--c-gris_clair);
  border-radius: 10px;
  padding: calc(var(--spacing) * 0.9);
  background: var(--c-blanc);
}

._sectionTitle {
  margin: 0 0 calc(var(--spacing) * 0.6) 0;
  font-size: 1rem;
}

._coverFrame {
  position: relative;
  width: min(300px, 100%);
  aspect-ratio: 4 / 3;
  border: 1px solid var(--c-gris_clair);
  border-radius: 8px;
  overflow: hidden;
  background: var(--c-bodybg);
  margin-bottom: calc(var(--spacing) * 0.75);
}

._dangerZone {
  display: flex;
  justify-content: flex-end;
  padding-top: calc(var(--spacing) / 2);
  margin-top: calc(var(--spacing) * 0.25);
  border-top: 1px solid var(--c-gris_clair);
}

._fieldsGrid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: calc(var(--spacing) / 1.75);
}
</style>
