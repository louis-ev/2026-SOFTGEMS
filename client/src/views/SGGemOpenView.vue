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

      <div class="_coverColumn" v-if="gem">
        <div class="_coverFrame">
          <CoverField
            :context="'full'"
            :ratio="'1 / 1'"
            :cover="gem.$cover"
            :path="gem_path"
            :can_edit="can_edit"
            :available_options="['import']"
          />
        </div>
      </div>
    </div>

    <div v-if="is_loading">{{ $t("sg_loading_gem") }}</div>
    <div v-else-if="fetch_error" class="u-errorMsg">{{ fetch_error }}</div>
    <div v-else-if="gem" class="_content">
      <!-- Overview: cover + files -->

      <section class="_formSection">
        <div class="_topOverview">
          <div class="_filesColumn">
            <SGGemFilesList
              :path="gem_path"
              :can_edit="can_edit"
              :gem_files="gem.$files || []"
              @filesUpdated="fetchGem"
            />
          </div>
        </div>
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
            @click="openEditModal(field_configs.status)"
          />
          <SGGemFieldCard
            :label="$t('sg_reference_supplier')"
            icon="archive"
            :value="gem.reference_supplier"
            @click="openEditModal(field_configs.reference_supplier)"
          />
          <SGGemFieldCard
            :label="$t('sg_reference_customer')"
            icon="person-circle"
            :value="gem.reference_customer"
            @click="openEditModal(field_configs.reference_customer)"
          />
          <SGGemFieldCard
            :label="$t('sg_paired_gem')"
            icon="link"
            :value="gem.paired_gem"
            @click="openEditModal(field_configs.paired_gem)"
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
            @click="openEditModal(field_configs.number_of_pieces)"
          />
          <SGGemFieldCard
            :label="$t('sg_stone_type')"
            icon="gem"
            :value="gem.stone_type"
            @click="openEditModal(field_configs.stone_type)"
          />
          <SGGemFieldCard
            :label="$t('sg_weight_ct')"
            icon="rulers"
            :value="gem.weight_ct"
            @click="openEditModal(field_configs.weight_ct)"
          />
          <SGGemFieldCard
            :label="$t('sg_color')"
            icon="palette-fill"
            :value="gem.color"
            @click="openEditModal(field_configs.color)"
          />
          <SGGemFieldCard
            :label="$t('sg_shape')"
            icon="pentagon"
            :value="gem.shape"
            @click="openEditModal(field_configs.shape)"
          />
          <SGGemFieldCard
            :label="$t('sg_origin_country')"
            icon="pin-map"
            :value="gem.origin_country"
            @click="openEditModal(field_configs.origin_country)"
          />
          <SGGemFieldCard
            :label="$t('sg_treatment_type')"
            icon="tools"
            :value="gem.treatment_type"
            @click="openEditModal(field_configs.treatment_type)"
          />
          <SGGemFieldCard
            :label="$t('sg_length_mm')"
            icon="aspect-ratio"
            :value="gem.length_mm"
            @click="openEditModal(field_configs.length_mm)"
          />
          <SGGemFieldCard
            :label="$t('sg_width_mm')"
            icon="aspect-ratio"
            :value="gem.width_mm"
            @click="openEditModal(field_configs.width_mm)"
          />
          <SGGemFieldCard
            :label="$t('sg_height_mm')"
            icon="aspect-ratio"
            :value="gem.height_mm"
            @click="openEditModal(field_configs.height_mm)"
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
            @click="openEditModal(field_configs.base_price_pcb)"
          />
          <SGGemFieldCard
            :label="$t('sg_purchased_price_pa')"
            icon="tag"
            :value="gem.purchased_price_pa"
            @click="openEditModal(field_configs.purchased_price_pa)"
          />
          <SGGemFieldCard
            :label="$t('sg_price_per_carat_pa_pcb')"
            icon="diagram2"
            :value="gem.price_per_carat_pa_pcb"
            @click="openEditModal(field_configs.price_per_carat_pa_pcb)"
          />
          <SGGemFieldCard
            :label="$t('sg_pv_selling_price')"
            icon="tag"
            :value="gem.pv_selling_price"
            @click="openEditModal(field_configs.pv_selling_price)"
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
            @click="openEditModal(field_configs.pc_to)"
          />
          <SGGemFieldCard
            :label="$t('sg_pf_invoiced_price')"
            icon="file-earmark-text"
            :value="gem.pf_invoiced_price"
            @click="openEditModal(field_configs.pf_invoiced_price)"
          />
          <SGGemFieldCard
            :label="$t('sg_price_per_carat_all')"
            icon="arrow-up"
            :value="gem.price_per_carat_all"
            @click="openEditModal(field_configs.price_per_carat_all)"
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
import { buildGemFieldConfigs } from "@/components/gems/gem_field_configs";

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
    field_configs() {
      return buildGemFieldConfigs(this.$t.bind(this), this.paired_gem_options);
    },
  },
  async created() {
    await this.fetchGem();
    this.$api.join({ room: this.gem_path });
    this.fetchPairableGems();
  },
  mounted() {},
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
  // max-width: 720px;
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

._topOverview {
  display: grid;
  grid-template-columns: minmax(220px, 220px) minmax(0, 1fr);
  gap: calc(var(--spacing) * 0.9);
  align-items: start;
}

._coverColumn {
  min-width: 0;
}

._filesColumn {
  min-width: 0;
}

._coverFrame {
  width: 100%;
  border: 1px solid var(--c-gris_clair);
  border-radius: 8px;
  overflow: hidden;
  background: var(--c-bodybg);
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

@media (max-width: 920px) {
  ._topOverview {
    grid-template-columns: 1fr;
  }
}
</style>
