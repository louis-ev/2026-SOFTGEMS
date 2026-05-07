<template>
  <section class="_gemNewView">
    <button
      type="button"
      class="u-button u-button_icon _closeButton"
      @click="goBack"
    >
      <b-icon icon="x-lg" />
    </button>

    <div class="_pageHeader">
      <h1 class="_pageTitle">{{ $t("sg_create_gem_title") }}</h1>
    </div>

    <form class="_form" @submit.prevent="createGem">
      <section
        v-for="form_section in form_sections"
        :key="form_section.key"
        class="_formSection"
      >
        <h2 class="_sectionTitle">{{ form_section.title }}</h2>
        <div class="_fieldsGrid">
          <div
            v-for="field_key in form_section.field_keys"
            :key="`${form_section.key}-${field_key}`"
            :class="{
              _fieldInvalid: !isFieldValid(field_key),
              _fieldDisabled: isFieldDisabled(field_key),
            }"
          >
            <DLabel
              :str="gem_field_configs[field_key].label"
              :icon="gem_field_configs[field_key].icon"
            />
            <input
              v-if="field_key === 'pvd_asking_price'"
              :value="pvd_asking_price_preview"
              type="number"
              class="u-input"
              readonly
            />
            <SGSelectField
              v-else-if="gem_field_configs[field_key].type === 'select'"
              :value="new_gem_fields[field_key]"
              :options="gem_field_configs[field_key].options || []"
              :allow_empty="true"
              :disabled="isFieldDisabled(field_key)"
              @input="setFieldValue(field_key, $event)"
            />
            <TextInput
              v-else
              :content="new_gem_fields[field_key]"
              :required="false"
              :disabled="isFieldDisabled(field_key)"
              :input_type="gem_field_configs[field_key].input_type || 'text'"
              :input_step="gem_field_configs[field_key].input_step"
              :instructions="gem_field_configs[field_key].instructions"
              @update:content="setFieldValue(field_key, $event)"
            />
            <p v-if="getFieldError(field_key)" class="_fieldError">
              {{ getFieldError(field_key) }}
            </p>
          </div>
        </div>
      </section>

      <section class="_formSection">
        <h2 class="_sectionTitle">{{ $t("sg_section_creation") }}</h2>
        <div>
          <DLabel :str="$t('sg_internal_name_optional')" icon="pencil" />
          <TextInput :content.sync="new_gem_internal_name" :required="false" />
        </div>
        <p class="_creationNotice">{{ $t("sg_creation_notice_documents") }}</p>
        <p class="_creationNotice">{{ $t("sg_creation_notice_editable") }}</p>
      </section>

      <div class="_actions">
        <p v-if="invalid_field_keys.length > 0" class="_formError">
          {{ invalid_fields_summary }}
        </p>
        <button type="button" class="u-button" @click="goBack">
          {{ $t("sg_cancel") }}
        </button>
        <button
          type="submit"
          class="u-button u-button_bleuvert"
          :disabled="is_create_disabled"
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
import { buildGemFieldConfigs } from "@/components/gems/gem_field_configs";
import SGSelectField from "@/components/softgems/SGSelectField.vue";

