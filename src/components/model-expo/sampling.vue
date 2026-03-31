<template>
  <div class="sampling-page expo-scroll">
    <section class="hero reveal-panel">
      <div>
        <div class="eyebrow">课程负采样与排序</div>
        <h2>先用容易负样本稳定训练，再逐步切到更难的表示空间，最后交给 BPR 排序收敛</h2>
        <p>
          这一页严格对应 <code>get_curriculum_neg_sample()</code> 和 <code>sample_neg_items()</code>。
          重点不是「有个课程学习思想」，而是明确你代码里到底怎么切阶段、怎么抽样、怎么过滤已交互项。
        </p>
      </div>
    </section>

    <section class="chart-grid">
      <article class="panel reveal-panel" style="overflow: hidden;">
        <header class="section-head compact" style="position: relative; z-index: 10;">
          <div>
            <h3>特征空间采样轨迹 (CSS 3D 模拟)</h3>
            <p>展示正样本 Anchor（红色）与各阶段抽取的负样本在三维潜空间中的分布变化。</p>
          </div>
        </header>
        <div class="css3d-container">
          <div class="css3d-scene">
            <div class="axis axis-x"><span>Z1</span></div>
            <div class="axis axis-y"><span>Z2</span></div>
            <div class="axis axis-z"><span>Z3</span></div>
            <div class="point anchor-point" style="--x: 0px; --y: 0px; --z: 0px;"></div>
            <div v-for="(pt, i) in samplingPoints" :key="i"
                 class="point sample-point"
                 :class="pt.phase"
                 :style="{ '--x': pt.x + 'px', '--y': pt.y + 'px', '--z': pt.z + 'px' }">
            </div>
          </div>
        </div>
      </article>

      <article class="panel reveal-panel">
        <header class="section-head compact">
          <div>
            <h3>课程难度漏斗</h3>
            <p>从易到难的训练台阶，直观看清负样本空间如何逐步逼近最终排序空间。</p>
          </div>
        </header>
        <div ref="difficultyRef" class="chart"></div>
      </article>

    </section>
  </div>
</template>

<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import * as echarts from "echarts";
import { trainingStages } from "@/models/ccdrec/expo-data";

defineOptions({ name: "ModelExpoSampling" });

const difficultyRef = ref(null);
let difficultyChart = null;

const samplingPoints = ref([]);
onMounted(() => {
  const pts = [];
  const rand = (min, max) => Math.random() * (max - min) + min;
  for (let i = 0; i < 30; i++) pts.push({ phase: 'p-quarter', x: rand(-240, 240), y: rand(-240, 240), z: rand(-240, 240) });
  for (let i = 0; i < 25; i++) pts.push({ phase: 'p-half', x: rand(-160, 160), y: rand(-160, 160), z: rand(-160, 160) });
  for (let i = 0; i < 15; i++) pts.push({ phase: 'p-full', x: rand(-80, 80), y: rand(-80, 80), z: rand(-80, 80) });
  for (let i = 0; i < 8; i++) pts.push({ phase: 'p-hard', x: rand(-40, 40), y: rand(-40, 40), z: rand(-40, 40) });
  samplingPoints.value = pts;
});

function renderDifficultyChart() {
  if (!difficultyChart) return;
  difficultyChart.setOption({
    color: trainingStages.map((item) => item.color),
    tooltip: { trigger: "item" },
    series: [{
      type: "funnel",
      left: "5%",
      width: "40%",
      minSize: "28%",
      maxSize: "96%",
      sort: "ascending",
      gap: 4,
      label: { color: "#475569", width: 190, overflow: "break" },
      itemStyle: { borderColor: "rgba(255,255,255,0.9)", borderWidth: 2 },
      data: trainingStages.map((item) => ({
        name: `${item.stageName} · ${item.embeddingSource}`,
        value: item.difficulty,
      })),
    }],
  });
}

function resize() {
  difficultyChart?.resize();
}

