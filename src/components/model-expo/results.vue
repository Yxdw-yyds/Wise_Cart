<template>
  <div class="results-page expo-scroll">
    <section class="hero reveal-panel">
      <div>
        <div class="eyebrow">结果与案例</div>
        <h2>把真实 Top50、离线指标、配置快照和代码回放串成一块结果面板</h2>

      </div>
      <div class="hero-side">
        <div class="select-box">
          <span>查看用户案例</span>
          <el-select v-model="selectedUserId" placeholder="请选择用户 ID" filterable>
            <el-option v-for="userId in userOptions" :key="userId" :label="`用户 ${userId}`" :value="userId" />
          </el-select>
        </div>
        <div class="summary-strip">
          <div class="summary-chip"><span>最佳 Epoch</span><strong>{{ metrics?.bestEpoch ?? '-' }}</strong></div>
          <div class="summary-chip"><span>推荐覆盖率</span><strong>{{ coverageText }}</strong></div>
        </div>
      </div>
    </section>

    <section class="snapshot-grid">
      

      <article class="panel reveal-panel">
        <header class="section-head compact">
          <div>
            <h3>结果摘要</h3>
          </div>
        </header>
        <div class="facts-grid">
          <div class="fact-card" v-for="fact in resultFacts" :key="fact.label">
            <span>{{ fact.label }}</span>
            <strong>{{ fact.value }}</strong>
          </div>
        </div>
      </article>

      <article class="panel reveal-panel">
        <header class="section-head compact" style="margin-bottom: 4px;">
          <div>
            <h3>离线指标趋势</h3>
            <p style="margin: 8px 0 0; color: var(--text-tertiary); font-size: 14px;">用真实指标文件恢复的趋势曲线，展示排序质量随 epoch 的变化。</p>
          </div>
        </header>
        <div ref="trendRef" class="chart" style="height: 380px;"></div>
      </article>
    </section>

    <section class="chart-grid">
      <article class="panel reveal-panel">
        <header class="section-head compact">
          <div>
            <h3>关键指标对比</h3>
          </div>
        </header>
        <div ref="metricRef" class="chart"></div>
      </article>

      <article class="panel reveal-panel">
        <header class="section-head compact">
          <div>
            <h3>热门推荐商品</h3>
          </div>
        </header>
        <div ref="hotRef" class="chart"></div>
      </article>
    </section>

    

    <section class="case-board reveal-panel">
      <header class="section-head">
        <div>
          <h3>用户 {{ selectedUserId }} 的 Top50 案例</h3>
        </div>
      </header>
      <div class="case-grid">
        <article v-for="item in visibleRecommendations" :key="item.rank" class="case-card">
          <div class="case-rank">TOP {{ item.rank }}</div>
          <h4>商品 {{ item.itemId }}</h4>
          <div class="confidence">
            <span>推荐置信度</span>
            <strong>{{ item.confidence }}</strong>
          </div>
          <div class="tag-list">
            <span v-for="tag in item.reasonTags" :key="tag">{{ tag }}</span>
          </div>
        </article>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import * as echarts from "echarts";
import { loadDatasetSummary, loadOfflineMetrics, loadOpsAnalytics, loadUserTopK } from "@/composables/useCcdrecData";
import { buildConfidence, buildReasonTags, configSnapshot, inferenceSteps, metricTrendSeries } from "@/models/ccdrec/expo-data";

defineOptions({ name: "ModelExpoResults" });

const summary = ref(null);
const metrics = ref(null);
const ops = ref(null);
const topkUsers = ref({});
const selectedUserId = ref("");
const metricRef = ref(null);
const hotRef = ref(null);
const trendRef = ref(null);
let metricChart = null;
let hotChart = null;
let trendChart = null;

const userOptions = computed(() => Object.keys(topkUsers.value).slice(0, 120));

const visibleRecommendations = computed(() => {
  const list = topkUsers.value[selectedUserId.value] || [];
  return list.slice(0, 16).map((itemId, index) => ({
    rank: index + 1,
    itemId,
    reasonTags: buildReasonTags(selectedUserId.value, index),
    confidence: buildConfidence(index),
  }));
});

const coverageText = computed(() => {
  if (!ops.value) return "-";
  return `${Math.round((ops.value.recommendCoverage || 0) * 100)}%`;
});

const resultFacts = computed(() => {
  if (!summary.value || !metrics.value) return [];
  return [
    { label: "用户数", value: summary.value.users.toLocaleString("zh-CN") },
    { label: "商品数", value: summary.value.items.toLocaleString("zh-CN") },
    { label: "最佳验证 Recall@20", value: metrics.value.bestValid["recall@20"].toFixed(4) },
    { label: "最佳测试 NDCG@20", value: metrics.value.bestTest["ndcg@20"].toFixed(4) },
    { label: "Precision@20", value: metrics.value.bestTest["precision@20"].toFixed(4) },
    { label: "MAP@20", value: metrics.value.bestTest["map@20"].toFixed(4) },
  ];
});

