<template>
  <span class="_gemBulkPerfSeed">
    <button
      type="button"
      class="u-button u-button_small"
      :disabled="Boolean(disabled) || is_running"
      @click="openModal"
    >
      {{ $t("sg_bulk_perf_seed_button") }}
    </button>

    <BaseModal2
      v-if="modal_open"
      :title="$t('sg_bulk_perf_seed_title')"
      :is_closable="!is_running"
      :is_loading="is_preparing"
      @close="requestCloseModal"
    >
      <div class="_modalBody">
        <p class="_warning">{{ $t("sg_bulk_perf_seed_warning") }}</p>

        <div class="_fields" v-if="!is_running || prep_snapshot">
          <label class="_field">
            <span class="_label">{{ $t("sg_bulk_perf_seed_target_label") }}</span>
            <input
              v-model.number="local_target_total"
              type="number"
              class="u-input"
              min="1"
              :disabled="is_running"
            />
          </label>
          <label class="_field">
            <span class="_label">{{
              $t("sg_bulk_perf_seed_seed_count_label")
            }}</span>
            <input
              v-model.number="local_seed_count"
              type="number"
              class="u-input"
              min="1"
              :disabled="is_running"
            />
          </label>
        </div>

        <p v-if="prep_snapshot" class="_summary">
          {{ $t("sg_bulk_perf_seed_current_count", { count: prep_snapshot.current_count }) }}
          <br />
          {{
            $t("sg_bulk_perf_seed_seeds_selected", {
              n: prep_snapshot.seeds.length,
            })
          }}
          <br />
          {{
            $t("sg_bulk_perf_seed_will_create", {
              n: prep_snapshot.will_create,
            })
          }}
        </p>

        <p v-if="last_error" class="u-errorMsg _error">{{ last_error }}</p>

        <div v-if="is_running" class="_progress">
          {{ $t("sg_bulk_perf_seed_progress", { done: done_count, total: total_to_create }) }}
        </div>

        <template v-if="!is_running && prep_snapshot && prep_snapshot.will_create > 0">
          <p class="_confirmHint">
            {{
              $t("sg_bulk_perf_seed_confirm_instructions", {
                phrase: confirm_phrase,
              })
            }}
          </p>
          <input
            v-model="confirm_phrase_input"
            type="text"
            class="u-input"
            autocomplete="off"
            :placeholder="$t('sg_bulk_perf_seed_confirm_placeholder')"
          />
        </template>
      </div>

      <template slot="footer">
        <button
          type="button"
          class="u-button"
          :disabled="is_running"
          @click="requestCloseModal"
        >
          {{ $t("sg_cancel") }}
        </button>
        <button
          v-if="!is_running && prep_snapshot && prep_snapshot.will_create > 0"
          type="button"
          class="u-button u-button_bleuvert"
          :disabled="!confirmMatches"
          @click="startBulkCopy"
        >
          {{ $t("sg_bulk_perf_seed_start") }}
        </button>
        <button
          v-if="is_running"
          type="button"
          class="u-button u-button_red"
          @click="requestCancel"
        >
          {{ $t("sg_bulk_perf_seed_stop") }}
        </button>
      </template>
    </BaseModal2>
  </span>
</template>

<script>
import BaseModal2 from "@/adc-core/modals/BaseModal2.vue";

const bulk_perf_confirm_phrase = "BULK SEED";
const bulk_perf_max_target = 50000;

