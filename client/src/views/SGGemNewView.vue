<template>
  <section class="_gemNewView">
    <div class="_pageHeader">
      <h1 class="_pageTitle">{{ $t("sg_create_gem_title") }}</h1>
      <button type="button" class="u-button" @click="goBack">
        {{ $t("sg_back") }}
      </button>
    </div>

    <form class="_form" @submit.prevent="createGem">
      <section class="_formSection">
        <h2 class="_sectionTitle">{{ $t("sg_section_identification") }}</h2>
        <div class="_fieldsGrid">
          <div>
            <DLabel :str="$t('sg_reference_supplier')" />
            <TextInput
              :content.sync="new_gem_fields.reference_supplier"
              :required="false"
            />
          </div>
          <div>
            <DLabel :str="$t('sg_reference_customer')" />
            <TextInput
              :content.sync="new_gem_fields.reference_customer"
              :required="false"
            />
          </div>
          <div>
            <DLabel :str="$t('sg_paired_gem')" />
            <SGSelectField
              v-model="new_gem_fields.paired_gem"
              :options="paired_gem_options"
              :allow_empty="true"
            />
          </div>
        </div>
      </section>

      <section class="_formSection">
        <h2 class="_sectionTitle">
          {{ $t("sg_section_stone_characteristics") }}
        </h2>
        <div class="_fieldsGrid">
          <div>
            <DLabel :str="$t('sg_number_of_pieces')" />
            <TextInput
              :content.sync="new_gem_fields.number_of_pieces"
              :required="false"
              input_type="number"
            />
          </div>
          <div>
            <DLabel :str="$t('sg_stone_type')" />
            <SGSelectField
              v-model="new_gem_fields.stone_type"
              :options="stone_type_suggestions"
              :allow_empty="true"
            />
          </div>
          <div>
            <DLabel :str="$t('sg_weight_ct')" />
            <TextInput
              :content.sync="new_gem_fields.weight_ct"
              :required="false"
              input_type="number"
            />
          </div>
          <div>
            <DLabel :str="$t('sg_color')" />
            <SGSelectField
              v-model="new_gem_fields.color"
              :options="color_suggestions"
              :allow_empty="true"
            />
          </div>
          <div>
            <DLabel :str="$t('sg_shape')" />
            <SGSelectField
              v-model="new_gem_fields.shape"
              :options="shape_suggestions"
              :allow_empty="true"
            />
          </div>
          <div>
            <DLabel :str="$t('sg_origin_country')" />
            <SGSelectField
              v-model="new_gem_fields.origin_country"
              :options="origin_country_suggestions"
              :allow_empty="true"
            />
          </div>
          <div>
            <DLabel :str="$t('sg_treatment_type')" />
            <SGSelectField
              v-model="new_gem_fields.treatment_type"
              :options="treatment_type_suggestions"
              :allow_empty="true"
            />
          </div>
          <div>
            <DLabel :str="$t('sg_length_mm')" />
            <TextInput
              :content.sync="new_gem_fields.length_mm"
              :required="false"
              input_type="number"
            />
          </div>
          <div>
            <DLabel :str="$t('sg_width_mm')" />
            <TextInput
              :content.sync="new_gem_fields.width_mm"
              :required="false"
              input_type="number"
            />
          </div>
          <div>
            <DLabel :str="$t('sg_height_mm')" />
            <TextInput
              :content.sync="new_gem_fields.height_mm"
              :required="false"
              input_type="number"
            />
          </div>
        </div>
      </section>

      <section class="_formSection">
        <h2 class="_sectionTitle">{{ $t("sg_section_pricing") }}</h2>
        <div class="_fieldsGrid">
          <div>
            <DLabel :str="$t('sg_base_price_pcb')" />
            <TextInput
              :content.sync="new_gem_fields.base_price_pcb"
              :required="false"
              input_type="number"
            />
          </div>
          <div>
            <DLabel :str="$t('sg_purchased_price_pa')" />
            <TextInput
              :content.sync="new_gem_fields.purchased_price_pa"
              :required="false"
              input_type="number"
            />
          </div>
          <div>
            <DLabel :str="$t('sg_price_per_carat_pa_pcb')" />
            <TextInput
              :content.sync="new_gem_fields.price_per_carat_pa_pcb"
              :required="false"
              input_type="number"
            />
          </div>
          <div>
            <DLabel :str="$t('sg_pv_selling_price')" />
            <TextInput
              :content.sync="new_gem_fields.pv_selling_price"
              :required="false"
              input_type="number"
            />
          </div>
          <div>
            <DLabel :str="$t('sg_pvd_asking_price')" />
            <input
              :value="pvd_asking_price_preview"
              type="number"
              class="u-input"
              readonly
            />
          </div>
          <div>
            <DLabel :str="$t('sg_pc_to')" />
            <TextInput
              :content.sync="new_gem_fields.pc_to"
              :required="false"
              input_type="number"
            />
          </div>
          <div>
            <DLabel :str="$t('sg_pf_invoiced_price')" />
            <TextInput
              :content.sync="new_gem_fields.pf_invoiced_price"
              :required="false"
              input_type="number"
            />
          </div>
          <div>
            <DLabel :str="$t('sg_price_per_carat_all')" />
            <TextInput
              :content.sync="new_gem_fields.price_per_carat_all"
              :required="false"
              input_type="number"
            />
          </div>
        </div>
      </section>

      <section class="_formSection">
        <h2 class="_sectionTitle">{{ $t("sg_section_creation") }}</h2>
        <div>
          <DLabel :str="$t('sg_internal_name_optional')" />
          <TextInput :content.sync="new_gem_name" :required="false" />
        </div>
      </section>

      <div class="_actions">
        <button type="button" class="u-button" @click="goBack">
          {{ $t("sg_cancel") }}
        </button>
        <button
          type="submit"
          class="u-button u-button_bleuvert"
          :disabled="is_creating"
        >
          {{
            is_creating ? $t("sg_create_gem_in_progress") : $t("sg_create_gem")
          }}
        </button>
      </div>
    </form>
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
import SGSelectField from "@/components/softgems/SGSelectField.vue";

