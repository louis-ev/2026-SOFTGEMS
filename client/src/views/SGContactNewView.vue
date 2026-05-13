<template>
  <section class="_contactNewView">
    <button
      type="button"
      class="u-button u-button_icon _closeButton"
      @click="goBack"
    >
      <b-icon icon="x-lg" />
    </button>

    <div class="_pageHeader">
      <h1 class="_pageTitle">{{ $t("sg_create_contact_title") }}</h1>
    </div>

    <form class="_form" @submit.prevent="createContact">
      <section class="_formSection">
        <h2 class="_sectionTitle">{{ $t("sg_section_contact_identity") }}</h2>
        <div class="_fieldsGrid">
          <div>
            <DLabel :str="$t('sg_contact_name')" icon="person" />
            <TextInput
              ref="name_input"
              :content.sync="new_contact_name"
              :required="true"
              @update:content="onNameInput"
            />
            <p v-if="name_duplicate_warning" class="u-warning _duplicateWarning">
              {{ name_duplicate_warning }}
            </p>
            <p v-if="name_error" class="_fieldError">{{ name_error }}</p>
          </div>
          <div>
            <DLabel :str="$t('sg_contact_type')" icon="tags" />
            <SGSelectField
              :value="new_contact_type"
              :options="contact_type_options"
              :allow_empty="false"
              @input="new_contact_type = $event"
            />
          </div>
        </div>
      </section>

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
              ? $t("sg_create_contact_in_progress")
              : $t("sg_create_contact")
          }}
        </button>
      </div>
    </form>
  </section>
</template>

<script>
import SGSelectField from "@/components/softgems/SGSelectField.vue";

export default {
  name: "SGContactNewView",
  components: {
    SGSelectField,
  },
  data() {
    return {
      address_book_path: "address_book",
      new_contact_name: "",
      new_contact_type: "company",
      name_touched: false,
      is_creating: false,
      name_duplicate_warning: "",
    };
  },
  computed: {
    contact_type_options() {
      return [
        {
          value: "company",
          label: this.$t("sg_contact_type_company"),
        },
        {
          value: "individual",
          label: this.$t("sg_contact_type_individual"),
        },
      ];
    },
    trimmed_name() {
      return this.cleanString(this.new_contact_name);
    },
    name_error() {
      if (!this.name_touched) return "";
      if (!this.trimmed_name) return this.$t("sg_contact_name_required");
      return "";
    },
    is_create_disabled() {
      return this.is_creating || !this.trimmed_name;
    },
  },
  methods: {
    onNameInput() {
      this.name_touched = true;
      this.name_duplicate_warning = "";
    },
    goBack() {
      this.$router.push("/address-book");
    },
    cleanString(value) {
      if (value === null || value === undefined) return "";
      return String(value).trim();
    },
    async createContact() {
      this.name_touched = true;
      if (!this.trimmed_name || this.is_creating) return;

      this.is_creating = true;
      try {
        const new_slug = await this.$api.createFolder({
          path: this.address_book_path,
          additional_meta: {
            $status: "public",
            $admins: "everyone",
            $contributors: "everyone",
            name: this.trimmed_name,
            contact_type: this.new_contact_type,
          },
        });
        if (new_slug) {
          this.$router.push("/address-book");
        } else {
          this.$router.push("/address-book");
        }
      } catch (err) {
        const code = err && err.code;
        if (code === "unique_field_taken") {
          const suffix =
            err &&
            err.err_infos != null &&
            String(err.err_infos).trim() !== ""
              ? ` : ${err.err_infos}`
              : "";
          const message = this.$t("name_taken") + suffix;
          this.name_duplicate_warning = message;
          this.$alertify.delay(4000).error(message);
          this.$nextTick(() => {
            const input_el =
              this.$refs.name_input &&
              this.$refs.name_input.$el &&
              this.$refs.name_input.$el.querySelector("input");
            if (input_el) input_el.select();
          });
        } else {
          this.$alertify
            .delay(4000)
            .error(code || this.$t("sg_could_not_create_contact"));
        }
      } finally {
        this.is_creating = false;
      }
    },
  },
};
</script>

<style lang="scss" scoped>
._contactNewView {
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

._duplicateWarning {
  margin: calc(var(--spacing) / 6) 0 0;
  font-size: var(--sl-font-size-x-small);
}
</style>
