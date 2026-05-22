<template>
  <SGSelectField
    :value="value"
    :options="options"
    :allow_empty="allow_empty"
    :placeholder="placeholder"
    @input="$emit('input', $event)"
  />
</template>

<script>
import SGSelectField from "@/components/softgems/SGSelectField.vue";

export default {
  name: "SGAddressBookFolderSelect",
  components: {
    SGSelectField,
  },
  props: {
    value: {
      type: String,
      default: "",
    },
    allow_empty: {
      type: Boolean,
      default: true,
    },
    placeholder: {
      type: String,
      default: "",
    },
  },
  data() {
    return {
      address_book_path: "address_book",
      address_book_entries: [],
      is_loading: false,
    };
  },
  computed: {
    options() {
      const rows = Array.isArray(this.address_book_entries)
        ? this.address_book_entries
        : [];
      return [...rows]
        .sort((a, b) =>
          this.contactLabel(a).localeCompare(this.contactLabel(b), undefined, {
            sensitivity: "base",
          })
        )
        .map((row) => ({
          value: row.$path || "",
          label: this.contactLabel(row),
        }))
        .filter((opt) => opt.value);
    },
  },
  mounted() {
    this.fetchAddressBook();
  },
  methods: {
    cleanString(value) {
      if (value === null || value === undefined) return "";
      return String(value).trim();
    },
    contactIdFromPath(contact_path) {
      const cleaned = this.cleanString(contact_path);
      if (!cleaned) return "";
      const segments = cleaned.split("/");
      return segments[segments.length - 1] || "";
    },
    contactLabel(contact) {
      const raw = typeof contact?.name === "string" ? contact.name.trim() : "";
      if (raw) return raw;
      return (
        this.contactIdFromPath(contact?.$path) ||
        this.$t("sg_contact_untitled")
      );
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
  },
};
</script>
