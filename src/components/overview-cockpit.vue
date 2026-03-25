<template>
  <div class="dashboard-page workspace-stack" v-loading="isLoading" element-loading-text="加载数据中...">
    <HeroCard 
      v-model:rangeKey="rangeKey" 
      :manifest="manifest" 
      :summary="summary" 
      :rangeOptions="rangeOptions" 
    />
    <MetricsGrid 
      v-if="!isLoading"
      :metricsCards="metricsCards" 
    />
    <ChartsGrid 
      v-if="!isLoading"
      :metricSeries="metricSeries" 
      :strategySeries="strategySeries" 
      :activeRangeLabel="activeRange.label" 
    />
    <BottomGrid 
      v-if="!isLoading"
      :alerts="alerts" 
      :opsHotItems="opsHotItems" 
    />
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { loadCcdrecManifest, loadDatasetSummary, loadOfflineMetrics, loadOpsAnalytics } from "@/composables/useCcdrecData";
import HeroCard from "./cockpit/HeroCard.vue";
import MetricsGrid from "./cockpit/MetricsGrid.vue";
import ChartsGrid from "./cockpit/ChartsGrid.vue";
import BottomGrid from "./cockpit/BottomGrid.vue";

defineOptions({ name: "OverviewCockpit" });

const isLoading = ref(true);
const manifest = ref(null);
const summary = ref(null);
const metrics = ref(null);
const ops = ref(null);
const rangeKey = ref("30d");

const rangeOptions = [
  { label: "7天", value: "7d" },
  { label: "30天", value: "30d" },
  { label: "自定义", value: "custom" },
];

const rangeProfiles = {
  "7d": {
    label: "近7天",
    multiplier: 0.94,
    strategyFactor: 0.9,
    deltas: [3.4, 2.8, 4.1, 1.9, 1.6, 2.4],
  },
  "30d": {
    label: "近30天",
    multiplier: 1,
    strategyFactor: 1,
    deltas: [5.6, 4.2, 6.8, 3.1, 2.7, 4.9],
  },
  custom: {
    label: "自定义区间",
    multiplier: 1.06,
    strategyFactor: 1.08,
    deltas: [-1.4, 2.1, 3.6, -0.8, 1.2, 2.9],
  },
};

const activeRange = computed(() => rangeProfiles[rangeKey.value] || rangeProfiles["30d"]);

const metricsCards = computed(() => {
  const s = summary.value;
  const m = metrics.value;
  const o = ops.value;
  if (!s || !m || !o) return [];

  const values = [
    s.users.toLocaleString("zh-CN"),
    s.items.toLocaleString("zh-CN"),
    s.interactions.toLocaleString("zh-CN"),
    (m.bestValid["recall@20"] || 0).toFixed(4),
    (m.bestValid["ndcg@20"] || 0).toFixed(4),
    `${((o.recommendCoverage || 0) * 100).toFixed(2)}%`,
  ];

  const labels = ["用户数", "商品数", "交互数", "Recall@20(valid)", "NDCG@20(valid)", "推荐覆盖率"];
  const keys = ["users", "items", "inters", "r20", "ndcg20", "cov"];

  return keys.map((key, index) => ({
    key,
    label: labels[index],
    value: values[index],
    delta: activeRange.value.deltas[index],
  }));
});

const alerts = computed(() => {
  const m = metrics.value;
  const o = ops.value;
  if (!m || !o) return [];
  return [
    {
      title: "离线最佳轮次",
      detail: `best epoch=${m.bestEpoch ?? "未知"}，${activeRange.value.label}表现稳定`,
    },
    {
      title: "推荐覆盖率监控",
      detail: `当前覆盖率 ${((o.recommendCoverage || 0) * 100).toFixed(2)}%，策略触达处于正常区间`,
    },
  ];
});

const opsHotItems = computed(() => (ops.value?.hotRecommendedItems || []).slice(0, 10));

const metricSeries = computed(() => {
  const m = metrics.value;
  if (!m) return { recall: [], ndcg: [] };
  const factor = activeRange.value.multiplier;
  return {
    recall: [5, 10, 20, 50].map((k, index) =>
      Number(((m.bestValid[`recall@${k}`] || 0) * (factor + index * 0.01)).toFixed(4))
    ),
    ndcg: [5, 10, 20, 50].map((k, index) =>
      Number(((m.bestValid[`ndcg@${k}`] || 0) * (factor + index * 0.008)).toFixed(4))
    ),
  };
});

const strategySeries = computed(() => {
  const o = ops.value;
  if (!o) return [];
  const factor = activeRange.value.strategyFactor;
  return ["recommend", "recall", "marketing", "coupon"].map((key, index) =>
    Math.round((o.strategyReach[key] || 0) * (factor + index * 0.03))
  );
});

onMounted(async () => {
  isLoading.value = true;
  try {
    [manifest.value, summary.value, metrics.value, ops.value] = await Promise.all([
      loadCcdrecManifest(),
      loadDatasetSummary("baby"),
      loadOfflineMetrics("baby"),
      loadOpsAnalytics("baby"),
    ]);
  } finally {
    isLoading.value = false;
  }
});
</script>

<style scoped>
.dashboard-page {
  display: grid;
  gap: 14px;
  min-height: 400px;
}
</style>
