<template>
  <div class="sampling-page expo-scroll">
    <section class="hero reveal-panel">
      <div>
        <div class="eyebrow">课程负采样与排序</div>
        <h2>先用容易负样本稳定训练，再逐步切到更难的表示空间，最后交给 BPR 排序收敛</h2>
        <p>
          这一页严格对应 <code>get_curriculum_neg_sample()</code> 和 <code>sample_neg_items()</code>。
          重点不是“有个课程学习思想”，而是明确你代码里到底怎么切阶段、怎么抽样、怎么过滤已交互项。
        </p>
      </div>
      <div class="hero-stats">
        <div class="mini-card"><span>课程启动</span><strong>Epoch 5</strong></div>
        <div class="mini-card"><span>阶段步长</span><strong>5</strong></div>
        <div class="mini-card"><span>课程结束</span><strong>Epoch 30</strong></div>
        <div class="mini-card"><span>采样比例</span><strong>10%</strong></div>
      </div>
    </section>

    <section class="formula-grid">
      <article class="formula-card reveal-panel">
        <span>阶段切换</span>
        <strong>quarter → half → three-quarter → full → ia_embeddings</strong>
        <p>切换逻辑不是猜测，而是代码里的 epoch 条件分支。</p>
      </article>
      <article class="formula-card reveal-panel">
        <span>候选抽样</span>
        <strong>先从当前表示池随机抽 10%</strong>
        <p>模型不会在全量空间里暴力找负样本，而是先缩小候选范围。</p>
      </article>
      <article class="formula-card reveal-panel">
        <span>难负样本选择</span>
        <strong>过滤已交互后，从 top-k 相似候选中随机选</strong>
        <p>这样既保留困难度，又避免所有训练都卡在同一个负样本上。</p>
      </article>
    </section>

    <section class="stage-board reveal-panel">
      <header class="section-head">
        <div>
          <h3>五阶段难度阶梯</h3>
          <p>每一段都对应一个明确的 embedding 来源和触发条件。</p>
        </div>
      </header>

      <div class="stage-grid">
        <article v-for="stage in trainingStages" :key="stage.key" class="stage-card" :style="{ '--stage-color': stage.color }">
          <div class="stage-badge">{{ stage.stageName }}</div>
          <h3>{{ stage.title }}</h3>
          <span>{{ stage.epochRange }}</span>
          <div class="stage-meter">
            <div class="stage-meter__fill" :style="{ width: `${stage.difficulty}%`, background: stage.color }"></div>
          </div>
          <p>{{ stage.explanation }}</p>
          <strong>来源：{{ stage.embeddingSource }}</strong>
          <em>触发：{{ stage.triggerCondition }}</em>
        </article>
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
            <!-- X/Y/Z Axes -->
            <div class="axis axis-x"><span>Z1</span></div>
            <div class="axis axis-y"><span>Z2</span></div>
            <div class="axis axis-z"><span>Z3</span></div>

            <!-- Positive Anchor -->
            <div class="point anchor-point" style="--x: 0px; --y: 0px; --z: 0px;"></div>

            <!-- Sampling Points generated dynamically -->
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

      <article class="panel reveal-panel">
        <header class="section-head compact">
          <div>
            <h3>损失项职责分工</h3>
            <p>排序学习不是一条 loss 走到底，而是组合优化。</p>
          </div>
        </header>
        <div class="loss-list">
          <div v-for="item in lossTerms" :key="item.name" class="loss-item">
            <strong>{{ item.name }}</strong>
            <span>{{ item.formulaText }}</span>
            <em>{{ item.weightSource }}</em>
            <p>{{ item.purpose }}</p>
          </div>
        </div>
      </article>
    </section>

    <section class="logic-grid">
      <article class="logic-card reveal-panel">
        <h3>真实采样路径</h3>
        <ol>
          <li>根据 epoch 选择当前阶段表示池。</li>
          <li>从表示池中随机抽取 10% 候选。</li>
          <li>利用正样本 embedding 与候选做相似度计算。</li>
          <li>根据 interaction_matrix 过滤已交互项。</li>
          <li>从 top-k 相似候选里随机抽一个 hard negative。</li>
        </ol>
      </article>
      <article class="logic-card reveal-panel">
        <h3>训练期 / 推理期分离</h3>
        <p>课程负采样只发生在训练期。线上生成 Top50 时不会再走这套采样逻辑，而是直接使用全量打分排序。</p>
      </article>
      <article class="logic-card reveal-panel">
        <h3>为什么最后还要接图传播</h3>
        <p>扩散和负采样提供更强的 item 表示，但最终排序仍要依赖 user-item 图和多模态 item 图把用户上下文补齐。</p>
      </article>
    </section>
  </div>
