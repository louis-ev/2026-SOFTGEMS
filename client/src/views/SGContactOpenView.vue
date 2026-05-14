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
          <SGClickRevealTextField
            :ref="(el) => registerRevealRef('contact_name', el)"
            :label="$t('sg_contact_name')"
            label_icon="person"
            :content.sync="edited_name"
            :required="true"
            :is_saving="is_saving_name"
            :is_save_disabled_externally="
              contact_name_save_blocked_without_request
            "
            @save="saveName"
            @update:content="onEditedName"
          />
          <p v-if="name_duplicate_warning" class="u-warning _duplicateWarning">
            {{ name_duplicate_warning }}
          </p>
          <p v-if="name_validation_error" class="_fieldError">
            {{ name_validation_error }}
          </p>
        </div>
      </section>

      <section v-if="is_company" class="_formSection">
        <h2 class="_sectionTitle">{{ $t("sg_section_company_details") }}</h2>
        <div class="_fieldsGrid">
          <div class="_fullWidthField">
            <SGClickRevealTextField
              :ref="(el) => registerRevealRef('company_address', el)"
              :label="$t('sg_company_address')"
              label_icon="geo-alt"
              :content.sync="edited_address"
              :required="false"
              :is_saving="saving_company_field_key === 'address'"
              :is_save_disabled_externally="
                company_field_matches_stored('address')
              "
              @save="saveCompanyDetailField('address')"
            />
          </div>
          <div>
            <SGClickRevealTextField
              :ref="(el) => registerRevealRef('company_phone', el)"
              :label="$t('sg_company_phone')"
              label_icon="telephone"
              :content.sync="edited_phone"
              :required="false"
              :is_saving="saving_company_field_key === 'phone'"
              :is_save_disabled_externally="company_field_matches_stored('phone')"
              @save="saveCompanyDetailField('phone')"
            />
          </div>
          <div>
            <SGClickRevealTextField
              :ref="(el) => registerRevealRef('company_email', el)"
              :label="$t('sg_company_email')"
              label_icon="envelope"
              :content.sync="edited_company_email"
              :required="false"
              :is_saving="saving_company_field_key === 'company_email'"
              :is_save_disabled_externally="
                company_field_matches_stored('company_email')
              "
              @save="saveCompanyDetailField('company_email')"
            />
          </div>
          <div>
            <SGClickRevealTextField
              :ref="(el) => registerRevealRef('company_tva_number', el)"
              :label="$t('sg_company_tva_number')"
              label_icon="hash"
              :content.sync="edited_tva_number"
              :required="false"
              :is_saving="saving_company_field_key === 'tva_number'"
              :is_save_disabled_externally="
                company_field_matches_stored('tva_number')
              "
              @save="saveCompanyDetailField('tva_number')"
            />
          </div>
          <div>
            <SGClickRevealTextField
              :ref="(el) => registerRevealRef('company_tva_attestation', el)"
              :label="$t('sg_company_tva_attestation')"
              label_icon="file-earmark-text"
              :content.sync="edited_tva_attestation"
              :required="false"
              :is_saving="saving_company_field_key === 'tva_attestation'"
              :is_save_disabled_externally="
                company_field_matches_stored('tva_attestation')
              "
              @save="saveCompanyDetailField('tva_attestation')"
            />
          </div>
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
                is_creating_company_person ? $t("saving") : $t("save")
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
                <SGClickRevealTextField
                  :ref="
                    (el) =>
                      personRevealRef(
                        personSlugFromFolder(person),
                        'last_name',
                        el
                      )
                  "
                  :label="$t('sg_person_last_name')"
                  label_icon="person"
                  :content="personField(person, 'last_name')"
                  :required="true"
                  :is_saving="
                    savingPersonPair(personSlugFromFolder(person), 'last_name')
                  "
                  :is_save_disabled_externally="
                    companyPersonFieldMatchesStored(person, 'last_name')
                  "
                  @update:content="
                    (v) =>
                      setPersonField(
                        personSlugFromFolder(person),
                        'last_name',
                        v
                      )
                  "
                  @save="
                    saveCompanyPersonField(
                      personSlugFromFolder(person),
                      'last_name'
                    )
                  "
                />
              </div>
              <div>
                <SGClickRevealTextField
                  :ref="
                    (el) =>
                      personRevealRef(
                        personSlugFromFolder(person),
                        'first_name',
                        el
                      )
                  "
                  :label="$t('sg_person_first_name')"
                  label_icon="person"
                  :content="personField(person, 'first_name')"
                  :required="false"
                  :is_saving="
                    savingPersonPair(personSlugFromFolder(person), 'first_name')
                  "
                  :is_save_disabled_externally="
                    companyPersonFieldMatchesStored(person, 'first_name')
                  "
                  @update:content="
                    (v) =>
                      setPersonField(
                        personSlugFromFolder(person),
                        'first_name',
                        v
                      )
                  "
                  @save="
                    saveCompanyPersonField(
                      personSlugFromFolder(person),
                      'first_name'
                    )
                  "
                />
              </div>
              <div>
                <SGClickRevealTextField
                  :ref="
                    (el) =>
                      personRevealRef(personSlugFromFolder(person), 'email', el)
                  "
                  :label="$t('sg_person_email')"
                  label_icon="envelope"
                  :content="personField(person, 'email')"
                  :required="false"
                  :is_saving="
                    savingPersonPair(personSlugFromFolder(person), 'email')
                  "
                  :is_save_disabled_externally="
                    companyPersonFieldMatchesStored(person, 'email')
                  "
                  @update:content="
                    (v) =>
                      setPersonField(personSlugFromFolder(person), 'email', v)
                  "
                  @save="
                    saveCompanyPersonField(
                      personSlugFromFolder(person),
                      'email'
                    )
                  "
                />
              </div>
              <div class="_fullWidthField">
                <SGClickRevealTextField
                  :ref="
                    (el) =>
                      personRevealRef(
                        personSlugFromFolder(person),
                        'address',
                        el
                      )
                  "
                  :label="$t('sg_person_address')"
                  label_icon="geo-alt"
                  :content="personField(person, 'address')"
                  :required="false"
                  :is_saving="
                    savingPersonPair(personSlugFromFolder(person), 'address')
                  "
                  :is_save_disabled_externally="
                    companyPersonFieldMatchesStored(person, 'address')
                  "
                  @update:content="
                    (v) =>
                      setPersonField(personSlugFromFolder(person), 'address', v)
                  "
                  @save="
                    saveCompanyPersonField(
                      personSlugFromFolder(person),
                      'address'
                    )
                  "
                />
              </div>
              <div>
                <SGClickRevealTextField
                  :ref="
                    (el) =>
                      personRevealRef(personSlugFromFolder(person), 'phone', el)
                  "
                  :label="$t('sg_person_phone')"
                  label_icon="telephone"
                  :content="personField(person, 'phone')"
                  :required="false"
                  :is_saving="
                    savingPersonPair(personSlugFromFolder(person), 'phone')
                  "
                  :is_save_disabled_externally="
                    companyPersonFieldMatchesStored(person, 'phone')
                  "
                  @update:content="
                    (v) =>
                      setPersonField(personSlugFromFolder(person), 'phone', v)
                  "
                  @save="
                    saveCompanyPersonField(personSlugFromFolder(person), 'phone')
                  "
                />
              </div>
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
import SGClickRevealTextField from "@/components/softgems/SGClickRevealTextField.vue";

