<template>
  <section
    :id="resolved_section_id || undefined"
    class="_sgSectionPanel"
    :class="{ '_sgSectionPanel--anchored': !!resolved_section_id }"
  >
    <header v-if="show_header" class="_header">
      <h2 v-if="has_title" class="_title">
        <a
          v-if="resolved_section_id"
          class="_titleAnchor"
          :href="section_href"
          :title="anchor_title"
          @click="onAnchorClick"
        >
          <span class="_titleText">{{ title }}</span>
          <b-icon
            icon="link-45deg"
            class="_titleAnchorIcon"
            aria-hidden="true"
          />
        </a>
        <span v-else class="_titleText">{{ title }}</span>
      </h2>
      <span v-if="show_count" class="_count">{{ count }}</span>
      <div v-if="has_actions" class="_actions">
        <slot name="actions" />
      </div>
    </header>
    <div class="_tile" :class="tile_class">
      <slot />
    </div>
  </section>
</template>

<script>
export default {
  name: "SGSectionPanel",
  props: {
    title: {
      type: String,
      default: "",
    },
    section_id: {
      type: String,
      default: "",
    },
    count: {
      type: [Number, String],
      default: null,
    },
    tile_class: {
      type: [String, Array, Object],
      default: null,
    },
  },
  computed: {
    has_title() {
      return String(this.title || "").trim() !== "";
    },
    resolved_section_id() {
      const raw = String(this.section_id || "").trim();
      if (!raw) return "";
      return raw.replace(/[^a-zA-Z0-9_-]/g, "");
    },
    show_count() {
      return this.count !== null && this.count !== undefined && this.count !== "";
    },
    has_actions() {
      return Boolean(this.$slots.actions);
    },
    show_header() {
      return this.has_title || this.show_count || this.has_actions;
    },
    section_href() {
      if (!this.resolved_section_id) return "";
      const route = this.$route;
      if (!route) {
        return `#${this.resolved_section_id}`;
      }
      const resolved = this.$router.resolve({
        path: route.path,
        query: route.query,
        hash: `#${this.resolved_section_id}`,
      });
      return resolved.href;
    },
    anchor_title() {
      const hint = this.$t("sg_section_link_to_section");
      return hint && hint !== "sg_section_link_to_section" ? hint : "";
    },
  },
  mounted() {
    this.$nextTick(() => {
      this.scrollIfHashMatches({ smooth: false });
    });
  },
  watch: {
    "$route.hash"() {
      this.$nextTick(() => {
        this.scrollIfHashMatches({ smooth: true });
      });
    },
  },
  methods: {
    onAnchorClick(event) {
      if (!this.resolved_section_id) return;
      if (
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        event.button !== 0
      ) {
        return;
      }
      event.preventDefault();
      this.$router
        .replace({
          path: this.$route.path,
          query: this.$route.query,
          hash: `#${this.resolved_section_id}`,
        })
        .catch(() => {});
      this.scrollSectionIntoView({ smooth: true });
    },
    scrollIfHashMatches({ smooth = false } = {}) {
      if (!this.resolved_section_id || !this.$el) return;
      const hash = String(this.$route?.hash || "").replace(/^#/, "");
      if (hash !== this.resolved_section_id) return;
      this.scrollSectionIntoView({ smooth });
    },
    scrollSectionIntoView({ smooth = true } = {}) {
      if (!this.$el) return;
      this.$el.scrollIntoView({
        behavior: smooth ? "smooth" : "auto",
        block: "start",
      });
    },
  },
};
</script>

<style lang="scss" scoped>
._sgSectionPanel {
  display: flex;
  flex-direction: column;
  gap: calc(var(--spacing) * 0.75);
}

._sgSectionPanel--anchored {
  scroll-margin-top: calc(var(--spacing) * 2);
}

._header {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: calc(var(--spacing) / 2);
}

._title {
  margin: 0;
  font-size: clamp(1.25rem, 1rem + 0.45vw, 1.5rem);
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: -0.01em;
}

._titleAnchor {
  display: inline-flex;
  align-items: center;
  gap: calc(var(--spacing) / 3);
  color: inherit;
  text-decoration: none;

  &:hover,
  &:focus-visible {
    text-decoration: underline;
    text-underline-offset: 0.18em;
  }
}

._titleAnchorIcon {
  flex: 0 0 auto;
  font-size: 0.85em;
  opacity: 0;
  transform: translateY(0.05em);
  transition: opacity 0.12s ease;
}

._titleAnchor:hover ._titleAnchorIcon,
._titleAnchor:focus-visible ._titleAnchorIcon {
  opacity: 0.55;
}

._count {
  background: var(--c-gris_clair);
  border-radius: 999px;
  padding: 0 calc(var(--spacing) / 2);
  font-size: var(--sl-font-size-small);
  font-weight: 600;
}

._actions {
  margin-left: auto;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: calc(var(--spacing) / 2);
}

._tile {
  border: 1px solid var(--c-gris_clair);
  border-radius: 10px;
  padding: calc(var(--spacing) * 0.9);
  background: var(--c-blanc);
  min-width: 0;
}
</style>
