<template>
  <div class="rmc-page workspace-stack">
    <el-card shadow="never" class="hero-card">
      <div class="header-row">
        <div>
          <h2>推荐与模型分析（CCDRec）</h2>
          <p>全部来自离线训练产物：log + 指标 + TopK。</p>
        </div>
        <el-tag type="success">dataset: baby</el-tag>
      </div>
    </el-card>

    <div class="value-strip">
      <el-card shadow="never"><div>best epoch</div><strong>{{ metrics?.bestEpoch ?? '-' }}</strong></el-card>
      <el-card shadow="never"><div>Recall@20(valid)</div><strong>{{ val('bestValid','recall@20') }}</strong></el-card>
      <el-card shadow="never"><div>NDCG@20(test)</div><strong>{{ val('bestTest','ndcg@20') }}</strong></el-card>
    </div>

    <el-card shadow="never" class="tabs-card mt12">
      <el-tabs v-model="activeTab">
        <el-tab-pane label="模型资产" name="model">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="模型">{{ manifest?.model }}</el-descriptions-item>
            <el-descriptions-item label="数据集">{{ manifest?.dataset }}</el-descriptions-item>
            <el-descriptions-item label="产出时间">{{ manifest?.generatedAt }}</el-descriptions-item>
            <el-descriptions-item label="权重打包进前端">{{ manifest?.weights?.includedInFrontend ? '是':'否' }}</el-descriptions-item>
          </el-descriptions>
        </el-tab-pane>

        <el-tab-pane label="离线指标" name="metrics">
          <div ref="metricsRef" class="chart"></div>
          <el-table :data="metricRows" border class="mt12">
            <el-table-column prop="metric" label="指标" />
            <el-table-column prop="valid" label="best valid" />
            <el-table-column prop="test" label="best test" />
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="个性化推荐" name="topk">
          <div class="toolbar">
            <el-input v-model="userId" placeholder="输入用户ID（如 0）" style="width: 240px" />
            <el-button type="primary" @click="loadUserRecs">查询Top50</el-button>
          </div>
          <el-table :data="userRecRows" border>
            <el-table-column prop="rank" label="rank" width="80" />
            <el-table-column prop="itemId" label="itemId" />
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="A/B（离线替代）" name="ab">
          <el-alert type="info" :closable="false" title="当前无在线A/B日志，使用离线 best valid vs best test 对比展示。" />
          <div ref="abRef" class="chart mt12"></div>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import * as echarts from "echarts";
import { loadCcdrecManifest, loadOfflineMetrics, loadUserTopK } from "@/composables/useCcdrecData";

defineOptions({ name: "RecommendationModelCenter" });

const activeTab = ref("model");
const manifest = ref(null);
const metrics = ref(null);
const userId = ref("0");
const userRecs = ref([]);

const metricsRef = ref(null);
const abRef = ref(null);
let metricsChart;
let abChart;

const val = (group, key) => {
  const m = metrics.value?.[group]?.[key];
  return typeof m === "number" ? m.toFixed(4) : "-";
};

const metricRows = computed(() => {
  const keys = ["recall@5", "recall@10", "recall@20", "recall@50", "ndcg@5", "ndcg@10", "ndcg@20", "ndcg@50", "precision@20", "map@20"];
  return keys.map((k) => ({
    metric: k,
    valid: val("bestValid", k),
    test: val("bestTest", k),
  }));
});

const userRecRows = computed(() => userRecs.value.map((itemId, idx) => ({ rank: idx + 1, itemId })));

const renderMetricsChart = () => {
  if (!metrics.value) return;
  metricsChart?.setOption({
    tooltip: { trigger: "axis" },
    legend: { data: ["valid", "test"] },
    xAxis: { type: "category", data: ["@5", "@10", "@20", "@50"] },
    yAxis: { type: "value" },
    series: [
      { name: "valid", type: "line", data: [metrics.value.bestValid["recall@5"], metrics.value.bestValid["recall@10"], metrics.value.bestValid["recall@20"], metrics.value.bestValid["recall@50"]] },
      { name: "test", type: "line", data: [metrics.value.bestTest["recall@5"], metrics.value.bestTest["recall@10"], metrics.value.bestTest["recall@20"], metrics.value.bestTest["recall@50"]] },
    ],
  });
};

const renderAbChart = () => {
  if (!metrics.value) return;
  abChart?.setOption({
    tooltip: { trigger: "axis" },
    legend: { data: ["best valid", "best test"] },
    xAxis: { type: "category", data: ["Recall@20", "NDCG@20", "Precision@20", "MAP@20"] },
    yAxis: { type: "value" },
    series: [
      { name: "best valid", type: "bar", data: [metrics.value.bestValid["recall@20"], metrics.value.bestValid["ndcg@20"], metrics.value.bestValid["precision@20"], metrics.value.bestValid["map@20"]] },
      { name: "best test", type: "bar", data: [metrics.value.bestTest["recall@20"], metrics.value.bestTest["ndcg@20"], metrics.value.bestTest["precision@20"], metrics.value.bestTest["map@20"]] },
    ],
  });
};

const loadUserRecs = async () => {
  userRecs.value = await loadUserTopK("baby", userId.value);
};

const initCharts = async () => {
  await nextTick();
  metricsChart ??= metricsRef.value ? echarts.init(metricsRef.value) : null;
  abChart ??= abRef.value ? echarts.init(abRef.value) : null;
  renderMetricsChart();
  renderAbChart();
};

const resize = () => {
  metricsChart?.resize();
  abChart?.resize();
};

onMounted(async () => {
  [manifest.value, metrics.value] = await Promise.all([loadCcdrecManifest(), loadOfflineMetrics("baby")]);
  await loadUserRecs();
  await initCharts();
  window.addEventListener("resize", resize);
});

watch(activeTab, async (v) => {
  if (v === "metrics" || v === "ab") await initCharts();
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", resize);
  metricsChart?.dispose();
  abChart?.dispose();
});
</script>

<style scoped>
.rmc-page {
  display: grid;
  gap: 14px;
}

.hero-card {
  border-radius: 18px;
  background: linear-gradient(128deg, rgba(59, 130, 246, 0.12), rgba(255, 255, 255, 0.95) 46%, rgba(245, 158, 11, 0.12));
}

.header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}

.header-row h2 {
  margin: 0;
  font-size: 28px;
  font-weight: 800;
  color: var(--text-primary);
}

.header-row p {
  margin: 8px 0 0;
  color: var(--text-tertiary);
}

.value-strip {
  margin-top: 0;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.value-strip :deep(.el-card) {
  border-radius: 16px;
}

.tabs-card {
  border-radius: 16px;
}

.mt12 {
  margin-top: 0;
}

.chart {
  height: 320px;
}

.toolbar {
  margin-bottom: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

@media (max-width: 900px) {
  .value-strip {
    grid-template-columns: 1fr;
  }

  .header-row {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
