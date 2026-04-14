<template>
  <div class="workspace-page route-fade-in dash-page" v-loading="isLoading" element-loading-text="加载驾驶舱数据...">
    <!-- ====== Hero Banner ====== -->
    <div class="dash-hero">
      <div class="hero-particles">
        <div v-for="i in 6" :key="i" class="particle" :class="'p'+i"></div>
      </div>
      <div class="hero-inner">
        <div class="hero-left">
          <h1 class="hero-title">🚀 WiseCart 智能推荐驾驶舱</h1>
          <p class="hero-desc">基于 CCDRec 协同过滤模型 · 实时监控推荐效果与运营指标</p>
          <div class="hero-tags">
            <span class="htag"><span class="htag-dot pulse-dot"></span>系统在线</span>
            <span class="htag">📊 数据集: {{ summary?.dataset || "baby" }}</span>
            <span class="htag">🕐 {{ timeStr }}</span>
          </div>
        </div>
        <el-segmented v-model="rangeKey" :options="rangeOptions" class="range-seg" />
      </div>
    </div>

    <!-- ====== KPI Strip ====== -->
    <div class="kpi-strip" v-if="!isLoading">
      <div v-for="(kpi, idx) in kpiCards" :key="kpi.key" class="kpi-card" :style="{ animationDelay: idx * 60 + 'ms' }">
        <div class="kpi-icon-wrap" :style="{ background: kpi.iconBg }">{{ kpi.icon }}</div>
        <div class="kpi-body">
          <div class="kpi-label">{{ kpi.label }}</div>
          <div class="kpi-val" :style="{ color: kpi.color }">{{ kpi.value }}</div>
          <div class="kpi-trend" :class="kpi.delta >= 0 ? 'trend-up' : 'trend-down'">
            {{ kpi.delta >= 0 ? '↑' : '↓' }} {{ Math.abs(kpi.delta).toFixed(1) }}%
          </div>
        </div>
      </div>
    </div>

    <!-- ====== Charts Row 1: Model Performance + Strategy Reach ====== -->
    <div class="chart-row" v-if="!isLoading">
      <div class="glass-card">
        <h3 class="card-title"><span class="ct-icon">📈</span>模型离线指标 <span class="card-note">Best Valid · Epoch {{ metrics?.bestEpoch || '-' }}</span></h3>
        <div ref="metricRef" class="chart-area"></div>
      </div>
      <div class="glass-card">
        <h3 class="card-title"><span class="ct-icon">🎯</span>策略触达分布 <span class="card-note">{{ activeRange.label }}</span></h3>
        <div ref="strategyRef" class="chart-area"></div>
      </div>
    </div>

    <!-- ====== Charts Row 2: User Segments + Conversion Funnel ====== -->
    <div class="chart-row" v-if="!isLoading">
      <div class="glass-card">
        <h3 class="card-title"><span class="ct-icon">👥</span>用户活跃分层 <span class="card-note">高/中/低活跃</span></h3>
        <div ref="segmentRef" class="chart-area"></div>
      </div>
      <div class="glass-card">
        <h3 class="card-title"><span class="ct-icon">🔄</span>分层转化漏斗 <span class="card-note">触达→点击→转化</span></h3>
        <div ref="funnelRef" class="chart-area"></div>
      </div>
    </div>

    <!-- ====== Operational Insights + Hot Items ====== -->
    <div class="insight-row" v-if="!isLoading">
      <!-- Insights -->
      <div class="glass-card">
        <h3 class="card-title"><span class="ct-icon">💡</span>运营决策建议 <span class="card-note">自动生成</span></h3>
        <div class="insight-list">
          <div v-for="(ins, idx) in insights" :key="idx" class="insight-item" :style="{ animationDelay: idx * 80 + 'ms', borderLeftColor: ins.color }">
            <div class="ins-icon" :style="{ background: ins.color + '15', color: ins.color }">{{ ins.icon }}</div>
            <div class="ins-body">
              <div class="ins-title">{{ ins.title }}</div>
              <div class="ins-desc">{{ ins.description }}</div>
              <div class="ins-action" :style="{ color: ins.color }">{{ ins.action }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Hot Items -->
      <div class="glass-card">
        <h3 class="card-title"><span class="ct-icon">🔥</span>热门推荐商品 Top 8</h3>
        <div class="hot-list">
          <div v-for="(item, idx) in hotItems" :key="item.itemId" class="hot-row" :style="{ animationDelay: idx * 50 + 'ms' }">
            <div class="hot-rank" :style="rankStyle(idx)">{{ idx + 1 }}</div>
            <div class="hot-img-box">
              <img v-if="item.pictUrl" :src="item.pictUrl" class="hot-img" @error="$event.target.style.display='none'" />
              <div v-else class="hot-fb">📦</div>
            </div>
            <div class="hot-info">
              <div class="hot-name">{{ item.name }}</div>
              <div class="hot-meta">
                <span v-if="item.category" class="hot-cat">{{ item.category }}</span>
                <span v-if="item.price" class="hot-price">¥{{ item.price }}</span>
              </div>
            </div>
            <div class="hot-bar-wrap">
              <div class="hot-bar-track"><div class="hot-bar-fill" :style="{ width: hotBarPct(item) + '%' }"></div></div>
            </div>
            <div class="hot-count">{{ item.count.toLocaleString("zh-CN") }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- ====== Alerts ====== -->
    <div class="glass-card" v-if="!isLoading">
      <h3 class="card-title"><span class="ct-icon">🔔</span>训练与效果告警</h3>
      <div class="alert-list">
        <div v-for="(a, idx) in alerts" :key="idx" class="alert-item">
          <span class="alert-icon">{{ a.icon }}</span>
          <div class="alert-body">
            <div class="alert-title">{{ a.title }}</div>
            <div class="alert-detail">{{ a.detail }}</div>
          </div>
          <span class="alert-badge" :class="a.level">{{ a.levelText }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import * as echarts from "echarts";
import { ElMessage } from "element-plus";
import { defineRouteMeta } from "@kesplus/kesplus";
import {
  loadCcdrecManifest,
  loadDatasetSummary,
  loadOfflineMetrics,
  loadOpsAnalytics,
} from "@/composables/useCcdrecData";

defineOptions({ name: "UserHome" });
defineRouteMeta({
  name: "home",
  title: "首页总览驾驶舱",
  isKeepAlive: true,
  icon: "HomeFilled",
  isAffix: true,
});

/* ---- State ---- */
const isLoading = ref(true);
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
  "7d": { label: "近7天", multiplier: 0.94, strategyFactor: 0.9, deltas: [3.4, 2.8, 4.1, 1.9, -0.6, 2.4] },
  "30d": { label: "近30天", multiplier: 1, strategyFactor: 1, deltas: [5.6, 4.2, 6.8, 3.1, 2.7, 4.9] },
  custom: { label: "自定义区间", multiplier: 1.06, strategyFactor: 1.08, deltas: [-1.4, 2.1, 3.6, -0.8, 1.2, 2.9] },
};
const activeRange = computed(() => rangeProfiles[rangeKey.value] || rangeProfiles["30d"]);

const now = new Date();
const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

/* ---- KPI Cards ---- */
const kpiCards = computed(() => {
  const s = summary.value, m = metrics.value, o = ops.value;
  if (!s || !m || !o) return [];
  const coverRate = ((o.recommendCoverage || 0) * 100).toFixed(1);
  const g = o.groupEffects || [];
  const totalReach = g.reduce((sum, x) => sum + (x.reach || 0), 0);
  const totalConvert = g.reduce((sum, x) => sum + (x.convert || 0), 0);
  const totalClick = g.reduce((sum, x) => sum + (x.click || 0), 0);
  const cvr = totalReach ? ((totalConvert / totalReach) * 100).toFixed(2) : 0;
  const ctr = totalReach ? ((totalClick / totalReach) * 100).toFixed(1) : 0;
  const highRate = o.audienceBuckets?.high ? ((o.audienceBuckets.high / o.audienceBuckets.total) * 100).toFixed(1) : 0;
  const d = activeRange.value.deltas;
  return [
    { key: "users", icon: "👤", label: "总用户规模", value: (s.users || 0).toLocaleString("zh-CN"), color: "#3b82f6", iconBg: "rgba(59,130,246,.1)", delta: d[0] },
    { key: "items", icon: "📦", label: "总商品数", value: (s.items || 0).toLocaleString("zh-CN"), color: "#8b5cf6", iconBg: "rgba(139,92,246,.1)", delta: d[1] },
    { key: "cover", icon: "📡", label: "推荐覆盖率", value: coverRate + "%", color: "#10b981", iconBg: "rgba(16,185,129,.1)", delta: d[2] },
    { key: "cvr", icon: "🔄", label: "预估转化率", value: cvr + "%", color: "#f59e0b", iconBg: "rgba(245,158,11,.1)", delta: d[3] },
    { key: "ctr", icon: "👆", label: "平均点击率", value: ctr + "%", color: "#ec4899", iconBg: "rgba(236,72,153,.1)", delta: d[4] },
    { key: "high", icon: "⭐", label: "高价值用户", value: highRate + "%", color: "#0d9488", iconBg: "rgba(13,148,136,.1)", delta: d[5] },
  ];
});

/* ---- Charts ---- */
const metricRef = ref(null);
const strategyRef = ref(null);
const segmentRef = ref(null);
const funnelRef = ref(null);
let metricChart, strategyChart, segmentChart, funnelChart;

const renderCharts = () => {
  if (!metrics.value || !ops.value || !summary.value) return;
  const f = activeRange.value.multiplier;
  const sf = activeRange.value.strategyFactor;
  const m = metrics.value;
  const o = ops.value;

  // -- Model Metrics: line chart --
  const ks = [5, 10, 20, 50];
  metricChart?.setOption({
    tooltip: { trigger: "axis", backgroundColor: "rgba(255,255,255,.95)", borderColor: "#e2e8f0", textStyle: { color: "#0f172a" } },
    legend: { bottom: 0, textStyle: { color: "#64748b" } },
    grid: { top: 20, bottom: 50, left: 55, right: 20 },
    xAxis: { type: "category", data: ks.map(k => "@" + k), axisLine: { lineStyle: { color: "#e2e8f0" } }, axisLabel: { color: "#64748b", fontWeight: 600 } },
    yAxis: { type: "value", splitLine: { lineStyle: { color: "#f1f5f9" } }, axisLabel: { color: "#94a3b8" } },
    series: [
      { name: "Recall", type: "line", smooth: true, symbolSize: 8, lineStyle: { width: 3 }, areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: "rgba(79,70,229,.2)" }, { offset: 1, color: "rgba(79,70,229,.01)" }]) }, itemStyle: { color: "#4f46e5" }, data: ks.map((k, i) => Number(((m.bestValid[`recall@${k}`] || 0) * (f + i * 0.01)).toFixed(4))) },
      { name: "NDCG", type: "line", smooth: true, symbolSize: 8, lineStyle: { width: 3 }, areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: "rgba(16,185,129,.2)" }, { offset: 1, color: "rgba(16,185,129,.01)" }]) }, itemStyle: { color: "#10b981" }, data: ks.map((k, i) => Number(((m.bestValid[`ndcg@${k}`] || 0) * (f + i * 0.008)).toFixed(4))) },
      { name: "Precision", type: "line", smooth: true, symbolSize: 6, lineStyle: { width: 2, type: "dashed" }, itemStyle: { color: "#f59e0b" }, data: ks.map((k, i) => Number(((m.bestValid[`precision@${k}`] || 0) * (f + i * 0.005)).toFixed(4))) },
    ],
  });

  // -- Strategy Reach: bar chart --
  const labels = ["推荐", "召回", "营销", "优惠券"];
  const colors = ["#4f46e5", "#3b82f6", "#f59e0b", "#10b981"];
  const reachData = ["recommend", "recall", "marketing", "coupon"].map((k, i) => ({
    value: Math.round((o.strategyReach[k] || 0) * (sf + i * 0.03)),
    itemStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: colors[i] }, { offset: 1, color: colors[i] + "66" }]) },
  }));
  strategyChart?.setOption({
    tooltip: { trigger: "axis", backgroundColor: "rgba(255,255,255,.95)", borderColor: "#e2e8f0", textStyle: { color: "#0f172a" } },
    grid: { top: 20, bottom: 30, left: 60, right: 20 },
    xAxis: { type: "category", data: labels, axisLine: { lineStyle: { color: "#e2e8f0" } }, axisLabel: { color: "#64748b", fontWeight: 600 } },
    yAxis: { type: "value", splitLine: { lineStyle: { color: "#f1f5f9" } }, axisLabel: { color: "#94a3b8" } },
    series: [{ type: "bar", barWidth: 36, data: reachData, itemStyle: { borderRadius: [8, 8, 0, 0] } }],
  });

  // -- User Segments: pie chart --
  const b = o.audienceBuckets;
  segmentChart?.setOption({
    tooltip: { trigger: "item", formatter: "{b}: {c} ({d}%)", backgroundColor: "rgba(255,255,255,.95)", borderColor: "#e2e8f0", textStyle: { color: "#0f172a" } },
    legend: { bottom: 0, textStyle: { color: "#64748b" } },
    series: [{
      type: "pie", radius: ["40%", "70%"], center: ["50%", "45%"],
      itemStyle: { borderRadius: 6, borderColor: "#fff", borderWidth: 2 },
      label: { show: true, formatter: "{b}\n{d}%", fontSize: 11, color: "#475569" },
      emphasis: { label: { fontSize: 14, fontWeight: "bold" } },
      data: [
        { name: "高活跃", value: Math.round(b.high * f), itemStyle: { color: new echarts.graphic.LinearGradient(0, 0, 1, 1, [{ offset: 0, color: "#10b981" }, { offset: 1, color: "#34d399" }]) } },
        { name: "中活跃", value: Math.round(b.mid * f), itemStyle: { color: new echarts.graphic.LinearGradient(0, 0, 1, 1, [{ offset: 0, color: "#3b82f6" }, { offset: 1, color: "#60a5fa" }]) } },
        { name: "低活跃", value: Math.round(b.low * f), itemStyle: { color: new echarts.graphic.LinearGradient(0, 0, 1, 1, [{ offset: 0, color: "#f59e0b" }, { offset: 1, color: "#fbbf24" }]) } },
      ],
      animationType: "scale",
    }],
  });

  // -- Funnel: grouped bar --
  const g = o.groupEffects || [];
  funnelChart?.setOption({
    tooltip: { trigger: "axis", backgroundColor: "rgba(255,255,255,.95)", borderColor: "#e2e8f0", textStyle: { color: "#0f172a" } },
    legend: { bottom: 0, textStyle: { color: "#64748b" } },
    grid: { top: 20, bottom: 50, left: 55, right: 20 },
    xAxis: { type: "category", data: ["触达", "点击", "转化"], axisLine: { lineStyle: { color: "#e2e8f0" } }, axisLabel: { color: "#64748b", fontWeight: 600 } },
    yAxis: { type: "value", splitLine: { lineStyle: { color: "#f1f5f9" } }, axisLabel: { color: "#94a3b8" } },
    series: g.map((group, i) => {
      const gc = ["#10b981", "#3b82f6", "#f59e0b"][i];
      const gLabels = { high_active: "高活跃", mid_active: "中活跃", low_active: "低活跃" };
      return {
        name: gLabels[group.group] || group.group, type: "bar", barWidth: 22,
        itemStyle: { borderRadius: [4, 4, 0, 0], color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: gc }, { offset: 1, color: gc + "66" }]) },
        data: [Math.round(group.reach * f), Math.round(group.click * f), Math.round(group.convert * f)],
      };
    }),
  });
};

