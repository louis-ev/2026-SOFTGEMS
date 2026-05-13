<template>
  <div class="_addressBookView">
    <div class="_addressBookView--content">
      <div class="_pageHeader">
        <h1 class="_pageTitle">{{ $t("sg_address_book") }}</h1>
        <div class="_headerActions" v-if="false">
          <router-link
            to="/address-book/new"
            class="u-button u-button_bleuvert"
          >
            <b-icon icon="plus-lg" />
            {{ $t("sg_create_contact") }}
          </router-link>
        </div>
      </div>

      <div v-if="is_loading">{{ $t("sg_loading_address_book") }}</div>
      <div v-else-if="fetch_error" class="u-errorMsg">{{ fetch_error }}</div>
      <div v-else class="_listSection">
        <div class="_cardsGrid">
          <article
            v-for="contact in sorted_entries"
            :key="contact.$path || contactIdFromPath(contact.$path)"
            class="_contactCard"
          >
            <div class="_contactHeader">
              <h2 class="_contactName">{{ contactLabel(contact) }}</h2>
              <span
                v-if="contactTypeLabel(contact.contact_type)"
                class="_typeBadge"
              >
                {{ contactTypeLabel(contact.contact_type) }}
              </span>
            </div>
          </article>
        </div>
        <p v-if="sorted_entries.length === 0" class="_emptyState">
          {{ $t("sg_address_book_empty") }}
        </p>
      </div>
    </div>

    <transition name="fade">
      <div
        v-if="is_create_contact_open"
        class="_contactOverlay"
        @click.self="closeCreatePanel"
      >
        <section class="_contactPanel">
          <router-view />
        </section>
      </div>
    </transition>
  </div>
</template>

<script>
export default {
  name: "SGAddressBookView",
  data() {
    return {
      address_book_path: "address_book",
      address_book_entries: [],
      is_loading: false,
      fetch_error: "",
    };
  },
  computed: {
    is_create_contact_open() {
      return this.$route.name === "Create contact";
    },
    sorted_entries() {
      if (!Array.isArray(this.address_book_entries)) return [];
      return [...this.address_book_entries].sort((a, b) =>
        this.contactLabel(a).localeCompare(this.contactLabel(b), undefined, {
          sensitivity: "base",
        })
      );
    },
  },
  watch: {
    "$route.name": {
      immediate: true,
      handler(route_name) {
        if (route_name === "Address book") {
          this.fetchAddressBook();
        }
      },
    },
  },
  mounted() {
    this.$api.join({ room: this.address_book_path });
  },
  beforeDestroy() {
    this.$api.leave({ room: this.address_book_path });
  },
  methods: {
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
        this.contactIdFromPath(contact?.$path) || this.$t("sg_contact_untitled")
      );
    },
    contactTypeLabel(contact_type) {
      if (contact_type === "company") return this.$t("sg_contact_type_company");
      if (contact_type === "individual")
        return this.$t("sg_contact_type_individual");
      return "";
    },
    cleanString(value) {
      if (value === null || value === undefined) return "";
      return String(value).trim();
    },
    closeCreatePanel() {
      this.$router.push("/address-book");
    },
    async fetchAddressBook() {
      this.is_loading = true;
      this.fetch_error = "";

      try {
        const fetched = await this.$api.getFolders({
          path: this.address_book_path,
        });
        this.address_book_entries = Array.isArray(fetched) ? fetched : [];
      } catch ({ code }) {
        this.fetch_error = code || this.$t("sg_could_not_load_address_book");
        this.address_book_entries = [];
      } finally {
        this.is_loading = false;
      }
    },
  },
};
</script>

<style lang="scss" scoped>
._addressBookView {
  position: relative;
  height: 100%;
  padding: calc(var(--spacing) * 2) calc(var(--spacing) * 3)
    calc(var(--spacing) * 1);
}

._addressBookView--content {
  position: relative;
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

._pageTitle {
  margin: 0;
}

._pageHeader {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--spacing);
  margin-bottom: calc(var(--spacing) * 1);
}

._headerActions {
  display: flex;
  align-items: center;
  gap: calc(var(--spacing) / 2);
}

._listSection {
  min-height: 0;
  flex: 1;
  overflow-y: auto;
}

._cardsGrid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: calc(var(--spacing) * 1.5);
}

._contactCard {
  display: flex;
  flex-direction: column;
  gap: calc(var(--spacing) * 0.75);
  padding: calc(var(--spacing) * 1.25);
  border: 1px solid var(--c-gris_clair);
  border-radius: calc(var(--spacing) * 0.75);
  background: var(--c-blanc);
}

._contactHeader {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: calc(var(--spacing) * 0.75);
}

._contactName {
  margin: 0;
  font-size: 1rem;
}

._typeBadge {
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 0.75rem;
  background: var(--c-gris_clair);
  white-space: nowrap;
}

._emptyState {
  margin-top: calc(var(--spacing) * 1.5);
  color: var(--c-gris_fonce);
}

._contactOverlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.2);
  z-index: 30;
  padding-left: 15vw;
}

._contactPanel {
  width: 100%;
  background: var(--c-bodybg);
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  overscroll-behavior: contain;
}
</style>
