<template>
  <header class="_softgemsTopbar">
    <div class="_inner">
      <div class="_left">
        <h1 class="_title">SoftGems</h1>
        <p class="_subtitle">Inventory workspace</p>
      </div>

      <div class="_right">
        <!-- <span class="_routeLabel">{{ route_label }}</span> -->
        <button
          type="button"
          class="u-button u-button_bleumarine _accountButton"
          @click="handleAccountClick"
        >
          {{ account_button_label }}
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
    account_button_label() {
      return this.connected_as?.name || this.$t("login");
    },
  },
  methods: {
    handleAccountClick() {
      if (this.connected_as) {
        window.location.assign("/@/author");
        return;
      }
      this.show_authors_modal = true;
    },
  },
};
</script>

<style lang="scss" scoped>
._softgemsTopbar {
  position: sticky;
  top: 0;
  z-index: 4;
  background: white;
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
  min-width: 0;
}

._title {
  margin: 0;
  line-height: 1;
  font-size: var(--sl-font-size-large);
}

._subtitle {
  margin: 0;
  color: var(--c-gris_fonce);
  font-size: var(--sl-font-size-x-small);
}

._right {
  display: flex;
  align-items: center;
  gap: calc(var(--spacing) / 2);
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
