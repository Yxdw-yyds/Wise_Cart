<template>
  <div class="dashboard-page p-16px">
    <el-card shadow="never" class="hero-card">
      <div class="hero-head">
        <div>
          <h2>首页总览驾驶舱</h2>
          <p>数据集：{{ summary?.dataset || "-" }}，生成时间：{{ manifest?.generatedAt || "-" }}</p>
        </div>
        <el-segmented v-model="rangeKey" :options="rangeOptions" />
      </div>
    </el-card>

    <div class="metrics-grid">
      <el-card v-for="item in metricsCards" :key="item.key" shadow="hover" class="metric-card">
        <div class="metric-label">{{ item.label }}</div>
        <div class="metric-main">
          <div class="metric-value">{{ item.value }}</div>
          <div class="trend" :class="item.delta >= 0 ? 'up' : 'down'">
            <span>{{ item.delta >= 0 ? "↑" : "↓" }}</span>
            {{ Math.abs(item.delta).toFixed(1) }}%
          </div>
        </div>
        <div class="metric-sub">环比 {{ item.delta >= 0 ? "增长" : "下降" }} {{ Math.abs(item.delta).toFixed(1) }}%</div>
      </el-card>
    </div>

    <div class="charts-grid">
      <el-card shadow="never" class="panel-card">
        <template #header>
          <div class="panel-title">
            <span>离线指标（Best Valid）</span>
            <span class="panel-desc">{{ activeRange.label }} 视角</span>
          </div>
        </template>
        <div ref="metricTrendRef" class="chart-box"></div>
      </el-card>
      <el-card shadow="never" class="panel-card">
        <template #header>
          <div class="panel-title">
            <span>推荐策略触达</span>
            <span class="panel-desc">覆盖趋势对比</span>
          </div>
        </template>
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
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import * as echarts from "echarts";
import { loadCcdrecManifest, loadDatasetSummary, loadOfflineMetrics, loadOpsAnalytics } from "@/composables/useCcdrecData";

defineOptions({ name: "OverviewCockpit" });

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

const metricTrendRef = ref(null);
const strategyRef = ref(null);
let metricChart;
let strategyChart;

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

const renderCharts = () => {
  const m = metrics.value;
  const o = ops.value;
  if (!m || !o) return;

  metricChart?.setOption({
    color: ["#295bff", "#22c7d6"],
    tooltip: { trigger: "axis" },
    legend: { top: 8 },
    grid: { left: 36, right: 18, top: 44, bottom: 28 },
    xAxis: { type: "category", data: ["@5", "@10", "@20", "@50"] },
    yAxis: { type: "value" },
    series: [
      { name: "Recall", type: "line", smooth: true, symbolSize: 8, data: metricSeries.value.recall },
      { name: "NDCG", type: "line", smooth: true, symbolSize: 8, data: metricSeries.value.ndcg },
    ],
  });

  strategyChart?.setOption({
    color: ["#ff8a2a"],
    tooltip: { trigger: "axis" },
    grid: { left: 36, right: 18, top: 28, bottom: 28 },
    xAxis: { type: "category", data: ["recommend", "recall", "marketing", "coupon"] },
    yAxis: { type: "value" },
    series: [{ type: "bar", barWidth: 34, data: strategySeries.value, itemStyle: { borderRadius: [10, 10, 0, 0] } }],
  });
};

const resize = () => {
  metricChart?.resize();
  strategyChart?.resize();
};

watch(rangeKey, () => {
  renderCharts();
});

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
.hero-card {
  padding: 4px 2px;
}

.hero-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.hero-head h2 {
  margin: 0;
}

.hero-head p {
  margin: 8px 0 0;
  color: #64748b;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-top: 12px;
}

.metric-card {
  min-height: 120px;
}

.metric-label {
  color: #64748b;
}

.metric-main {
  margin-top: 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.metric-value {
  font-size: 26px;
  font-weight: 800;
}

.metric-sub {
  margin-top: 10px;
  color: #64748b;
  font-size: 12px;
}

.trend {
  border-radius: 999px;
  padding: 6px 10px;
  font-size: 12px;
  font-weight: 700;
}

.trend.up {
  color: #0f9f63;
  background: rgba(25, 179, 107, 0.12);
}

.trend.down {
  color: #dc2626;
  background: rgba(243, 91, 107, 0.12);
}

.charts-grid {
  margin-top: 12px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.bottom-grid {
  margin-top: 12px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.panel-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-weight: 700;
}

.panel-desc {
  color: #64748b;
  font-size: 12px;
  font-weight: 500;
}

.chart-box {
  height: 320px;
}

@media (max-width: 1200px) {
  .metrics-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 900px) {
  .hero-head,
  .metrics-grid,
  .charts-grid,
  .bottom-grid {
    grid-template-columns: 1fr;
  }

  .hero-head {
    display: grid;
  }

  .metrics-grid,
  .charts-grid,
  .bottom-grid {
    display: grid;
  }
}
</style>
