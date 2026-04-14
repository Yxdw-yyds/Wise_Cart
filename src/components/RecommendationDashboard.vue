<template>
  <div class="rec-dashboard">
    <div class="metrics-row">
      <div v-for="card in metricCards" :key="card.key" class="metric-card" :class="card.colorClass">
        <div class="mc-icon">{{ card.icon }}</div>
        <div class="mc-content">
          <div class="mc-topline">
            <div class="mc-label">{{ card.label }}</div>
            <div class="mc-value">{{ card.value }}</div>
          </div>
          <div class="mc-trend">{{ card.trend }}</div>
        </div>
      </div>
    </div>

    <div class="main-layout">
      <div class="recommendations-panel panel panel-recs">
        <div class="panel-header">
          <span class="panel-title">个性化推荐</span>
          <div class="header-actions">
            <button class="sim-btn" :class="{ running: simRunning }" @click="toggleSim">
              {{ simRunning ? "■ 停止模拟" : "▶ 实时模拟" }}
            </button>
            <button class="refresh-btn" @click="doRefresh">↻ 刷新</button>
          </div>
        </div>

        <div v-if="loading" class="loading-state">
          <div class="spinner"></div>
          <span>推荐计算中...</span>
        </div>

        <div v-else class="rec-cards-grid">
          <RecommendProductCard
            v-for="rec in recommendations.slice(0, 15)"
            :key="rec.itemId"
            :item-id="rec.itemId"
            :product="rec.product"
            :fused-score="rec.fusedScore"
            :rank="rec.rank"
            :models="rec.models"
            :explanation="rec.explanation"
            :category-labels="categoryLabels"
            @interact="handleInteract"
          />
        </div>

      </div>

      <div class="right-column">
        <div class="right-top panel panel-radar">
          <div class="panel-header">
            <span class="panel-title">用户兴趣分布</span>
            <span class="live-badge">● 实时</span>
          </div>
          <div ref="radarRef" class="echart-box"></div>
          <div class="top-cats">
            <div v-for="cat in topCategories" :key="cat.key" class="top-cat-item">
              <span class="cat-dot" :style="{ background: categoryColors[cat.key] }"></span>
              <span class="cat-name">{{ categoryLabels[cat.key] }}</span>
              <span class="cat-pct">{{ cat.percent }}%</span>
            </div>
          </div>
        </div>

        <div class="right-bottom panel panel-efficiency">
          <div class="panel-header">
            <span class="panel-title">推荐效率</span>
          </div>
          <div class="eff-grid">
            <div class="eff-item">
              <div class="eff-val">{{ behaviorLog.length }}</div>
              <div class="eff-lbl">行为事件总数</div>
            </div>
            <div class="eff-item">
              <div class="eff-val">{{ behaviorLog.filter(e => e.action === "buy").length }}</div>
              <div class="eff-lbl">购买次数</div>
            </div>
            <div class="eff-item">
              <div class="eff-val">{{ behaviorLog.filter(e => e.action === "cart").length }}</div>
              <div class="eff-lbl">加购次数</div>
            </div>
            <div class="eff-item">
              <div class="eff-val">{{ recommendations.length }}</div>
              <div class="eff-lbl">当前推荐数</div>
            </div>
          </div>
        </div>

        <div class="panel panel-stream">
          <div class="panel-header">
            <span class="panel-title">事件流</span>
          </div>
          <transition-group name="stream-item" tag="div" class="stream-list">
            <div v-for="evt in recentEvents.slice(0, 6)" :key="evt.id" class="stream-evt">
              <span class="evt-time">{{ evt.timeStr }}</span>
              <span class="evt-action" :class="`act-${evt.action}`">{{ actionLabels[evt.action] || evt.action }}</span>
              <span class="evt-name">{{ evt.productName }}</span>
            </div>
          </transition-group>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import * as echarts from "echarts";
import { useTmallData } from "@/composables/useTmallData";
import { useEnhancedRecommendation } from "@/services/enhancedRecommendationComposer";
import RecommendProductCard from "@/components/RecommendProductCard.vue";

