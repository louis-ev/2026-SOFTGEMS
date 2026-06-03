<template>
  <div class="_counterpartyEditor">
    <div class="_fieldBlock">
      <DLabel
        :str="$t('sg_selection_counterparty_address_book_entry')"
        icon="tags"
      />
      <SGSelectField
        :value="draft_contact_path"
        :options="contact_options"
        :allow_empty="true"
        :disabled="is_loading"
        @input="onContactInput"
      />
    </div>

    <div v-if="selected_contact_is_company" class="_fieldBlock">
      <DLabel
        :str="$t('sg_selection_counterparty_company_contact')"
        icon="person"
      />
      <p class="_optionalHint">
        {{ $t("sg_selection_counterparty_company_contact_optional") }}
      </p>
      <SGSelectField
        :value="draft_person_path"
        :options="person_options"
        :allow_empty="true"
        :disabled="is_loading_persons"
        @input="draft_person_path = $event"
      />
      <p v-if="is_loading_persons" class="_hint">
        {{ $t("sg_selection_counterparty_loading_contacts") }}
      </p>
    </div>

    <p v-if="is_loading" class="_hint">{{ $t("sg_loading_address_book") }}</p>
  </div>
</template>

<script>
import SGSelectField from "@/components/softgems/SGSelectField.vue";
import {
  buildCounterpartyPathFromDraft,
  formatAddressBookContactLabel,
  formatPersonDisplayName,
  splitCounterpartyPath,
} from "@/utils/address_book_paths.js";

export default {
  name: "SGSelectionCounterpartyEditor",
  components: {
    SGSelectField,
  },
  props: {
    initial_value: {
      type: String,
      default: "",
    },
    label: {
      type: String,
      default: "",
    },
  },
  data() {
    const { contact_path, person_path } = splitCounterpartyPath(
      this.initial_value
    );
    return {
      address_book_path: "address_book",
      address_book_entries: [],
      persons_by_contact_path: {},
      draft_contact_path: contact_path,
      draft_person_path: person_path,
      is_loading: false,
      is_loading_persons: false,
    };
  },
  computed: {
    is_footer_save_disabled() {
      return false;
    },
    selected_contact() {
      const path = this.cleanString(this.draft_contact_path);
      if (!path) return null;
      return (
        this.address_book_entries.find(
          (entry) => String(entry?.$path || "").trim() === path
        ) || null
      );
    },
    selected_contact_is_company() {
      return this.selected_contact?.contact_type === "company";
    },
    contact_options() {
      const rows = Array.isArray(this.address_book_entries)
        ? this.address_book_entries
        : [];
      return [...rows]
        .sort((a, b) =>
          this.contactOptionLabel(a).localeCompare(
            this.contactOptionLabel(b),
            undefined,
            { sensitivity: "base" }
          )
        )
        .map((contact) => ({
          value: String(contact?.$path || "").trim(),
          label: this.contactOptionLabel(contact),
        }))
        .filter((option_item) => option_item.value);
    },
    person_options() {
      const contact_path = this.cleanString(this.draft_contact_path);
      if (!contact_path) return [];
      const persons = Array.isArray(this.persons_by_contact_path[contact_path])
        ? this.persons_by_contact_path[contact_path]
        : [];
      return [...persons]
        .sort((a, b) =>
          this.personOptionLabel(a).localeCompare(
            this.personOptionLabel(b),
            undefined,
            { sensitivity: "base" }
          )
        )
        .map((person) => ({
          value: String(person?.$path || "").trim(),
          label: this.personOptionLabel(person),
        }))
        .filter((option_item) => option_item.value);
    },
    draft_counterparty_path() {
      return buildCounterpartyPathFromDraft({
        contact_path: this.draft_contact_path,
        person_path: this.draft_person_path,
        is_company: this.selected_contact_is_company,
      });
    },
  },
  watch: {
    initial_value(next_value) {
      const { contact_path, person_path } = splitCounterpartyPath(next_value);
      this.draft_contact_path = contact_path;
      this.draft_person_path = person_path;
      if (contact_path && person_path) {
        this.ensurePersonsLoaded(contact_path);
      }
    },
    is_footer_save_disabled() {
      this.emitFooterState();
    },
  },
  mounted() {
    this.emitFooterState();
    this.fetchAddressBook().then(() => {
      if (this.draft_contact_path) {
        this.ensurePersonsLoaded(this.draft_contact_path);
      }
    });
  },
  methods: {
    cleanString(value) {
      if (value === null || value === undefined) return "";
      return String(value).trim();
    },
    contactTypeSuffix(contact_type) {
      if (contact_type === "company") {
        return this.$t("sg_contact_type_company");
      }
      if (contact_type === "individual") {
        return this.$t("sg_contact_type_individual");
      }
      return "";
    },
    contactOptionLabel(contact) {
      const name =
        formatAddressBookContactLabel(contact) ||
        this.$t("sg_contact_untitled");
      const type_suffix = this.contactTypeSuffix(contact?.contact_type);
      return type_suffix ? `${name} (${type_suffix})` : name;
    },
    personOptionLabel(person) {
      const label = formatPersonDisplayName(person);
      if (label) return label;
      const path = String(person?.$path || "").trim();
      if (!path) return this.$t("sg_contact_untitled");
      const segments = path.split("/");
      return segments[segments.length - 1] || this.$t("sg_contact_untitled");
    },
    emitFooterState() {
      this.$emit("footerStateChange", {
        save_disabled: this.is_footer_save_disabled,
      });
    },
    onContactInput(next_contact_path) {
      const previous_contact_path = this.draft_contact_path;
      this.draft_contact_path = next_contact_path;
      if (next_contact_path !== previous_contact_path) {
        this.draft_person_path = "";
      }
      if (this.cleanString(next_contact_path)) {
        this.ensurePersonsLoaded(next_contact_path);
      }
    },
    async fetchAddressBook() {
      this.is_loading = true;
      try {
        const fetched = await this.$api.getFolders({
          path: this.address_book_path,
        });
        this.address_book_entries = Array.isArray(fetched) ? fetched : [];
      } catch {
        this.address_book_entries = [];
      } finally {
        this.is_loading = false;
      }
    },
    async ensurePersonsLoaded(contact_path_raw) {
      const contact_path = this.cleanString(contact_path_raw);
      if (!contact_path) return;
      const contact = this.address_book_entries.find(
        (entry) => String(entry?.$path || "").trim() === contact_path
      );
      if (contact?.contact_type !== "company") return;
      if (Array.isArray(this.persons_by_contact_path[contact_path])) return;

      this.is_loading_persons = true;
      try {
        const rows = await this.$api.getFolders({
          path: `${contact_path}/contacts`,
        });
        this.$set(
          this.persons_by_contact_path,
          contact_path,
          Array.isArray(rows) ? rows : []
        );
      } catch {
        this.$set(this.persons_by_contact_path, contact_path, []);
      } finally {
        this.is_loading_persons = false;
      }
    },
    tryShellSave() {
      this.$emit("save", { value: this.draft_counterparty_path || "" });
    },
  },
};
</script>

<style lang="scss" scoped>
._counterpartyEditor {
  display: flex;
  flex-direction: column;
  gap: calc(var(--spacing) * 0.9);
}

._fieldBlock {
  display: flex;
  flex-direction: column;
  gap: calc(var(--spacing) * 0.35);
}

._optionalHint {
  margin: 0;
  color: var(--c-gris_fonce);
  font-size: var(--sl-font-size-x-small);
  line-height: 1.4;
}

._hint {
  margin: 0;
  color: var(--c-gris_fonce);
  font-size: var(--sl-font-size-x-small);
}
</style>
