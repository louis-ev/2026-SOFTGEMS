<template>
  <div class="_sgOverlaySidePanelLayout">
    <div class="_sgOverlaySidePanelLayout--main">
      <slot />
    </div>
    <transition name="fade_fast">
      <div
        v-if="panel_open"
        class="_sgOverlaySidePanelLayout--overlay"
        @click.self="onBackdropClick"
      >
        <section class="_sgOverlaySidePanelLayout--panel">
          <slot name="panel" />
        </section>
      </div>
    </transition>
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

._sgOverlaySidePanelLayout--overlay {
  position: absolute;
  inset: 0;
  z-index: 30;
  display: flex;
  justify-content: flex-end;
  align-items: stretch;
  box-sizing: border-box;
  cursor: pointer;
  padding-left: clamp(0px, 10vw, 320px);
  padding-bottom: env(safe-area-inset-bottom, 0px);
  background: rgba(0, 0, 0, 0.2);
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
}

@media (max-width: 767px) {
  ._sgOverlaySidePanelLayout--overlay {
    padding-left: 0;
    padding-right: 0;
    padding-top: env(safe-area-inset-top, 0px);
  }

  ._sgOverlaySidePanelLayout--panel {
    flex: 1 1 100%;
    box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.06);
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.18s ease;
}

.fade-enter-active ._sgOverlaySidePanelLayout--panel,
.fade-leave-active ._sgOverlaySidePanelLayout--panel {
  transition: transform 0.22s ease;
}

.fade-enter,
.fade-leave-to {
  opacity: 0;
}

.fade-enter ._sgOverlaySidePanelLayout--panel,
.fade-leave-to ._sgOverlaySidePanelLayout--panel {
  transform: translateX(12px);
}

@media (max-width: 767px) {
  .fade-enter ._sgOverlaySidePanelLayout--panel,
  .fade-leave-to ._sgOverlaySidePanelLayout--panel {
    transform: translateY(10px);
  }
}
</style>
