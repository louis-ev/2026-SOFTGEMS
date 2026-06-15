<template>
  <div class="_sgOverlaySidePanelLayout">
    <div class="_sgOverlaySidePanelLayout--main">
      <slot />
    </div>
    <div class="_sgOverlaySidePanelLayout--shell">
      <transition name="backdropFade">
        <div
          v-if="panel_open"
          key="backdrop"
          class="_sgOverlaySidePanelLayout--backdrop"
          :style="backdrop_style"
          @click="onBackdropClick"
        />
      </transition>
      <div class="_sgOverlaySidePanelLayout--panelTrack">
        <transition name="panelSlide">
          <section
            v-if="panel_open"
            key="panel"
            class="_sgOverlaySidePanelLayout--panel"
          >
            <button
              v-if="panel_show_close_button"
              type="button"
              class="u-button u-button_icon _sgOverlaySidePanelLayout--panelClose"
              :aria-label="$t('close')"
              @click="onPanelCloseClick"
            >
              <b-icon icon="x-lg" />
            </button>
            <div class="_sgOverlaySidePanelLayout--panelBody">
              <slot name="panel" />
            </div>
          </section>
        </transition>
      </div>
    </div>
  </div>
</template>

<script>
const BACKDROP_LIGHT_OPACITY = 0.12;
const BACKDROP_DARK_OPACITY = 0.32;
const BACKDROP_HOVER_DELTA = 0.08;

export default {
  name: "SGOverlaySidePanelLayout",
  inject: {
    parent_overlay_depth: {
      from: "overlay_panel_depth",
      default: 0,
    },
    parent_overlay_registry: {
      from: "overlay_panel_registry",
      default: null,
    },
  },
  data() {
    return {
      overlay_registry_ref: this.parent_overlay_registry || { layouts: [] },
    };
  },
  provide() {
    return {
      overlay_panel_depth: this.overlay_depth,
      overlay_panel_registry: this.overlay_registry_ref,
    };
  },
  props: {
    panel_open: {
      type: Boolean,
      default: false,
    },
    /** When the panel is open, shows an overlay close control (same effect as backdrop click). */
    panel_show_close_button: {
      type: Boolean,
      default: false,
    },
  },
  computed: {
    overlay_depth() {
      return this.parent_overlay_depth + 1;
    },
    topmost_open_depth() {
      return this.overlay_registry_ref.layouts.reduce((max_depth, layout) => {
        void layout.panel_open;
        return layout.panel_open
          ? Math.max(max_depth, layout.overlay_depth)
          : max_depth;
      }, 0);
    },
    backdrop_style() {
      const steps_behind = this.topmost_open_depth - this.overlay_depth + 1;
      const opacity =
        steps_behind >= 2 ? BACKDROP_DARK_OPACITY : BACKDROP_LIGHT_OPACITY;
      const hover_opacity = Math.max(opacity - BACKDROP_HOVER_DELTA, 0.04);

      return {
        "--backdrop-bg": `rgba(150, 150, 150, ${opacity})`,
        "--backdrop-bg-hover": `rgba(150, 150, 150, ${hover_opacity})`,
      };
    },
  },
  created() {
    this.overlay_registry_ref.layouts.push(this);
  },
  beforeDestroy() {
    const layouts = this.overlay_registry_ref.layouts;
    const index = layouts.indexOf(this);
    if (index !== -1) {
      layouts.splice(index, 1);
    }
  },
  methods: {
    onBackdropClick() {
      this.emitClose();
    },
    onPanelCloseClick() {
      this.emitClose();
    },
    emitClose() {
      this.$emit("close");
    },
  },
};
</script>

<style lang="scss" scoped>
._sgOverlaySidePanelLayout {
  position: relative;
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

._sgOverlaySidePanelLayout--main {
  position: relative;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

._sgOverlaySidePanelLayout--shell {
  position: absolute;
  inset: 0;
  z-index: 30;
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  align-items: stretch;
  box-sizing: border-box;
  padding-left: clamp(0px, 7vw, 320px);
  padding-bottom: env(safe-area-inset-bottom, 0px);
  pointer-events: none;
}

._sgOverlaySidePanelLayout--backdrop {
  position: absolute;
  inset: 0;
  background: var(--backdrop-bg, rgba(150, 150, 150, 0.15));
  cursor: pointer;
  pointer-events: auto;
  backdrop-filter: blur(1px);

  transition: background 0.2s ease, backdrop-filter 0.2s ease;

  &:hover {
    // background: var(--backdrop-bg-hover, rgba(150, 150, 150, 0.05));
    backdrop-filter: blur(0px);
  }
}

._sgOverlaySidePanelLayout--panelTrack {
  position: relative;
  z-index: 1;
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: flex;
  justify-content: flex-end;
  align-items: stretch;
  pointer-events: none;
}

._sgOverlaySidePanelLayout--panel {
  position: relative;
  flex: 1;
  min-width: 0;
  width: 100%;
  max-width: 100%;
  background: var(--c-bodybg);
  height: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  pointer-events: auto;
}

._sgOverlaySidePanelLayout--panelClose {
  position: absolute;
  top: calc(var(--spacing) * 0.5);
  right: calc(var(--spacing) * 0.5);
  z-index: 25;
  pointer-events: auto;
}

._sgOverlaySidePanelLayout--panelTop {
  flex: 0 0 auto;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: calc(var(--spacing) / 2);
  padding: calc(var(--spacing) * 1) calc(var(--spacing) * 1.35)
    calc(var(--spacing) * 0.45);
  box-sizing: border-box;
}

._sgOverlaySidePanelLayout--panelTopLeading {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  align-items: center;
}

._sgOverlaySidePanelLayout--panelBody {
  flex: 1;
  min-height: 0;
  background: var(--c-bodybg);
  overflow-y: auto;
  overflow-x: hidden;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}

@media (max-width: 767px) {
  ._sgOverlaySidePanelLayout--shell {
    padding-left: 0;
    padding-right: 0;
    padding-top: env(safe-area-inset-top, 0px);
  }

  ._sgOverlaySidePanelLayout--panel {
    flex: 1 1 100%;
    box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.06);
  }

  ._sgOverlaySidePanelLayout--panelClose {
    right: calc(var(--spacing) * 1.35 + env(safe-area-inset-right, 0px));
  }

  ._sgOverlaySidePanelLayout--panelTop {
    padding-right: calc(
      var(--spacing) * 1.35 + env(safe-area-inset-right, 0px)
    );
    padding-left: env(safe-area-inset-left, 0px);
  }
}

.backdropFade-enter-active,
.backdropFade-leave-active {
  transition: opacity 0.2s ease;
}

.backdropFade-enter,
.backdropFade-leave-to {
  opacity: 0;
}

.panelSlide-enter-active,
.panelSlide-leave-active {
  transition: opacity 0.22s ease, transform 0.22s ease;
}

.panelSlide-enter,
.panelSlide-leave-to {
  opacity: 0;
  transform: translateX(10vw);
}
</style>