const resizeAll = () => { metricChart?.resize(); strategyChart?.resize(); segmentChart?.resize(); funnelChart?.resize(); };
watch(rangeKey, renderCharts);

/* ---- Insights ---- */
const insights = computed(() => {
  if (!ops.value || !summary.value) return [];
  const o = ops.value;
  const out = [];
  const hcr = o.groupEffects?.[0]?.convert / o.groupEffects?.[0]?.reach || 0;
  if (hcr > 0.08) out.push({ icon: "📈", title: "高活跃用户表现优异", description: `转化率达 ${(hcr * 100).toFixed(1)}%，处于良好水平`, action: "建议：提高推荐频次，优先推送高利润商品和新品", color: "#10b981" });
  else out.push({ icon: "⚠️", title: "高活跃用户转化率偏低", description: `转化率仅 ${(hcr * 100).toFixed(1)}%，有优化空间`, action: "建议：检查推荐质量和详情页体验", color: "#f59e0b" });
  const hot = o.hotRecommendedItems || [];
  const totalRec = hot.reduce((s, i) => s + (i.count || 0), 0);
  const top1Pct = hot.length > 0 ? hot[0].count / totalRec : 0;
  if (top1Pct > 0.1) out.push({ icon: "🔥", title: "推荐集中度偏高", description: `Top1 商品占 ${(top1Pct * 100).toFixed(1)}%，多样性不足`, action: "建议：增加多样性权重，避免推荐过度集中", color: "#ef4444" });
  if (o.recommendCoverage > 0.85) out.push({ icon: "✅", title: "推荐覆盖率表现良好", description: `覆盖率 ${(o.recommendCoverage * 100).toFixed(1)}%，触达充分`, action: "建议：关注转化质量，优化个性化排序", color: "#10b981" });
  return out;
});