</template>

<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import * as echarts from "echarts";
import { lossTerms, trainingStages } from "@/models/ccdrec/expo-data";

defineOptions({ name: "ModelExpoSampling" });


const difficultyRef = ref(null);
let difficultyChart = null;

// Generate simulated sampling points for CSS 3D
const samplingPoints = ref([]);
onMounted(() => {
  const pts = [];
  const rand = (min, max) => Math.random() * (max - min) + min;
  
  // Quarter Phase (Light Blue, far away)
  for(let i=0; i<30; i++) pts.push({ phase: 'p-quarter', x: rand(-240, 240), y: rand(-240, 240), z: rand(-240, 240) });
  // Half Phase (Medium Blue, closer)
  for(let i=0; i<25; i++) pts.push({ phase: 'p-half', x: rand(-160, 160), y: rand(-160, 160), z: rand(-160, 160) });
  // Full Phase (Dark Blue, very close)
  for(let i=0; i<15; i++) pts.push({ phase: 'p-full', x: rand(-80, 80), y: rand(-80, 80), z: rand(-80, 80) });
  // Hard Negatives (Purple, nearest)
  for(let i=0; i<8; i++) pts.push({ phase: 'p-hard', x: rand(-40, 40), y: rand(-40, 40), z: rand(-40, 40) });
  
  samplingPoints.value = pts;
});

function renderDifficultyChart() {

  if (!difficultyChart) return;
  difficultyChart.setOption({
    color: trainingStages.map((item) => item.color),
    tooltip: { trigger: "item" },
    series: [
      {
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
      },
    ],
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
.stage-board,
.panel,
.logic-card,
.formula-card {
  border: 1px solid var(--border-soft);
  background: var(--bg-elevated);
  box-shadow: var(--shadow-soft);
}

.reveal-panel {
  animation: reveal-in 0.65s ease both;
}

.hero,
.stage-board,
.panel {
  border-radius: 26px;
  padding: 24px;
}

.hero {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(300px, 0.8fr);
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
  font-size: 42px;
  line-height: 1.08;
  color: var(--text-primary);
}

.hero p,
.stage-card p,
.logic-card p,
.section-head p,
.formula-card p,
.logic-card li {
  margin: 0;
  line-height: 1.8;
  color: var(--text-secondary);
}

.hero-stats {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.mini-card {
  padding: 22px;
  border-radius: 20px;
  background: var(--bg-muted);
  border: 1px solid var(--border-soft);
}

.mini-card span {
  display: block;
  color: var(--text-tertiary);
  font-size: 12px;
}

.mini-card strong {
  display: block;
  margin-top: 6px;
  color: var(--text-primary);
  font-size: 28px;
}

.formula-grid,
.chart-grid,
.logic-grid,
.stage-grid {
  display: grid;
  gap: 24px;
}

.formula-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}
.chart-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.logic-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.formula-card,
.logic-card {
  padding: 18px;
  border-radius: 22px;
}

.formula-card span {
  display: block;
  font-size: 12px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--accent-danger);
}

.formula-card strong {
  display: block;
  margin-top: 10px;
  color: var(--text-primary);
  font-size: 20px;
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

.stage-grid {
  grid-template-columns: repeat(5, minmax(0, 1fr));
  margin-top: 18px;
}

.stage-card {
  padding: 18px;
  border-radius: 22px;
  background: var(--bg-muted);
  border: 1px solid color-mix(in srgb, var(--stage-color) 25%, rgba(113, 148, 202, 0.12));
}

.stage-badge {
  display: inline-flex;
  padding: 6px 12px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--stage-color) 12%, rgba(255, 255, 255, 0.9));
  color: var(--text-primary);
}

.stage-card h3 {
  margin: 14px 0 6px;
  color: var(--text-primary);
}

.stage-card span,
.stage-card strong,
.stage-card em {
  display: block;
}

.stage-card span {
  color: var(--text-tertiary);
}

.stage-card strong {
  margin-top: 12px;
  color: var(--text-secondary);
}

.stage-card em {
  margin-top: 6px;
  color: var(--accent-secondary);
  font-style: normal;
}

.stage-meter {
  height: 10px;
  margin: 16px 0 14px;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.16);
  overflow: hidden;
}

