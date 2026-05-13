<template>
  <BaseModal2
    :title="$t('sg_media_remove_modal_title')"
    @close="onCloseRequested"
  >
    <p class="_expl">
      {{
        $t("sg_media_remove_modal_body", {
          filename: display_filename,
        })
      }}
    </p>
    <template slot="footer">
      <button
        class="u-button"
        type="button"
        :disabled="removal_in_progress"
        @click="onCloseRequested"
      >
        <b-icon icon="x-circle" />
        {{ $t("cancel") }}
      </button>
      <button
        class="u-button u-button_red"
        type="button"
        autofocus
        :disabled="removal_in_progress"
        @click="confirmRemoval"
      >
        <b-icon icon="trash" />
        {{ $t("confirm_removal") }}
      </button>
      <LoaderSpinner v-if="removal_in_progress" />
    </template>
  </BaseModal2>
</template>

<script>
export default {
  name: "SGGemMediaRemoveModal",
  props: {
    file_path: {
      type: String,
      required: true,
    },
    display_filename: {
      type: String,
      default: "",
    },
    can_delete: {
      type: Boolean,
      default: true,
    },
  },
  data() {
    return {
      removal_in_progress: false,
    };
  },
  methods: {
    onCloseRequested() {
      if (this.removal_in_progress) return;
      this.$emit("close");
    },
    async confirmRemoval() {
      if (!this.can_delete || !this.file_path) return;
      this.removal_in_progress = true;
      try {
        await this.$api.deleteItem({
          path: this.file_path,
        });
        this.$alertify.closeLogOnClick(true).delay(4000).success(
          this.$t("sg_media_remove_success"),
        );
        this.$emit("removedSuccessfully");
        this.$emit("close");
      } catch ({ code }) {
        this.$alertify.delay(4000).error(code || this.$t("couldntbesaved"));
      } finally {
        this.removal_in_progress = false;
      }
    },
  },
};
</script>

<style lang="scss" scoped>
._expl {
  margin: 0;
  font-size: var(--sl-font-size-small);
  line-height: 1.45;
}
</style>
