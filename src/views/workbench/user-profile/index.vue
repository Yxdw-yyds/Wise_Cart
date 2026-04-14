<template>
  <div class="workspace-page route-fade-in profile-page">
    <!-- ====== Hero ====== -->
    <div class="profile-hero">
      <div class="hero-shapes"><div class="hs hs1"></div><div class="hs hs2"></div></div>
      <div class="hero-inner">
        <div>
          <h2 class="hero-title">🎨 用户画像分析</h2>
          <p class="hero-desc">管理员工作台 · 基于行为日志构建用户兴趣模型</p>
        </div>
        <div class="hero-badges">
          <span class="hbadge">📊 行为事件数: {{ behaviorLog.length }}</span>
          <span class="hbadge">📂 偏好分类: {{ percentItems.length }}</span>
        </div>
      </div>
    </div>

    <!-- ====== KPI Strip ====== -->
    <div class="kpi-strip">
      <div class="kpi-card blue">
        <span class="kpi-icon">🎯</span>
        <div class="kpi-body"><div class="kpi-label">第一偏好</div><div class="kpi-val">{{ percentItems[0]?.label || "-" }}</div></div>
      </div>
      <div class="kpi-card purple">
        <span class="kpi-icon">📌</span>
        <div class="kpi-body"><div class="kpi-label">第二偏好</div><div class="kpi-val">{{ percentItems[1]?.label || "-" }}</div></div>
      </div>
      <div class="kpi-card green">
        <span class="kpi-icon">📝</span>
        <div class="kpi-body"><div class="kpi-label">行为事件数</div><div class="kpi-val">{{ behaviorLog.length }}</div></div>
      </div>
      <div class="kpi-card amber">
        <span class="kpi-icon">🏷️</span>
        <div class="kpi-body"><div class="kpi-label">用户标签</div><div class="kpi-val">{{ userProfile.tags?.length || 0 }} 个</div></div>
      </div>
    </div>

    <!-- ====== Tags ====== -->
    <div class="glass-card" v-if="userProfile.tags && userProfile.tags.length">
      <h3 class="card-title"><span class="ct-icon">🏷️</span>用户标签</h3>
      <div class="tags-wrap">
        <span v-for="tag in userProfile.tags" :key="tag" class="utag">{{ tag }}</span>
      </div>
    </div>

    <!-- ====== Radar + Distribution ====== -->
    <div class="chart-row">
      <div class="glass-card">
        <h3 class="card-title"><span class="ct-icon">🕸️</span>兴趣分布雷达 <span class="card-note">品类偏好占比</span></h3>
        <div ref="radarRef" class="chart-area"></div>
      </div>
      <div class="glass-card">
        <h3 class="card-title"><span class="ct-icon">📊</span>偏好占比分布</h3>
        <div class="pct-list">
          <div v-for="(item, idx) in percentItems" :key="item.key" class="pct-row" :style="{ animationDelay: idx * 60 + 'ms' }">
            <span class="pct-rank" :style="rankStyle(idx)">{{ idx + 1 }}</span>
            <span class="pct-label">{{ item.label }}</span>
            <div class="pct-bar-track"><div class="pct-bar-fill" :style="{ width: item.percent + '%', background: pctColor(idx) }"></div></div>
            <span class="pct-val" :style="{ color: pctColor(idx) }">{{ item.percent.toFixed(1) }}%</span>
          </div>
        </div>
      </div>
    </div>

    <!-- ====== Timeline ====== -->
    <div class="glass-card">
      <h3 class="card-title"><span class="ct-icon">📅</span>近期行为时间线 <span class="card-note">最近 8 条</span></h3>
      <div class="timeline-list">
        <div v-for="(item, idx) in timelineItems" :key="`${item.productId}-${item.ts}`" class="tl-item" :style="{ animationDelay: idx * 60 + 'ms' }">
          <div class="tl-dot" :class="'tl-' + item.action"></div>
          <div class="tl-content">
            <div class="tl-head">
              <span class="tl-action-badge" :class="'tl-' + item.action">{{ item.actionText }}</span>
              <span class="tl-product">{{ item.productName }}</span>
            </div>
            <div class="tl-meta">{{ item.categoryName }} · {{ item.detail }}</div>
          </div>
          <div class="tl-time">{{ item.timeText }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import dayjs from "dayjs";
import * as echarts from "echarts";
import { defineRouteMeta } from "@kesplus/kesplus";
import { useUserMallData } from "@/composables/useUserMallData";

defineOptions({ name: "用户画像页面" });
defineRouteMeta({
  name: "workbenchUserProfile",
  title: "用户画像",
  icon: "PieChart",
  isKeepAlive: true,
});

const radarRef = ref(null);
let radarChart;

const { userProfile, categoryLabels, behaviorLog, products } = useUserMallData();

const percentItems = computed(() =>
  Object.entries(userProfile.value.categoryPercents)
    .map(([key, percent]) => ({ key, label: categoryLabels[key] || key, percent }))
    .sort((a, b) => b.percent - a.percent)
);

const PALETTE = ["#4f46e5", "#3b82f6", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6", "#0d9488", "#ef4444"];
const pctColor = (idx) => PALETTE[idx % PALETTE.length];
const rankStyle = (idx) => {
  const c = pctColor(idx);
  return { background: c, boxShadow: `0 2px 6px ${c}55` };
};

const productMap = computed(() => Object.fromEntries(products.value.map((item) => [item.id, item])));
const actionLabelMap = { view: "浏览", fav: "收藏", cart: "加购", buy: "购买" };

const timelineItems = computed(() =>
  [...behaviorLog.value]
    .sort((a, b) => b.ts - a.ts)
    .slice(0, 8)
    .map((event) => {
      const product = productMap.value[event.productId];
      return {
        ...event,
        productName: product?.name || `商品 ${event.productId}`,
        categoryName: categoryLabels[event.category] || event.category,
        actionText: actionLabelMap[event.action] || "行为",
        detail: `${product?.shop || "未知店铺"} / ${dayjs(event.ts).format("MM-DD HH:mm")}`,
        timeText: dayjs(event.ts).format("YYYY-MM-DD HH:mm"),
      };
    })
);

const renderRadar = () => {
  if (!radarChart || !percentItems.value.length) return;
  radarChart.setOption({
    tooltip: { trigger: "item", backgroundColor: "rgba(255,255,255,.95)", borderColor: "#e2e8f0", textStyle: { color: "#0f172a" } },
    radar: {
      radius: "60%",
      axisName: { color: "#475569", fontSize: 12, fontWeight: 600 },
      splitArea: { areaStyle: { color: ["rgba(79,70,229,.02)", "rgba(79,70,229,.04)", "rgba(79,70,229,.06)", "rgba(79,70,229,.08)"] } },
      splitLine: { lineStyle: { color: "rgba(79,70,229,.1)" } },
      axisLine: { lineStyle: { color: "rgba(79,70,229,.15)" } },
      indicator: percentItems.value.map((item) => ({ name: item.label, max: 40 })),
    },
    series: [{
      type: "radar",
      areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: "rgba(79,70,229,.25)" }, { offset: 1, color: "rgba(79,70,229,.05)" }]) },
      lineStyle: { width: 2.5, color: "#4f46e5" },
      itemStyle: { color: "#4f46e5" },
      symbol: "circle", symbolSize: 6,
      data: [{ value: percentItems.value.map((item) => item.percent), name: "分类占比" }],
    }],
  });
};