export default {
  name: "SGContactOpenView",
  components: {
    SGClickRevealTextField,
  },
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
      saving_company_field_key: "",
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
      reveal_component_refs: {},
      saving_person_slug_field: "",
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
    contact_name_save_blocked_without_request() {
      return (
        !this.trimmed_edited_name ||
        this.trimmed_edited_name === this.stored_name
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
    registerRevealRef(key, component) {
      if (component) this.$set(this.reveal_component_refs, key, component);
      else this.$delete(this.reveal_component_refs, key);
    },
    personRevealRef(slug, field_key, component) {
      const k = `pp:${this.clean_string(slug)}:${field_key}`;
      return this.registerRevealRef(k, component);
    },
    reveal_component_for_company_detail(meta_key) {
      const reveal_map = {
        address: "company_address",
        phone: "company_phone",
        company_email: "company_email",
        tva_number: "company_tva_number",
        tva_attestation: "company_tva_attestation",
      };
      const ref_key = reveal_map[meta_key];
      return ref_key ? this.reveal_component_refs[ref_key] : null;
    },
    collapse_reveal_component(cmp) {
      if (
        cmp &&
        typeof cmp.collapseAfterSave === "function"
      ) {
        cmp.collapseAfterSave();
      }
    },
    focus_reveal_inner_input(ref_key) {
      const cmp = this.reveal_component_refs[ref_key];
      if (cmp && typeof cmp.focusInnerInput === "function") {
        cmp.focusInnerInput();
      }
    },
    company_detail_edited_value(meta_key) {
      if (meta_key === "address") return this.edited_address;
      if (meta_key === "phone") return this.edited_phone;
      if (meta_key === "company_email") return this.edited_company_email;
      if (meta_key === "tva_number") return this.edited_tva_number;
      if (meta_key === "tva_attestation") return this.edited_tva_attestation;
      return "";
    },
    company_field_matches_stored(meta_key) {
      return (
        this.clean_string(this.company_detail_edited_value(meta_key)) ===
        this.stored_string_field(meta_key)
      );
    },
    savingPersonPair(slug, field_key) {
      return (
        this.saving_person_slug_field ===
        `${this.clean_string(slug)}::${field_key}`
      );
    },
    companyPersonFieldMatchesStored(person, field_key) {
      const slug = this.personSlugFromFolder(person);
      if (!slug) return true;
      const buf = this.person_edit_buffers[slug];
      if (!buf) return true;
      const buf_val = this.clean_string(
        typeof buf[field_key] === "string" ? buf[field_key] : ""
      );
      if (field_key === "last_name") {
        return (
          buf_val === this.stored_person_field_normalized(person, "last_name")
        );
      }
      return buf_val === this.storedPersonField(person, field_key);
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
        this.collapse_reveal_component(
          this.reveal_component_refs.contact_name
        );
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
            this.focus_reveal_inner_input("contact_name");
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
    async saveCompanyDetailField(meta_key) {
      if (
        !this.is_company ||
        !this.clean_string(meta_key) ||
        this.company_field_matches_stored(meta_key) ||
        this.saving_company_field_key
      ) {
        return;
      }

      this.saving_company_field_key = meta_key;
      const reveal_cmp =
        this.reveal_component_for_company_detail(meta_key);
      try {
        await this.$api.updateMeta({
          path: this.contact_path,
          new_meta: {
            [meta_key]: this.clean_string(
              this.company_detail_edited_value(meta_key)
            ),
          },
        });
        this.contact = await this.$api.getFolder({
          path: this.contact_path,
          no_files: true,
        });
        this.populate_company_editors_from_contact();
        this.collapse_reveal_component(reveal_cmp);
        this.$alertify
          .delay(3000)
          .success(this.$t("sg_company_details_updated"));
      } catch (err) {
        const code = err && err.code;
        this.$alertify
          .delay(4000)
          .error(code || this.$t("sg_could_not_save_company_details"));
      } finally {
        this.saving_company_field_key = "";
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
    async saveCompanyPersonField(slug_raw, field_key) {
      const slug = this.clean_string(slug_raw);
      const fk = this.clean_string(field_key);
      if (!slug || !fk || this.saving_person_slug_field) return;

      const folder = this.company_person_folders.find(
        (item) => this.personSlugFromFolder(item) === slug
      );
      if (!folder) return;
      if (this.companyPersonFieldMatchesStored(folder, fk)) return;

      const buf = this.person_edit_buffers[slug];
      if (!buf) return;

      if (fk === "last_name" && !this.clean_string(buf.last_name)) {
        this.$alertify
          .delay(4000)
          .error(this.$t("sg_person_last_name_required"));
        return;
      }

      const reveal_cmp =
        this.reveal_component_refs[`pp:${slug}:${fk}`];

      const pair_key = `${slug}::${fk}`;
      this.saving_person_slug_field = pair_key;
      try {
        const person_path = `${this.company_contacts_path}/${slug}`;
        await this.$api.updateMeta({
          path: person_path,
          new_meta: {
            [fk]: this.clean_string(
              typeof buf[fk] === "string" ? buf[fk] : ""
            ),
          },
        });
        await this.fetchCompanyContacts();
        this.collapse_reveal_component(reveal_cmp);
        this.$alertify
          .delay(3000)
          .success(this.$t("sg_company_contact_saved"));
      } catch (err) {
        const code = err && err.code;
        this.$alertify
          .delay(4000)
          .error(code || this.$t("sg_could_not_save_company_contact"));
      } finally {
        if (this.saving_person_slug_field === pair_key) {
          this.saving_person_slug_field = "";
        }
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