const creation_locked_field_keys = [
  "reference_supplier",
  "reference_customer",
  "paired_gem",
];

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
      new_gem_internal_name: "",
      new_gem_fields: { ...v1_new_gem_fields_defaults },
      paired_gem_options: [],
      is_creating: false,
      is_joined_gems_room: false,
    };
  },
  computed: {
    gem_field_configs() {
      return buildGemFieldConfigs(this.$t.bind(this), this.paired_gem_options);
    },
    form_sections() {
      return [
        // {
        //   key: "identification",
        //   title: this.$t("sg_section_identification"),
        //   field_keys: [
        //     "reference_supplier",
        //     "reference_customer",
        //     "paired_gem",
        //   ],
        // },
        {
          key: "stone_characteristics",
          title: this.$t("sg_section_stone_characteristics"),
          field_keys: [
            "number_of_pieces",
            "stone_type",
            "weight_ct",
            "color",
            "shape",
            "origin_country",
            "treatment_type",
            "length_mm",
            "width_mm",
            "height_mm",
          ],
        },
      ];
    },
    pvd_asking_price_preview() {
      const pv_selling_price = Number(this.new_gem_fields.pv_selling_price);
      if (!Number.isFinite(pv_selling_price)) return 0;
      return Number((pv_selling_price * 1.15).toFixed(2));
    },
    flat_form_field_keys() {
      return this.form_sections.flatMap(
        (form_section) => form_section.field_keys
      );
    },
    field_validation_map() {
      return this.flat_form_field_keys.reduce((accumulator, field_key) => {
        accumulator[field_key] = this.validateFieldValue(
          field_key,
          this.new_gem_fields[field_key]
        );
        return accumulator;
      }, {});
    },
    invalid_field_keys() {
      return this.flat_form_field_keys.filter((field_key) => {
        const field_validation = this.field_validation_map[field_key];
        return field_validation && !field_validation.is_valid;
      });
    },
    invalid_fields_summary() {
      const invalid_field_labels = this.invalid_field_keys.map(
        (field_key) => this.gem_field_configs[field_key]?.label || field_key
      );
      return this.$t("sg_invalid_fields_summary", {
        fields: invalid_field_labels.join(", "),
      });
    },
    is_create_disabled() {
      return this.is_creating || this.invalid_field_keys.length > 0;
    },
  },
  methods: {
    isFieldDisabled(field_key) {
      return creation_locked_field_keys.includes(field_key);
    },
    setFieldValue(field_key, value) {
      if (this.isFieldDisabled(field_key)) return;
      this.$set(this.new_gem_fields, field_key, value);
    },
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
              this.cleanString(gem?.internal_name) ||
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
      if (this.is_creating || this.invalid_field_keys.length > 0) return;

      const normalized_gem_fields = this.normalizeGemFields(
        this.new_gem_fields
      );
      const paired_gem_id = normalized_gem_fields.paired_gem;
      const creation_meta = this.getCreationMeta();

      this.is_creating = true;
      try {
        const new_gem_slug = await this.$api.createFolder({
          path: this.gems_path,
          additional_meta: {
            $status: "public",
            $admins: "everyone",
            $contributors: "everyone",
            ...normalized_gem_fields,
            ...creation_meta,
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
    getCreationMeta() {
      const cleaned_internal_name = this.cleanString(this.new_gem_internal_name);
      if (!cleaned_internal_name) return {};
      return {
        internal_name: cleaned_internal_name,
      };
    },
    normalizeGemFields(raw_fields) {
      const normalized_fields = {
        ...v1_new_gem_fields_defaults,
        ...raw_fields,
      };

      const string_field_keys = this.getFieldKeysByType("string");
      string_field_keys.forEach((field_key) => {
        normalized_fields[field_key] = this.cleanString(
          normalized_fields[field_key]
        );
      });

      // Status is automatic and not editable in this form.
      normalized_fields.status = "reference";

      const number_field_keys = this.getFieldKeysByType("number");
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
    getFieldKeysByType(target_type) {
      return Object.values(this.gem_field_configs)
        .filter((field_config) => {
          if (!field_config || typeof field_config !== "object") return false;
          if (field_config.key === "status") return false;
          if (field_config.readonly) return false;
          if (target_type === "number") return field_config.type === "number";
          if (target_type === "string")
            return (
              field_config.type === "text" || field_config.type === "select"
            );
          return false;
        })
        .map((field_config) => field_config.key);
    },
    getFieldError(field_key) {
      const field_validation = this.field_validation_map[field_key];
      if (!field_validation || field_validation.is_valid) return "";
      return field_validation.error_message;
    },
    isFieldValid(field_key) {
      const field_validation = this.field_validation_map[field_key];
      if (!field_validation) return true;
      return field_validation.is_valid;
    },
    validateFieldValue(field_key, raw_value) {
      const field_config = this.gem_field_configs[field_key];
      if (!field_config) return { is_valid: true, error_message: "" };
      if (this.isFieldDisabled(field_key))
        return { is_valid: true, error_message: "" };
      if (field_key === "pvd_asking_price" || field_config.readonly)
        return { is_valid: true, error_message: "" };
      if (field_config.type !== "number")
        return { is_valid: true, error_message: "" };
      if (raw_value === null || raw_value === undefined || raw_value === "")
        return { is_valid: true, error_message: "" };

      const normalized_value = String(raw_value).trim().replace(",", ".");
      if (!/^-?\d+(?:\.\d+)?$/.test(normalized_value)) {
        return {
          is_valid: false,
          error_message: this.$t("sg_invalid_number"),
        };
      }

      const number_value = Number(normalized_value);
      if (!Number.isFinite(number_value)) {
        return {
          is_valid: false,
          error_message: this.$t("sg_invalid_number"),
        };
      }

      const allowed_decimals = this.getAllowedDecimals(field_config.input_step);
      if (allowed_decimals === null)
        return { is_valid: true, error_message: "" };

      const decimal_count = this.getDecimalCount(normalized_value);
      if (decimal_count <= allowed_decimals)
        return { is_valid: true, error_message: "" };

      return {
        is_valid: false,
        error_message:
          allowed_decimals === 0
            ? this.$t("sg_invalid_integer")
            : this.$t("sg_invalid_decimals", { decimals: allowed_decimals }),
      };
    },
    getAllowedDecimals(input_step) {
      if (input_step === null || input_step === undefined || input_step === "")
        return null;
      const step_value = String(input_step);
      if (step_value.includes(".")) return step_value.split(".")[1].length;
      return 0;
    },
    getDecimalCount(normalized_value) {
      if (!normalized_value.includes(".")) return 0;
      return normalized_value.split(".")[1].length;
    },
    cleanString(value) {
      if (value === null || value === undefined) return "";
      return String(value).trim();
    },
    toNumberOrDefault(value, fallback_value = 0) {
      const normalized_value = String(value ?? "")
        .trim()
        .replace(",", ".");
      const as_number = Number(normalized_value);
      if (Number.isFinite(as_number)) return as_number;
      return fallback_value;
    },
  },
};
</script>

<style lang="scss" scoped>
._gemNewView {
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

._fieldsGrid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: calc(var(--spacing) / 1.75);
}

._textarea {
  width: 100%;
  min-height: 96px;
}

._creationNotice {
  margin: calc(var(--spacing) * 0.6) 0 0;
  color: var(--c-gris_fonce);
  font-size: 0.925rem;
}

._actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: calc(var(--spacing) / 2);
}

._fieldInvalid {
  :deep(.u-input) {
    border-color: var(--c-rouge);
  }
}

._fieldDisabled {
  :deep(.u-input),
  :deep(select) {
    cursor: not-allowed;
  }
}

._fieldError,
._formError {
  margin: calc(var(--spacing) / 6) 0 0;
  color: var(--c-rouge);
  font-size: var(--sl-font-size-x-small);
}

._formError {
  margin-right: auto;
}
</style>