.stage-meter__fill {
  height: 100%;
  border-radius: 999px;
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

.loss-item strong {
  color: var(--text-primary);
}

.loss-item span {
  margin-top: 6px;
  color: #b45309;
}

.loss-item em {
  margin-top: 4px;
  color: var(--accent-secondary);
  font-style: normal;
}

.loss-item p {
  margin-top: 8px;
}

.logic-card h3 {
  margin: 0 0 10px;
  color: var(--text-primary);
}

.logic-card ol {
  margin: 0;
  padding-left: 18px;
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

@media (max-width: 1180px) {
  .stage-grid,
  .logic-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 980px) {
  .hero,
  .chart-grid,
  .formula-grid {
    grid-template-columns: 1fr;
  }

  .hero h2 {
    font-size: 32px;
  }
}

@media (max-width: 640px) {
  .stage-grid,
  .logic-grid,
  .hero-stats {
    grid-template-columns: 1fr;
  }
}

/* ── CSS 3D Scene ── */
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

.axis {
  position: absolute;
  background: var(--border-soft);
  transform-style: preserve-3d;
}

.axis span {
  position: absolute;
  color: var(--text-tertiary);
  font-size: 12px;
  transform: rotateY(-45deg) rotateX(15deg);
}

.axis-x { width: 600px; height: 1px; transform: translate3d(-300px, 0, 0); }
.axis-x span { right: -20px; top: -10px; }

.axis-y { width: 1px; height: 600px; transform: translate3d(0, -300px, 0); }
.axis-y span { top: -20px; left: -10px; }

.axis-z { width: 1px; height: 600px; transform: translate3d(0, 0, -300px) rotateX(90deg); }
.axis-z span { bottom: -20px; left: 10px; }

.point {
  position: absolute;
  border-radius: 50%;
  transform: translate3d(var(--x), var(--y), var(--z));
  box-shadow: 0 0 10px currentColor;
}

.anchor-point {
  width: 24px;
  height: 24px;
  margin: -12px 0 0 -12px;
  background: #ef4444; 
  color: rgba(239, 68, 68, 0.4);
  border: 2px solid #fff;
  z-index: 10;
}

.sample-point {
  width: 8px;
  height: 8px;
  margin: -4px 0 0 -4px;
}
.p-quarter { background: #93c5fd; color: #93c5fd; opacity: 0.4; width: 10px; height: 10px; }
.p-half { background: #60a5fa; color: #60a5fa; opacity: 0.6; width: 12px; height: 12px; }
.p-full { background: #2563eb; color: #2563eb; opacity: 0.8; width: 14px; height: 14px; }
.p-hard { background: #1d4ed8; color: #1d4ed8; opacity: 1; width: 16px; height: 16px; border: 1px solid #fff; }

</style>


