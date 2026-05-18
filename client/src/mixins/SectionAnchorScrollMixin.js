import { scrollToRouteSectionFromRoot } from "@/utils/section_anchor_scroll.js";

export default {
  data() {
    return {
      _section_anchor_scroll_cancel: null,
    };
  },
  beforeDestroy() {
    this.cancelSectionAnchorScroll();
  },
  methods: {
    cancelSectionAnchorScroll() {
      if (typeof this._section_anchor_scroll_cancel === "function") {
        this._section_anchor_scroll_cancel();
        this._section_anchor_scroll_cancel = null;
      }
    },
    scrollToRouteSectionAnchorAfterLoad({ smooth = false } = {}) {
      this.cancelSectionAnchorScroll();
      this.$nextTick(() => {
        this._section_anchor_scroll_cancel = scrollToRouteSectionFromRoot({
          route: this.$route,
          root_el: this.$el,
          smooth,
        });
      });
    },
  },
};
