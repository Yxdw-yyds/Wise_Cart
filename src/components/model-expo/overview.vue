<template>
  <div          class="expo-page expo-scroll">
    <section class="hero-panel reveal-panel">
      <div class="hero-top">
        <div class="hero-copy">
          <h2>CCDRec 推荐模型技术说明</h2>
        </div>
        
        <div class="hero-tags">
          <span>Item ID 是扩散主对象</span>
          <span>文本 / 图像 / timestep 是条件输入</span>
          <span>课程式负采样五阶段切换</span>
          <span>双图传播 + BPR 排序</span>
        </div>
      </div>
      <div class="hero-stats">
        <div v-for="fact in summaryFacts" :key="fact.label" class="stat-tile">
          <span>{{ fact.label }}</span>
          <strong>{{ fact.value }}</strong>
        </div>
      </div>
    </section>

    <!-- 动态图解：CCDRec 实物级图解 -->
    <section class="viz-section reveal-panel">
      <ModelExpoVisualization />
    </section>

  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import { loadDatasetSummary, loadOfflineMetrics } from "@/composables/useCcdrecData";
import { modelFlowNodes } from "@/models/ccdrec/expo-data";
import ModelExpoVisualization from "@/components/model-expo/ccdrec-visualization.vue";

defineOptions({ name: "ModelExpoOverview" });

const activeKey = ref(modelFlowNodes[0].key);
const summary = ref(null);
const metrics = ref(null);

const activeNode = computed(() => modelFlowNodes.find((item) => item.key === activeKey.value) || modelFlowNodes[0]);

const summaryFacts = computed(() => {
  if (!summary.value || !metrics.value) return [];
  return [
    { label: "数据集", value: summary.value.dataset },
    { label: "用户数", value: summary.value.users.toLocaleString("zh-CN") },
    { label: "商品数", value: summary.value.items.toLocaleString("zh-CN") },
    { label: "交互总数", value: summary.value.interactions.toLocaleString("zh-CN") },
    { label: "最佳 Epoch", value: metrics.value.bestEpoch },
    { label: "Recall@20", value: metrics.value.bestValid["recall@20"].toFixed(4) },
  ];
});

onMounted(async () => {
  [summary.value, metrics.value] = await Promise.all([loadDatasetSummary("baby"), loadOfflineMetrics("baby")]);
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

.expo-page {
  display: flex;
  flex-direction: column;
  gap: 18px;
  max-width: 1600px;
  margin: 0 auto;
  align-items: center;
  width: 100%;
  color: var(--text-primary);
}
.hero-panel, .viz-section { width: 100%; box-sizing: border-box; }

.hero-panel,
.poster-panel,
.flow-board,
.detail-panel,
.metric-card,
.module-card,
.notice-card,
.viz-section {
  position: relative;
  border: 1px solid var(--border-soft);
  background: var(--bg-elevated);
  box-shadow: var(--shadow-soft);
}

.reveal-panel {
  animation: reveal-in 0.65s ease both;
}

.hero-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px 24px;
  border-radius: 28px;
}

.hero-top {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 18px;
}

.poster-panel,
.flow-board,
.detail-panel,
.metric-card,
.notice-card,
.viz-section {
  border-radius: 26px;
  padding: 22px;
}

.eyebrow {
  font-size: 12px;
  letter-spacing: 0.24em;
  text-transform: uppercase;
  color: var(--accent-secondary);
}

.hero-copy h2 {
  margin: 0;
  font-size: 30px;
  line-height: 1.08;
  color: var(--text-primary);
}

.hero-copy p,
.notice-card p {
  margin: 0;
  font-size: 15px;
  line-height: 1.8;
  color: var(--text-secondary);
}

.hero-tags {
  display: flex;
  flex-wrap: nowrap;
  gap: 8px;
}

.hero-tags span,
.poster-node span,
.notice-card span {
  display: inline-flex;
  white-space: nowrap;
  padding: 6px 12px;
  border-radius: 999px;
  border: 1px solid var(--border-soft);
  background: var(--bg-muted);
  color: var(--text-secondary);
}

.hero-stats {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 10px;
}

.stat-tile {
  padding: 12px 14px;
  border-radius: 18px;
  background: var(--bg-muted);
  border: 1px solid var(--border-soft);
  min-width: 0;
}

.stat-tile span {
  display: block;
  color: var(--text-tertiary);
  font-size: 11px;
}

.stat-tile strong {
  display: block;
  margin-top: 4px;
  font-size: 18px;
  color: var(--text-primary);
  line-height: 1.15;
  word-break: break-all;
}

.section-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
}

.section-head h3 {
  margin: 0;
  font-size: 24px;
  color: var(--text-primary);
}

.section-head p {
  margin: 8px 0 0;
  color: var(--text-tertiary);
}

.section-head.compact h3 {
  font-size: 20px;
}

.poster-track {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 14px;
  margin-top: 16px;
}

.poster-node {
  position: relative;
  padding: 18px;
  border-radius: 22px;
  background: var(--bg-muted);
  border: 1px solid color-mix(in srgb, var(--poster-color) 22%, var(--border-soft));
  animation: reveal-in 0.7s ease both;
}

.poster-node::after {
  content: "";
  position: absolute;
  top: 50%;
  right: -10px;
  width: 20px;
  height: 2px;
  background: linear-gradient(90deg, color-mix(in srgb, var(--poster-color) 55%, white 10%), rgba(255, 255, 255, 0.12));
}