defineOptions({ name: "RecommendationDashboard" });

const {
  products,
  behaviorLog,
  categoryLabels,
  categoryColors,
  userProfile: tmallUserProfile,
  loadAll: loadTmallData
} = useTmallData();

const {
  loading,
  recommendations,
  userProfile,
  analysis,
  loadRecommendations,
  updateUserProfile,
  updateAnalysis,
  trackInteraction
} = useEnhancedRecommendation();

const radarRef = ref(null);
let radarChart = null;
const recentEvents = ref([]);

let evtCounter = 0;
let simReplayIndex = 0;
const simRunning = ref(false);
let simTimer = null;
let initialBehaviorCount = 0;

const actionLabels = {
  view: "浏览",
  click: "点击",
  fav: "收藏",
  cart: "加购",
  buy: "购买",
  skip: "跳过"
};

const metricCards = computed(() => [
  {
    key: "ctr",
    icon: "📈",
    label: "推荐点击率",
    value: analysis.value?.overview?.ctr || "0%",
    trend: "实时更新",
    colorClass: "mc-blue"
  },
  {
    key: "cvr",
    icon: "🎯",
    label: "推荐转化率",
    value: analysis.value?.overview?.cvr || "0%",
    trend: "实时更新",
    colorClass: "mc-green"
  },
  {
    key: "total",
    icon: "📦",
    label: "总推荐次数",
    value: analysis.value?.overview?.totalRecommendations || 0,
    trend: "累计统计",
    colorClass: "mc-purple"
  },
  {
    key: "buy",
    icon: "🛒",
    label: "总购买转化",
    value: analysis.value?.overview?.totalConversions || 0,
    trend: "实时统计",
    colorClass: "mc-orange"
  }
]);

const blockedProductPattern = /内衣|文胸|胸罩|睡衣|情趣|泳装|比基尼|抹胸|聚拢|桑蚕丝|蕾丝|性感/i;

const safeProducts = computed(() =>
  products.value.filter((product) => !blockedProductPattern.test(`${product?.name || ""} ${product?.category || ""}`))
);

const topCategories = computed(() => {
  const normalized = userProfile.value?.interestNormalized || tmallUserProfile.value?.categoryPercents || {};
  return Object.entries(normalized)
    .map(([key, percent]) => ({ key, percent: +percent || 0 }))
    .sort((a, b) => b.percent - a.percent)
    .slice(0, 6);
});

function renderRadar() {
  if (!radarChart) return;
  const normalized = userProfile.value?.interestNormalized || tmallUserProfile.value?.categoryPercents || {};
  const entries = Object.entries(normalized)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);
  if (!entries.length) return;

  radarChart.setOption({
    backgroundColor: "transparent",
    tooltip: { trigger: "item" },
    radar: {
      radius: "52%",
      center: ["50%", "54%"],
      axisName: { color: "#334155", fontSize: 11, padding: [0, 4] },
      nameGap: 6,
      splitArea: { areaStyle: { color: ["rgba(79,70,229,0.03)", "rgba(79,70,229,0.08)"] } },
      axisLine: { lineStyle: { color: "#cbd5e1" } },
      splitLine: { lineStyle: { color: "#e2e8f0" } },
      indicator: entries.map(([key]) => ({ name: categoryLabels[key] || key, max: 40 }))
    },
    series: [
      {
        type: "radar",
        areaStyle: { color: "rgba(79,70,229,0.15)" },
        lineStyle: { color: "#4f46e5", width: 2.5 },
        symbol: "circle",
        symbolSize: 5,
        itemStyle: { color: "#4f46e5" },
        data: [{ value: entries.map(([, v]) => v), name: "兴趣分布" }]
      }
    ]
  });
}

async function doRefresh({ silent = false } = {}) {
  await loadRecommendations({
    topK: 15,
    userBehavior: behaviorLog.value,
    allProducts: safeProducts.value,
    useCache: false,
    silent,
  });
  updateUserProfile(behaviorLog.value);
  updateAnalysis();
  await nextTick();
  renderRadar();
}

