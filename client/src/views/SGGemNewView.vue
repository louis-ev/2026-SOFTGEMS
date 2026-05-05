<template>
  <section class="_gemNewView">
    <div class="_pageHeader">
      <h1 class="_pageTitle">{{ $t("sg_create_gem_title") }}</h1>
      <button type="button" class="u-button" @click="goBack">
        {{ $t("sg_back") }}
      </button>
    </div>

    <form class="_form" @submit.prevent="createGem">
      <div class="_fieldsGrid">
        <div>
          <DLabel :str="$t('sg_status')" />
          <TextInput :content.sync="new_gem_fields.status" :required="false" />
        </div>
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
          <DLabel :str="$t('sg_pair_single_indicator')" />
          <TextInput
            :content.sync="new_gem_fields.pair_single_indicator"
            :required="false"
          />
        </div>
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
          <DLabel :str="$t('sg_color')" />
          <TextInput :content.sync="new_gem_fields.color" :required="false" />
        </div>
        <div>
          <DLabel :str="$t('sg_shape')" />
          <TextInput :content.sync="new_gem_fields.shape" :required="false" />
        </div>
        <div>
          <DLabel :str="$t('sg_origin_country')" />
          <TextInput
            :content.sync="new_gem_fields.origin_country"
            :required="false"
          />
        </div>
        <div>
          <DLabel :str="$t('sg_treatment_type')" />
          <TextInput
            :content.sync="new_gem_fields.treatment_type"
            :required="false"
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
        <div>
          <DLabel :str="$t('sg_weight_ct')" />
          <TextInput
            :content.sync="new_gem_fields.weight_ct"
            :required="false"
            input_type="number"
          />
        </div>
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
      </div>

      <div>
        <DLabel :str="$t('sg_internal_name_optional')" />
        <TextInput :content.sync="new_gem_name" :required="false" />
      </div>

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
import { stone_type_suggestions } from "@/suggestions/softgems";
import SGSelectField from "@/components/softgems/SGSelectField.vue";

const v1_new_gem_fields_defaults = {
  status: "reference",
  reference_supplier: "",
  reference_customer: "",
  pair_single_indicator: "",
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
};

export default {
  name: "SGGemNewView",
  components: {
    SGSelectField,
  },
  data() {
    return {
      gems_path: "gems",
      new_gem_name: "",
      new_gem_fields: { ...v1_new_gem_fields_defaults },
      stone_type_suggestions,
      is_creating: false,
    };
  },
  methods: {
    goBack() {
      this.$router.push("/gems");
    },
    async createGem() {
      const cleaned_name = this.getGemTitle();
      if (!cleaned_name || this.is_creating) return;

      const normalized_gem_fields = this.normalizeGemFields(
        this.new_gem_fields
      );

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
        if (new_gem_slug) this.$router.push(`/gems/${new_gem_slug}`);
        else this.$router.push("/gems");
      } catch ({ code }) {
        this.$alertify
          .delay(4000)
          .error(code || this.$t("sg_could_not_create_gem"));
      } finally {
        this.is_creating = false;
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
        "status",
        "reference_supplier",
        "reference_customer",
        "pair_single_indicator",
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
      ];
      number_field_keys.forEach((field_key) => {
        normalized_fields[field_key] = this.toNumberOrDefault(
          normalized_fields[field_key],
          v1_new_gem_fields_defaults[field_key]
        );
      });

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
  height: 100%;
  overflow-y: auto;
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

._form {
  max-width: 720px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: calc(var(--spacing) / 1.5);
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
