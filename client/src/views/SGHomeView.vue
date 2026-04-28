<template>
  <div class="_sgHome">
    <div class="u-sameRow u-spacingBottom">
      <h1 class="_title">INVENTORY</h1>
      <button
        type="button"
        class="u-button u-button_bleuvert"
        @click="openCreateView"
      >
        Create gem
      </button>
    </div>

    <div v-if="is_loading">Loading gems...</div>
    <div v-else-if="fetch_error" class="u-errorMsg">{{ fetch_error }}</div>
    <table v-else class="_table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Path</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="gems.length === 0">
          <td colspan="2">No gems yet.</td>
        </tr>
        <tr v-for="gem in gems" :key="gem.$path">
          <td>{{ gem.name || gem.title || "-" }}</td>
          <td>
            <code>{{ gem.$path }}</code>
          </td>
        </tr>
      </tbody>
    </table>
    <section class="_fontPreview">
      <h1>Typography Preview H1</h1>
      <h2>Typography Preview H2</h2>
      <h3>Typography Preview H3</h3>
      <p>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum sed
        dui turpis. Praesent finibus, arcu id feugiat facilisis, elit sem
        elementum justo, sed tempor neque justo eu mauris.
      </p>
      <p class="sg-content-emphasis">
        This line uses content emphasis style to preview Spectral 500.
      </p>
      <p class="sg-data-number">
        Numeric sample: 12.50 ct - $15,450.00 - 48 pieces
      </p>
    </section>
  </div>
</template>
<script>
export default {
  props: {},
  components: {},
  data() {
    return {
      gems_path: "gems",
      gems: [],
      is_loading: false,
      fetch_error: "",
    };
  },
  created() {
    this.fetchGems();
  },
  mounted() {
    this.$api.join({ room: this.gems_path });
  },
  beforeDestroy() {
    this.$api.leave({ room: this.gems_path });
  },
  watch: {},
  computed: {},
  methods: {
    async fetchGems() {
      this.is_loading = true;
      this.fetch_error = "";

      try {
        this.gems = await this.$api.getFolders({
          path: this.gems_path,
        });
      } catch ({ code }) {
        this.fetch_error = code || "Could not load gems.";
      } finally {
        this.is_loading = false;
      }
    },
    openCreateView() {
      this.$router.push("/gems/new");
    },
  },
};
</script>
<style lang="scss" scoped>
._sgHome {
  max-width: 960px;
  margin: 0 auto;
}

._title {
  margin: 0;
}

._table {
  width: 100%;
  border-collapse: collapse;

  th,
  td {
    text-align: left;
    border-bottom: 1px solid var(--c-gris_clair);
    padding: calc(var(--spacing) / 2);
  }
}

._fontPreview {
  margin-top: calc(var(--spacing) * 2);
  padding-top: calc(var(--spacing) * 1.5);
  border-top: 1px solid var(--c-gris_clair);
}
</style>