function pushEvent({ product, action, vtime }) {
  evtCounter += 1;
  recentEvents.value.unshift({
    id: evtCounter,
    action,
    productName: product?.name || `天猫商品${evtCounter}`,
    timeStr: vtime
      ? vtime.split(" ")[1] || vtime
      : new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
  });
  if (recentEvents.value.length > 20) recentEvents.value.pop();
}

function handleInteract({ itemId, action }) {
  const product = products.value.find(p => p.id === itemId);
  trackInteraction(itemId, action, { rank: recommendations.value.findIndex(r => r.itemId === itemId) + 1 });
  pushEvent({ product, action });
  updateAnalysis();
}

function toggleSim() {
  if (simRunning.value) {
    clearInterval(simTimer);
    simTimer = null;
    simRunning.value = false;
    return;
  }

  simRunning.value = true;
  initialBehaviorCount = behaviorLog.value.length;
  simTimer = setInterval(async () => {
    if (!initialBehaviorCount) return;
    if (simReplayIndex >= initialBehaviorCount) simReplayIndex = 0;

    const realEvent = behaviorLog.value[simReplayIndex];
    simReplayIndex += 1;
    if (!realEvent) return;

    const product = products.value.find(prod => prod.id === realEvent.productId) || products.value[0];
    const action = realEvent.action;
    behaviorLog.value.push({ productId: product.id, category: product.category, action, ts: Date.now() });
    pushEvent({ product, action, vtime: realEvent.vtime });

    if (["click", "cart", "buy"].includes(action)) {
      const rank = recommendations.value.findIndex((rec) => rec.itemId === product.id) + 1;
      trackInteraction(product.id, action, { rank: rank > 0 ? rank : undefined, simulated: true });
    }

    evtCounter += 1;
    if (evtCounter % 5 === 0) await doRefresh({ silent: true });
    else {
      updateAnalysis();
      renderRadar();
    }
  }, 1200);
}

function onResize() {
  radarChart?.resize();
}

watch(
  () => behaviorLog.value.length,
  () => {
    updateUserProfile(behaviorLog.value);
    renderRadar();
  }
);

onMounted(async () => {
  await loadTmallData();
  await nextTick();
  radarChart = radarRef.value ? echarts.init(radarRef.value) : null;
  await doRefresh();
  window.addEventListener("resize", onResize);
});

onBeforeUnmount(() => {
  if (simTimer) clearInterval(simTimer);
  window.removeEventListener("resize", onResize);
  radarChart?.dispose();
});
</script>

<style scoped>
.rec-dashboard * {
  box-sizing: border-box;
}

.rec-dashboard {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  font-family: "PingFang SC", "Microsoft YaHei", system-ui, sans-serif;
}

.metrics-row {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  min-height: 0;
}

.metric-card {
  border-radius: 14px;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.07);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  background-color: #fff;
  overflow: hidden;
  min-height: 92px;
}

