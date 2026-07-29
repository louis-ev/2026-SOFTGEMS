<template>
  <header class="_softgemsTopbar">
    <div class="_inner">
      <div class="_left">
        <router-link to="/" class="_brandLink">
          <AcfLogoMark class="_logoMark" />
          <!-- <p class="_subtitle">Inventory workspace</p> -->
        </router-link>
      </div>

      <div class="_right">
        <!-- <span class="_routeLabel">{{ route_label }}</span> -->
        <button
          v-if="connected_as"
          type="button"
          class="u-button"
          @click="openAuthorModal"
        >
          <b-icon icon="person-circle" />
          {{ author_name }}
        </button>
        <button v-else type="button" class="u-button" @click="openAuthorModal">
          {{ $t("login") }}
        </button>
      </div>
    </div>

    <AuthorList v-if="show_authors_modal" @close="show_authors_modal = false" />
  </header>
</template>

<script>
import AuthorList from "@/adc-core/author/AuthorList.vue";
import AcfLogoMark from "@/components/selections/AcfLogoMark.vue";

export default {
  components: {
    AuthorList,
    AcfLogoMark,
  },
  data() {
    return {
      show_authors_modal: false,
    };
  },
  computed: {
    route_label() {
      return this.$route?.name || this.$route?.path || "Home";
    },
    author_name() {
      return this.connected_as?.name || this.$t("login");
    },
  },
  methods: {
    openAuthorModal() {
      this.show_authors_modal = true;
    },
  },
};
</script>
<style lang="scss" scoped>
._softgemsTopbar {
  background: var(--acf-brand-primary);
  border-bottom: 1px solid
    color-mix(in srgb, var(--acf-brand-light) 35%, transparent);
}

._inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing);
  padding: calc(var(--spacing) * 0.75) var(--spacing);
}

._left {
  display: flex;
  flex-direction: column;
  gap: calc(var(--spacing) / 5);
  color: #fff;
  min-width: 0;
}

._brandLink {
  display: flex;
  flex-flow: row wrap;
  gap: calc(var(--spacing) / 1);
  align-items: center;
  text-decoration: none;
  color: inherit;
}

._logoMark {
  --acf-logo-fill: var(--acf-brand-cream);
  height: 1.8rem;
  width: 4rem;
}

._subtitle {
  margin: 0;
  font-size: var(--sl-font-size-small);
  color: var(--acf-brand-light);
}

._right {
  display: flex;
  align-items: center;
  gap: calc(var(--spacing) / 2);

  > a {
    text-decoration: none;
    color: inherit;
  }
}

._routeLabel {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: calc(var(--spacing) / 4) calc(var(--spacing) / 2);
  background: var(--c-gris_clair);
  color: var(--c-noir);
  font-weight: 500;
  font-size: var(--sl-font-size-x-small);
  white-space: nowrap;
}

._accountButton {
  white-space: nowrap;
}
</style>
