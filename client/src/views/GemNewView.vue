<template>
  <section class="_gemNewView">
    <div class="u-sameRow u-spacingBottom">
      <h1>{{ $t("sg_create_gem_title") }}</h1>
      <button type="button" class="u-button" @click="goBack">
        {{ $t("sg_back") }}
      </button>
    </div>

    <form class="_form" @submit.prevent="createGem">
      <DLabel str="Name" />
      <TextInput
        :content.sync="new_gem_name"
        :required="true"
        :autofocus="true"
        @onEnter="createGem"
      />

      <div class="_fieldsGrid">
        <div>
          <DLabel :str="$t('sg_status')" />
          <TextInput :content.sync="new_gem_fields.status" :required="false" />
        </div>
        <div>
          <DLabel :str="$t('sg_type')" />
          <TextInput
            :content.sync="new_gem_fields.gem_type"
            :required="false"
          />
        </div>
        <div>
          <DLabel :str="$t('sg_color')" />
          <TextInput :content.sync="new_gem_fields.color" :required="false" />
        </div>
        <div>
          <DLabel :str="$t('sg_origin')" />
          <TextInput :content.sync="new_gem_fields.origin" :required="false" />
        </div>
        <div>
          <DLabel :str="$t('sg_dimensions')" />
          <TextInput
            :content.sync="new_gem_fields.dimensions"
            :required="false"
          />
        </div>
        <div>
          <DLabel :str="$t('sg_weight_carat')" />
          <TextInput
            :content.sync="new_gem_fields.weight_carat"
            :required="false"
            input_type="number"
          />
        </div>
        <div>
          <DLabel :str="$t('sg_piece_count')" />
          <TextInput
            :content.sync="new_gem_fields.piece_count"
            :required="false"
            input_type="number"
          />
        </div>
        <div>
          <DLabel :str="$t('sg_condition')" />
          <TextInput
            :content.sync="new_gem_fields.condition"
            :required="false"
          />
        </div>
        <div>
          <DLabel :str="$t('sg_treatment')" />
          <TextInput
            :content.sync="new_gem_fields.treatment"
            :required="false"
          />
        </div>
        <div>
          <DLabel :str="$t('sg_purchase_price_usd')" />
          <TextInput
            :content.sync="new_gem_fields.purchase_price_usd"
            :required="false"
            input_type="number"
          />
        </div>
        <div>
          <DLabel :str="$t('sg_sale_price_usd')" />
          <TextInput
            :content.sync="new_gem_fields.sale_price_usd"
            :required="false"
            input_type="number"
          />
        </div>
        <div>
          <DLabel :str="$t('sg_price_per_carat_usd')" />
          <TextInput
            :content.sync="new_gem_fields.price_per_carat_usd"
            :required="false"
            input_type="number"
          />
        </div>
        <div>
          <DLabel :str="$t('sg_supplier')" />
          <TextInput
            :content.sync="new_gem_fields.supplier"
            :required="false"
          />
        </div>
        <div>
          <DLabel :str="$t('sg_acquisition_date')" />
          <TextInput
            :content.sync="new_gem_fields.acquisition_date"
            :required="false"
            input_type="date"
          />
        </div>
        <div>
          <DLabel :str="$t('sg_country_of_cut')" />
          <TextInput
            :content.sync="new_gem_fields.country_of_cut"
            :required="false"
          />
        </div>
        <div>
          <DLabel :str="$t('sg_pair_gem_id')" />
          <TextInput
            :content.sync="new_gem_fields.pair_gem_id"
            :required="false"
          />
        </div>
      </div>

      <div>
        <DLabel :str="$t('sg_remarks')" />
        <textarea v-model="new_gem_fields.remarks" class="_textarea" rows="4" />
      </div>

      <div class="_actions">
        <button type="button" class="u-button" @click="goBack">
          {{ $t("sg_cancel") }}
        </button>
        <button
          type="submit"
          class="u-button u-button_bleuvert"
          :disabled="is_creating || !new_gem_name.trim()"
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
import { default_gem_fields } from "@/utils/gemDefaults";

export default {
  data() {
    return {
      gems_path: "gems",
      new_gem_name: "",
      new_gem_fields: { ...default_gem_fields },
      is_creating: false,
    };
  },
  methods: {
    goBack() {
      this.$router.push("/");
    },
    async createGem() {
      const cleaned_name = this.new_gem_name.trim();
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
        else this.$router.push("/");
      } catch ({ code }) {
        this.$alertify
          .delay(4000)
          .error(code || this.$t("sg_could_not_create_gem"));
      } finally {
        this.is_creating = false;
      }
    },
    normalizeGemFields(raw_fields) {
      const normalized_fields = {
        ...default_gem_fields,
        ...raw_fields,
      };

      const string_field_keys = [
        "status",
        "color",
        "origin",
        "dimensions",
        "gem_type",
        "condition",
        "treatment",
        "supplier",
        "acquisition_date",
        "country_of_cut",
        "pair_gem_id",
        "remarks",
      ];
      string_field_keys.forEach((field_key) => {
        normalized_fields[field_key] = this.cleanString(
          normalized_fields[field_key]
        );
      });

      const number_field_keys = [
        "weight_carat",
        "piece_count",
        "purchase_price_usd",
        "sale_price_usd",
        "price_per_carat_usd",
      ];
      number_field_keys.forEach((field_key) => {
        normalized_fields[field_key] = this.toNumberOrDefault(
          normalized_fields[field_key],
          default_gem_fields[field_key]
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
  max-width: 720px;
  margin: 0 auto;
}

._form {
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
