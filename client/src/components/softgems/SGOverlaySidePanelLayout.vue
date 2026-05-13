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
            <slot name="panel" />
          </section>
        </transition>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "SGOverlaySidePanelLayout",
  props: {
    panel_open: {
      type: Boolean,
      default: false,
    },
  },
  methods: {
    onBackdropClick() {
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
  padding-left: clamp(0px, 10vw, 320px);
  padding-bottom: env(safe-area-inset-bottom, 0px);
  pointer-events: none;
}

._sgOverlaySidePanelLayout--backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.2);
  cursor: pointer;
  pointer-events: auto;
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
  flex: 1;
  min-width: 0;
  width: 100%;
  max-width: 100%;
  background: var(--c-bodybg);
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  pointer-events: auto;
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
