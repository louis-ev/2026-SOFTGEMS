/** Shared field highlight after save — used by Gem and Contact detail views */
export default {
  data() {
    return {
      flashing_fields: {},
      flash_timeouts: {},
    };
  },
  beforeDestroy() {
    Object.values(this.flash_timeouts).forEach((timeout_id) => {
      clearTimeout(timeout_id);
    });
  },
  methods: {
    flashFields(field_keys) {
      if (!Array.isArray(field_keys) || field_keys.length === 0) return;
      const flash_duration_ms = 4000;
      field_keys.forEach((field_key) => {
        if (!field_key) return;
        if (this.flash_timeouts[field_key]) {
          clearTimeout(this.flash_timeouts[field_key]);
          this.$delete(this.flash_timeouts, field_key);
        }
        this.$set(this.flashing_fields, field_key, false);
        this.$nextTick(() => {
          this.$set(this.flashing_fields, field_key, true);
          this.flash_timeouts[field_key] = setTimeout(() => {
            this.$delete(this.flashing_fields, field_key);
            this.$delete(this.flash_timeouts, field_key);
          }, flash_duration_ms);
        });
      });
    },
    isFieldFlashing(field_key) {
      return Boolean(this.flashing_fields[field_key]);
    },
  },
};
