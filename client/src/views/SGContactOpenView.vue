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

      <div v-if="contact" class="_headerMeta">
        <p class="_headerType">
          {{ $t("sg_contact_type") }}:
          {{ contact_type_label }}
        </p>
        <div class="_headerMetaRow">
          <p class="_readonlyHint _headerReadonlyHint">
            {{ $t("sg_contact_type_readonly") }}
          </p>
          <button
            type="button"
            class="u-buttonLink u-buttonLink_red"
            :disabled="!connected_as"
            :title="contact_guest_action_hint"
            @click="show_remove_contact_modal = true"
          >
            {{ $t("sg_remove_contact") }}
          </button>
        </div>
        <RemoveMenu2
          v-if="show_remove_contact_modal"
          :path="contact_path"
          :modal_title="
            $t('sg_remove_contact_confirm', { name: page_title })
          "
          :success_notification="$t('removed_successfully')"
          @removedSuccessfully="on_contact_removed_successfully"
          @close="show_remove_contact_modal = false"
        />
      </div>
    </div>

    <div v-if="is_loading">{{ $t("sg_loading_contact") }}</div>
    <div v-else-if="fetch_error" class="u-errorMsg">{{ fetch_error }}</div>
    <div v-else-if="contact" class="_form">
      <SGSectionPanel section_id="contact_identity" :title="$t('sg_section_contact_identity')">
        <div>
          <SGEditableMetaField
            ref="contact_name_editable_field"
            :label="$t('sg_contact_name')"
            icon="person"
            :value="edited_name"
            :is_flashing="isFieldFlashing(flash_contact_name_key)"
            :modal_open="
              !!(contact_edit_modal && contact_edit_modal.kind === 'name')
            "
            :modal_title="contact_edit_modal_title"
            :modal_is_loading="contact_edit_modal_is_saving_for_name"
            :meta_text="contact_name_meta_text"
            @presentClick="openContactNameModal"
            @close="closeContactEditModal"
            @save="onContactEditModalSave"
            @draftChange="contactEditModalDraftChange"
          />
        </div>
      </SGSectionPanel>

      <SGSectionPanel
        v-if="is_company"
        section_id="company_details"
        :title="$t('sg_section_company_details')"
      >
        <div class="_fieldsGrid">
          <div class="_fullWidthField">
            <SGEditableMetaField
              :label="$t('sg_company_address')"
              icon="geo-alt"
              :value="edited_address"
              :is_flashing="isFieldFlashing(flashCompanyFieldKey('address'))"
              :modal_open="company_detail_modal_open('address')"
              :modal_title="contact_edit_modal_title"
              :modal_is_loading="
                company_detail_modal_saving('address')
              "
              :meta_text="company_field_meta_text('address')"
              @presentClick="openCompanyDetailModal('address')"
              @close="closeContactEditModal"
              @save="onContactEditModalSave"
            />
          </div>
          <div>
            <SGEditableMetaField
              :label="$t('sg_company_phone')"
              icon="telephone"
              :value="edited_phone"
              :is_flashing="isFieldFlashing(flashCompanyFieldKey('phone'))"
              :modal_open="company_detail_modal_open('phone')"
              :modal_title="contact_edit_modal_title"
              :modal_is_loading="company_detail_modal_saving('phone')"
              :meta_text="company_field_meta_text('phone')"
              @presentClick="openCompanyDetailModal('phone')"
              @close="closeContactEditModal"
              @save="onContactEditModalSave"
            />
          </div>
          <div>
            <SGEditableMetaField
              :label="$t('sg_company_email')"
              icon="envelope"
              :value="edited_company_email"
              :is_flashing="
                isFieldFlashing(flashCompanyFieldKey('company_email'))
              "
              :modal_open="
                company_detail_modal_open('company_email')
              "
              :modal_title="contact_edit_modal_title"
              :modal_is_loading="
                company_detail_modal_saving('company_email')
              "
              :meta_text="company_field_meta_text('company_email')"
              @presentClick="openCompanyDetailModal('company_email')"
              @close="closeContactEditModal"
              @save="onContactEditModalSave"
            />
          </div>
          <div>
            <SGEditableMetaField
              :label="$t('sg_company_tva_number')"
              icon="hash"
              :value="edited_tva_number"
              :is_flashing="
                isFieldFlashing(flashCompanyFieldKey('tva_number'))
              "
              :modal_open="
                company_detail_modal_open('tva_number')
              "
              :modal_title="contact_edit_modal_title"
              :modal_is_loading="
                company_detail_modal_saving('tva_number')
              "
              :meta_text="company_field_meta_text('tva_number')"
              @presentClick="openCompanyDetailModal('tva_number')"
              @close="closeContactEditModal"
              @save="onContactEditModalSave"
            />
          </div>
          <div>
            <SGEditableMetaField
              :label="$t('sg_company_tva_attestation')"
              icon="file-earmark-text"
              :value="edited_tva_attestation"
              :is_flashing="
                isFieldFlashing(flashCompanyFieldKey('tva_attestation'))
              "
              :modal_open="
                company_detail_modal_open('tva_attestation')
              "
              :modal_title="contact_edit_modal_title"
              :modal_is_loading="
                company_detail_modal_saving('tva_attestation')
              "
              :meta_text="company_field_meta_text('tva_attestation')"
              @presentClick="
                openCompanyDetailModal('tva_attestation')
              "
              @close="closeContactEditModal"
              @save="onContactEditModalSave"
            />
          </div>
        </div>
      </SGSectionPanel>

      <SGSectionPanel
        v-if="is_company"
        section_id="company_contacts"
        :title="$t('sg_section_company_contacts')"
      >
        <template #actions>
          <button
            type="button"
            class="u-button u-button_bleuvert"
            :disabled="!connected_as"
            :title="contact_guest_action_hint"
            @click="toggleNewPersonForm"
          >
            <b-icon icon="plus-lg" />
            {{ $t("sg_add_company_contact") }}
          </button>
        </template>
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
                <SGEditableMetaField
                  :label="$t('sg_person_last_name')"
                  icon="person"
                  :value="personField(person, 'last_name')"
                  :is_flashing="
                    isFieldFlashing(
                      personFieldFlashKey(person, 'last_name')
                    )
                  "
                  :modal_open="
                    person_detail_modal_open(person, 'last_name')
                  "
                  :modal_title="contact_edit_modal_title"
                  :modal_is_loading="
                    person_detail_modal_saving(person, 'last_name')
                  "
                  :meta_text="
                    person_field_meta_text(person, 'last_name')
                  "
                  @presentClick="
                    openPersonDetailModal(person, 'last_name')
                  "
                  @close="closeContactEditModal"
                  @save="onContactEditModalSave"
                />
              </div>
              <div>
                <SGEditableMetaField
                  :label="$t('sg_person_first_name')"
                  icon="person"
                  :value="personField(person, 'first_name')"
                  :is_flashing="
                    isFieldFlashing(
                      personFieldFlashKey(person, 'first_name')
                    )
                  "
                  :modal_open="
                    person_detail_modal_open(person, 'first_name')
                  "
                  :modal_title="contact_edit_modal_title"
                  :modal_is_loading="
                    person_detail_modal_saving(person, 'first_name')
                  "
                  :meta_text="
                    person_field_meta_text(person, 'first_name')
                  "
                  @presentClick="
                    openPersonDetailModal(person, 'first_name')
                  "
                  @close="closeContactEditModal"
                  @save="onContactEditModalSave"
                />
              </div>
              <div>
                <SGEditableMetaField
                  :label="$t('sg_person_email')"
                  icon="envelope"
                  :value="personField(person, 'email')"
                  :is_flashing="
                    isFieldFlashing(personFieldFlashKey(person, 'email'))
                  "
                  :modal_open="
                    person_detail_modal_open(person, 'email')
                  "
                  :modal_title="contact_edit_modal_title"
                  :modal_is_loading="
                    person_detail_modal_saving(person, 'email')
                  "
                  :meta_text="person_field_meta_text(person, 'email')"
                  @presentClick="
                    openPersonDetailModal(person, 'email')
                  "
                  @close="closeContactEditModal"
                  @save="onContactEditModalSave"
                />
              </div>
              <div class="_fullWidthField">
                <SGEditableMetaField
                  :label="$t('sg_person_address')"
                  icon="geo-alt"
                  :value="personField(person, 'address')"
                  :is_flashing="
                    isFieldFlashing(
                      personFieldFlashKey(person, 'address')
                    )
                  "
                  :modal_open="
                    person_detail_modal_open(person, 'address')
                  "
                  :modal_title="contact_edit_modal_title"
                  :modal_is_loading="
                    person_detail_modal_saving(person, 'address')
                  "
                  :meta_text="
                    person_field_meta_text(person, 'address')
                  "
                  @presentClick="
                    openPersonDetailModal(person, 'address')
                  "
                  @close="closeContactEditModal"
                  @save="onContactEditModalSave"
                />
              </div>
              <div>
                <SGEditableMetaField
                  :label="$t('sg_person_phone')"
                  icon="telephone"
                  :value="personField(person, 'phone')"
                  :is_flashing="
                    isFieldFlashing(personFieldFlashKey(person, 'phone'))
                  "
                  :modal_open="
                    person_detail_modal_open(person, 'phone')
                  "
                  :modal_title="contact_edit_modal_title"
                  :modal_is_loading="
                    person_detail_modal_saving(person, 'phone')
                  "
                  :meta_text="
                    person_field_meta_text(person, 'phone')
                  "
                  @presentClick="
                    openPersonDetailModal(person, 'phone')
                  "
                  @close="closeContactEditModal"
                  @save="onContactEditModalSave"
                />
              </div>
            </div>
          </article>
        </div>
      </SGSectionPanel>

      <SGFolderMetaPeek :folder_meta="contact" />
    </div>
  </section>