const configFacts = computed(() => [
  { label: "embedding_size", value: configSnapshot.embeddingSize },
  { label: "feat_embed_dim", value: configSnapshot.featEmbedDim },
  { label: "timesteps", value: configSnapshot.timesteps },
  { label: "beta_sche", value: configSnapshot.betaSchedule },
  { label: "n_mm_layers", value: configSnapshot.nMmLayers },
  { label: "n_ui_layers", value: configSnapshot.nUiLayers },
  { label: "curriculum_start_epoch", value: configSnapshot.curriculumStartEpoch },
  { label: "curriculum_step", value: configSnapshot.curriculumStep },
  { label: "curriculum_end_epoch", value: configSnapshot.curriculumEndEpoch },
  { label: "sample_k", value: configSnapshot.sampleK },
]);

function renderMetricChart() {
  if (!metricChart || !metrics.value) return;
  metricChart.setOption({
    tooltip: { trigger: "axis" },
    legend: { top: 8, textStyle: { color: "#475569" } },
    grid: { left: 36, right: 18, top: 48, bottom: 28 },
    xAxis: {
      type: "category",
      data: ["Recall@20", "NDCG@20", "Precision@20", "MAP@20"],
      axisLabel: { color: "#64748b" },
      axisLine: { lineStyle: { color: "rgba(30,58,138,0.18)" } },
    },
    yAxis: {
      type: "value",
      axisLabel: { color: "#64748b" },
      splitLine: { lineStyle: { color: "rgba(30,58,138,0.08)" } },
    },
    series: [
      {
        name: "最佳验证集",
        type: "bar",
        data: [
          metrics.value.bestValid["recall@20"],
          metrics.value.bestValid["ndcg@20"],
          metrics.value.bestValid["precision@20"],
          metrics.value.bestValid["map@20"],
        ],
        itemStyle: { color: "#3b82f6", borderRadius: 10 },
      },
      {
        name: "最佳测试集",
        type: "bar",
        data: [
          metrics.value.bestTest["recall@20"],
          metrics.value.bestTest["ndcg@20"],
          metrics.value.bestTest["precision@20"],
          metrics.value.bestTest["map@20"],
        ],
        itemStyle: { color: "#f59e0b", borderRadius: 10 },
      },
    ],
  });
}

function renderHotChart() {
  if (!hotChart || !ops.value) return;
  const topItems = (ops.value.hotRecommendedItems || []).slice(0, 15);
  hotChart.setOption({
    tooltip: { trigger: "axis" },
    grid: { left: 50, right: 18, top: 20, bottom: 30 },
    xAxis: {
      type: "value",
      axisLabel: { color: "#64748b" },
      splitLine: { lineStyle: { color: "rgba(30,58,138,0.08)" } },
    },
    yAxis: {
      type: "category",
      data: topItems.map((item) => `商品 ${item.itemId}`),
      axisLabel: { color: "#64748b" },
      axisLine: { lineStyle: { color: "rgba(30,58,138,0.18)" } },
    },
    series: [
      {
        type: "bar",
        barWidth: 16,
        data: topItems.map((item) => ({
          value: item.count,
          itemStyle: { color: "#16a34a", borderRadius: 999 },
        })),
      },
    ],
  });
}

function renderTrendChart() {
  if (!trendChart) return;
  trendChart.setOption({
    backgroundColor: "transparent",
    color: ["#3b82f6", "#16a34a", "#f59e0b", "#e11d48"],
    tooltip: { trigger: "axis" },
    legend: { top: 8, textStyle: { color: "#475569" } },
    grid: { left: 40, right: 20, top: 40, bottom: 20 },
    xAxis: {
      type: "category",
      data: metricTrendSeries.epochs,
      axisLine: { lineStyle: { color: "rgba(30,58,138,0.18)" } },
      axisLabel: { color: "#64748b" },
    },
    yAxis: {
      type: "value",
      axisLabel: { color: "#64748b" },
      splitLine: { lineStyle: { color: "rgba(30,58,138,0.08)" } },
    },
    series: [
      { name: "Recall@20", type: "line", smooth: true, symbolSize: 7, data: metricTrendSeries.recall20 },
      { name: "NDCG@20", type: "line", smooth: true, symbolSize: 7, data: metricTrendSeries.ndcg20 },
      { name: "Precision@20", type: "line", smooth: true, symbolSize: 7, data: metricTrendSeries.precision20 },
      { name: "MAP@20", type: "line", smooth: true, symbolSize: 7, data: metricTrendSeries.map20 },
    ],
  });
}

function resize() {
  metricChart?.resize();
  hotChart?.resize();
  trendChart?.resize();
}

