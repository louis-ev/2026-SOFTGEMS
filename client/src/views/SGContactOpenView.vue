<template>
  <section class="_contactOpenView">
    <button
      type="button"
      class="u-button u-button_icon _closeButton"
      @click="goBack"
    >
      <b-icon icon="x-lg" />
    </button>

    <div class="_pageHeader">
      <h1 class="_pageTitle">{{ page_title }}</h1>
    </div>

    <div v-if="is_loading">{{ $t("sg_loading_contact") }}</div>
    <div v-else-if="fetch_error" class="u-errorMsg">{{ fetch_error }}</div>
    <div v-else-if="contact" class="_form">
      <section class="_formSection">
        <h2 class="_sectionTitle">{{ $t("sg_section_contact_identity") }}</h2>
        <div>
          <DLabel :str="$t('sg_contact_name')" icon="person" />
          <TextInput
            ref="name_input"
            :content.sync="edited_name"
            :required="true"
            @update:content="onEditedName"
          />
          <p v-if="name_duplicate_warning" class="u-warning _duplicateWarning">
            {{ name_duplicate_warning }}
          </p>
          <p v-if="name_validation_error" class="_fieldError">
            {{ name_validation_error }}
          </p>
        </div>
        <div class="_saveRow">
          <button
            type="button"
            class="u-button u-button_bleuvert"
            :disabled="is_save_name_disabled"
            @click="saveName"
          >
            {{ is_saving_name ? $t("saving") : $t("save") }}
          </button>
        </div>
      </section>

      <section v-if="is_company" class="_formSection">
        <h2 class="_sectionTitle">{{ $t("sg_section_company_details") }}</h2>
        <div class="_fieldsGrid">
          <div class="_fullWidthField">
            <DLabel :str="$t('sg_company_address')" icon="geo-alt" />
            <TextInput
              :content.sync="edited_address"
              :required="false"
              @update:content="onCompanyFieldInput"
            />
          </div>
          <div>
            <DLabel :str="$t('sg_company_phone')" icon="telephone" />
            <TextInput
              :content.sync="edited_phone"
              :required="false"
              @update:content="onCompanyFieldInput"
            />
          </div>
          <div>
            <DLabel :str="$t('sg_company_email')" icon="envelope" />
            <TextInput
              :content.sync="edited_company_email"
              :required="false"
              @update:content="onCompanyFieldInput"
            />
          </div>
          <div>
            <DLabel :str="$t('sg_company_tva_number')" icon="hash" />
            <TextInput
              :content.sync="edited_tva_number"
              :required="false"
              @update:content="onCompanyFieldInput"
            />
          </div>
          <div>
            <DLabel :str="$t('sg_company_tva_attestation')" icon="file-earmark-text" />
            <TextInput
              :content.sync="edited_tva_attestation"
              :required="false"
              @update:content="onCompanyFieldInput"
            />
          </div>
        </div>
        <div class="_saveRow">
          <button
            type="button"
            class="u-button u-button_bleuvert"
            :disabled="is_save_company_disabled"
            @click="saveCompanyDetails"
          >
            {{ is_saving_company ? $t("saving") : $t("save") }}
          </button>
        </div>
      </section>

      <section v-if="is_company" class="_formSection">
        <h2 class="_sectionTitle">{{ $t("sg_section_company_contacts") }}</h2>
        <button
          type="button"
          class="u-button u-button_bleuvert _addPersonButton"
          @click="toggleNewPersonForm"
        >
          <b-icon icon="plus-lg" />
          {{ $t("sg_add_company_contact") }}
        </button>
        <form
          v-if="show_new_person_form"
          class="_newPersonForm"
          @submit.prevent="createCompanyPerson"
        >
          <div class="_fieldsGrid">
            <div>
              <DLabel :str="$t('sg_person_last_name')" icon="person" />
              <TextInput
                :content.sync="new_person_last_name"
                :required="true"
                @update:content="onNewPersonInput"
              />
            </div>
            <div>
              <DLabel :str="$t('sg_person_first_name')" icon="person" />
              <TextInput
                :content.sync="new_person_first_name"
                :required="false"
                @update:content="onNewPersonInput"
              />
            </div>
            <div>
              <DLabel :str="$t('sg_person_email')" icon="envelope" />
              <TextInput
                :content.sync="new_person_email"
                :required="false"
                @update:content="onNewPersonInput"
              />
            </div>
            <div class="_fullWidthField">
              <DLabel :str="$t('sg_person_address')" icon="geo-alt" />
              <TextInput
                :content.sync="new_person_address"
                :required="false"
                @update:content="onNewPersonInput"
              />
            </div>
            <div>
              <DLabel :str="$t('sg_person_phone')" icon="telephone" />
              <TextInput
                :content.sync="new_person_phone"
                :required="false"
                @update:content="onNewPersonInput"
              />
            </div>
          </div>
          <div class="_saveRow">
            <button
              type="submit"
              class="u-button u-button_bleuvert"
              :disabled="is_create_person_disabled"
            >
              {{
                is_creating_company_person
                  ? $t("sg_create_contact_in_progress")
                  : $t("sg_add_company_contact")
              }}
            </button>
          </div>
        </form>
        <div v-if="is_loading_company_contacts" class="_muted">
          {{ $t("sg_loading_company_contacts") }}
        </div>
        <div
          v-else-if="
            !show_new_person_form && company_person_folders.length === 0
          "
          class="_muted"
        >
          {{ $t("sg_no_company_contacts_yet") }}
        </div>
        <div v-else class="_personList">
          <article
            v-for="person in company_person_folders"
            :key="person.$path"
            class="_personCard"
          >
            <div
              v-if="personSlugFromFolder(person)"
              class="_fieldsGrid"
            >
              <div>
                <DLabel :str="$t('sg_person_last_name')" icon="person" />
                <TextInput
                  :content="personField(person, 'last_name')"
                  :required="true"
                  @update:content="
                    (v) =>
                      setPersonField(
                        personSlugFromFolder(person),
                        'last_name',
                        v
                      )
                  "
                />
              </div>
              <div>
                <DLabel :str="$t('sg_person_first_name')" icon="person" />
                <TextInput
                  :content="personField(person, 'first_name')"
                  :required="false"
                  @update:content="
                    (v) =>
                      setPersonField(
                        personSlugFromFolder(person),
                        'first_name',
                        v
                      )
                  "
                />
              </div>
              <div>
                <DLabel :str="$t('sg_person_email')" icon="envelope" />
                <TextInput
                  :content="personField(person, 'email')"
                  :required="false"
                  @update:content="
                    (v) =>
                      setPersonField(
                        personSlugFromFolder(person),
                        'email',
                        v
                      )
                  "
                />
              </div>
              <div class="_fullWidthField">
                <DLabel :str="$t('sg_person_address')" icon="geo-alt" />
                <TextInput
                  :content="personField(person, 'address')"
                  :required="false"
                  @update:content="
                    (v) =>
                      setPersonField(
                        personSlugFromFolder(person),
                        'address',
                        v
                      )
                  "
                />
              </div>
              <div>
                <DLabel :str="$t('sg_person_phone')" icon="telephone" />
                <TextInput
                  :content="personField(person, 'phone')"
                  :required="false"
                  @update:content="
                    (v) =>
                      setPersonField(
                        personSlugFromFolder(person),
                        'phone',
                        v
                      )
                  "
                />
              </div>
            </div>
            <div class="_saveRow">
              <button
                type="button"
                class="u-button u-button_bleuvert"
                :disabled="
                  isCompanyPersonSaveDisabled(personSlugFromFolder(person))
                "
                @click="saveCompanyPerson(personSlugFromFolder(person))"
              >
                {{
                  saving_company_person_slug ===
                  personSlugFromFolder(person)
                    ? $t("saving")
                    : $t("save")
                }}
              </button>
            </div>
          </article>
        </div>
      </section>

      <section class="_formSection">
        <h2 class="_sectionTitle">{{ $t("sg_contact_type") }}</h2>
        <p class="_readonlyType">{{ contact_type_label }}</p>
        <p class="_readonlyHint">{{ $t("sg_contact_type_readonly") }}</p>
      </section>
    </div>
  </section>
