<template>
  <section class="_gemOpenView">
    <div class="_pageHeader">
      <div class="_headerMain">
        <div class="_titleRow">
          <div class="_titleGroup">
            <h1 class="_pageTitle">{{ gem_title }}</h1>
            <SGFolderModificationsHistory
              :folder_path="gem_path"
              :folder_meta="gem"
              history_kind="gem"
            />
          </div>
          <DropDown v-if="can_edit" :show_label="false" :right="true">
            <button
              type="button"
              class="u-buttonLink u-buttonLink_red"
              @click="show_remove_modal = true"
            >
              <b-icon icon="trash" />
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
          </DropDown>
        </div>
      </div>
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
      <SGGemSelectionsSection :gem_path="gem_path" :gem="gem" />

      <SGSectionPanel
        section_id="identification"
        :title="$t('sg_section_identification')"
      >
        <div class="_fieldsGrid">
          <SGEditableMetaField
            :label="$t('sg_status')"
            :value="gem.status"
            value_type="gem_status"
            :is_flashing="isFieldFlashing('status')"
            :modal_open="editing_field === field_configs.status"
            :modal_title="gemFieldModalTitle(field_configs.status)"
            :gem_edit="gemEditorProps(field_configs.status)"
            @presentClick="openEditModal(field_configs.status)"
            @close="editing_field = null"
            @saved="onFieldSaved"
          />
          <SGEditableMetaField
            :label="$t('sg_reference_supplier')"
            icon="archive"
            :value="gem.reference_supplier"
            :is_flashing="isFieldFlashing('reference_supplier')"
            :modal_open="editing_field === field_configs.reference_supplier"
            :modal_title="gemFieldModalTitle(field_configs.reference_supplier)"
            :gem_edit="gemEditorProps(field_configs.reference_supplier)"
            @presentClick="openEditModal(field_configs.reference_supplier)"
            @close="editing_field = null"
            @saved="onFieldSaved"
          />
          <SGEditableMetaField
            :label="$t('sg_reference_customer')"
            icon="person-circle"
            :value="gem.reference_customer"
            :is_flashing="isFieldFlashing('reference_customer')"
            :modal_open="editing_field === field_configs.reference_customer"
            :modal_title="gemFieldModalTitle(field_configs.reference_customer)"
            :gem_edit="gemEditorProps(field_configs.reference_customer)"
            @presentClick="openEditModal(field_configs.reference_customer)"
            @close="editing_field = null"
            @saved="onFieldSaved"
          />
          <SGEditableMetaField
            :label="$t('sg_paired_gem')"
            icon="link"
            :value="gem.paired_gem"
            :is_flashing="isFieldFlashing('paired_gem')"
            :modal_open="editing_field === field_configs.paired_gem"
            :modal_title="gemFieldModalTitle(field_configs.paired_gem)"
            :gem_edit="gemEditorProps(field_configs.paired_gem)"
            @presentClick="openEditModal(field_configs.paired_gem)"
            @close="editing_field = null"
            @saved="onFieldSaved"
          />
        </div>
      </SGSectionPanel>

      <SGSectionPanel
        section_id="stone_characteristics"
        :title="$t('sg_section_stone_characteristics')"
      >
        <div class="_fieldsGrid">
          <SGEditableMetaField
            :label="$t('sg_number_of_pieces')"
            icon="list-ol"
            :value="gem.number_of_pieces"
            :is_flashing="isFieldFlashing('number_of_pieces')"
            :modal_open="editing_field === field_configs.number_of_pieces"
            :modal_title="gemFieldModalTitle(field_configs.number_of_pieces)"
            :gem_edit="gemEditorProps(field_configs.number_of_pieces)"
            @presentClick="openEditModal(field_configs.number_of_pieces)"
            @close="editing_field = null"
            @saved="onFieldSaved"
          />
          <SGEditableMetaField
            :label="$t('sg_stone_type')"
            icon="gem"
            :value="gem.stone_type"
            :is_flashing="isFieldFlashing('stone_type')"
            :modal_open="editing_field === field_configs.stone_type"
            :modal_title="gemFieldModalTitle(field_configs.stone_type)"
            :gem_edit="gemEditorProps(field_configs.stone_type)"
            @presentClick="openEditModal(field_configs.stone_type)"
            @close="editing_field = null"
            @saved="onFieldSaved"
          />
          <SGEditableMetaField
            :label="$t('sg_weight_ct')"
            icon="rulers"
            :value="gem.weight_ct"
            :is_flashing="isFieldFlashing('weight_ct')"
            :modal_open="editing_field === field_configs.weight_ct"
            :modal_title="gemFieldModalTitle(field_configs.weight_ct)"
            :gem_edit="gemEditorProps(field_configs.weight_ct)"
            @presentClick="openEditModal(field_configs.weight_ct)"
            @close="editing_field = null"
            @saved="onFieldSaved"
          />
          <SGEditableMetaField
            :label="$t('sg_color')"
            icon="palette-fill"
            :value="gem.color"
            :is_flashing="isFieldFlashing('color')"
            :modal_open="editing_field === field_configs.color"
            :modal_title="gemFieldModalTitle(field_configs.color)"
            :gem_edit="gemEditorProps(field_configs.color)"
            @presentClick="openEditModal(field_configs.color)"
            @close="editing_field = null"
            @saved="onFieldSaved"
          />
          <SGEditableMetaField
            :label="$t('sg_shape')"
            icon="pentagon"
            :value="gem.shape"
            :is_flashing="isFieldFlashing('shape')"
            :modal_open="editing_field === field_configs.shape"
            :modal_title="gemFieldModalTitle(field_configs.shape)"
            :gem_edit="gemEditorProps(field_configs.shape)"
            @presentClick="openEditModal(field_configs.shape)"
            @close="editing_field = null"
            @saved="onFieldSaved"
          />
          <SGEditableMetaField
            :label="$t('sg_origin_country')"
            icon="pin-map"
            :value="gem.origin_country"
            :is_flashing="isFieldFlashing('origin_country')"
            :modal_open="editing_field === field_configs.origin_country"
            :modal_title="gemFieldModalTitle(field_configs.origin_country)"
            :gem_edit="gemEditorProps(field_configs.origin_country)"
            @presentClick="openEditModal(field_configs.origin_country)"
            @close="editing_field = null"
            @saved="onFieldSaved"
          />
          <SGEditableMetaField
            :label="$t('sg_country_of_cut')"
            icon="scissors"
            :value="gem.country_of_cut"
            :is_flashing="isFieldFlashing('country_of_cut')"
            :modal_open="editing_field === field_configs.country_of_cut"
            :modal_title="gemFieldModalTitle(field_configs.country_of_cut)"
            :gem_edit="gemEditorProps(field_configs.country_of_cut)"
            @presentClick="openEditModal(field_configs.country_of_cut)"
            @close="editing_field = null"
            @saved="onFieldSaved"
          />
          <SGEditableMetaField
            :label="$t('sg_treatment_type')"
            icon="tools"
            :value="gem.treatment_type"
            :is_flashing="isFieldFlashing('treatment_type')"
            :modal_open="editing_field === field_configs.treatment_type"
            :modal_title="gemFieldModalTitle(field_configs.treatment_type)"
            :gem_edit="gemEditorProps(field_configs.treatment_type)"
            @presentClick="openEditModal(field_configs.treatment_type)"
            @close="editing_field = null"
            @saved="onFieldSaved"
          />
          <SGEditableMetaField
            :label="field_configs.dimensions_lwh.label"
            :icon="field_configs.dimensions_lwh.icon"
            :value="formatGemDimensionsInline(gem)"
            :is_flashing="isFieldFlashing('dimensions_lwh')"
            :modal_open="editing_field === field_configs.dimensions_lwh"
            :modal_title="gemFieldModalTitle(field_configs.dimensions_lwh)"
            :gem_edit="gemEditorProps(field_configs.dimensions_lwh)"
            @presentClick="openEditModal(field_configs.dimensions_lwh)"
            @close="editing_field = null"
            @saved="onFieldSaved"
          />
        </div>
      </SGSectionPanel>

      <SGSectionPanel section_id="pricing" :title="$t('sg_section_pricing')">
        <div class="_pricingGroups">
          <div class="_pricingPair">
            <p class="_pricingPairCaption">
              {{ $t("sg_pricing_pair_caption", { line: "PCb" }) }}
            </p>
            <div class="_pricingPairGrid">
              <SGEditableMetaField
                :label="$t('sg_base_price_pcb')"
                icon="tag"
                :pill_text="$t('sg_pricing_cell_total')"
                :value="gem.base_price_pcb"
                :is_flashing="isFieldFlashing('base_price_pcb')"
                :modal_open="editing_field === field_configs.base_price_pcb"
                :modal_title="gemFieldModalTitle(field_configs.base_price_pcb)"
                :gem_edit="gemEditorProps(field_configs.base_price_pcb)"
                @presentClick="openEditModal(field_configs.base_price_pcb)"
                @close="editing_field = null"
                @saved="onFieldSaved"
              />
              <SGEditableMetaField
                :label="$t('sg_price_per_carat_pcb')"
                icon="diagram2"
                :pill_text="$t('sg_pricing_cell_per_carat')"
                :value="displayGemFieldValue('price_per_carat_pcb')"
                :is_flashing="isFieldFlashing('price_per_carat_pcb')"
                :modal_open="
                  editing_field === field_configs.price_per_carat_pcb
                "
                :modal_title="
                  gemFieldModalTitle(field_configs.price_per_carat_pcb)
                "
                :gem_edit="gemEditorProps(field_configs.price_per_carat_pcb)"
                @presentClick="openEditModal(field_configs.price_per_carat_pcb)"
                @close="editing_field = null"
                @saved="onFieldSaved"
              />
            </div>
          </div>
          <div class="_pricingPair">
            <p class="_pricingPairCaption">
              {{ $t("sg_pricing_pair_caption", { line: "PA" }) }}
            </p>
            <div class="_pricingPairGrid">
              <SGEditableMetaField
                :label="$t('sg_purchased_price_pa')"
                icon="tag"
                :pill_text="$t('sg_pricing_cell_total')"
                :value="gem.purchased_price_pa"
                :is_flashing="isFieldFlashing('purchased_price_pa')"
                :modal_open="editing_field === field_configs.purchased_price_pa"
                :modal_title="
                  gemFieldModalTitle(field_configs.purchased_price_pa)
                "
                :gem_edit="gemEditorProps(field_configs.purchased_price_pa)"
                @presentClick="openEditModal(field_configs.purchased_price_pa)"
                @close="editing_field = null"
                @saved="onFieldSaved"
              />
              <SGEditableMetaField
                :label="$t('sg_price_per_carat_pa')"
                icon="diagram2"
                :pill_text="$t('sg_pricing_cell_per_carat')"
                :value="displayGemFieldValue('price_per_carat_pa')"
                :is_flashing="isFieldFlashing('price_per_carat_pa')"
                :modal_open="editing_field === field_configs.price_per_carat_pa"
                :modal_title="
                  gemFieldModalTitle(field_configs.price_per_carat_pa)
                "
                :gem_edit="gemEditorProps(field_configs.price_per_carat_pa)"
                @presentClick="openEditModal(field_configs.price_per_carat_pa)"
                @close="editing_field = null"
                @saved="onFieldSaved"
              />
            </div>
          </div>
          <div class="_pricingPair">
            <p class="_pricingPairCaption">
              {{ $t("sg_pricing_pair_caption", { line: "PV" }) }}
            </p>
            <div class="_pricingPairGrid">
              <SGEditableMetaField
                :label="$t('sg_pv_selling_price')"
                icon="tag"
                :pill_text="$t('sg_pricing_cell_total')"
                :value="gem.pv_selling_price"
                :is_flashing="isFieldFlashing('pv_selling_price')"
                :modal_open="editing_field === field_configs.pv_selling_price"
                :modal_title="
                  gemFieldModalTitle(field_configs.pv_selling_price)
                "
                :gem_edit="gemEditorProps(field_configs.pv_selling_price)"
                @presentClick="openEditModal(field_configs.pv_selling_price)"
                @close="editing_field = null"
                @saved="onFieldSaved"
              />
              <SGEditableMetaField
                :label="$t('sg_price_per_carat_pv')"
                icon="diagram2"
                :pill_text="$t('sg_pricing_cell_per_carat')"
                :value="displayGemFieldValue('price_per_carat_pv')"
                :is_flashing="isFieldFlashing('price_per_carat_pv')"
                :modal_open="editing_field === field_configs.price_per_carat_pv"
                :modal_title="
                  gemFieldModalTitle(field_configs.price_per_carat_pv)
                "
                :gem_edit="gemEditorProps(field_configs.price_per_carat_pv)"
                @presentClick="openEditModal(field_configs.price_per_carat_pv)"
                @close="editing_field = null"
                @saved="onFieldSaved"
              />
            </div>
          </div>
          <div class="_pricingPair">
            <p class="_pricingPairCaption">
              {{ $t("sg_pricing_pair_caption_from_pv", { line: "PVD" }) }}
            </p>
            <div class="_pricingPairGrid">
              <SGGemFieldCard
                :label="$t('sg_pvd_asking_price')"
                icon="diagram2"
                :link_role="$t('sg_pricing_cell_total')"
                :value="pvd_asking_price_computed"
                :readonly="true"
              />
              <SGGemFieldCard
                :label="$t('sg_price_per_carat_pvd')"
                icon="diagram2"
                :link_role="$t('sg_pricing_cell_per_carat')"
                :value="pvd_per_carat_computed"
                :readonly="true"
              />
            </div>
          </div>
          <div class="_pricingPair">
            <p class="_pricingPairCaption">
              {{ $t("sg_pricing_pair_caption", { line: "PC" }) }}
            </p>
            <div class="_pricingPairGrid">
              <SGEditableMetaField
                :label="$t('sg_pc_to')"
                icon="file-earmark-text"
                :pill_text="$t('sg_pricing_cell_total')"
                :value="gem.pc_to"
                :is_flashing="isFieldFlashing('pc_to')"
                :modal_open="editing_field === field_configs.pc_to"
                :modal_title="gemFieldModalTitle(field_configs.pc_to)"
                :gem_edit="gemEditorProps(field_configs.pc_to)"
                @presentClick="openEditModal(field_configs.pc_to)"
                @close="editing_field = null"
                @saved="onFieldSaved"
              />
              <SGEditableMetaField
                :label="$t('sg_price_per_carat_pc')"
                icon="diagram2"
                :pill_text="$t('sg_pricing_cell_per_carat')"
                :value="displayGemFieldValue('price_per_carat_pc')"
                :is_flashing="isFieldFlashing('price_per_carat_pc')"
                :modal_open="editing_field === field_configs.price_per_carat_pc"
                :modal_title="
                  gemFieldModalTitle(field_configs.price_per_carat_pc)
                "
                :gem_edit="gemEditorProps(field_configs.price_per_carat_pc)"
                @presentClick="openEditModal(field_configs.price_per_carat_pc)"
                @close="editing_field = null"
                @saved="onFieldSaved"
              />
            </div>
          </div>
          <div class="_pricingPair">
            <p class="_pricingPairCaption">
              {{ $t("sg_pricing_pair_caption", { line: "PF" }) }}
            </p>
            <div class="_pricingPairGrid">
              <SGEditableMetaField
                :label="$t('sg_pf_invoiced_price')"
                icon="file-earmark-text"
                :pill_text="$t('sg_pricing_cell_total')"
                :value="gem.pf_invoiced_price"
                :is_flashing="isFieldFlashing('pf_invoiced_price')"
                :modal_open="editing_field === field_configs.pf_invoiced_price"
                :modal_title="
                  gemFieldModalTitle(field_configs.pf_invoiced_price)
                "
                :gem_edit="gemEditorProps(field_configs.pf_invoiced_price)"
                @presentClick="openEditModal(field_configs.pf_invoiced_price)"
                @close="editing_field = null"
                @saved="onFieldSaved"
              />
              <SGEditableMetaField
                :label="$t('sg_price_per_carat_pf')"
                icon="diagram2"
                :pill_text="$t('sg_pricing_cell_per_carat')"
                :value="displayGemFieldValue('price_per_carat_pf')"
                :is_flashing="isFieldFlashing('price_per_carat_pf')"
                :modal_open="editing_field === field_configs.price_per_carat_pf"
                :modal_title="
                  gemFieldModalTitle(field_configs.price_per_carat_pf)
                "
                :gem_edit="gemEditorProps(field_configs.price_per_carat_pf)"
                @presentClick="openEditModal(field_configs.price_per_carat_pf)"
                @close="editing_field = null"
                @saved="onFieldSaved"
              />
            </div>
          </div>
        </div>
      </SGSectionPanel>

      <SGGemMediaSection :gem_path="gem_path" :gem="gem" :can_edit="can_edit" />

      <SGGemCertificatesSection
        :gem_path="gem_path"
        :gem="gem"
        :can_edit="can_edit"
      />

      <SGFolderMetaPeek :folder_meta="gem" />
    </div>
  </section>