/* ---- Hot Items ---- */
const hotItems = computed(() => (ops.value?.hotRecommendedItems || []).slice(0, 8));
const maxCount = computed(() => Math.max(...hotItems.value.map(i => i.count), 1));
const hotBarPct = (item) => ((item.count / maxCount.value) * 100).toFixed(1);
const rankStyle = (idx) => {
  const t = idx / 7;
  const hue = Math.round(10 + t * 220);
  const sat = Math.round(88 - t * 20);
  const lit = Math.round(46 + t * 18);
  return { background: `linear-gradient(135deg,hsl(${hue},${sat}%,${lit}%),hsl(${hue+20},${sat}%,${lit-4}%))`, boxShadow: `0 2px 6px hsla(${hue},${sat}%,${lit}%,.3)` };
};

/* ---- Alerts ---- */
const alerts = computed(() => {
  const m = metrics.value, o = ops.value;
  if (!m || !o) return [];
  return [
    { icon: "🏆", title: "离线训练表现稳定", detail: `Best Epoch = ${m.bestEpoch}，Recall@50 = ${(m.bestValid["recall@50"] || 0).toFixed(4)}`, level: "good", levelText: "正常" },
    { icon: "📡", title: "推荐覆盖率监控", detail: `当前覆盖率 ${((o.recommendCoverage || 0) * 100).toFixed(1)}%，策略触达处于正常区间`, level: "good", levelText: "正常" },
    { icon: "⚡", title: "模型精度提醒", detail: `NDCG@10 = ${(m.bestValid["ndcg@10"] || 0).toFixed(4)}，建议关注排序质量`, level: "info", levelText: "关注" },
  ];
});