onMounted(async () => {
  await nextTick();
  difficultyChart = difficultyRef.value ? echarts.init(difficultyRef.value) : null;
  renderDifficultyChart();
  window.addEventListener("resize", resize);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", resize);
  difficultyChart?.dispose();
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

.sampling-page {
  display: grid;
  gap: 24px;
  color: var(--text-primary);
}

.hero,
.panel {
  border: 1px solid var(--border-soft);
  background: var(--bg-elevated);
  box-shadow: var(--shadow-soft);
}

.reveal-panel {
  animation: reveal-in 0.65s ease both;
}

.hero,
.panel {
  border-radius: 26px;
  padding: 24px;
}

.hero {
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
}

.eyebrow {
  font-size: 14px;
  letter-spacing: 0.22em;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--accent-danger);
}

.hero h2 {
  margin: 10px 0 12px;
  font-size: 36px;
  line-height: 1.12;
  color: var(--text-primary);
}

.hero p,
.section-head p {
  margin: 0;
  line-height: 1.8;
  color: var(--text-secondary);
}

.chart-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 24px;
}

.section-head {
  display: flex;
  justify-content: space-between;
  gap: 14px;
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
  height: 480px;
  margin-top: 10px;
}

.loss-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px;
  margin-top: 16px;
}

.loss-item {
  padding: 22px;
  border-radius: 20px;
  background: var(--bg-muted);
  border: 1px solid var(--border-soft);
}

.loss-item strong,
.loss-item span,
.loss-item em {
  display: block;
}

.loss-item strong { color: var(--text-primary); }
.loss-item span { margin-top: 6px; color: #b45309; }
.loss-item em { margin-top: 4px; color: var(--accent-secondary); font-style: normal; }
.loss-item p { margin-top: 8px; line-height: 1.8; color: var(--text-secondary); }

@keyframes reveal-in {
  from { opacity: 0; transform: translateY(14px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 980px) {
  .chart-grid { grid-template-columns: 1fr; }
  .hero h2 { font-size: 28px; }
}

/* CSS 3D Scene */
.css3d-container {
  height: 480px;
  perspective: 1000px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  margin-top: 10px;
}

.css3d-scene {
  width: 0;
  height: 0;
  transform-style: preserve-3d;
  animation: rotateScene 20s infinite linear;
}

@keyframes rotateScene {
  0% { transform: scale(0.7) rotateX(-15deg) rotateY(0deg); }
  100% { transform: scale(0.7) rotateX(-15deg) rotateY(360deg); }
}

.axis { position: absolute; background: var(--border-soft); transform-style: preserve-3d; }
.axis span { position: absolute; color: var(--text-tertiary); font-size: 12px; transform: rotateY(-45deg) rotateX(15deg); }
.axis-x { width: 600px; height: 1px; transform: translate3d(-300px, 0, 0); }
.axis-x span { right: -20px; top: -10px; }
.axis-y { width: 1px; height: 600px; transform: translate3d(0, -300px, 0); }
.axis-y span { top: -20px; left: -10px; }
.axis-z { width: 1px; height: 600px; transform: translate3d(0, 0, -300px) rotateX(90deg); }
.axis-z span { bottom: -20px; left: 10px; }

.point { position: absolute; border-radius: 50%; transform: translate3d(var(--x), var(--y), var(--z)); box-shadow: 0 0 10px currentColor; }
.anchor-point { width: 24px; height: 24px; margin: -12px 0 0 -12px; background: #ef4444; color: rgba(239,68,68,0.4); border: 2px solid #fff; z-index: 10; }
.sample-point { width: 8px; height: 8px; margin: -4px 0 0 -4px; }
.p-quarter { background: #93c5fd; color: #93c5fd; opacity: 0.4; width: 10px; height: 10px; }
.p-half { background: #60a5fa; color: #60a5fa; opacity: 0.6; width: 12px; height: 12px; }
.p-full { background: #2563eb; color: #2563eb; opacity: 0.8; width: 14px; height: 14px; }
.p-hard { background: #1d4ed8; color: #1d4ed8; opacity: 1; width: 16px; height: 16px; border: 1px solid #fff; }
</style>
