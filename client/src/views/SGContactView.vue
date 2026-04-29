<template>
  <section class="_contactView">
    <h1 class="_pageTitle">Contacts</h1>
    <p class="_subtitle">Team members at companies A, B, and C.</p>

    <div class="_searchWrap">
      <input
        v-model.trim="search_query"
        type="search"
        class="_searchInput"
        placeholder="Search name, company, role, or phone"
      />
    </div>

    <div class="_cardsGrid">
      <article
        v-for="person in filtered_contacts_list"
        :key="person.id"
        class="_contactCard"
      >
        <div class="_contactHeader">
          <h2 class="_contactName">{{ person.name }}</h2>
          <span class="_companyBadge">{{ person.company }}</span>
        </div>

        <p class="_contactRole">{{ person.role }}</p>
        <p class="_contactPhone">{{ person.phone_number }}</p>

        <a
          :href="person.profile_link"
          class="_contactLink"
          target="_blank"
          rel="noreferrer noopener"
        >
          Open profile
        </a>
      </article>
    </div>
    <p v-if="!filtered_contacts_list.length" class="_emptyState">
      No contacts found.
    </p>
  </section>
</template>

<script>
export default {
  name: "SGContactView",
  data() {
    return {
      search_query: "",
      contacts_list: [
        {
          id: 1,
          name: "Narin Chaiwat",
          company: "Company A",
          role: "Sales Manager",
          phone_number: "+66 81 234 5671",
          profile_link: "#company-a-narin",
        },
        {
          id: 2,
          name: "Pimchanok Srisai",
          company: "Company A",
          role: "Operations Lead",
          phone_number: "+66 89 345 6782",
          profile_link: "#company-a-pimchanok",
        },
        {
          id: 3,
          name: "Kittisak Rattanakul",
          company: "Company A",
          role: "Account Executive",
          phone_number: "+66 95 456 7893",
          profile_link: "#company-a-kittisak",
        },
        {
          id: 4,
          name: "Anongrat Boonsiri",
          company: "Company B",
          role: "Project Coordinator",
          phone_number: "+66 84 567 8904",
          profile_link: "#company-b-anongrat",
        },
        {
          id: 5,
          name: "Thanawat Preecha",
          company: "Company B",
          role: "Technical Consultant",
          phone_number: "+66 92 678 9015",
          profile_link: "#company-b-thanawat",
        },
        {
          id: 6,
          name: "Supalak Jitthong",
          company: "Company B",
          role: "Support Specialist",
          phone_number: "+66 86 789 0126",
          profile_link: "#company-b-supalak",
        },
        {
          id: 7,
          name: "Phuwadon Meechai",
          company: "Company C",
          role: "Business Analyst",
          phone_number: "+66 98 123 4507",
          profile_link: "#company-c-phuwadon",
        },
        {
          id: 8,
          name: "Lalita Kongsri",
          company: "Company C",
          role: "Client Success",
          phone_number: "+66 83 234 5618",
          profile_link: "#company-c-lalita",
        },
        {
          id: 9,
          name: "Aekkachai Wattanapong",
          company: "Company C",
          role: "Regional Director",
          phone_number: "+66 91 345 6729",
          profile_link: "#company-c-aekkachai",
        },
      ],
    };
  },
  computed: {
    filtered_contacts_list() {
      const query = this.search_query.toLowerCase();

      if (!query) {
        return this.contacts_list;
      }

      return this.contacts_list.filter((person) => {
        const searchable_text = [
          person.name,
          person.company,
          person.role,
          person.phone_number,
        ]
          .join(" ")
          .toLowerCase();

        return searchable_text.includes(query);
      });
    },
  },
};
</script>

<style lang="scss" scoped>
._contactView {
  height: 100%;
  overflow-y: auto;
  padding: calc(var(--spacing) * 2) calc(var(--spacing) * 3);
}

._pageTitle {
  margin: 0;
}

._subtitle {
  margin: calc(var(--spacing) * 0.75) 0 calc(var(--spacing) * 2);
  color: var(--c-gris_fonce);
}

._searchWrap {
  margin-bottom: calc(var(--spacing) * 1.5);
}

._searchInput {
  width: min(100%, 420px);
  padding: 10px 12px;
  border: 1px solid var(--c-gris_clair);
  border-radius: calc(var(--spacing) * 0.5);
  font: inherit;
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

._companyBadge {
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 0.75rem;
  background: var(--c-gris_clair);
}

._contactRole,
._contactPhone {
  margin: 0;
}

._contactPhone {
  font-family: monospace;
}

._contactLink {
  margin-top: auto;
  color: var(--c-orange);
  text-decoration: none;
}

._contactLink:hover {
  text-decoration: underline;
}

._emptyState {
  margin-top: calc(var(--spacing) * 1.5);
  color: var(--c-gris_fonce);
}
</style>
