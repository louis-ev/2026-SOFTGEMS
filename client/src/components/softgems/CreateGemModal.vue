<template>
  <BaseModal2 title="Create gem" @close="$emit('close')">
    <form @submit.prevent="createGem">
      <DLabel str="Name" />
      <TextInput
        :content.sync="new_gem_name"
        :required="true"
        :autofocus="true"
        @onEnter="createGem"
      />
    </form>
    <template #footer>
      <button type="button" class="u-button" @click="$emit('close')">Cancel</button>
      <button
        type="button"
        class="u-button u-button_bleuvert"
        :disabled="is_creating || !new_gem_name.trim()"
        @click="createGem"
      >
        {{ is_creating ? "Creating..." : "Create" }}
      </button>
    </template>
  </BaseModal2>
</template>

<script>
export default {
  props: {
    gems_path: {
      type: String,
      default: "gems",
    },
  },
  data() {
    return {
      is_creating: false,
      new_gem_name: "",
    };
  },
  methods: {
    async createGem() {
      const cleaned_name = this.new_gem_name.trim();
      if (!cleaned_name || this.is_creating) return;

      this.is_creating = true;
      try {
        await this.$api.createFolder({
          path: this.gems_path,
          additional_meta: {
            title: cleaned_name,
            name: cleaned_name,
            requested_slug: cleaned_name,
          },
        });
        this.$emit("gemCreated");
        this.$emit("close");
      } catch ({ code }) {
        this.$alertify.delay(4000).error(code || "Could not create gem.");
      } finally {
        this.is_creating = false;
      }
    },
  },
};
</script>
