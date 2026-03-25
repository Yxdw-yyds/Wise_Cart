<template>
  <div class="charts-grid slide-in-bottom">
    <el-card shadow="never" class="panel-card">
      <template #header>
        <div class="panel-title">
          <span>离线指标（Best Valid）</span>
          <span class="panel-desc">{{ activeRangeLabel }} 视角</span>
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
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from "vue";
import echarts from "@/utils/echarts";

const props = defineProps({
  metricSeries: { type: Object, default: () => ({ recall: [], ndcg: [] }) },
  strategySeries: { type: Array, default: () => [] },
  activeRangeLabel: { type: String, default: "" }
});

const metricTrendRef = ref(null);
const strategyRef = ref(null);
let metricChart;
let strategyChart;

const renderCharts = () => {
  if (metricChart) {
    metricChart.setOption({
      color: ["#295bff", "#22c7d6"],
      tooltip: { trigger: "axis" },
      legend: { top: 8 },
      grid: { left: 36, right: 18, top: 44, bottom: 28 },
      xAxis: { type: "category", data: ["@5", "@10", "@20", "@50"] },
      yAxis: { type: "value" },
      series: [
        { name: "Recall", type: "line", smooth: true, symbolSize: 8, data: props.metricSeries.recall },
        { name: "NDCG", type: "line", smooth: true, symbolSize: 8, data: props.metricSeries.ndcg },
      ],
    });
  }

  if (strategyChart) {
    strategyChart.setOption({
      color: ["#ff8a2a"],
      tooltip: { trigger: "axis" },
      grid: { left: 36, right: 18, top: 28, bottom: 28 },
      xAxis: { type: "category", data: ["recommend", "recall", "marketing", "coupon"] },
      yAxis: { type: "value" },
      series: [{ type: "bar", barWidth: 34, data: props.strategySeries, itemStyle: { borderRadius: [10, 10, 0, 0] } }],
    });
  }
};

const resize = () => {
  metricChart?.resize();
  strategyChart?.resize();
};

watch(() => [props.metricSeries, props.strategySeries], () => {
  renderCharts();
}, { deep: true });

onMounted(async () => {
  await nextTick();
  if (metricTrendRef.value) metricChart = echarts.init(metricTrendRef.value);
  if (strategyRef.value) strategyChart = echarts.init(strategyRef.value);
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
.charts-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  animation: slideInBottom 0.6s ease-out forwards;
}

.panel-card {
  border-radius: 16px;
  transition: box-shadow 0.3s ease;
}

.panel-card:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.05) !important;
}

.panel-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-weight: 800;
  color: var(--text-primary);
}

.panel-desc {
  color: var(--text-tertiary);
  font-size: 12px;
  font-weight: 500;
}

.chart-box {
  height: 320px;
}

@keyframes slideInBottom {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 900px) {
  .charts-grid {
    grid-template-columns: 1fr;
  }
}
</style>
