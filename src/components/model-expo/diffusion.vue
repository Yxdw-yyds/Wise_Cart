<template>
  <div class="diffusion-page expo-scroll">
    <section class="hero reveal-panel">
      <div>
        <div class="eyebrow">条件扩散重建</div>
        <h2>扩散对象是 item_id_embedding，文本、图像和 timestep 只作为条件输入参与重建</h2>
      </div>

    </section>

    

    <section class="chart-panel reveal-panel">
      <header class="section-head compact" style="justify-content: center; margin-bottom: 8px;">
        <h3 style="text-align: center;">条件信号随 timestep 的重建轨迹</h3>
      </header>
      <div ref="fusionRef" class="chart"></div>
    </section>

    <section class="formula-grid">
      
      
      
    </section>

    <section class="logic-grid">
      
      
    </section>

    
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import * as echarts from "echarts";
import { codeHighlights, diffusionRail, diffusionSignalSeries } from "@/models/ccdrec/expo-data";

defineOptions({ name: "ModelExpoDiffusion" });

const fusionRef = ref(null);
let fusionChart = null;

const visibleHighlights = computed(() =>
  codeHighlights.filter((item) => ["扩散主对象", "条件输入融合"].includes(item.title)),
);

function renderFusionChart() {
  if (!fusionChart) return;
  fusionChart.setOption({
    color: ["#3b82f6", "#60a5fa", "#16a34a", "#f59e0b"],
    tooltip: { trigger: "axis" },
    legend: { top: 8, textStyle: { color: "#475569" } },
    grid: { left: 36, right: 18, top: 48, bottom: 24 },
    xAxis: {
      type: "category",
      data: diffusionSignalSeries.steps,
      axisLabel: { color: "#64748b" },
      axisLine: { lineStyle: { color: "rgba(30,58,138,0.18)" } },
    },
    yAxis: {
      type: "value",
      axisLabel: { color: "#64748b" },
      splitLine: { lineStyle: { color: "rgba(30,58,138,0.08)" } },
    },
    series: [
      { name: "x_noisy", type: "line", smooth: true, areaStyle: {}, data: diffusionSignalSeries.xNoisy },
      { name: "文本条件", type: "line", smooth: true, areaStyle: {}, data: diffusionSignalSeries.textSignal },
      { name: "图像条件", type: "line", smooth: true, areaStyle: {}, data: diffusionSignalSeries.imageSignal },
      { name: "predicted_x", type: "line", smooth: true, areaStyle: {}, data: diffusionSignalSeries.reconstructed },
    ],
  });
}

function resize() {
  fusionChart?.resize();
}

onMounted(async () => {
  await nextTick();
  fusionChart = fusionRef.value ? echarts.init(fusionRef.value) : null;
  renderFusionChart();
  window.addEventListener("resize", resize);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", resize);
  fusionChart?.dispose();
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

.diffusion-page {
  display: flex;
  flex-direction: column;
  gap: 18px;
  max-width: 1600px;
  margin: 0 auto;
  align-items: center;
  width: 100%;
  color: var(--text-primary);
}
.hero, .chart-panel, .rail-panel, .code-board, .logic-grid, .formula-grid {
  width: 100%;
  box-sizing: border-box;
}

.hero,
.chart-panel,
.rail-panel,
.logic-card,
.code-board,
.formula-card {
  border: 1px solid var(--border-soft);
  background: var(--bg-elevated);
  box-shadow: var(--shadow-soft);
}

.reveal-panel {
  animation: reveal-in 0.65s ease both;
}

.hero,
.chart-panel,
.rail-panel,
.code-board {
  border-radius: 26px;
  padding: 24px;
}

.hero {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) auto;
  gap: 18px;
  align-items: start;
}

.eyebrow {
  font-size: 12px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--accent-warning);
}

.hero h2 {
  margin: 10px 0 12px;
  font-size: 38px;
  line-height: 1.08;
  color: var(--text-primary);
}

.hero p,
.chart-panel p,
.logic-card p,
.code-board p,
.formula-card p,
.rail-card p {
  margin: 0;
  line-height: 1.8;
  color: var(--text-secondary);
}

.hero-badges {
  display: grid;
  gap: 10px;
}

.hero-badges span {
  padding: 10px 16px;
  border-radius: 999px;
  background: var(--bg-muted);
  border: 1px solid var(--border-soft);
  color: var(--text-secondary);
}

.section-head {
  display: flex;
  justify-content: space-between;
  gap: 14px;
}

.section-head h3,
.logic-card h3,
.code-board h3,
.chart-panel h3 {
  margin: 0;
  color: var(--text-primary);
}

.section-head p {
  margin: 8px 0 0;
  color: var(--text-tertiary);
}

.rail-grid,
.logic-grid,
.formula-grid {
  display: grid;
  gap: 16px;
}

.rail-grid {
  grid-template-columns: repeat(4, minmax(0, 1fr));
  margin-top: 16px;
}

.rail-card {
  padding: 18px;
  border-radius: 22px;
  background: var(--bg-muted);
  border: 1px solid color-mix(in srgb, var(--rail-color) 24%, var(--border-soft));
}

.rail-card span,
.formula-card span {
  display: block;
  font-size: 12px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--accent-warning);
}

.formula-grid,
.logic-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.formula-card,
.logic-card {
  padding: 18px;
  border-radius: 22px;
}

.formula-card strong {
  display: block;
  margin-top: 10px;
  color: var(--text-primary);
  font-size: 20px;
}

.chart {
  height: 340px;
  margin-top: 14px;
}

.pill-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 16px;
}

.pill {
  padding: 9px 14px;
  border-radius: 999px;
  background: rgba(59, 130, 246, 0.08);
  border: 1px solid rgba(59, 130, 246, 0.16);
  color: var(--text-secondary);
}

.pill.warm {
  background: rgba(245, 158, 11, 0.08);
  border-color: rgba(245, 158, 11, 0.2);
  color: #b45309;
}

.code-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  margin-top: 18px;
}

.code-item {
  padding: 18px;
  border-radius: 20px;
  background: var(--bg-muted);
  border: 1px solid var(--border-soft);
}

.code-item strong,
.code-item span,
.code-item em {
  display: block;
}

.code-item strong {
  color: var(--text-primary);
}

.code-item span {
  margin-top: 8px;
  color: var(--accent-secondary);
}

.code-item em {
  margin-top: 4px;
  color: var(--accent-warning);
  font-style: normal;
}

.code-item p {
  margin-top: 10px;
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

@media (max-width: 980px) {
  .hero,
  .rail-grid,
  .logic-grid,
  .code-list,
  .formula-grid {
    grid-template-columns: 1fr;
  }

  .hero h2 {
    font-size: 32px;
  }
}
</style>