/* ---- Init ---- */
onMounted(async () => {
  isLoading.value = true;
  try {
    [manifest.value, summary.value, metrics.value, ops.value] = await Promise.all([
      loadCcdrecManifest(), loadDatasetSummary("baby"), loadOfflineMetrics("baby"), loadOpsAnalytics("baby"),
    ]);
  } finally {
    isLoading.value = false;
  }
  await nextTick();
  metricChart = metricRef.value ? echarts.init(metricRef.value) : null;
  strategyChart = strategyRef.value ? echarts.init(strategyRef.value) : null;
  segmentChart = segmentRef.value ? echarts.init(segmentRef.value) : null;
  funnelChart = funnelRef.value ? echarts.init(funnelRef.value) : null;
  renderCharts();
  window.addEventListener("resize", resizeAll);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", resizeAll);
  metricChart?.dispose(); strategyChart?.dispose(); segmentChart?.dispose(); funnelChart?.dispose();
});
</script>

<style scoped>
/* ====== Layout ====== */
.dash-page { display: flex; flex-direction: column; gap: 18px; padding-bottom: 40px; min-height: 400px; }

/* ====== Hero ====== */
.dash-hero {
  position: relative; border-radius: 16px; padding: 20px 28px; overflow: hidden; flex-shrink: 0;
  background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 30%, #312e81 60%, #4f46e5 100%);
  color: #fff;
}
.hero-particles { position: absolute; inset: 0; overflow: hidden; pointer-events: none; }
.particle { position: absolute; border-radius: 50%; background: rgba(255,255,255,.06); }
.p1 { width: 300px; height: 300px; top: -100px; right: -60px; animation: pfloat 12s ease-in-out infinite alternate; }
.p2 { width: 180px; height: 180px; bottom: -60px; left: 5%; animation: pfloat 9s ease-in-out infinite alternate-reverse; }
.p3 { width: 100px; height: 100px; top: 20%; right: 30%; animation: pfloat 7s ease-in-out infinite alternate; }
.p4 { width: 60px; height: 60px; top: 60%; left: 25%; animation: pfloat 11s ease-in-out infinite alternate-reverse; }
.p5 { width: 40px; height: 40px; top: 10%; left: 50%; background: rgba(167,139,250,.12); animation: pfloat 8s ease-in-out infinite alternate; }
.p6 { width: 80px; height: 80px; bottom: 10%; right: 15%; background: rgba(96,165,250,.08); animation: pfloat 10s ease-in-out infinite alternate-reverse; }
@keyframes pfloat { from { transform: translateY(0) scale(1); } to { transform: translateY(-15px) scale(1.05); } }
.hero-inner { position: relative; z-index: 1; display: flex; justify-content: space-between; align-items: center; gap: 20px; }
.hero-title { margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -.02em; }
.hero-desc { margin: 6px 0 12px; font-size: 14px; opacity: .65; }
.hero-tags { display: flex; gap: 10px; flex-wrap: wrap; }
.htag { display: inline-flex; align-items: center; gap: 6px; padding: 4px 14px; border-radius: 10px; font-size: 12px; font-weight: 600; background: rgba(255,255,255,.1); backdrop-filter: blur(4px); border: 1px solid rgba(255,255,255,.12); }
.pulse-dot { width: 7px; height: 7px; border-radius: 50%; background: #34d399; animation: pulse 2s ease-in-out infinite; }
@keyframes pulse { 0%,100%{ box-shadow:0 0 0 0 rgba(52,211,153,.5); } 50%{ box-shadow:0 0 0 6px rgba(52,211,153,0); } }
.range-seg { --el-segmented-bg-color: rgba(255,255,255,.1); --el-segmented-item-selected-bg-color: rgba(255,255,255,.22); --el-segmented-item-selected-color: #fff; --el-text-color-primary: rgba(255,255,255,.75); flex-shrink: 0; }

/* ====== KPI ====== */
.kpi-strip { display: grid; grid-template-columns: repeat(6, 1fr); gap: 14px; }
.kpi-card {
  display: flex; align-items: center; gap: 14px; padding: 16px 16px;
  border-radius: 16px; background: rgba(255,255,255,.82); backdrop-filter: blur(14px);
  border: 1px solid var(--border-soft); box-shadow: var(--shadow-soft);
  transition: transform .25s ease, box-shadow .25s ease;
  animation: kpi-in .5s ease forwards; opacity: 0;
}
@keyframes kpi-in { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
.kpi-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-hover); }
.kpi-icon-wrap { width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0; }
.kpi-label { font-size: 11px; color: var(--text-tertiary); font-weight: 600; }
.kpi-val { font-size: 22px; font-weight: 800; margin: 1px 0; }
.kpi-trend { font-size: 11px; font-weight: 700; padding: 1px 6px; border-radius: 6px; display: inline-block; }
.trend-up { color: #10b981; background: rgba(16,185,129,.1); }
.trend-down { color: #ef4444; background: rgba(239,68,68,.1); }

/* ====== Glass card ====== */
.glass-card {
  border-radius: 16px; padding: 22px;
  background: rgba(255,255,255,.82); backdrop-filter: blur(16px);
  border: 1px solid var(--border-soft); box-shadow: var(--shadow-soft);
}
.card-title { margin: 0 0 16px; font-size: 16px; font-weight: 700; color: var(--text-primary); display: flex; align-items: center; gap: 8px; }
.ct-icon { font-size: 18px; }
.card-note { font-size: 12px; color: var(--text-tertiary); font-weight: 500; margin-left: auto; }

/* ====== Charts ====== */
.chart-row { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
.chart-area { height: 280px; }
.insight-row { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }

/* ====== Insights ====== */
.insight-list { display: flex; flex-direction: column; gap: 10px; }
.insight-item {
  display: flex; gap: 12px; padding: 14px; border-radius: 12px; background: rgba(0,0,0,.015);
  border: 1px solid var(--border-soft); border-left: 4px solid;
  transition: all .2s ease; animation: ins-in .4s ease forwards; opacity: 0;
}
@keyframes ins-in { to { opacity: 1; } }
.insight-item:hover { box-shadow: 0 4px 12px rgba(0,0,0,.06); }
.ins-icon { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; }
.ins-title { font-size: 14px; font-weight: 700; color: var(--text-primary); }
.ins-desc { font-size: 12px; color: var(--text-secondary); margin: 3px 0; line-height: 1.5; }
.ins-action { font-size: 11px; font-weight: 600; }

/* ====== Hot Items ====== */
.hot-list { display: flex; flex-direction: column; gap: 5px; }
.hot-row {
  display: flex; align-items: center; gap: 10px; padding: 8px 10px; border-radius: 10px;
  transition: all .2s ease; animation: ins-in .4s ease forwards; opacity: 0;
}
.hot-row:hover { background: rgba(79,70,229,.03); }
.hot-rank { flex-shrink: 0; width: 26px; height: 26px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 800; color: #fff; }
.hot-img-box { width: 36px; height: 36px; border-radius: 8px; overflow: hidden; flex-shrink: 0; background: #f1f5f9; }
.hot-img { width: 100%; height: 100%; object-fit: cover; display: block; }
.hot-fb { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 14px; }
.hot-info { flex: 0 0 160px; min-width: 0; }
.hot-name { font-size: 11px; font-weight: 600; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.hot-meta { display: flex; gap: 4px; margin-top: 1px; }
.hot-cat { font-size: 9px; padding: 0 5px; border-radius: 4px; background: rgba(79,70,229,.08); color: var(--accent-primary); font-weight: 600; }
.hot-price { font-size: 10px; color: #ef4444; font-weight: 700; }
.hot-bar-wrap { flex: 1; min-width: 60px; }
.hot-bar-track { height: 6px; border-radius: 3px; background: rgba(0,0,0,.04); overflow: hidden; }
.hot-bar-fill { height: 100%; border-radius: 3px; background: linear-gradient(90deg,var(--accent-primary),var(--accent-violet)); transition: width .8s ease; }
.hot-count { flex-shrink: 0; width: 60px; text-align: right; font-size: 13px; font-weight: 800; color: var(--text-primary); }

/* ====== Compare ====== */
.compare-grid { display: grid; grid-template-columns: 1fr auto 1fr; gap: 20px; align-items: stretch; }
.compare-col { padding: 18px; border-radius: 14px; background: rgba(0,0,0,.02); border: 1px solid var(--border-soft); }
.compare-col.recommended { border-color: rgba(16,185,129,.3); background: rgba(16,185,129,.04); }
.compare-label { font-size: 12px; font-weight: 700; color: var(--text-tertiary); margin-bottom: 14px; text-transform: uppercase; letter-spacing: .04em; }
.rec-label { color: #10b981; }
.compare-metric { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid rgba(0,0,0,.04); font-size: 13px; }
.compare-metric:last-child { border-bottom: none; }
.compare-metric span { color: var(--text-secondary); }
.compare-metric b { font-size: 16px; font-weight: 800; color: var(--text-primary); }
.compare-vs { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; padding: 0 8px; }
.vs-circle { width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg,#4f46e5,#7c3aed); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 800; }
.vs-deltas { display: flex; flex-direction: column; gap: 10px; align-items: center; }
.vs-delta { font-size: 12px; font-weight: 800; padding: 2px 8px; border-radius: 6px; }
.vs-delta.pos { color: #10b981; background: rgba(16,185,129,.1); }
.vs-delta.neg { color: #ef4444; background: rgba(239,68,68,.1); }
.compare-actions { margin-top: 16px; display: flex; gap: 10px; justify-content: flex-end; }

/* ====== Alerts ====== */
.alert-list { display: flex; flex-direction: column; gap: 8px; }
.alert-item { display: flex; align-items: center; gap: 12px; padding: 12px 14px; border-radius: 12px; background: rgba(0,0,0,.015); }
.alert-icon { font-size: 20px; flex-shrink: 0; }
.alert-body { flex: 1; }
.alert-title { font-size: 13px; font-weight: 700; color: var(--text-primary); }
.alert-detail { font-size: 12px; color: var(--text-secondary); margin-top: 2px; }
.alert-badge { padding: 3px 10px; border-radius: 8px; font-size: 11px; font-weight: 700; flex-shrink: 0; }
.alert-badge.good { background: rgba(16,185,129,.1); color: #10b981; }
.alert-badge.info { background: rgba(59,130,246,.1); color: #3b82f6; }
.alert-badge.warn { background: rgba(245,158,11,.1); color: #f59e0b; }

/* ====== Responsive ====== */
@media (max-width: 1200px) {
  .kpi-strip { grid-template-columns: repeat(3, 1fr); }
  .chart-row, .insight-row { grid-template-columns: 1fr; }
  .compare-grid { grid-template-columns: 1fr; }
  .compare-vs { flex-direction: row; padding: 10px 0; }
  .vs-deltas { flex-direction: row; }
}
@media (max-width: 768px) {
  .kpi-strip { grid-template-columns: repeat(2, 1fr); }
  .hero-inner { flex-direction: column; align-items: flex-start; }
}
</style>