const v1_new_gem_fields_defaults = {
  status: "reference",
  reference_supplier: "",
  reference_customer: "",
  paired_gem: "",
  number_of_pieces: 1,
  stone_type: "",
  color: "",
  shape: "",
  origin_country: "",
  treatment_type: "",
  length_mm: 0,
  width_mm: 0,
  height_mm: 0,
  weight_ct: 0,
  base_price_pcb: 0,
  purchased_price_pa: 0,
  price_per_carat_pa_pcb: 0,
  pv_selling_price: 0,
  pvd_asking_price: 0,
  pc_to: 0,
  pf_invoiced_price: 0,
  price_per_carat_all: 0,
};

export default {
  name: "SGGemNewView",
  components: {
    SGSelectField,
  },
  async created() {
    await this.fetchPairableGems();
  },
  beforeDestroy() {
    if (!this.is_joined_gems_room) return;
    this.$api.leave({ room: this.gems_path });
    this.is_joined_gems_room = false;
  },
  data() {
    return {
      gems_path: "gems",
      new_gem_name: "",
      new_gem_fields: { ...v1_new_gem_fields_defaults },
      color_suggestions,
      origin_country_suggestions,
      paired_gem_options: [],
      shape_suggestions,
      stone_type_suggestions,
      treatment_type_suggestions,
      is_creating: false,
      is_joined_gems_room: false,
    };
  },
  computed: {
    pvd_asking_price_preview() {
      const pv_selling_price = Number(this.new_gem_fields.pv_selling_price);
      if (!Number.isFinite(pv_selling_price)) return 0;
      return Number((pv_selling_price * 1.15).toFixed(2));
    },
  },
  methods: {
    goBack() {
      this.$router.push("/gems");
    },
    async fetchPairableGems() {
      try {
        if (!this.is_joined_gems_room) {
          this.$api.join({ room: this.gems_path });
          this.is_joined_gems_room = true;
        }
        const gems = await this.$api.getFolders({
          path: this.gems_path,
        });
        this.paired_gem_options = (Array.isArray(gems) ? gems : []).map(
          (gem) => {
            const gem_id = this.getGemIdFromPath(gem?.$path);
            const gem_label =
              this.cleanString(gem?.reference_id) ||
              this.cleanString(gem?.title) ||
              this.cleanString(gem?.name) ||
              gem_id;
            return {
              value: gem_id,
              label: gem_label,
            };
          }
        );
      } catch {
        this.paired_gem_options = [];
      }
    },
    getGemIdFromPath(gem_path) {
      const cleaned_path = this.cleanString(gem_path);
      if (!cleaned_path) return "";
      const path_parts = cleaned_path.split("/");
      return path_parts[path_parts.length - 1] || "";
    },
    async createGem() {
      const cleaned_name = this.getGemTitle();
      if (!cleaned_name || this.is_creating) return;

      const normalized_gem_fields = this.normalizeGemFields(
        this.new_gem_fields
      );
      const paired_gem_id = normalized_gem_fields.paired_gem;

      this.is_creating = true;
      try {
        const new_gem_slug = await this.$api.createFolder({
          path: this.gems_path,
          additional_meta: {
            title: cleaned_name,
            name: cleaned_name,
            $status: "public",
            $admins: "everyone",
            $contributors: "everyone",
            ...normalized_gem_fields,
          },
        });
        if (new_gem_slug) {
          await this.syncReciprocalPairing({
            new_gem_slug,
            paired_gem_id,
          });
          this.$router.push(`/gems/${new_gem_slug}`);
        } else this.$router.push("/gems");
      } catch ({ code }) {
        this.$alertify
          .delay(4000)
          .error(code || this.$t("sg_could_not_create_gem"));
      } finally {
        this.is_creating = false;
      }
    },
    async syncReciprocalPairing({ new_gem_slug, paired_gem_id }) {
      const cleaned_new_gem_slug = this.cleanString(new_gem_slug);
      const cleaned_paired_gem_id = this.cleanString(paired_gem_id);
      if (!cleaned_new_gem_slug || !cleaned_paired_gem_id) return;
      if (cleaned_new_gem_slug === cleaned_paired_gem_id) return;

      try {
        await this.$api.updateMeta({
          path: `${this.gems_path}/${cleaned_paired_gem_id}`,
          new_meta: {
            paired_gem: cleaned_new_gem_slug,
          },
        });
      } catch {
        // Do not block creation if reciprocal link update fails.
      }
    },
    getGemTitle() {
      const explicit_name = this.cleanString(this.new_gem_name);
      if (explicit_name) return explicit_name;

      const derived_name =
        this.cleanString(this.new_gem_fields.reference_supplier) ||
        this.cleanString(this.new_gem_fields.reference_customer) ||
        this.cleanString(this.new_gem_fields.stone_type);

      if (derived_name) return derived_name;
      return `Gem ${new Date().toISOString().slice(0, 19).replace("T", " ")}`;
    },
    normalizeGemFields(raw_fields) {
      const normalized_fields = {
        ...v1_new_gem_fields_defaults,
        ...raw_fields,
      };

      const string_field_keys = [
        "reference_supplier",
        "reference_customer",
        "paired_gem",
        "stone_type",
        "color",
        "shape",
        "origin_country",
        "treatment_type",
      ];
      string_field_keys.forEach((field_key) => {
        normalized_fields[field_key] = this.cleanString(
          normalized_fields[field_key]
        );
      });

      // Status is automatic and not editable in this form.
      normalized_fields.status = "reference";

      const number_field_keys = [
        "number_of_pieces",
        "length_mm",
        "width_mm",
        "height_mm",
        "weight_ct",
        "base_price_pcb",
        "purchased_price_pa",
        "price_per_carat_pa_pcb",
        "pv_selling_price",
        "pc_to",
        "pf_invoiced_price",
        "price_per_carat_all",
      ];
      number_field_keys.forEach((field_key) => {
        normalized_fields[field_key] = this.toNumberOrDefault(
          normalized_fields[field_key],
          v1_new_gem_fields_defaults[field_key]
        );
      });

      normalized_fields.pvd_asking_price = Number(
        (normalized_fields.pv_selling_price * 1.15).toFixed(2)
      );

      return normalized_fields;
    },
    cleanString(value) {
      if (value === null || value === undefined) return "";
      return String(value).trim();
    },
    toNumberOrDefault(value, fallback_value = 0) {
      const as_number = Number(value);
      if (Number.isFinite(as_number)) return as_number;
      return fallback_value;
    },
  },
};
</script>

<style lang="scss" scoped>
._gemNewView {
  padding: calc(var(--spacing) * 1) calc(var(--spacing) * 2);
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

._form {
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

._fieldsGrid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: calc(var(--spacing) / 1.75);
}

._textarea {
  width: 100%;
  min-height: 96px;
}

._actions {
  display: flex;
  justify-content: flex-end;
  gap: calc(var(--spacing) / 2);
}
</style>