.metric-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.mc-blue   { background: linear-gradient(135deg, #e0edff, #c7d9ff); }
.mc-green  { background: linear-gradient(135deg, #d1fae5, #a7f3d0); }
.mc-purple { background: linear-gradient(135deg, #ede9fe, #ddd6fe); }
.mc-orange { background: linear-gradient(135deg, #fff7ed, #fed7aa); }

.mc-icon  { font-size: 26px; flex-shrink: 0; }
.mc-content {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
  min-width: 0;
  flex: 1;
}
.mc-topline {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
  min-width: 0;
}
.mc-label {
  font-size: 12px;
  font-weight: 700;
  color: #64748b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.mc-value {
  font-size: 30px;
  font-weight: 800;
  color: #1e293b;
  line-height: 1;
  flex-shrink: 0;
}
.mc-trend { font-size: 11px; color: #94a3b8; }

.main-layout {
  display: flex;
  gap: 12px;
  width: 100%;
  min-height: 0;
  align-items: flex-start;
}

.recommendations-panel {
  flex: 1;
  min-width: 0;
}

.right-top,
.right-bottom {
  width: 100%;
}

.right-column {
  width: clamp(300px, 28vw, 380px);
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
}

.panel-radar {
  padding: 18px;
}

.panel-efficiency {
  padding: 18px;
}

.panel {
  background: #fff;
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.07);
  position: relative;
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
}

.panel-recs {
  flex: 1;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
  flex-wrap: wrap;
  gap: 6px;
  min-width: 0;
}

.panel-title {
  font-size: 14px;
  font-weight: 700;
  color: #1e293b;
  white-space: nowrap;
}

.live-badge {
  font-size: 10px;
  font-weight: 700;
  color: #10b981;
  background: rgba(16, 185, 129, 0.1);
  padding: 2px 8px;
  border-radius: 999px;
  animation: pulse 2s infinite;
  flex-shrink: 0;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.echart-box {
  width: 100%;
  height: 280px;
  flex-shrink: 0;
}

.top-cats {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 14px;
  border-top: 1px solid #f1f5f9;
  padding-top: 14px;
}

.top-cat-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  min-width: 0;
}

.cat-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.cat-name {
  flex: 1;
  color: #475569;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}

.cat-pct {
  font-weight: 700;
  color: #1e293b;
  flex-shrink: 0;
}

.header-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.sim-btn,
.refresh-btn {
  font-size: 12px;
  font-weight: 600;
  padding: 5px 12px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.sim-btn { background: #4f46e5; color: #fff; }
.sim-btn:hover { background: #4338ca; }
.sim-btn.running { background: #ef4444; }
.refresh-btn { background: #f1f5f9; color: #475569; }
.refresh-btn:hover { background: #e2e8f0; }

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  height: 200px;
  color: #94a3b8;
  font-size: 13px;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e2e8f0;
  border-top-color: #4f46e5;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.rec-cards-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 8px;
  margin-bottom: 10px;
  min-width: 0;
  width: 100%;
}

.panel-stream {
  padding: 18px;
  width: 100%;
  min-width: 0;
  max-width: 100%;
  align-self: stretch;
}

.stream-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  min-width: 0;
  max-width: 100%;
}

.stream-evt {
  display: grid;
  grid-template-columns: 58px 42px minmax(0, 1fr);
  align-items: center;
  gap: 8px;
  font-size: 12px;
  padding: 8px 10px;
  background: #f8fafc;
  border-radius: 10px;
  min-width: 0;
  width: 100%;
  max-width: 100%;
  overflow: hidden;
}

.evt-time { color: #94a3b8; min-width: 0; }
.evt-name {
  color: #334155;
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.evt-action {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 999px;
  min-width: 34px;
  max-width: 42px;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.act-view, .act-click { background: #e0edff; color: #4f46e5; }
.act-fav { background: #fee2e2; color: #ef4444; }
.act-cart { background: #fff7ed; color: #f59e0b; }
.act-buy { background: #d1fae5; color: #10b981; }
.act-skip { background: #f1f5f9; color: #94a3b8; }

.stream-item-enter-active { transition: all 0.3s ease; }
.stream-item-enter-from { opacity: 0; transform: translateY(-8px); }

.eff-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.eff-item {
  text-align: center;
  padding: 16px 10px;
  background: #f8fafc;
  border-radius: 12px;
  overflow: hidden;
}

.eff-val {
  font-size: 28px;
  font-weight: 800;
  color: #1e293b;
}

.eff-lbl {
  font-size: 12px;
  color: #94a3b8;
  margin-top: 6px;
}

@media (max-width: 1200px) {
  .main-layout {
    flex-direction: column;
  }

  .right-column {
    width: 100%;
  }

  .rec-cards-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (max-width: 900px) {
  .metrics-row {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .rec-cards-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 600px) {
  .metrics-row {
    grid-template-columns: 1fr 1fr;
  }

  .rec-cards-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
