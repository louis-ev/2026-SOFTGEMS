<template>
  <div class="_statsPage">
    <div class="_pageHeader">
      <h1 class="_pageTitle">{{ $t("sg_stats_page_title") }}</h1>
    </div>

    <div class="_sections">
      <SGStatsChartSection
        v-for="section in chart_sections"
        :key="section.id"
        :section_id="section.id"
        :title="section.title"
        :placeholder_message="section.placeholder_message"
        @exportCsv="onExportCsv(section.id)"
      />
    </div>
  </div>
</template>

<script>
import SGStatsChartSection from "@/components/stats/SGStatsChartSection.vue";

export default {
  name: "SGStatsView",
  components: {
    SGStatsChartSection,
  },
  computed: {
    chart_sections() {
      return [
        {
          id: "stock-fiscal",
          title: this.$t("sg_stats_section_stock_fiscal"),
          placeholder_message: this.$t("sg_stats_stock_fiscal_coming_soon"),
        },
        {
          id: "stock-by-type",
          title: this.$t("sg_stats_section_stock_by_type"),
          placeholder_message: this.$t("sg_stats_placeholder_coming_soon"),
        },
        {
          id: "stock-value",
          title: this.$t("sg_stats_section_stock_value"),
          placeholder_message: this.$t("sg_stats_placeholder_coming_soon"),
        },
      ];
    },
  },
  methods: {
    onExportCsv(section_id) {
      void section_id;
      this.$alertify
        .delay(3500)
        .success(this.$t("sg_stats_export_csv_coming_soon"));
    },
  },
};
</script>

<style lang="scss" scoped>
._statsPage {
  height: 100%;
  min-height: 0;
  overflow-y: auto;
  padding: calc(var(--spacing) * 2) calc(var(--spacing) * 3);
  box-sizing: border-box;
}

._pageHeader {
  margin-bottom: calc(var(--spacing) * 1.5);
}

._pageTitle {
  margin: 0;
}

._sections {
  display: flex;
  flex-direction: column;
  gap: calc(var(--spacing) * 1.5);
  padding-bottom: calc(var(--spacing) * 2);
}
</style>