</template>

<script>
export default {
  name: "SGContactOpenView",
  props: {
    contact_slug: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      address_book_path: "address_book",
      contact: null,
      edited_name: "",
      edited_address: "",
      edited_phone: "",
      edited_company_email: "",
      edited_tva_number: "",
      edited_tva_attestation: "",
      is_loading: false,
      is_saving_name: false,
      is_saving_company: false,
      fetch_error: "",
      name_duplicate_warning: "",
      name_save_attempted: false,
      company_person_folders: [],
      person_edit_buffers: {},
      is_loading_company_contacts: false,
      show_new_person_form: false,
      new_person_last_name: "",
      new_person_first_name: "",
      new_person_email: "",
      new_person_address: "",
      new_person_phone: "",
      is_creating_company_person: false,
      saving_company_person_slug: "",
    };
  },
  computed: {
    contact_path() {
      return `${this.address_book_path}/${this.contact_slug}`;
    },
    company_contacts_path() {
      return `${this.contact_path}/contacts`;
    },
    is_company() {
      return this.contact?.contact_type === "company";
    },
    page_title() {
      const label = this.clean_string(this.contact?.name);
      if (label) return label;
      if (this.clean_string(this.contact_slug))
        return this.contact_slug;
      return this.$t("sg_open_contact_title");
    },
    trimmed_edited_name() {
      return this.clean_string(this.edited_name);
    },
    stored_name() {
      return this.clean_string(this.contact?.name);
    },
    name_validation_error() {
      if (!this.name_save_attempted) return "";
      if (!this.trimmed_edited_name) return this.$t("sg_contact_name_required");
      return "";
    },
    is_save_name_disabled() {
      return (
        this.is_saving_name ||
        !this.trimmed_edited_name ||
        this.trimmed_edited_name === this.stored_name
      );
    },
    company_details_match_stored() {
      if (!this.contact) return true;
      return (
        this.clean_string(this.edited_address) ===
          this.stored_string_field("address") &&
        this.clean_string(this.edited_phone) ===
          this.stored_string_field("phone") &&
        this.clean_string(this.edited_company_email) ===
          this.stored_string_field("company_email") &&
        this.clean_string(this.edited_tva_number) ===
          this.stored_string_field("tva_number") &&
        this.clean_string(this.edited_tva_attestation) ===
          this.stored_string_field("tva_attestation")
      );
    },
    is_save_company_disabled() {
      return (
        this.is_saving_company ||
        !this.is_company ||
        this.company_details_match_stored
      );
    },
    is_create_person_disabled() {
      return (
        this.is_creating_company_person ||
        !this.clean_string(this.new_person_last_name)
      );
    },
    contact_type_label() {
      const t = this.contact?.contact_type;
      if (t === "company") return this.$t("sg_contact_type_company");
      if (t === "individual") return this.$t("sg_contact_type_individual");
      return "—";
    },
  },
  watch: {
    contact_slug: {
      immediate: false,
      handler() {
        this.fetchContact();
      },
    },
  },
  async created() {
    await this.fetchContact();
    this.$api.join({ room: this.contact_path });
  },
  beforeDestroy() {
    this.$api.leave({ room: this.contact_path });
  },
  methods: {
    goBack() {
      this.$router.push("/address-book");
    },
    clean_string(value) {
      if (value === null || value === undefined) return "";
      return String(value).trim();
    },
    string_from_contact(contact, field_key) {
      if (!contact) return "";
      const v = contact[field_key];
      return typeof v === "string" ? v : "";
    },
    stored_string_field(field_key) {
      return this.clean_string(this.string_from_contact(this.contact, field_key));
    },
    populate_company_editors_from_contact() {
      const c = this.contact;
      this.edited_address = this.string_from_contact(c, "address");
      this.edited_phone = this.string_from_contact(c, "phone");
      this.edited_company_email = this.string_from_contact(c, "company_email");
      this.edited_tva_number = this.string_from_contact(c, "tva_number");
      this.edited_tva_attestation = this.string_from_contact(c, "tva_attestation");
    },
    onEditedName() {
      this.name_duplicate_warning = "";
      this.name_save_attempted = false;
    },
    onCompanyFieldInput() {},
    async fetchContact() {
      this.is_loading = true;
      this.fetch_error = "";
      this.contact = null;

      try {
        const folder = await this.$api.getFolder({
          path: this.contact_path,
          no_files: true,
        });
        this.contact = folder;
        this.edited_name =
          typeof folder?.name === "string" ? folder.name : "";
        this.populate_company_editors_from_contact();
        if (this.contact?.contact_type === "company") {
          await this.fetchCompanyContacts();
        } else {
          this.company_person_folders = [];
          this.person_edit_buffers = {};
        }
      } catch ({ code }) {
        this.fetch_error = code || this.$t("sg_could_not_load_contact");
      } finally {
        this.is_loading = false;
      }
    },
    async saveName() {
      this.name_save_attempted = true;
      this.name_duplicate_warning = "";
      if (!this.trimmed_edited_name) return;
      if (this.trimmed_edited_name === this.stored_name) return;
      if (this.is_saving_name) return;

      this.is_saving_name = true;
      try {
        await this.$api.updateMeta({
          path: this.contact_path,
          new_meta: {
            name: this.trimmed_edited_name,
          },
        });
        this.contact = await this.$api.getFolder({
          path: this.contact_path,
          no_files: true,
        });
        this.edited_name =
          typeof this.contact?.name === "string" ? this.contact.name : "";
        this.populate_company_editors_from_contact();
        if (this.is_company) {
          await this.fetchCompanyContacts();
        }
        this.name_save_attempted = false;
        this.$alertify.delay(3000).success(this.$t("sg_contact_name_updated"));
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
            .error(code || this.$t("sg_could_not_save_contact_name"));
        }
      } finally {
        this.is_saving_name = false;
      }
    },
    async saveCompanyDetails() {
      if (!this.is_company || this.is_save_company_disabled) return;

      this.is_saving_company = true;
      try {
        await this.$api.updateMeta({
          path: this.contact_path,
          new_meta: {
            address: this.clean_string(this.edited_address),
            phone: this.clean_string(this.edited_phone),
            company_email: this.clean_string(this.edited_company_email),
            tva_number: this.clean_string(this.edited_tva_number),
            tva_attestation: this.clean_string(this.edited_tva_attestation),
          },
        });
        this.contact = await this.$api.getFolder({
          path: this.contact_path,
          no_files: true,
        });
        this.populate_company_editors_from_contact();
        this.$alertify
          .delay(3000)
          .success(this.$t("sg_company_details_updated"));
      } catch (err) {
        const code = err && err.code;
        this.$alertify
          .delay(4000)
          .error(code || this.$t("sg_could_not_save_company_details"));
      } finally {
        this.is_saving_company = false;
      }
    },
    personSlugFromFolder(folder) {
      const folder_path =
        typeof folder?.$path === "string" ? folder.$path.trim() : "";
      if (!folder_path) return "";
      const segments = folder_path.split("/").filter(Boolean);
      return segments[segments.length - 1] || "";
    },
    personField(person, field_key) {
      const slug = this.personSlugFromFolder(person);
      const buf = slug ? this.person_edit_buffers[slug] : null;
      if (!buf || buf[field_key] === undefined || buf[field_key] === null) {
        return "";
      }
      return typeof buf[field_key] === "string" ? buf[field_key] : "";
    },
    setPersonField(slug, field_key, value) {
      if (!slug) return;
      if (!this.person_edit_buffers[slug]) {
        this.$set(this.person_edit_buffers, slug, {
          last_name: "",
          first_name: "",
          email: "",
          address: "",
          phone: "",
        });
      }
      this.$set(
        this.person_edit_buffers[slug],
        field_key,
        typeof value === "string" ? value : ""
      );
    },
    storedPersonField(folder, field_key) {
      return this.clean_string(this.string_from_contact(folder, field_key));
    },
    stored_person_field_normalized(folder, field_key) {
      return this.clean_string(this.raw_person_folder_field(folder, field_key));
    },
    raw_person_folder_field(folder, field_key) {
      let v = this.string_from_contact(folder, field_key);
      if (
        field_key === "last_name" &&
        !this.clean_string(v) &&
        this.string_from_contact(folder, "full_name")
      ) {
        v = this.string_from_contact(folder, "full_name");
      }
      return v;
    },
    isCompanyPersonSaveDisabled(slug) {
      if (!slug) return true;
      if (this.saving_company_person_slug === slug) return true;
      const folder = this.company_person_folders.find(
        (item) => this.personSlugFromFolder(item) === slug
      );
      if (!folder) return true;
      const buf = this.person_edit_buffers[slug];
      if (!buf) return true;
      return (
        this.clean_string(buf.last_name) ===
          this.stored_person_field_normalized(folder, "last_name") &&
        this.clean_string(buf.first_name) ===
          this.stored_person_field_normalized(folder, "first_name") &&
        this.clean_string(buf.email) ===
          this.storedPersonField(folder, "email") &&
        this.clean_string(buf.address) ===
          this.storedPersonField(folder, "address") &&
        this.clean_string(buf.phone) ===
          this.storedPersonField(folder, "phone")
      );
    },
    toggleNewPersonForm() {
      this.show_new_person_form = !this.show_new_person_form;
      if (!this.show_new_person_form) {
        this.clearNewPersonForm();
      }
    },
    clearNewPersonForm() {
      this.new_person_last_name = "";
      this.new_person_first_name = "";
      this.new_person_email = "";
      this.new_person_address = "";
      this.new_person_phone = "";
    },
    onNewPersonInput() {},
    person_requested_slug_basis(last_name_raw, first_name_raw) {
      const last_name = this.clean_string(last_name_raw);
      const first_name = this.clean_string(first_name_raw);
      if (first_name && last_name) {
        return `${first_name} ${last_name}`;
      }
      return last_name || first_name;
    },
    async fetchCompanyContacts() {
      if (!this.contact || this.contact.contact_type !== "company") return;

      this.is_loading_company_contacts = true;
      try {
        const rows = await this.$api.getFolders({
          path: this.company_contacts_path,
        });
        const list = Array.isArray(rows) ? rows : [];
        const buffers = {};
        for (const folder of list) {
          const slug = this.personSlugFromFolder(folder);
          if (!slug) continue;
          buffers[slug] = {
            last_name:
              this.string_from_contact(folder, "last_name") ||
              this.string_from_contact(folder, "full_name"),
            first_name: this.string_from_contact(folder, "first_name"),
            email: this.string_from_contact(folder, "email"),
            address: this.string_from_contact(folder, "address"),
            phone: this.string_from_contact(folder, "phone"),
          };
        }
        this.person_edit_buffers = buffers;
        this.company_person_folders = list;
      } catch {
        this.company_person_folders = [];
        this.person_edit_buffers = {};
      } finally {
        this.is_loading_company_contacts = false;
      }
    },
    async createCompanyPerson() {
      const last_name = this.clean_string(this.new_person_last_name);
      if (!last_name || this.is_creating_company_person) return;

      const first_name = this.clean_string(this.new_person_first_name);
      const slug_basis = this.person_requested_slug_basis(
        this.new_person_last_name,
        this.new_person_first_name
      );

      this.is_creating_company_person = true;
      try {
        await this.$api.createFolder({
          path: this.company_contacts_path,
          additional_meta: {
            $status: "public",
            $admins: "everyone",
            $contributors: "everyone",
            last_name,
            first_name,
            email: this.clean_string(this.new_person_email),
            address: this.clean_string(this.new_person_address),
            phone: this.clean_string(this.new_person_phone),
            requested_slug: slug_basis,
          },
        });
        this.clearNewPersonForm();
        this.show_new_person_form = false;
        await this.fetchCompanyContacts();
        this.$alertify
          .delay(3000)
          .success(this.$t("sg_company_contact_created"));
      } catch (err) {
        const code = err && err.code;
        this.$alertify
          .delay(4000)
          .error(
            code || this.$t("sg_could_not_create_company_contact")
          );
      } finally {
        this.is_creating_company_person = false;
      }
    },
    async saveCompanyPerson(slug) {
      const cleaned_slug = this.clean_string(slug);
      if (
        !cleaned_slug ||
        this.isCompanyPersonSaveDisabled(cleaned_slug) ||
        this.saving_company_person_slug
      ) {
        return;
      }

      const buf = this.person_edit_buffers[cleaned_slug];
      if (!buf) return;

      const last_name = this.clean_string(buf.last_name);
      if (!last_name) {
        this.$alertify
          .delay(4000)
          .error(this.$t("sg_person_last_name_required"));
        return;
      }

      const first_name = this.clean_string(buf.first_name);

      this.saving_company_person_slug = cleaned_slug;
      try {
        const person_path = `${this.company_contacts_path}/${cleaned_slug}`;
        await this.$api.updateMeta({
          path: person_path,
          new_meta: {
            last_name,
            first_name,
            email: this.clean_string(buf.email),
            address: this.clean_string(buf.address),
            phone: this.clean_string(buf.phone),
          },
        });
        await this.fetchCompanyContacts();
        this.$alertify
          .delay(3000)
          .success(this.$t("sg_company_contact_saved"));
      } catch (err) {
        const code = err && err.code;
        this.$alertify
          .delay(4000)
          .error(code || this.$t("sg_could_not_save_company_contact"));
      } finally {
        this.saving_company_person_slug = "";
      }
    },
  },
};
</script>

