z
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
      <div>
        <h1 class="_pageTitle">{{ gem_title }}</h1>
        <p v-if="gem_internal_name" class="_pageSubtitle">
          {{ gem_internal_name }}
        </p>
        <button
          v-if="gem_last_edited_date"
          type="button"
          class="_historyTrigger"
          @click="openHistoryModal"
        >
          {{ $t("sg_last_modified") }}: {{ gem_last_edited_date }}
        </button>
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
      <!-- Overview: cover + files -->

      <section class="_formSection">
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
            :label="$t('sg_internal_name')"
            icon="pencil"
            :value="gem.internal_name"
            @click="openEditModal(field_configs.internal_name)"
          />
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
            :label="$t('sg_price_per_carat_pcb')"
            icon="diagram2"
            :value="gem.price_per_carat_pcb"
            @click="openEditModal(field_configs.price_per_carat_pcb)"
          />
          <SGGemFieldCard
            :label="$t('sg_price_per_carat_pa')"
            icon="diagram2"
            :value="gem.price_per_carat_pa"
            @click="openEditModal(field_configs.price_per_carat_pa)"
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
      :gem="gem"
      @saved="onFieldSaved"
      @close="editing_field = null"
    />

    <BaseModal2
      v-if="show_history_modal"
      :title="$t('sg_modifications_history')"
      :size="'large'"
      @close="show_history_modal = false"
    >
      <div class="_historyModalBody">
        <div v-if="is_loading_history" class="_historyLoading">
          <LoaderSpinner />
        </div>
        <p v-else-if="gem_history_entries.length === 0" class="_historyEmpty">
          {{ $t("sg_no_history") }}
        </p>
        <ul v-else class="_historyList">
          <li
            v-for="(entry, index) in gem_history_entries"
            :key="`${entry.ts}-${entry.event}-${
              entry.field || 'created'
            }-${index}`"
            class="_historyEntry"
          >
            <p class="_historyEntryTitle">
              {{ formatHistoryEntryTitle(entry) }}
            </p>
            <p class="_historyEntryMeta">
              <time :datetime="entry.ts">{{
                formatRecentDateTime(entry.ts)
              }}</time>
              <template v-if="entry.author">
                • {{ $t("sg_history_by") }}
                <strong>{{ formatAuthor(entry.author) }}</strong>
              </template>
            </p>
          </li>
        </ul>
      </div>
    </BaseModal2>
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
      show_history_modal: false,
      is_loading_history: false,
      gem_history_entries: [],
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
    gem_internal_name() {
      return this.cleanString(this.gem?.internal_name);
    },
    gem_last_edited_date() {
      const raw_date = this.gem?.$date_modified || this.gem?.$date_created;
      if (!raw_date) return "";
      return this.formatRecentDateTime(raw_date);
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
        const gem = await this.$api.getFolder({ path: this.gem_path });
        this.gem = this.normalizeGemPricingFields(gem);
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
    async openHistoryModal() {
      this.show_history_modal = true;
      if (this.gem_history_entries.length > 0) return;

      this.is_loading_history = true;
      try {
        const entries = await this.$api.getFieldHistory({
          path: this.gem_path,
        });
        this.gem_history_entries = (Array.isArray(entries) ? entries : [])
          .slice()
          .reverse();
      } catch {
        this.gem_history_entries = [];
      } finally {
        this.is_loading_history = false;
      }
    },
    formatHistoryEntryTitle(entry) {
      if (entry?.event === "created") {
        const fields_count = Object.keys(entry?.fields || {}).length;
        return `${this.$t("sg_created")} (${fields_count} fields)`;
      }

      if (entry?.event === "updated") {
        const field_name =
          this.field_configs?.[entry.field]?.label || entry.field;
        const value_text =
          entry.value === null ||
          entry.value === undefined ||
          entry.value === ""
            ? "—"
            : String(entry.value);
        return `${field_name}: ${value_text}`;
      }

      return this.$t("sg_field_history");
    },
    formatAuthor(author_path) {
      if (!author_path) return "";
      const author = this.getAuthor(author_path);
      if (author) return author.name;
      const parts = String(author_path).split("/");
      return parts[parts.length - 1] || author_path;
    },
    openEditModal(field_config) {
      const raw_value = this.gem?.[field_config.key];
      this.editing_current_value =
        raw_value !== undefined && raw_value !== null ? raw_value : "";
      this.editing_field = field_config;
    },
    onFieldSaved({ key, value, changes }) {
      if (!this.gem) return;
      if (changes && typeof changes === "object") {
        this.gem = this.normalizeGemPricingFields({ ...this.gem, ...changes });
        return;
      }
      this.gem = this.normalizeGemPricingFields({ ...this.gem, [key]: value });
    },
    normalizeGemPricingFields(gem) {
      if (!gem || typeof gem !== "object") return gem;
      const normalized_gem = { ...gem };
      const weight_ct = this.toNumberOrDefault(normalized_gem.weight_ct);
      const legacy_per_carat = this.toNumberOrNull(
        normalized_gem.price_per_carat_pa_pcb
      );

      const base_price_pcb = this.toNumberOrDefault(normalized_gem.base_price_pcb);
      const purchased_price_pa = this.toNumberOrDefault(
        normalized_gem.purchased_price_pa
      );

      normalized_gem.price_per_carat_pcb = this.resolvePerCaratValue({
        explicit_value: normalized_gem.price_per_carat_pcb,
        legacy_value: legacy_per_carat,
        total_value: base_price_pcb,
        weight_ct,
      });
      normalized_gem.price_per_carat_pa = this.resolvePerCaratValue({
        explicit_value: normalized_gem.price_per_carat_pa,
        legacy_value: legacy_per_carat,
        total_value: purchased_price_pa,
        weight_ct,
      });
      delete normalized_gem.price_per_carat_pa_pcb;
      return normalized_gem;
    },
    resolvePerCaratValue({ explicit_value, legacy_value, total_value, weight_ct }) {
      const explicit_number = this.toNumberOrNull(explicit_value);
      if (explicit_number !== null) return explicit_number;
      if (legacy_value !== null) return legacy_value;
      return this.computePerCarat({ total_value, weight_ct });
    },
    computePerCarat({ total_value, weight_ct }) {
      if (!Number.isFinite(total_value)) return 0;
      if (!Number.isFinite(weight_ct) || weight_ct <= 0) return 0;
      return Number((total_value / weight_ct).toFixed(2));
    },
    toNumberOrNull(value) {
      if (value === null || value === undefined || value === "") return null;
      const normalized_value = String(value).trim().replace(",", ".");
      const number_value = Number(normalized_value);
      if (!Number.isFinite(number_value)) return null;
      return number_value;
    },
    toNumberOrDefault(value, fallback_value = 0) {
      const number_value = this.toNumberOrNull(value);
      if (number_value === null) return fallback_value;
      return number_value;
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

._pageSubtitle {
  margin: calc(var(--spacing) / 6) 0 0;
  color: var(--c-gris_fonce);
  font-size: 0.95rem;
}

._pageSubtitle_muted {
  font-size: 0.85rem;
}

._historyTrigger {
  all: unset;
  cursor: pointer;
  margin: calc(var(--spacing) / 6) 0 0;
  color: var(--c-gris_fonce);
  font-size: 0.85rem;
  text-decoration: underline;
  text-decoration-style: dotted;

  &:hover {
    color: var(--c-noir);
  }
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

._historyModalBody {
  min-height: 120px;
}

._historyLoading {
  display: flex;
  justify-content: center;
  padding: calc(var(--spacing) / 2);
}

._historyEmpty {
  margin: 0;
  font-size: var(--sl-font-size-small);
  color: var(--c-gris_fonce);
}

._historyList {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: calc(var(--spacing) / 3);
}

._historyEntry {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: calc(var(--spacing) / 3) calc(var(--spacing) / 2);
  border: 1px solid var(--c-gris_clair);
  border-radius: 6px;
  background: var(--c-bodybg);
}

._historyEntryTitle {
  margin: 0;
  font-size: var(--sl-font-size-small);
  color: var(--c-noir);
}

._historyEntryMeta {
  margin: 0;
  font-size: var(--sl-font-size-x-small);
  color: var(--c-gris_fonce);
}

@media (max-width: 920px) {
  ._topOverview {
    grid-template-columns: 1fr;
  }
}
</style>