onMounted(async () => {
  const [summaryData, metricsData, opsData, topkData] = await Promise.all([
    loadDatasetSummary("baby"),
    loadOfflineMetrics("baby"),
    loadOpsAnalytics("baby"),
    loadUserTopK("baby"),
  ]);

  summary.value = summaryData;
  metrics.value = metricsData;
  ops.value = opsData;
  topkUsers.value = topkData;
  selectedUserId.value = Object.keys(topkData)[0] || "";

  await nextTick();
  metricChart = metricRef.value ? echarts.init(metricRef.value) : null;
  hotChart = hotRef.value ? echarts.init(hotRef.value) : null;
  trendChart = trendRef.value ? echarts.init(trendRef.value) : null;
  renderMetricChart();
  renderHotChart();
  renderTrendChart();
  window.addEventListener("resize", resize);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", resize);
  metricChart?.dispose();
  hotChart?.dispose();
  trendChart?.dispose();
});
</script>

<style scoped>
.expo-scroll {
  height: calc(100vh - 120px);
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 6px;
  scrollbar-gutter: stable;
}

.results-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-width: 1600px;
  margin: 0 auto;
  align-items: center;
  width: 100%;
  color: var(--text-primary);
}
.hero, .case-board, .path-board, .main-grid, .snapshot-grid, .chart-grid {
  width: 100%;
  box-sizing: border-box;
}

.hero,
.panel,
.case-board,
.path-board {
  border: 1px solid var(--border-soft);
  background: var(--bg-elevated);
  box-shadow: var(--shadow-soft);
}

.reveal-panel {
  animation: reveal-in 0.65s ease both;
}

.hero,
.panel,
.case-board,
.path-board {
  border-radius: 26px;
  padding: 24px;
  width: 100%;
  box-sizing: border-box;
}

.hero {
  display: grid;
  grid-template-columns: minmax(0, 1.3fr) minmax(320px, 0.85fr);
  gap: 24px;
}

.eyebrow {
  font-size: 14px;
  letter-spacing: 0.22em;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--accent-success);
}

.hero h2 {
  margin: 10px 0 12px;
  font-size: 42px;
  line-height: 1.08;
  color: var(--text-primary);
}

.hero p,
.section-head p {
  margin: 0;
  line-height: 1.8;
  color: var(--text-secondary);
}

.hero-side {
  display: grid;
  gap: 20px;
}

.select-box {
  display: grid;
  gap: 8px;
}

.select-box span {
  color: var(--text-primary);
}

.summary-strip {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px;
}

.summary-chip,
.fact-card,
.path-card {
  padding: 22px;
  border-radius: 20px;
  background: var(--bg-muted);
  border: 1px solid var(--border-soft);
}





.snapshot-grid,
.chart-grid,
.path-grid {
  display: grid !important;
  grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
  gap: 24px;
}

.path-grid {
  margin-top: 16px;
}

.path-card p,
.path-card em {
  display: block;
  margin-top: 8px;
  color: var(--text-secondary);
}

.path-card em {
  color: var(--accent-secondary);
  font-style: normal;
}

.section-head {
  display: flex;
  justify-content: space-between;
  gap: 20px;
}

.section-head h3 {
  margin: 0;
  color: var(--text-primary);
  font-size: 28px;
}

.section-head.compact h3 {
  font-size: 20px;
}

.chart {
  height: 420px;
  margin-top: 10px;
  width: 100%;
}

.case-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 20px;
  margin-top: 18px;
}

.case-card {
  padding: 24px;
  border-radius: 22px;
  background: var(--bg-muted);
  border: 1px solid var(--border-soft);
}

.case-rank {
  display: inline-flex;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(19, 194, 194, 0.14);
  color: var(--accent-primary);
}

.case-card h4 {
  margin: 14px 0 12px;
  color: var(--text-primary);
  font-size: 26px;
}

.confidence {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: center;
}

.confidence span {
  color: var(--text-tertiary);
  font-size: 13px;
}

.confidence strong {
  color: #b45309;
  font-size: 26px;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 14px;
}

.tag-list span {
  padding: 7px 12px;
  border-radius: 999px;
  background: rgba(59, 130, 246, 0.08);
  border: 1px solid rgba(59, 130, 246, 0.16);
  color: var(--text-secondary);
}

.facts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 24px;
  margin-top: 16px;
}

.facts-grid--config {
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
}

@keyframes reveal-in {
  from {
    opacity: 0;
    transform: translateY(14px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 1280px) {
  .case-grid,
  .facts-grid--config {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 980px) {
  .hero,
  .snapshot-grid,
  .chart-grid,
  .path-grid {
    grid-template-columns: 1fr;
  }

  .hero h2 {
    font-size: 32px;
  }

  .case-grid,
  .facts-grid,
  .facts-grid--config {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .case-grid,
  .facts-grid,
  .facts-grid--config,
  .summary-strip {
    grid-template-columns: 1fr;
  }
}

.summary-chip span,
.fact-card span,
.path-card span {
  display: block;
  color: var(--text-tertiary);
  font-size: 12.5px;
  line-height: 1.4;
  word-break: break-word;
}

.summary-chip strong,
.fact-card strong,
.path-card strong {
  display: block;
  margin-top: 6px;
  color: var(--text-primary);
  font-size: 24px;
  word-break: break-all;
}

</style>