</template>

<script>
import SGEditableMetaField from "@/components/softgems/SGEditableMetaField.vue";
import SGFolderMetaPeek from "@/components/softgems/SGFolderMetaPeek.vue";
import SGSectionPanel from "@/components/softgems/SGSectionPanel.vue";
import RemoveMenu2 from "@/adc-core/fields/RemoveMenu2.vue";
import FieldFlashMixin from "@/mixins/FieldFlashMixin";
import SectionAnchorScrollMixin from "@/mixins/SectionAnchorScrollMixin.js";

export default {
  name: "SGContactOpenView",
  mixins: [FieldFlashMixin, SectionAnchorScrollMixin],
  components: {
    SGEditableMetaField,
    SGFolderMetaPeek,
    SGSectionPanel,
    RemoveMenu2,
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
      contact_edit_modal: null,
      saving_person_slug_field: "",
      show_remove_contact_modal: false,
      /** Tracks slug whose `…/{slug}/contacts` Socket room is joined */
      joined_company_contacts_slug: "",
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
    contact_edit_modal_title() {
      const m = this.contact_edit_modal;
      if (!m) return "";
      if (m.kind === "name") {
        return `${this.page_title} — ${this.$t("sg_contact_name")}`;
      }
      if (m.kind === "company") {
        return `${this.page_title} — ${this.company_details_field_label(m.meta_key)}`;
      }
      if (m.kind === "person") {
        const heading = this.person_heading_for_modal(m.slug);
        return `${heading} — ${this.person_details_field_label(m.meta_key)}`;
      }
      return "";
    },
    contact_edit_modal_is_saving_for_name() {
      const m = this.contact_edit_modal;
      return !!(m && m.kind === "name" && this.is_saving_name);
    },
    contact_name_meta_text() {
      return {
        meta_path: this.contact_path,
        field_key: "name",
        stored_value: this.stored_name,
        is_saving: this.contact_edit_modal_is_saving_for_name,
        required: true,
        required_empty_hint: this.$t("sg_contact_name_required"),
        external_warning: this.name_duplicate_warning || "",
      };
    },
    is_create_person_disabled() {
      return (
        !this.connected_as ||
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
    flash_contact_name_key() {
      return "contact_name";
    },
    contact_guest_action_hint() {
      return this.connected_as ? "" : this.$t("sg_action_requires_account");
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
    this.leaveCompanyContactsListRoomTracked();
    this.$api.leave({ room: this.contact_path });
  },
  methods: {
    goBack() {
      this.$router.push("/address-book");
    },
    on_contact_removed_successfully() {
      this.show_remove_contact_modal = false;
      this.goBack();
    },
    flashCompanyFieldKey(meta_key_raw) {
      const mk = this.clean_string(meta_key_raw);
      return mk ? `company::${mk}` : "";
    },
    personFieldFlashKey(person_folder, field_key_raw) {
      const slug = this.personSlugFromFolder(person_folder);
      const fk = this.clean_string(field_key_raw);
      return slug && fk ? `${slug}::${fk}` : "";
    },
    openContactNameModal() {
      if (!this.connected_as) return;
      this.name_duplicate_warning = "";
      this.contact_edit_modal = { kind: "name" };
    },
    company_detail_modal_open(meta_key) {
      const m = this.contact_edit_modal;
      return !!(
        m &&
        m.kind === "company" &&
        m.meta_key === meta_key
      );
    },
    company_detail_modal_saving(meta_key) {
      return (
        this.company_detail_modal_open(meta_key) &&
        this.saving_company_field_key === meta_key
      );
    },
    company_field_meta_text(meta_key) {
      return {
        meta_path: this.contact_path,
        field_key: meta_key,
        stored_value: this.stored_string_field(meta_key),
        is_saving: this.company_detail_modal_saving(meta_key),
        required: false,
        required_empty_hint: "",
        external_warning: "",
      };
    },
    person_detail_modal_open(person, field_key) {
      const slug = this.personSlugFromFolder(person);
      const m = this.contact_edit_modal;
      return !!(
        m &&
        m.kind === "person" &&
        this.clean_string(m.slug) === slug &&
        m.meta_key === field_key
      );
    },
    person_detail_modal_saving(person, field_key) {
      const slug = this.personSlugFromFolder(person);
      if (!slug || !field_key) return false;
      const pair_key = `${slug}::${field_key}`;
      return (
        this.person_detail_modal_open(person, field_key) &&
        this.saving_person_slug_field === pair_key
      );
    },
    person_stored_comparison_string(person, field_key) {
      if (field_key === "last_name") {
        return this.stored_person_field_normalized(person, "last_name");
      }
      return this.storedPersonField(person, field_key);
    },
    person_field_meta_text(person, field_key) {
      const slug = this.personSlugFromFolder(person);
      const person_path = slug ? `${this.company_contacts_path}/${slug}` : "";
      return {
        meta_path: person_path,
        field_key,
        stored_value: this.person_stored_comparison_string(person, field_key),
        is_saving: this.person_detail_modal_saving(person, field_key),
        required: field_key === "last_name",
        required_empty_hint:
          field_key === "last_name"
            ? this.$t("sg_person_last_name_required")
            : "",
        external_warning: "",
      };
    },
    openCompanyDetailModal(meta_key) {
      if (!this.connected_as || !this.is_company || !this.clean_string(meta_key))
        return;
      this.contact_edit_modal = { kind: "company", meta_key };
    },
    openPersonDetailModal(person, field_key) {
      if (!this.connected_as) return;
      const slug = this.personSlugFromFolder(person);
      if (!slug || !field_key) return;
      this.contact_edit_modal = {
        kind: "person",
        slug,
        meta_key: field_key,
      };
    },
    closeContactEditModal() {
      this.contact_edit_modal = null;
    },
    contactEditModalDraftChange() {
      this.name_duplicate_warning = "";
    },
    async onContactEditModalSave({ value }) {
      const modal = this.contact_edit_modal;
      if (!modal) return;
      const raw_value = typeof value === "string" ? value : "";
      if (modal.kind === "name") {
        this.edited_name = raw_value;
        await this.persistContactNameModal();
        return;
      }
      if (modal.kind === "company") {
        this.assign_company_detail_value_from_modal(
          modal.meta_key,
          raw_value
        );
        await this.persistCompanyDetailModal(modal.meta_key);
        return;
      }
      if (modal.kind === "person") {
        this.setPersonField(modal.slug, modal.meta_key, raw_value);
        await this.persistPersonFieldModal(modal.slug, modal.meta_key);
      }
    },
    company_details_field_label(meta_key) {
      const labels = {
        address: this.$t("sg_company_address"),
        phone: this.$t("sg_company_phone"),
        company_email: this.$t("sg_company_email"),
        tva_number: this.$t("sg_company_tva_number"),
        tva_attestation: this.$t("sg_company_tva_attestation"),
      };
      return labels[meta_key] || "";
    },
    person_details_field_label(meta_key) {
      const labels = {
        last_name: this.$t("sg_person_last_name"),
        first_name: this.$t("sg_person_first_name"),
        email: this.$t("sg_person_email"),
        address: this.$t("sg_person_address"),
        phone: this.$t("sg_person_phone"),
      };
      return labels[meta_key] || "";
    },
    person_heading_for_modal(slug_raw) {
      const slug = this.clean_string(slug_raw);
      if (!slug) return "";
      const buf = this.person_edit_buffers[slug];
      const last = buf ? this.clean_string(buf.last_name) : "";
      const first = buf ? this.clean_string(buf.first_name) : "";
      if (first && last) return `${first} ${last}`;
      if (last) return last;
      if (first) return first;
      return slug;
    },
    person_folder_from_slug(slug_raw) {
      const slug = this.clean_string(slug_raw);
      return this.company_person_folders.find(
        (item) => this.personSlugFromFolder(item) === slug
      );
    },
    assign_company_detail_value_from_modal(meta_key, raw_string) {
      const v =
        typeof raw_string === "string" ? raw_string : String(raw_string || "");
      if (meta_key === "address") this.edited_address = v;
      else if (meta_key === "phone") this.edited_phone = v;
      else if (meta_key === "company_email") this.edited_company_email = v;
      else if (meta_key === "tva_number") this.edited_tva_number = v;
      else if (meta_key === "tva_attestation")
        this.edited_tva_attestation = v;
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
    async fetchContact() {
      this.closeContactEditModal();
      if (this.joined_company_contacts_slug !== this.contact_slug) {
        this.leaveCompanyContactsListRoomTracked();
      }
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
          this.$api.join({ room: this.company_contacts_path });
          this.joined_company_contacts_slug = this.contact_slug;
        } else {
          this.leaveCompanyContactsListRoomTracked();
          this.company_person_folders = [];
          this.person_edit_buffers = {};
        }
      } catch ({ code }) {
        this.fetch_error = code || this.$t("sg_could_not_load_contact");
        this.leaveCompanyContactsListRoomTracked();
      } finally {
        this.is_loading = false;
        if (this.contact && !this.fetch_error) {
          this.scrollToRouteSectionAnchorAfterLoad();
        }
      }
    },
    async persistContactNameModal() {
      this.name_duplicate_warning = "";
      if (!this.trimmed_edited_name) return;
      if (this.trimmed_edited_name === this.stored_name) {
        this.closeContactEditModal();
        return;
      }
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
        this.closeContactEditModal();
        this.flashFields([this.flash_contact_name_key]);
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
            const ref = this.$refs.contact_name_editable_field;
            if (ref && typeof ref.focusInputSelect === "function") {
              ref.focusInputSelect();
            }
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
    async persistCompanyDetailModal(meta_key) {
      if (
        !this.is_company ||
        !this.clean_string(meta_key) ||
        this.company_field_matches_stored(meta_key) ||
        this.saving_company_field_key
      ) {
        if (this.company_field_matches_stored(meta_key)) {
          this.closeContactEditModal();
        }
        return;
      }

      this.saving_company_field_key = meta_key;
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
        this.closeContactEditModal();
        this.flashFields([this.flashCompanyFieldKey(meta_key)]);
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
      if (!this.connected_as) return;
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
    leaveCompanyContactsListRoomTracked() {
      if (!this.joined_company_contacts_slug) return;
      const p = `${this.address_book_path}/${this.joined_company_contacts_slug}/contacts`;
      this.$api.leave({ room: p });
      this.joined_company_contacts_slug = "";
    },
    async fetchCompanyContacts() {
      if (!this.contact || this.contact.contact_type !== "company") return;

      const listing_path = this.company_contacts_path;
      /* getFolders returns api.store[path] without refetch when set; [] is truthy — stale
         listings never reload. Socket folderCreated only mutates tracked joined rooms. */
      if (
        this.$api.store &&
        Object.prototype.hasOwnProperty.call(this.$api.store, listing_path)
      ) {
        this.$delete(this.$api.store, listing_path);
      }

      this.is_loading_company_contacts = true;
      try {
        const rows = await this.$api.getFolders({
          path: listing_path,
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
    async persistPersonFieldModal(slug_raw, field_key) {
      const slug = this.clean_string(slug_raw);
      const fk = this.clean_string(field_key);
      if (!slug || !fk || this.saving_person_slug_field) return;

      const folder = this.company_person_folders.find(
        (item) => this.personSlugFromFolder(item) === slug
      );
      if (!folder) return;
      if (this.companyPersonFieldMatchesStored(folder, fk)) {
        this.closeContactEditModal();
        return;
      }

      const buf = this.person_edit_buffers[slug];
      if (!buf) return;

      if (fk === "last_name" && !this.clean_string(buf.last_name)) {
        this.$alertify
          .delay(4000)
          .error(this.$t("sg_person_last_name_required"));
        return;
      }

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
        this.closeContactEditModal();
        this.flashFields([pair_key]);
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

._headerMeta {
  margin-top: calc(var(--spacing) * 0.55);
}

._headerType {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
}

._headerMetaRow {
  margin-top: calc(var(--spacing) * 0.45);
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: calc(var(--spacing) / 2);
}

._headerReadonlyHint {
  margin: 0;
  flex: 1 1 200px;
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
  gap: calc(var(--spacing) * 1.1);
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

._saveRow {
  margin-top: calc(var(--spacing) * 0.75);
  display: flex;
  justify-content: flex-end;
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