<style lang="scss" scoped>
._contactOpenView {
  position: relative;
  padding: calc(var(--spacing) * 2) calc(var(--spacing) * 3);
}

._pageHeader {
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
  display: flex;
  flex-direction: column;
  gap: calc(var(--spacing) / 1.5);
  max-width: 640px;
}

._fieldsGrid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: calc(var(--spacing) / 1.75);
}

._fullWidthField {
  grid-column: 1 / -1;
}

._formSection {
  border: 1px solid var(--c-gris_clair);
  border-radius: 10px;
  padding: calc(var(--spacing) * 0.9);
  background: var(--c-blanc);
}

._sectionTitle {
  margin: 0 0 calc(var(--spacing) * 0.75) 0;
  font-size: 1rem;
}

._saveRow {
  margin-top: calc(var(--spacing) * 0.75);
  display: flex;
  justify-content: flex-end;
}

._readonlyType {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
}

._readonlyHint {
  margin: calc(var(--spacing) * 0.5) 0 0;
  color: var(--c-gris_fonce);
  font-size: var(--sl-font-size-small);
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

._addPersonButton {
  margin-bottom: calc(var(--spacing) * 0.75);
}

._newPersonForm {
  margin-bottom: calc(var(--spacing) * 1);
}

._personList {
  display: flex;
  flex-direction: column;
  gap: calc(var(--spacing) * 1);
}

._personCard {
  border: 1px solid var(--c-gris_clair);
  border-radius: 8px;
  padding: calc(var(--spacing) * 0.75);
  background: var(--c-bodybg);
}

._muted {
  color: var(--c-gris_fonce);
  font-size: var(--sl-font-size-small);
}
</style>
