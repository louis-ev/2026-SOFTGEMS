<template>
  <section class="_gemNewView">
    <div class="u-sameRow u-spacingBottom">
      <h1>Create gem</h1>
      <button type="button" class="u-button" @click="goBack">Back</button>
    </div>

    <form class="_form" @submit.prevent="createGem">
      <DLabel str="Name" />
      <TextInput
        :content.sync="new_gem_name"
        :required="true"
        :autofocus="true"
        @onEnter="createGem"
      />

      <div class="_actions">
        <button type="button" class="u-button" @click="goBack">Cancel</button>
        <button
          type="submit"
          class="u-button u-button_bleuvert"
          :disabled="is_creating || !new_gem_name.trim()"
        >
          {{ is_creating ? "Creating..." : "Create gem" }}
        </button>
      </div>
    </form>
  </section>
</template>

<script>
export default {
  data() {
    return {
      gems_path: "gems",
      new_gem_name: "",
      is_creating: false,
    };
  },
  methods: {
    goBack() {
      this.$router.push("/");
    },
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
        this.$router.push("/");
      } catch ({ code }) {
        this.$alertify.delay(4000).error(code || "Could not create gem.");
      } finally {
        this.is_creating = false;
      }
    },
  },
};
</script>

<style lang="scss" scoped>
._gemNewView {
  max-width: 720px;
  margin: 0 auto;
}

._form {
  display: flex;
  flex-direction: column;
  gap: calc(var(--spacing) / 1.5);
}

._actions {
  display: flex;
  justify-content: flex-end;
  gap: calc(var(--spacing) / 2);
}
</style>