</template>

<script>
import RemoveMenu2 from "@/adc-core/fields/RemoveMenu2.vue";
import { buildGemFieldConfigs } from "@/components/gems/gem_field_configs";
import GemPricing from "@/mixins/GemPricing";
import GemDimensions from "@/mixins/GemDimensions";
import FieldFlashMixin from "@/mixins/FieldFlashMixin";
import SectionAnchorScrollMixin from "@/mixins/SectionAnchorScrollMixin.js";
import SGEditableMetaField from "@/components/softgems/SGEditableMetaField.vue";
import SGFolderMetaPeek from "@/components/softgems/SGFolderMetaPeek.vue";
import SGFolderModificationsHistory from "@/components/softgems/SGFolderModificationsHistory.vue";
import SGSectionPanel from "@/components/softgems/SGSectionPanel.vue";
import SGGemSelectionsSection from "@/components/gems/SGGemSelectionsSection.vue";

export default {
  name: "SGGemOpenView",
  mixins: [
    GemPricing,
    GemDimensions,
    FieldFlashMixin,
    SectionAnchorScrollMixin,
  ],
  components: {
    RemoveMenu2,
    SGEditableMetaField,
    SGFolderMetaPeek,
    SGFolderModificationsHistory,
    SGSectionPanel,
    SGGemSelectionsSection,
    SGGemFieldCard: () => import("@/components/gems/SGGemFieldCard.vue"),
    SGGemCertificatesSection: () =>
      import("@/components/gems/SGGemCertificatesSection.vue"),
    SGGemMediaSection: () => import("@/components/gems/SGGemMediaSection.vue"),
  },
  props: {
    gem_id: {
      type: String,
      required: true,
    },
    /** When true, back/close and remove stay in context (emit closePanel instead of /gems). */
    panel_mode: {
      type: Boolean,
      default: false,
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
    };
  },
  computed: {
    can_edit() {
      return !!this.connected_as;
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
    pvd_per_carat_computed() {
      return this.computePerCarat({
        total_value: this.toNumberOrDefault(this.pvd_asking_price_computed),
        weight_ct: this.toNumberOrDefault(this.gem?.weight_ct),
      });
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
    async fetchGem() {
      this.is_loading = true;
      this.fetch_error = "";
      try {
        this.gem = await this.$api.getFolder({ path: this.gem_path });
      } catch ({ code }) {
        this.fetch_error = code || this.$t("sg_could_not_load_gem");
      } finally {
        this.is_loading = false;
        if (this.gem && !this.fetch_error) {
          this.scrollToRouteSectionAnchorAfterLoad();
        }
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
      if (!this.connected_as) return;
      this.editing_field = field_config;
    },
    gemFieldModalTitle() {
      return this.gem_title;
    },
    gemEditorProps(field_config) {
      return {
        field: field_config,
        current_value: this.gemFieldDisplayValue(this.gem, field_config),
        gem_path: this.gem_path,
        gem: this.gem,
        meta_target_path: "",
        auxiliary_disable: false,
      };
    },
    displayGemFieldValue(field_key) {
      const field_config = this.field_configs[field_key];
      return this.gemFieldDisplayValue(this.gem, field_config);
    },
    onFieldSaved({ key, value, changes }) {
      if (!this.gem) return;
      const has_changed_keys =
        changes &&
        typeof changes === "object" &&
        Object.keys(changes).length > 0;
      const next_changes = has_changed_keys
        ? changes
        : key
        ? { [key]: value }
        : {};
      const flash_keys = this.expandLinearDimensionFlashKeys(
        this.expandPricingFlashKeys(Object.keys(next_changes))
      );
      this.flashFields(flash_keys);
      Object.keys(next_changes).forEach((change_key) => {
        this.$set(this.gem, change_key, next_changes[change_key]);
      });
      const should_refresh_all_per_carat = Object.prototype.hasOwnProperty.call(
        next_changes,
        "weight_ct"
      );
      this.getPriceFieldPairs().forEach(
        ({ total_key, virtual_per_carat_key }) => {
          if (
            should_refresh_all_per_carat ||
            Object.prototype.hasOwnProperty.call(next_changes, total_key)
          ) {
            this.$set(
              this.gem,
              virtual_per_carat_key,
              this.computeDisplayedPerCaratForGem(this.gem, total_key)
            );
          }
        }
      );
    },
    onGemRemoved() {
      this.show_remove_modal = false;
      if (this.panel_mode) {
        this.$emit("closePanel");
        return;
      }
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
  padding: calc(var(--spacing) * 1.35) calc(var(--spacing) * 3)
    calc(var(--spacing) * 2);
}

._pageHeader {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--spacing);
  margin-bottom: calc(var(--spacing) * 1);
}

._headerMain {
  min-width: 0;
  flex: 1 1 auto;
}

._titleRow {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: calc(var(--spacing) * 0.75);
}

._titleGroup {
  min-width: 0;
}

._pageTitle {
  margin: 0;
}

._pageSubtitle {
  margin: calc(var(--spacing) / 6) 0 0;
  color: var(--c-gris_fonce);
  font-size: 0.95rem;
}

._pageSubtitle_muted {
  font-size: 0.85rem;
}

._content {
  // max-width: 720px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: calc(var(--spacing) * 1.1);
}

._topOverview {
  display: grid;
  grid-template-columns: minmax(220px, 220px) minmax(0, 1fr);
  gap: calc(var(--spacing) * 0.9);
  align-items: start;
}

._coverColumn {
  min-width: 0;
  flex: 0 1 200px;
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

._fieldsGrid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: calc(var(--spacing) / 1.75);
}

._pricingGroups {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 300px), 1fr));
  gap: calc(var(--spacing) * 0.45);
  align-items: start;
}

._pricingPair {
  margin: 0;
  padding: calc(var(--spacing) * 0.4);
  border-radius: 8px;
  border: 1px solid var(--c-gris_clair);
  // background: var(--c-gris);
}

._pricingPair_other {
  grid-column: 1 / -1;
  border-color: var(--c-gris_clair);
  background: color-mix(in srgb, var(--c-gris_clair) 22%, var(--c-blanc));
}

._pricingPairCaption {
  margin: 0 0 calc(var(--spacing) * 0.3) 0;
  font-size: var(--sl-font-size-x-small);
  font-weight: 700;
  color: var(--c-noir);
  letter-spacing: 0.01em;
  line-height: 1.25;
}

._pricingPairGrid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: calc(var(--spacing) / 2.5);
}

/* denser field cards inside pricing only */
._pricingGroups :deep(._gemFieldCard) {
  gap: 2px;
}

._pricingGroups :deep(._labelRow) {
  gap: calc(var(--spacing) / 5);
  align-items: center;
}

._pricingGroups :deep(._linkRolePill) {
  margin-top: 0;
  font-size: 0.55rem;
  padding: 2px 5px;
  letter-spacing: 0.04em;
  border-color: var(--c-gris);
}

._pricingGroups :deep(._value) {
  padding: calc(var(--spacing) * 0.32);
  font-size: var(--sl-font-size-x-small);
}

@media (max-width: 920px) {
  ._topOverview {
    grid-template-columns: 1fr;
  }
}
</style>
