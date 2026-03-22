<template>
  <div class="dashboard-page p-16px">
    <el-card shadow="never">
      <h2>首页总览驾驶舱（CCDRec真实数据）</h2>
      <p>数据集：{{ summary?.dataset || '-' }}，生成时间：{{ manifest?.generatedAt || '-' }}</p>
    </el-card>

    <div class="metrics-grid">
      <el-card v-for="item in metricsCards" :key="item.key" shadow="hover" class="metric-card">
        <div class="metric-label">{{ item.label }}</div>
        <div class="metric-value">{{ item.value }}</div>
      </el-card>
    </div>

    <div class="charts-grid">
      <el-card shadow="never" class="panel-card">
        <template #header><div class="panel-title">离线指标（Best Valid）</div></template>
        <div ref="metricTrendRef" class="chart-box"></div>
      </el-card>
      <el-card shadow="never" class="panel-card">
        <template #header><div class="panel-title">推荐策略触达</div></template>
        <div ref="strategyRef" class="chart-box"></div>
      </el-card>
    </div>

    <div class="bottom-grid">
      <el-card shadow="never" class="panel-card">
        <template #header><div class="panel-title">训练与效果告警</div></template>
        <el-table :data="alerts" border>
          <el-table-column prop="title" label="告警" />
          <el-table-column prop="detail" label="详情" />
        </el-table>
      </el-card>
      <el-card shadow="never" class="panel-card">
        <template #header><div class="panel-title">热门推荐商品（Top10聚合）</div></template>
        <el-table :data="opsHotItems" border>
          <el-table-column prop="itemId" label="itemId" />
          <el-table-column prop="count" label="推荐次数" />
        </el-table>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import * as echarts from "echarts";
import { loadCcdrecManifest, loadDatasetSummary, loadOfflineMetrics, loadOpsAnalytics } from "@/composables/useCcdrecData";

defineOptions({ name: "OverviewCockpit" });

const manifest = ref(null);
const summary = ref(null);
const metrics = ref(null);
const ops = ref(null);

const metricTrendRef = ref(null);
const strategyRef = ref(null);
let metricChart;
let strategyChart;

const metricsCards = computed(() => {
  const s = summary.value;
  const m = metrics.value;
  const o = ops.value;
  if (!s || !m || !o) return [];
  return [
    { key: "users", label: "用户数", value: s.users.toLocaleString("zh-CN") },
    { key: "items", label: "商品数", value: s.items.toLocaleString("zh-CN") },
    { key: "inters", label: "交互数", value: s.interactions.toLocaleString("zh-CN") },
    { key: "r20", label: "Recall@20(valid)", value: (m.bestValid["recall@20"] || 0).toFixed(4) },
    { key: "ndcg20", label: "NDCG@20(valid)", value: (m.bestValid["ndcg@20"] || 0).toFixed(4) },
    { key: "cov", label: "推荐覆盖率", value: `${((o.recommendCoverage || 0) * 100).toFixed(2)}%` },
  ];
});

const alerts = computed(() => {
  const m = metrics.value;
  const o = ops.value;
  if (!m || !o) return [];
  return [
    {
      title: "离线最佳轮次",
      detail: `best epoch=${m.bestEpoch ?? "未知"}`,
    },
    {
      title: "推荐覆盖率监控",
      detail: `当前覆盖率 ${(o.recommendCoverage * 100).toFixed(2)}%`,
    },
  ];
});

const opsHotItems = computed(() => (ops.value?.hotRecommendedItems || []).slice(0, 10));

const renderCharts = () => {
  const m = metrics.value;
  const o = ops.value;
  if (!m || !o) return;

  metricChart?.setOption({
    tooltip: { trigger: "axis" },
    xAxis: { type: "category", data: ["@5", "@10", "@20", "@50"] },
    yAxis: { type: "value" },
    series: [
      { name: "Recall", type: "line", data: [m.bestValid["recall@5"], m.bestValid["recall@10"], m.bestValid["recall@20"], m.bestValid["recall@50"]] },
      { name: "NDCG", type: "line", data: [m.bestValid["ndcg@5"], m.bestValid["ndcg@10"], m.bestValid["ndcg@20"], m.bestValid["ndcg@50"]] },
    ],
  });

  strategyChart?.setOption({
    tooltip: { trigger: "axis" },
    xAxis: { type: "category", data: ["recommend", "recall", "marketing", "coupon"] },
    yAxis: { type: "value" },
    series: [{ type: "bar", data: [o.strategyReach.recommend, o.strategyReach.recall, o.strategyReach.marketing, o.strategyReach.coupon] }],
  });
};

const resize = () => {
  metricChart?.resize();
  strategyChart?.resize();
};

onMounted(async () => {
  [manifest.value, summary.value, metrics.value, ops.value] = await Promise.all([
    loadCcdrecManifest(),
    loadDatasetSummary("baby"),
    loadOfflineMetrics("baby"),
    loadOpsAnalytics("baby"),
  ]);
  await nextTick();
  metricChart = metricTrendRef.value ? echarts.init(metricTrendRef.value) : null;
  strategyChart = strategyRef.value ? echarts.init(strategyRef.value) : null;
  renderCharts();
  window.addEventListener("resize", resize);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", resize);
  metricChart?.dispose();
  strategyChart?.dispose();
});
</script>

<style scoped>
.metrics-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; margin-top: 12px; }
.metric-card { min-height: 96px; }
.metric-label { color: #64748b; }
.metric-value { margin-top: 8px; font-size: 24px; font-weight: 700; }
.charts-grid { margin-top: 12px; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
.bottom-grid { margin-top: 12px; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
.chart-box { height: 320px; }
@media (max-width: 900px) { .metrics-grid,.charts-grid,.bottom-grid { grid-template-columns: 1fr; } }
</style>
