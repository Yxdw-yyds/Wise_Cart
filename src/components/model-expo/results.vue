<template>
  <div class="results-page expo-scroll">
    <section class="hero reveal-panel">
      <div>
        <div class="eyebrow">结果与案例</div>
        <h2>真实 Top50+离线指标+配置快照</h2>

      </div>
      <div class="hero-side">
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
            <h3>配置快照</h3>
          </div>
        </header>
        <div class="facts-grid facts-grid--config">
          <div class="fact-card" v-for="fact in configFacts" :key="fact.label">
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
        <div ref="trendRef" class="chart chart--trend"></div>
      </article>
    </section>

    <section class="chart-grid">
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
          <h3>用户 0 的 Top50 案例</h3>
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
        </article>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import * as echarts from "echarts";
import { loadDatasetSummary, loadOfflineMetrics, loadOpsAnalytics, loadUserTopK } from "@/composables/useCcdrecData";
import { buildConfidence, configSnapshot, metricTrendSeries } from "@/models/ccdrec/expo-data";

defineOptions({ name: "ModelExpoResults" });

const summary = ref(null);
const metrics = ref(null);
const ops = ref(null);
const topkUsers = ref({});
const hotRef = ref(null);
const trendRef = ref(null);
let hotChart = null;
let trendChart = null;

const visibleRecommendations = computed(() => {
  const list = topkUsers.value["0"] || [];
  return list.slice(0, 50).map((itemId, index) => ({
    rank: index + 1,
    itemId,
    confidence: buildConfidence(index),
  }));
});

const coverageText = computed(() => {
  if (!ops.value) return "-";
  return `${Math.round((ops.value.recommendCoverage || 0) * 100)}%`;
});

const configFacts = computed(() => [
  { label: "嵌入维度", value: configSnapshot.embeddingSize },
  { label: "特征嵌入维度", value: configSnapshot.featEmbedDim },
  { label: "扩散步数", value: configSnapshot.timesteps },
  { label: "噪声调度", value: configSnapshot.betaSchedule },
  { label: "多模态图层数", value: configSnapshot.nMmLayers },
  { label: "交互图层数", value: configSnapshot.nUiLayers },
  { label: "课程起始 Epoch", value: configSnapshot.curriculumStartEpoch },
  { label: "课程步长", value: configSnapshot.curriculumStep },
  { label: "课程结束 Epoch", value: configSnapshot.curriculumEndEpoch },
  { label: "采样系数", value: configSnapshot.sampleK },
]);

function renderHotChart() {
  if (!hotChart || !ops.value) return;
  const topItems = (ops.value.hotRecommendedItems || []).slice(0, 15);
  hotChart.setOption({
    tooltip: { trigger: "axis" },
    grid: { left: 76, right: 18, top: 20, bottom: 30 },
    xAxis: {
      type: "value",
      axisLabel: { color: "#64748b" },
      splitLine: { lineStyle: { color: "rgba(30,58,138,0.08)" } },
    },
    yAxis: {
      type: "category",
      data: topItems.map((item) => `商品 ${item.itemId}`),
      axisLabel: { color: "#64748b", margin: 10 },
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

  await nextTick();
  hotChart = hotRef.value ? echarts.init(hotRef.value) : null;
  trendChart = trendRef.value ? echarts.init(trendRef.value) : null;
  renderHotChart();
  renderTrendChart();
  window.addEventListener("resize", resize);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", resize);
  hotChart?.dispose();
  trendChart?.dispose();
});
</script>

<style scoped>
.expo-scroll {
  height: calc(100vh - 156px);
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 6px;
  padding-bottom: 128px;
  box-sizing: border-box;
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
  grid-template-columns: minmax(0, 1.4fr) minmax(280px, 0.7fr);
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
  gap: 24px;
}

.snapshot-grid {
  grid-template-columns: minmax(0, 1.15fr) minmax(0, 1.85fr) !important;
}

.chart-grid {
  grid-template-columns: 1fr !important;
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

.chart--trend {
  height: 320px;
}

.case-grid {
  display: grid;
  grid-template-columns: repeat(10, minmax(0, 1fr));
  gap: 10px;
  margin-top: 18px;
}

.case-card {
  padding: 12px;
  border-radius: 14px;
  background: var(--bg-muted);
  border: 1px solid var(--border-soft);
  min-width: 0;
}

.case-rank {
  display: inline-flex;
  padding: 4px 8px;
  border-radius: 999px;
  background: rgba(19, 194, 194, 0.14);
  color: var(--accent-primary);
  font-size: 11px;
}

.case-card h4 {
  margin: 8px 0 8px;
  color: var(--text-primary);
  font-size: 14px;
  line-height: 1.2;
  word-break: break-word;
}

.confidence {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: center;
}

.confidence span {
  color: var(--text-tertiary);
  font-size: 11px;
}

.confidence strong {
  color: #b45309;
  font-size: 16px;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 10px;
}

.tag-list span {
  padding: 4px 7px;
  border-radius: 999px;
  background: rgba(59, 130, 246, 0.08);
  border: 1px solid rgba(59, 130, 246, 0.16);
  color: var(--text-secondary);
  font-size: 10px;
  line-height: 1.2;
}

.facts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 24px;
  margin-top: 16px;
}

.facts-grid--config {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.facts-grid--config .fact-card {
  padding: 16px 18px;
  border-radius: 16px;
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
    grid-template-columns: repeat(6, minmax(0, 1fr));
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
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .case-grid,
  .facts-grid,
  .facts-grid--config,
  .summary-strip {
    grid-template-columns: repeat(2, minmax(0, 1fr));
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

.facts-grid--config .fact-card span {
  font-size: 12px;
}

.facts-grid--config .fact-card strong {
  font-size: 18px;
  margin-top: 4px;
  word-break: break-word;
}

</style>

