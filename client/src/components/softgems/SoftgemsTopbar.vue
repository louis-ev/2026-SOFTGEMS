<template>
  <header class="_softgemsTopbar">
    <div class="_inner">
      <div class="_left">
        <router-link to="/">
          <h1 class="_title">ACF</h1>
          <p class="_subtitle">Inventory workspace</p>
        </router-link>
      </div>

      <div class="_right">
        <!-- <span class="_routeLabel">{{ route_label }}</span> -->
        <router-link
          v-if="connected_as"
          :to="author_url"
          class="u-button"
          :class="{ 'is--active': $route.path === author_url }"
        >
          <b-icon icon="person-circle" />
          {{ author_name }}
        </router-link>
        <button
          v-else
          type="button"
          class="u-button"
          @click="show_authors_modal = true"
        >
          {{ $t("login") }}
        </button>
      </div>
    </div>

    <AuthorList v-if="show_authors_modal" @close="show_authors_modal = false" />
  </header>
</template>

<script>
import AuthorList from "@/adc-core/author/AuthorList.vue";

export default {
  components: {
    AuthorList,
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
    author_url() {
      return this.createURLFromPath(
        this.getAuthor(this.connected_as.$path).$path
      );
    },
  },
};
</script>
<style lang="scss" scoped>
._softgemsTopbar {
  position: sticky;
  top: 0;
  z-index: 4;
  background: #333;
  border-bottom: 1px solid var(--c-gris_clair);
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

  > a {
    text-decoration: none;
    color: inherit;
  }
}

._title {
  margin: 0;
  line-height: 1;
  font-size: var(--sl-font-size-large);
}

._subtitle {
  margin: 0;
  font-size: var(--sl-font-size-small);
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