const resize = () => radarChart?.resize();

onMounted(async () => {
  await nextTick();
  radarChart = radarRef.value ? echarts.init(radarRef.value) : null;
  renderRadar();
  window.addEventListener("resize", resize);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", resize);
  radarChart?.dispose();
});
</script>

<style scoped>
/* ====== Layout ====== */
.profile-page { display: flex; flex-direction: column; gap: 18px; padding-bottom: 40px; }

/* ====== Hero ====== */
.profile-hero {
  position: relative; border-radius: 16px; padding: 20px 28px; overflow: hidden; flex-shrink: 0;
  background: linear-gradient(135deg, #134e4a 0%, #0d9488 35%, #14b8a6 65%, #2dd4bf 100%);
  color: #fff;
}
.hero-shapes { position: absolute; inset: 0; pointer-events: none; overflow: hidden; border-radius: 16px; }
.hs { position: absolute; border-radius: 50%; opacity: .08; background: #fff; }
.hs1 { width: 200px; height: 200px; top: -60px; right: -40px; }
.hs2 { width: 100px; height: 100px; bottom: -30px; left: 10%; }
.hero-inner { position: relative; z-index: 1; display: flex; justify-content: space-between; align-items: center; gap: 16px; }
.hero-title { margin: 0; font-size: 22px; font-weight: 800; }
.hero-desc { margin: 4px 0 0; font-size: 13px; opacity: .7; }
.hero-badges { display: flex; gap: 10px; }
.hbadge { padding: 4px 14px; border-radius: 10px; font-size: 12px; font-weight: 600; background: rgba(255,255,255,.12); border: 1px solid rgba(255,255,255,.15); }

/* ====== KPI ====== */
.kpi-strip { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
.kpi-card {
  display: flex; align-items: center; gap: 12px; padding: 16px;
  border-radius: 16px; background: rgba(255,255,255,.82); backdrop-filter: blur(14px);
  border: 1px solid var(--border-soft); box-shadow: var(--shadow-soft);
  transition: transform .2s ease, box-shadow .2s ease;
}
.kpi-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-hover); }
.kpi-icon { font-size: 24px; }
.kpi-label { font-size: 11px; color: var(--text-tertiary); font-weight: 600; }
.kpi-val { font-size: 18px; font-weight: 800; margin-top: 2px; }
.kpi-card.blue .kpi-val { color: #3b82f6; }
.kpi-card.purple .kpi-val { color: #7c3aed; }
.kpi-card.green .kpi-val { color: #10b981; }
.kpi-card.amber .kpi-val { color: #f59e0b; }

/* ====== Glass card ====== */
.glass-card {
  border-radius: 16px; padding: 22px;
  background: rgba(255,255,255,.82); backdrop-filter: blur(16px);
  border: 1px solid var(--border-soft); box-shadow: var(--shadow-soft);
}
.card-title { margin: 0 0 16px; font-size: 16px; font-weight: 700; color: var(--text-primary); display: flex; align-items: center; gap: 8px; }
.ct-icon { font-size: 18px; }
.card-note { font-size: 12px; color: var(--text-tertiary); font-weight: 500; margin-left: auto; }

/* ====== Tags ====== */
.tags-wrap { display: flex; flex-wrap: wrap; gap: 8px; }
.utag { padding: 6px 14px; border-radius: 20px; background: linear-gradient(135deg, rgba(79,70,229,.08), rgba(139,92,246,.1)); color: var(--accent-primary); font-size: 12px; font-weight: 600; border: 1px solid rgba(79,70,229,.12); transition: all .2s ease; }
.utag:hover { background: linear-gradient(135deg, rgba(79,70,229,.12), rgba(139,92,246,.16)); transform: translateY(-1px); }

/* ====== Charts ====== */
.chart-row { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
.chart-area { height: 320px; }

/* ====== Percent list ====== */
.pct-list { display: flex; flex-direction: column; gap: 10px; }
.pct-row {
  display: flex; align-items: center; gap: 10px; padding: 8px 12px;
  border-radius: 10px; transition: all .2s ease;
  animation: pfade .4s ease forwards; opacity: 0;
}
@keyframes pfade { to { opacity: 1; } }
.pct-row:hover { background: rgba(0,0,0,.02); }
.pct-rank { flex-shrink: 0; width: 24px; height: 24px; border-radius: 7px; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 800; color: #fff; }
.pct-label { flex-shrink: 0; width: 80px; font-size: 13px; font-weight: 600; color: var(--text-primary); }
.pct-bar-track { flex: 1; height: 8px; border-radius: 4px; background: rgba(0,0,0,.04); overflow: hidden; }
.pct-bar-fill { height: 100%; border-radius: 4px; transition: width .8s ease; }
.pct-val { flex-shrink: 0; width: 50px; text-align: right; font-size: 14px; font-weight: 800; }

/* ====== Timeline ====== */
.timeline-list { display: flex; flex-direction: column; gap: 4px; }
.tl-item {
  display: flex; align-items: center; gap: 12px; padding: 10px 14px; border-radius: 10px;
  transition: all .2s ease; animation: pfade .4s ease forwards; opacity: 0;
}
.tl-item:hover { background: rgba(0,0,0,.02); }
.tl-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.tl-dot.tl-view { background: #3b82f6; }
.tl-dot.tl-fav { background: #f59e0b; }
.tl-dot.tl-cart { background: #8b5cf6; }
.tl-dot.tl-buy { background: #10b981; }
.tl-content { flex: 1; min-width: 0; }
.tl-head { display: flex; align-items: center; gap: 8px; }
.tl-action-badge { padding: 2px 8px; border-radius: 6px; font-size: 11px; font-weight: 700; }
.tl-action-badge.tl-view { background: rgba(59,130,246,.1); color: #3b82f6; }
.tl-action-badge.tl-fav { background: rgba(245,158,11,.1); color: #f59e0b; }
.tl-action-badge.tl-cart { background: rgba(139,92,246,.1); color: #8b5cf6; }
.tl-action-badge.tl-buy { background: rgba(16,185,129,.1); color: #10b981; }
.tl-product { font-size: 13px; font-weight: 600; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.tl-meta { font-size: 11px; color: var(--text-tertiary); margin-top: 2px; }
.tl-time { flex-shrink: 0; font-size: 11px; color: var(--text-tertiary); font-weight: 600; }

/* ====== Responsive ====== */
@media (max-width: 1200px) {
  .kpi-strip { grid-template-columns: repeat(2, 1fr); }
  .chart-row { grid-template-columns: 1fr; }
}
@media (max-width: 768px) {
  .kpi-strip { grid-template-columns: 1fr; }
}
</style>
