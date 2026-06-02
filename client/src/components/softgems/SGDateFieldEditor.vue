<template>
  <div>
    <DLabel :str="label" :icon="label_icon" />
    <SGDateInput :value="draft" @input="draft = $event" />
  </div>
</template>

<script>
import SGDateInput from "@/components/softgems/SGDateInput.vue";
import { toDateInputValue, toStoredCalendarDate } from "@/utils/date_input.js";

export default {
  name: "SGDateFieldEditor",
  components: {
    SGDateInput,
  },
  props: {
    initial_value: {
      type: String,
      default: "",
    },
    label: {
      type: String,
      required: true,
    },
    label_icon: {
      type: String,
      default: "calendar3",
    },
  },
  data() {
    return {
      draft: toDateInputValue(this.initial_value),
    };
  },
  computed: {
    is_footer_save_disabled() {
      return false;
    },
  },
  watch: {
    initial_value(next_value) {
      this.draft = toDateInputValue(next_value);
    },
    is_footer_save_disabled() {
      this.emitFooterState();
    },
  },
  mounted() {
    this.emitFooterState();
  },
  methods: {
    emitFooterState() {
      this.$emit("footerStateChange", {
        save_disabled: this.is_footer_save_disabled,
      });
    },
    tryShellSave() {
      this.$emit("save", { value: toStoredCalendarDate(this.draft) });
    },
  },
};
</script>
