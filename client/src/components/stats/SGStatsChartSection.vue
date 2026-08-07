<template>
  <section class="_chartSection" :aria-labelledby="title_id">
    <header class="_header">
      <h2 :id="title_id" class="_title">{{ title }}</h2>
      <div ref="menu_wrap" class="_menuWrap">
        <button
          type="button"
          class="u-button u-button_verysmall _menuTrigger"
          :aria-label="$t('sg_stats_chart_menu_aria')"
          :aria-expanded="menu_open ? 'true' : 'false'"
          aria-haspopup="menu"
          @click.stop="toggleMenu"
        >
          <b-icon icon="three-dots-vertical" aria-hidden="true" />
        </button>
        <div
          v-if="menu_open"
          class="_menu"
          role="menu"
          :aria-label="$t('sg_stats_chart_menu_aria')"
        >
          <button
            type="button"
            class="_menuItem"
            role="menuitem"
            @click="onExportCsv"
          >
            <b-icon icon="download" class="_menuItemIcon" aria-hidden="true" />
            {{ $t("sg_stats_export_csv") }}
          </button>
        </div>
      </div>
    </header>
    <div class="_body">
      <slot>
        <p class="_placeholderMsg">{{ placeholder_message }}</p>
      </slot>
    </div>
  </section>
</template>

<script>
export default {
  name: "SGStatsChartSection",
  props: {
    section_id: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    placeholder_message: {
      type: String,
      default: "",
    },
  },
  data() {
    return {
      menu_open: false,
    };
  },
  computed: {
    title_id() {
      return `stats-chart-title-${this.section_id}`;
    },
  },
  watch: {
    menu_open(is_open) {
      if (is_open) {
        this.bindOutsideClose();
      } else {
        this.unbindOutsideClose();
      }
    },
  },
  beforeDestroy() {
    this.unbindOutsideClose();
  },
  methods: {
    toggleMenu() {
      this.menu_open = !this.menu_open;
    },
    closeMenu() {
      this.menu_open = false;
    },
    onExportCsv() {
      this.closeMenu();
      this.$emit("exportCsv");
    },
    bindOutsideClose() {
      this.unbindOutsideClose();
      this._on_pointer_down = (event) => {
        const wrap = this.$refs.menu_wrap;
        if (!wrap || wrap.contains(event.target)) return;
        this.closeMenu();
      };
      document.addEventListener("pointerdown", this._on_pointer_down, true);
    },
    unbindOutsideClose() {
      if (!this._on_pointer_down) return;
      document.removeEventListener("pointerdown", this._on_pointer_down, true);
      this._on_pointer_down = null;
    },
  },
};
</script>

<style lang="scss" scoped>
._chartSection {
  display: flex;
  flex-direction: column;
  min-height: 500px;
  height: 500px;
  border: 1px solid var(--c-gris_clair);
  border-radius: 10px;
  background: var(--c-blanc);
  box-sizing: border-box;
  overflow: hidden;
}

._header {
  display: flex;
  align-items: center;
  gap: calc(var(--spacing) / 2);
  padding: calc(var(--spacing) * 0.85) calc(var(--spacing) * 1.1);
  border-bottom: 1px solid var(--c-gris_clair);
  flex: 0 0 auto;
}

._title {
  margin: 0;
  font-size: clamp(1.05rem, 0.95rem + 0.35vw, 1.25rem);
  font-weight: 500;
  letter-spacing: -0.01em;
  min-width: 0;
}

._menuWrap {
  position: relative;
  margin-left: auto;
  flex: 0 0 auto;
}

._menuTrigger {
  width: 32px;
  height: 32px;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

._menu {
  position: absolute;
  top: calc(100% + 4px);
  right: 0;
  z-index: 5;
  min-width: 11.5rem;
  padding: calc(var(--spacing) / 4);
  background: var(--c-blanc);
  border: 1px solid var(--c-gris_clair);
  border-radius: 8px;
  box-shadow: 0 8px 24px color-mix(in srgb, #000 12%, transparent);
}

._menuItem {
  width: 100%;
  display: flex;
  align-items: center;
  gap: calc(var(--spacing) / 2);
  padding: calc(var(--spacing) / 2) calc(var(--spacing) * 0.7);
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;

  &:hover,
  &:focus-visible {
    background: var(--c-gris_clair);
    outline: none;
  }
}

._menuItemIcon {
  flex: 0 0 auto;
  opacity: 0.75;
}

._body {
  flex: 1 1 auto;
  min-height: 0;
  padding: calc(var(--spacing) * 1.25) calc(var(--spacing) * 1.1);
  display: flex;
  align-items: center;
  justify-content: center;
}

._placeholderMsg {
  margin: 0;
  max-width: 42rem;
  text-align: center;
  white-space: pre-line;
  color: var(--c-gris_fonce);
  line-height: 1.45;
}
</style>