.poster-node:last-child::after {
  display: none;
}

.poster-node span,
.notice-card span {
  font-size: 12px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.poster-node strong,
.notice-card strong {
  display: block;
  margin-top: 12px;
  color: var(--text-primary);
  font-size: 20px;
}

.poster-node p {
  margin: 10px 0 0;
  color: var(--text-secondary);
  line-height: 1.75;
}

.card-grid,
.notice-grid,
.bottom-grid {
  display: grid;
  gap: 14px;
}

.card-grid {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.notice-grid,
.bottom-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.module-card {
  padding: 18px;
  border-radius: 22px;
}

.module-dot {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  box-shadow: 0 0 0 8px rgba(59, 130, 246, 0.06);
}

.module-card h3 {
  margin: 14px 0 8px;
  font-size: 19px;
  color: var(--text-primary);
}

.module-card p,
.loss-item p,
.loss-item small {
  margin: 0;
  line-height: 1.75;
  color: var(--text-secondary);
}

.notice-card--warm {
  background:
    radial-gradient(circle at top right, rgba(245, 158, 11, 0.08), transparent 28%),
    var(--bg-elevated);
}

.main-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(340px, 0.9fr);
  gap: 18px;
}

.flow-lanes {
  display: grid;
  gap: 12px;
  margin-top: 20px;
}

.flow-lanes--five {
  grid-template-columns: repeat(5, minmax(0, 1fr));
}

.flow-node {
  position: relative;
  padding: 18px 16px 16px;
  border: 1px solid var(--border-soft);
  border-radius: 20px;
  background: var(--bg-muted);
  text-align: left;
  color: inherit;
  cursor: pointer;
  transition: transform 0.22s ease, border-color 0.22s ease, box-shadow 0.22s ease;
}

.flow-node:hover,
.flow-node.active {
  transform: translateY(-3px);
  border-color: color-mix(in srgb, var(--node-color) 68%, white 10%);
  box-shadow: var(--shadow-hover);
}

.flow-node::before {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(160deg, color-mix(in srgb, var(--node-color) 18%, transparent), transparent 58%);
  pointer-events: none;
}

.flow-node__chip {
  display: inline-flex;
  padding: 5px 10px;
  border-radius: 999px;
  background: rgba(59, 130, 246, 0.08);
  color: var(--text-primary);
  font-size: 12px;
}

.flow-node strong,
.flow-node small {
  position: relative;
  display: block;
}

.flow-node strong {
  margin-top: 12px;
  font-size: 17px;
  color: var(--text-primary);
}

.flow-node small {
  margin-top: 8px;
  color: var(--text-tertiary);
  line-height: 1.7;
}

.detail-head {
  display: flex;
  gap: 14px;
  align-items: flex-start;
  margin-bottom: 18px;
}

.detail-line {
  flex: 0 0 6px;
  height: 96px;
  border-radius: 999px;
}

.detail-head h3 {
  margin: 0;
  font-size: 24px;
  color: var(--text-primary);
}

.detail-head p {
  margin: 8px 0 0;
  color: var(--text-secondary);
  line-height: 1.8;
}

.tech-layer :deep(.el-collapse-item__header),
.tech-layer :deep(.el-collapse-item__wrap) {
  background: transparent;
  color: var(--text-primary);
  border-color: var(--border-soft);
}

.tech-layer :deep(.el-collapse-item__content) {
  color: var(--text-primary);
  padding-bottom: 14px;
}

.detail-block + .detail-block {
  margin-top: 14px;
}

.detail-block label {
  display: block;
  margin-bottom: 8px;
  font-size: 12px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--accent-secondary);
}

.detail-block p {
  margin: 0;
  line-height: 1.8;
  color: var(--text-secondary);
}

.pill-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.pill {
  padding: 7px 12px;
  border-radius: 999px;
  background: rgba(59, 130, 246, 0.08);
  border: 1px solid rgba(59, 130, 246, 0.16);
  color: var(--text-secondary);
}

.pill--soft {
  background: rgba(245, 158, 11, 0.08);
  border-color: rgba(245, 158, 11, 0.2);
}

.chart {
  height: 320px;
  margin-top: 12px;
}

.loss-list {
  display: grid;
  gap: 12px;
  margin-top: 12px;
}

.loss-item {
  padding: 16px;
  border-radius: 20px;
  background: var(--bg-muted);
  border: 1px solid var(--border-soft);
}

.loss-item strong,
.loss-item span,
.loss-item em,
.loss-item small {
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

.loss-item small {
  margin-top: 8px;
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
  .card-grid,
  .poster-track,
  .flow-lanes--five,
  .notice-grid,
  .bottom-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 980px) {
  .hero-panel,
  .main-grid,
  .bottom-grid,
  .notice-grid {
    grid-template-columns: 1fr;
  }

  .hero-copy h2 {
    font-size: 32px;
  }
}

@media (max-width: 640px) {
  .card-grid,
  .poster-track,
  .flow-lanes--five,
  .hero-stats {
    grid-template-columns: 1fr;
  }

  .hero-panel,
  .flow-board,
  .detail-panel,
  .metric-card,
  .poster-panel,
  .notice-card {
    padding: 18px;
  }
}
</style>