export default {
  name: "SGGemBulkPerfSeedPanel",
  components: { BaseModal2 },
  props: {
    gems_path: { type: String, default: "gems" },
    seed_count: { type: Number, default: 150 },
    target_total: { type: Number, default: 10_000 },
    disabled: { type: Boolean, default: false },
  },
  data() {
    return {
      modal_open: false,
      local_target_total: 10_000,
      local_seed_count: 150,
      confirm_phrase_input: "",
      is_preparing: false,
      is_running: false,
      cancel_requested: false,
      prep_snapshot: null,
      done_count: 0,
      total_to_create: 0,
      last_error: "",
      confirm_phrase: bulk_perf_confirm_phrase,
    };
  },
  computed: {
    confirmMatches() {
      return (
        String(this.confirm_phrase_input || "")
          .trim()
          .toUpperCase() === bulk_perf_confirm_phrase
      );
    },
  },
  methods: {
    getGemSlug(gem) {
      const gem_path = gem?.$path || "";
      if (!gem_path) return "";
      const path_parts = gem_path.split("/");
      return path_parts[path_parts.length - 1] || "";
    },
    isPerfCopySlug(slug) {
      return typeof slug === "string" && /-copy(-\d+)?$/.test(slug);
    },
    selectSeedsFromInventory(all_gems) {
      const rows = Array.isArray(all_gems) ? all_gems : [];
      const non_copy = rows.filter((gem) => !this.isPerfCopySlug(this.getGemSlug(gem)));
      const sorted = [...non_copy].sort((a_gem, b_gem) =>
        this.getGemSlug(a_gem).localeCompare(this.getGemSlug(b_gem), undefined, {
          numeric: true,
          sensitivity: "base",
        })
      );
      const cap = Math.max(1, Math.floor(Number(this.local_seed_count)) || 1);
      return sorted.slice(0, cap);
    },
    openModal() {
      this.modal_open = true;
      this.local_target_total = Math.min(
        bulk_perf_max_target,
        Math.max(1, Math.floor(Number(this.target_total)) || 10_000)
      );
      this.local_seed_count = Math.max(1, Math.floor(Number(this.seed_count)) || 150);
      this.confirm_phrase_input = "";
      this.last_error = "";
      this.prep_snapshot = null;
      this.done_count = 0;
      this.total_to_create = 0;
      this.is_preparing = true;
      this.$nextTick(() => {
        this.prepareSnapshot();
      });
    },
    requestCloseModal() {
      if (this.is_running) return;
      this.modal_open = false;
      this.resetModalState();
    },
    resetModalState() {
      this.is_preparing = false;
      this.prep_snapshot = null;
      this.confirm_phrase_input = "";
      this.last_error = "";
    },
    async prepareSnapshot() {
      this.last_error = "";
      try {
        const all_gems = await this.$api.getFolders({ path: this.gems_path });
        if (!this.modal_open) return;
        const current_count = Array.isArray(all_gems) ? all_gems.length : 0;
        const seeds = this.selectSeedsFromInventory(all_gems);
        const target = Math.min(
          bulk_perf_max_target,
          Math.max(1, Math.floor(Number(this.local_target_total)) || 1)
        );
        const will_create = Math.max(0, target - current_count);

        if (seeds.length === 0) {
          this.last_error = this.$t("sg_bulk_perf_seed_no_seeds");
          this.prep_snapshot = null;
          return;
        }

        if (will_create === 0) {
          this.last_error = this.$t("sg_bulk_perf_seed_already_at_target");
        }

        this.prep_snapshot = {
          current_count,
          seeds,
          will_create,
          target_total: target,
        };
      } catch ({ code }) {
        this.last_error = code || this.$t("sg_bulk_perf_seed_error");
        this.prep_snapshot = null;
      } finally {
        this.is_preparing = false;
      }
    },
    requestCancel() {
      this.cancel_requested = true;
    },
    async startBulkCopy() {
      if (!this.prep_snapshot || this.prep_snapshot.will_create <= 0) return;
      if (!this.confirmMatches) return;

      const seeds = this.prep_snapshot.seeds;
      const will_create = this.prep_snapshot.will_create;

      this.is_running = true;
      this.cancel_requested = false;
      this.done_count = 0;
      this.total_to_create = will_create;
      this.last_error = "";

      try {
        for (let copy_index = 0; copy_index < will_create; copy_index += 1) {
          if (this.cancel_requested) break;

          const source = seeds[copy_index % seeds.length];
          const new_meta = {
            paired_gem: "",
          };

          try {
            await this.$api.copyFolder({
              path: source.$path,
              path_to_destination_type: this.gems_path,
              new_meta,
              is_copy_or_move: "copy",
            });
            this.done_count += 1;
          } catch ({ code }) {
            if (code === "not_allowed_to_copy_folder") {
              this.last_error = this.$t("sg_bulk_perf_seed_not_allowed");
            } else {
              this.last_error = code || this.$t("sg_bulk_perf_seed_error");
            }
            break;
          }
        }
      } finally {
        this.is_running = false;
        this.bustStoreAndNotify();
      }
    },
    bustStoreAndNotify() {
      if (Object.prototype.hasOwnProperty.call(this.$api.store, this.gems_path)) {
        this.$delete(this.$api.store, this.gems_path);
      }

      if (this.last_error) {
        this.$alertify.delay(8000).error(this.last_error);
      } else if (this.cancel_requested && this.done_count > 0) {
        this.$alertify
          .delay(5000)
          .log(this.$t("sg_bulk_perf_seed_stopped", { done: this.done_count }));
      } else if (this.cancel_requested) {
        this.$alertify.delay(3000).log(this.$t("sg_bulk_perf_seed_stopped", { done: 0 }));
      } else if (this.done_count > 0) {
        this.$alertify
          .delay(5000)
          .success(
            this.$t("sg_bulk_perf_seed_completed", { count: this.done_count })
          );
      }

      this.$emit("finished", { created: this.done_count });
      this.modal_open = false;
      this.resetModalState();
    },
  },
};
</script>

<style scoped>
._gemBulkPerfSeed {
  display: inline-flex;
  align-items: center;
}

._modalBody {
  max-width: 32rem;
}

._warning {
  margin: 0 0 1rem;
  font-size: 0.92rem;
  line-height: 1.45;
}

._fields {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

._field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

._label {
  font-size: 0.85rem;
  font-weight: 600;
}

._summary {
  margin: 0 0 0.75rem;
  font-size: 0.88rem;
  line-height: 1.5;
}

._error {
  margin: 0.5rem 0;
}

._progress {
  margin-top: 0.75rem;
  font-weight: 600;
}

._confirmHint {
  margin: 1rem 0 0.5rem;
  font-size: 0.88rem;
  line-height: 1.45;
}
</style>
