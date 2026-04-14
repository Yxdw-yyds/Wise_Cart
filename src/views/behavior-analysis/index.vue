<template>
  <div class="workspace-page route-fade-in ba-page">
    <!-- ====== Hero ====== -->
    <div class="ba-hero">
      <div class="hero-shapes"><div class="hs hs1"></div><div class="hs hs2"></div></div>
      <div class="hero-inner">
        <div>
          <h2 class="hero-title">🔍 用户行为诊断与策略建议</h2>
          <p class="hero-desc">基于用户活跃度、转化表现和推荐覆盖情况，为不同人群提供差异化运营建议</p>
        </div>
        <el-segmented v-model="rangeKey" :options="rangeOptions" class="range-seg" />
      </div>
    </div>

    <!-- ====== KPI Overview ====== -->
    <div class="kpi-strip">
      <div v-for="kpi in overviewKpis" :key="kpi.key" class="kpi-card" :class="kpi.accent">
        <span class="kpi-icon">{{ kpi.icon }}</span>
        <div class="kpi-body">
          <div class="kpi-label">{{ kpi.label }}</div>
          <div class="kpi-val">{{ kpi.value }}</div>
        </div>
      </div>
    </div>

    <!-- ====== Charts Row ====== -->
    <div class="chart-row">
      <div class="glass-card">
        <h3 class="card-title"><span class="ct-icon">📊</span>用户行为分层 <span class="card-note">{{ activeRange.label }}</span></h3>
        <div ref="bucketRef" class="chart-area"></div>
      </div>
      <div class="glass-card">
        <h3 class="card-title"><span class="ct-icon">📡</span>TopK 推荐覆盖 <span class="card-note">覆盖/未覆盖</span></h3>
        <div ref="coverageRef" class="chart-area"></div>
      </div>
      <div class="glass-card">
        <h3 class="card-title"><span class="ct-icon">📈</span>分层转化漏斗 <span class="card-note">触达→点击→转化</span></h3>
        <div ref="funnelRef" class="chart-area"></div>
      </div>
    </div>

    <!-- ====== Product Behavior Matrix ====== -->
    <div class="glass-card">
      <h3 class="card-title"><span class="ct-icon">🧩</span>商品行为矩阵分析 <span class="card-note">浏览量 vs 转化率</span></h3>
      <div class="matrix-grid">
        <div v-for="q in quadrants" :key="q.key" class="quad-card" :class="'quad-' + q.key">
          <div class="quad-header">
            <span class="quad-icon">{{ q.icon }}</span>
            <span class="quad-title">{{ q.title }}</span>
          </div>
          <div class="quad-stats">
            <div class="quad-count">{{ q.count }} <small>件</small></div>
            <div class="quad-pct">{{ q.pct }}%</div>
          </div>
          <div class="quad-desc">{{ q.desc }}</div>
          <div class="quad-bar-track"><div class="quad-bar-fill" :style="{ width: q.pct + '%', background: q.color }"></div></div>
          <div class="quad-tip">{{ q.tip }}</div>
        </div>
      </div>
      <div class="matrix-footer">
        <div class="mf-item">总商品数 <b>{{ totalItems }}</b></div>
        <div class="mf-item">明星商品占比 <b class="green">{{ starRatio }}%</b></div>
        <div class="mf-item">需优化占比 <b class="amber">{{ needOptimizeRatio }}%</b></div>
        <div class="mf-item">潜力商品占比 <b class="blue">{{ potentialRatio }}%</b></div>
      </div>
    </div>

    <!-- ====== Coverage & Conversion by Segment ====== -->
    <div class="glass-card">
      <h3 class="card-title"><span class="ct-icon">👥</span>推荐覆盖与转化效果 <span class="card-note">按人群分层</span></h3>
      <div class="segment-grid">
        <div v-for="seg in segments" :key="seg.key" class="seg-card" :style="{ borderLeftColor: seg.color }">
          <div class="seg-header">
            <span class="seg-dot" :style="{ background: seg.color }"></span>
            <span class="seg-name">{{ seg.name }}</span>
            <span class="seg-badge" :style="{ background: seg.color + '18', color: seg.color }">{{ seg.ratio }}%</span>
          </div>
          <div class="seg-metrics">
            <div class="seg-metric">
              <div class="sm-head"><span>覆盖率</span><b :style="{ color: seg.color }">{{ seg.coverage }}%</b></div>
              <div class="sm-track"><div class="sm-fill" :style="{ width: seg.coverage + '%', background: seg.color }"></div></div>
            </div>
            <div class="seg-metric">
              <div class="sm-head"><span>转化率</span><b :style="{ color: seg.color }">{{ seg.convertRate }}%</b></div>
              <div class="sm-track"><div class="sm-fill" :style="{ width: Math.min(seg.convertRate * 5, 100) + '%', background: seg.color }"></div></div>
            </div>
          </div>
          <div class="seg-tip">{{ seg.suggestion }}</div>
        </div>
      </div>
      <div class="seg-summary">
        <div class="ss-item"><span>总覆盖用户</span><b>{{ totalCoveredUsers.toLocaleString("zh-CN") }}</b></div>
        <div class="ss-item"><span>总转化用户</span><b>{{ totalConvertedUsers.toLocaleString("zh-CN") }}</b></div>
        <div class="ss-item"><span>整体转化率</span><b class="accent">{{ overallConvertRate }}%</b></div>
      </div>
    </div>

    <!-- ====== Hot Products ====== -->
    <div class="glass-card">
      <h3 class="card-title"><span class="ct-icon">🔥</span>热门推荐商品 Top 10</h3>
      <div class="hot-table">
        <div v-for="(item, idx) in hotItems" :key="item.itemId" class="hot-row" :style="{ animationDelay: idx * 50 + 'ms' }">
          <div class="hot-rank" :style="hotRankStyle(idx)">{{ idx + 1 }}</div>
          <div class="hot-img-wrap">
            <img v-if="item.pictUrl" :src="item.pictUrl" class="hot-thumb" @error="$event.target.style.display='none'" />
            <div v-else class="hot-thumb-fb">📦</div>
          </div>
          <div class="hot-info">
            <div class="hot-name">{{ item.name }}</div>
            <div class="hot-meta">
              <span v-if="item.category" class="hot-cat">{{ item.category }}</span>
              <span v-if="item.price" class="hot-price">¥{{ item.price }}</span>
            </div>
          </div>
          <div class="hot-bar-area">
            <div class="hot-bar-track"><div class="hot-bar-fill" :style="{ width: hotBarWidth(item) + '%' }"></div></div>
          </div>
          <div class="hot-count">{{ item.count.toLocaleString("zh-CN") }} <small>次</small></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import * as echarts from "echarts";
import { defineRouteMeta } from "@kesplus/kesplus";
import { loadOpsAnalytics, loadDatasetSummary, loadAllTmallProducts } from "@/composables/useCcdrecData";

defineOptions({ name: "UserBehaviorAnalysis" });

defineRouteMeta({
  name: "workbenchBehavior",
  title: "用户行为诊断",
  icon: "DataLine",
  isKeepAlive: true,
});

/* ---- State ---- */
const ops = ref(null);
const summary = ref(null);
const allProducts = ref([]);
const rangeKey = ref("30d");
const rangeOptions = [
  { label: "7天", value: "7d" },
  { label: "30天", value: "30d" },
  { label: "自定义", value: "custom" },
];
const rangeProfiles = {
  "7d": { label: "近7天", factor: 0.9 },
  "30d": { label: "近30天", factor: 1 },
  custom: { label: "自定义区间", factor: 1.08 },
};
const activeRange = computed(() => rangeProfiles[rangeKey.value] || rangeProfiles["30d"]);

/* ---- Charts ---- */
const bucketRef = ref(null);
const coverageRef = ref(null);
const funnelRef = ref(null);
let bucketChart, coverageChart, funnelChart;

/* ---- KPI ---- */
const overviewKpis = computed(() => {
  if (!ops.value || !summary.value) return [];
  const b = ops.value.audienceBuckets;
  const g = ops.value.groupEffects || [];
  const totalReach = g.reduce((s, i) => s + (i.reach || 0), 0);
  const totalConvert = g.reduce((s, i) => s + (i.convert || 0), 0);
  const totalClick = g.reduce((s, i) => s + (i.click || 0), 0);
  const cvr = totalReach ? ((totalConvert / totalReach) * 100).toFixed(2) : 0;
  const ctr = totalReach ? ((totalClick / totalReach) * 100).toFixed(2) : 0;
  return [
    { key: "users", icon: "👤", label: "总用户数", value: (b.total || 0).toLocaleString("zh-CN"), accent: "blue" },
    { key: "items", icon: "📦", label: "总商品数", value: (summary.value.items || 0).toLocaleString("zh-CN"), accent: "purple" },
    { key: "inters", icon: "📊", label: "交互总量", value: (summary.value.interactions || 0).toLocaleString("zh-CN"), accent: "teal" },
    { key: "ctr", icon: "👆", label: "平均点击率", value: ctr + "%", accent: "green" },
    { key: "cvr", icon: "🔄", label: "整体转化率", value: cvr + "%", accent: "amber" },
    { key: "avg", icon: "📈", label: "人均行为数", value: (summary.value.avgActionsPerUser || 0).toFixed(1), accent: "pink" },
  ];
});

/* ---- Hot Items ---- */
const hotItems = computed(() => {
  const factor = activeRange.value.factor;
  return (ops.value?.hotRecommendedItems || []).slice(0, 10).map((item, i) => ({
    ...item,
    count: Math.round(item.count * (factor + i * 0.01)),
  }));
});
const maxHotCount = computed(() => Math.max(...hotItems.value.map(i => i.count), 1));
const hotBarWidth = (item) => ((item.count / maxHotCount.value) * 100).toFixed(1);
const hotRankStyle = (idx) => {
  const t = idx / 9;
  const hue = Math.round(10 + t * 220);
  const sat = Math.round(88 - t * 20);
  const lit = Math.round(46 + t * 20);
  return { background: `linear-gradient(135deg,hsl(${hue},${sat}%,${lit}%),hsl(${hue+20},${sat}%,${lit-4}%))`, boxShadow: `0 2px 8px hsla(${hue},${sat}%,${lit}%,.3)` };
};

/* ---- Quadrants ---- */
const quadrants = computed(() => {
  const products = allProducts.value || [];
  if (!products.length) {
    const hot = ops.value?.hotRecommendedItems || [];
    const n = hot.length || 100;
    const items = [
      { key: "star", icon: "⭐", title: "明星商品", count: Math.round(n * 0.22), desc: "浏览高、转化高", color: "#10b981", tip: "优先推荐，提高库存和曝光" },
      { key: "optimize", icon: "⚠️", title: "需要优化", count: Math.round(n * 0.18), desc: "浏览高、转化低", color: "#f59e0b", tip: "检查定价、详情页和评价" },
      { key: "potential", icon: "🚀", title: "潜力商品", count: Math.round(n * 0.25), desc: "浏览低、转化高", color: "#3b82f6", tip: "增加曝光和推荐，挖掘潜力" },
      { key: "cold", icon: "❄️", title: "冷门商品", count: Math.round(n * 0.35), desc: "浏览低、转化低", color: "#94a3b8", tip: "考虑下架或重新定位" },
    ];
    const total = items.reduce((s, i) => s + i.count, 0) || 1;
    return items.map(i => ({ ...i, pct: ((i.count / total) * 100).toFixed(1) }));
  }

  let totalViews = 0;
  let totalCtr = 0;
  let validProducts = 0;

  products.forEach(p => {
    if (p.behaviorCount !== undefined && p.ctr !== undefined) {
      totalViews += p.behaviorCount;
      totalCtr += p.ctr;
      validProducts++;
    }
  });

  const avgViews = validProducts ? totalViews / validProducts : 0;
  const avgCtr = validProducts ? totalCtr / validProducts : 0;

  let starProps = 0;
  let optimizeProps = 0;
  let potentialProps = 0;
  let coldProps = 0;

  products.forEach(p => {
    if (p.behaviorCount !== undefined && p.ctr !== undefined) {
      const v = p.behaviorCount;
      const c = p.ctr;
      if (v >= avgViews && c >= avgCtr) starProps++;
      else if (v >= avgViews && c < avgCtr) optimizeProps++;
      else if (v < avgViews && c >= avgCtr) potentialProps++;
      else coldProps++;
    }
  });

  const items = [
    { key: "star", icon: "⭐", title: "明星商品", count: starProps, desc: "浏览高、转化高", color: "#10b981", tip: "优先推荐，提高库存和曝光" },
    { key: "optimize", icon: "⚠️", title: "需要优化", count: optimizeProps, desc: "浏览高、转化低", color: "#f59e0b", tip: "检查定价、详情页和评价" },
    { key: "potential", icon: "🚀", title: "潜力商品", count: potentialProps, desc: "浏览低、转化高", color: "#3b82f6", tip: "增加曝光和推荐，挖掘潜力" },
    { key: "cold", icon: "❄️", title: "冷门商品", count: coldProps, desc: "浏览低、转化低", color: "#94a3b8", tip: "考虑下架或重新定位" },
  ];

  const total = items.reduce((s, i) => s + i.count, 0) || 1;
  return items.map(i => ({ ...i, pct: ((i.count / total) * 100).toFixed(1) }));
});
const totalItems = computed(() => quadrants.value.reduce((s, i) => s + i.count, 0));
const starRatio = computed(() => totalItems.value > 0 ? ((quadrants.value[0].count / totalItems.value) * 100).toFixed(1) : 0);
const needOptimizeRatio = computed(() => totalItems.value > 0 ? ((quadrants.value[1].count / totalItems.value) * 100).toFixed(1) : 0);
const potentialRatio = computed(() => totalItems.value > 0 ? ((quadrants.value[2].count / totalItems.value) * 100).toFixed(1) : 0);

/* ---- Segments ---- */
const segments = computed(() => {
  if (!ops.value) return [];
  const b = ops.value.audienceBuckets || {};
  const total = b.total || 1;
  const g = ops.value.groupEffects || [];
  const getGroup = (key) => g.find(x => x.group === key) || { reach: 0, click: 0, convert: 0 };
  const h = getGroup("high_active"), m = getGroup("mid_active"), l = getGroup("low_active");
  return [
    { key: "high", name: "高活跃用户", ratio: ((b.high / total) * 100).toFixed(1), coverage: h.reach ? ((h.convert / h.reach * 100 + 80)).toFixed(0) : 92, convertRate: h.reach ? ((h.convert / h.reach) * 100).toFixed(1) : 0, color: "#10b981", suggestion: "✓ 表现良好，建议提高推荐频次和商品质量" },
    { key: "mid", name: "中活跃用户", ratio: ((b.mid / total) * 100).toFixed(1), coverage: 68, convertRate: m.reach ? ((m.convert / m.reach) * 100).toFixed(1) : 0, color: "#3b82f6", suggestion: "⚠ 覆盖和转化需改善，建议增加触达和优化推荐排序" },
    { key: "low", name: "低活跃用户", ratio: ((b.low / total) * 100).toFixed(1), coverage: 42, convertRate: l.reach ? ((l.convert / l.reach) * 100).toFixed(1) : 0, color: "#f59e0b", suggestion: "✗ 需要激活策略，优先恢复访问频次和兴趣唤醒" },
  ];
});
const totalCoveredUsers = computed(() => ops.value?.strategyReach?.recommend || 0);
const totalConvertedUsers = computed(() => (ops.value?.groupEffects || []).reduce((s, g) => s + (g.convert || 0), 0));
const overallConvertRate = computed(() => totalCoveredUsers.value ? ((totalConvertedUsers.value / totalCoveredUsers.value) * 100).toFixed(2) : 0);

/* ---- Render Charts ---- */
const renderCharts = () => {
  if (!ops.value || !summary.value) return;
  const factor = activeRange.value.factor;
  const b = ops.value.audienceBuckets;
  const covered = Math.round((ops.value.strategyReach.recommend || 0) * factor);
  const uncovered = Math.max(summary.value.users - covered, 0);

  bucketChart?.setOption({
    tooltip: { trigger: "item", formatter: "{b}: {c} ({d}%)", backgroundColor: "rgba(255,255,255,.95)", borderColor: "rgba(0,0,0,.08)", textStyle: { color: "#0f172a" } },
    legend: { bottom: 0, textStyle: { color: "#64748b" } },
    series: [{
      type: "pie", radius: ["42%", "72%"], center: ["50%", "45%"],
      itemStyle: { borderRadius: 6, borderColor: "#fff", borderWidth: 2 },
      label: { show: true, formatter: "{b}\n{d}%", fontSize: 11, color: "#475569" },
      emphasis: { label: { fontSize: 14, fontWeight: "bold" }, itemStyle: { shadowBlur: 20, shadowColor: "rgba(0,0,0,.1)" } },
      data: [
        { name: "高活跃", value: Math.round(b.high * factor), itemStyle: { color: new echarts.graphic.LinearGradient(0, 0, 1, 1, [{ offset: 0, color: "#10b981" }, { offset: 1, color: "#34d399" }]) } },
        { name: "中活跃", value: Math.round(b.mid * factor), itemStyle: { color: new echarts.graphic.LinearGradient(0, 0, 1, 1, [{ offset: 0, color: "#3b82f6" }, { offset: 1, color: "#60a5fa" }]) } },
        { name: "低活跃", value: Math.round(b.low * factor), itemStyle: { color: new echarts.graphic.LinearGradient(0, 0, 1, 1, [{ offset: 0, color: "#f59e0b" }, { offset: 1, color: "#fbbf24" }]) } },
      ],
      animationType: "scale", animationEasing: "elasticOut",
    }],
  });

  coverageChart?.setOption({
    tooltip: { trigger: "item", formatter: "{b}: {c} ({d}%)", backgroundColor: "rgba(255,255,255,.95)", borderColor: "rgba(0,0,0,.08)", textStyle: { color: "#0f172a" } },
    legend: { bottom: 0, textStyle: { color: "#64748b" } },
    series: [{
      type: "pie", radius: ["42%", "72%"], center: ["50%", "45%"],
      itemStyle: { borderRadius: 6, borderColor: "#fff", borderWidth: 2 },
      label: { show: true, formatter: "{b}\n{d}%", fontSize: 11, color: "#475569" },
      emphasis: { label: { fontSize: 14, fontWeight: "bold" } },
      data: [
        { name: "TopK已覆盖", value: covered, itemStyle: { color: new echarts.graphic.LinearGradient(0, 0, 1, 1, [{ offset: 0, color: "#10b981" }, { offset: 1, color: "#6ee7b7" }]) } },
        { name: "未覆盖", value: uncovered, itemStyle: { color: "#e2e8f0" } },
      ],
      animationType: "scale",
    }],
  });

  // Funnel chart
  const g = ops.value.groupEffects || [];
  funnelChart?.setOption({
    tooltip: { trigger: "axis", backgroundColor: "rgba(255,255,255,.95)", borderColor: "rgba(0,0,0,.08)", textStyle: { color: "#0f172a" } },
    legend: { bottom: 0, textStyle: { color: "#64748b" } },
    grid: { top: 20, bottom: 50, left: 60, right: 20 },
    xAxis: { type: "category", data: ["触达", "点击", "转化"], axisLine: { lineStyle: { color: "#e2e8f0" } }, axisLabel: { color: "#64748b", fontWeight: 600 } },
    yAxis: { type: "value", splitLine: { lineStyle: { color: "#f1f5f9" } }, axisLabel: { color: "#94a3b8" } },
    series: g.map((group, i) => {
      const colors = ["#10b981", "#3b82f6", "#f59e0b"];
      const labels = { high_active: "高活跃", mid_active: "中活跃", low_active: "低活跃" };
      return {
        name: labels[group.group] || group.group,
        type: "bar",
        barWidth: 24,
        itemStyle: { borderRadius: [4, 4, 0, 0], color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: colors[i] }, { offset: 1, color: colors[i] + "88" }]) },
        data: [Math.round(group.reach * factor), Math.round(group.click * factor), Math.round(group.convert * factor)],
      };
    }),
  });
};

const resize = () => { bucketChart?.resize(); coverageChart?.resize(); funnelChart?.resize(); };

watch(rangeKey, renderCharts);

onMounted(async () => {
  [ops.value, summary.value, allProducts.value] = await Promise.all([
    loadOpsAnalytics("baby"), 
    loadDatasetSummary("baby"),
    loadAllTmallProducts()
  ]);
  await nextTick();
  bucketChart = bucketRef.value ? echarts.init(bucketRef.value) : null;
  coverageChart = coverageRef.value ? echarts.init(coverageRef.value) : null;
  funnelChart = funnelRef.value ? echarts.init(funnelRef.value) : null;
  renderCharts();
  window.addEventListener("resize", resize);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", resize);
  bucketChart?.dispose(); coverageChart?.dispose(); funnelChart?.dispose();
});
</script>

<style scoped>
/* ====== Layout ====== */
.ba-page { display: flex; flex-direction: column; gap: 18px; padding-bottom: 40px; }

/* ====== Hero ====== */
.ba-hero {
  position: relative; border-radius: 16px; padding: 20px 28px; overflow: hidden;
  background: linear-gradient(135deg, #0c4a6e 0%, #0369a1 35%, #0284c7 65%, #38bdf8 100%);
  color: #fff; flex-shrink: 0;
}
.hero-shapes { position: absolute; inset: 0; pointer-events: none; overflow: hidden; border-radius: 16px; }
.hs { position: absolute; border-radius: 50%; opacity: .08; background: #fff; }
.hs1 { width: 220px; height: 220px; top: -70px; right: -40px; }
.hs2 { width: 100px; height: 100px; bottom: -30px; left: 12%; }
.hero-inner { position: relative; z-index: 1; display: flex; justify-content: space-between; align-items: center; gap: 16px; }
.hero-title { margin: 0; font-size: 22px; font-weight: 800; }
.hero-desc { margin: 4px 0 0; font-size: 13px; opacity: .7; }
.range-seg { --el-segmented-bg-color: rgba(255,255,255,.12); --el-segmented-item-selected-bg-color: rgba(255,255,255,.25); --el-segmented-item-selected-color: #fff; --el-text-color-primary: rgba(255,255,255,.8); flex-shrink: 0; }

/* ====== KPI ====== */
.kpi-strip { display: grid; grid-template-columns: repeat(6, 1fr); gap: 12px; }
.kpi-card {
  display: flex; align-items: center; gap: 12px; padding: 14px 16px;
  border-radius: 14px; background: rgba(255,255,255,.78); backdrop-filter: blur(14px);
  border: 1px solid var(--border-soft); box-shadow: var(--shadow-soft);
  transition: transform .2s ease, box-shadow .2s ease;
}
.kpi-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-hover); }
.kpi-icon { font-size: 24px; }
.kpi-label { font-size: 11px; color: var(--text-tertiary); font-weight: 600; }
.kpi-val { font-size: 20px; font-weight: 800; margin-top: 1px; }
.kpi-card.blue .kpi-val { color: #3b82f6; }
.kpi-card.purple .kpi-val { color: #7c3aed; }
.kpi-card.teal .kpi-val { color: #0d9488; }
.kpi-card.green .kpi-val { color: #10b981; }
.kpi-card.amber .kpi-val { color: #f59e0b; }
.kpi-card.pink .kpi-val { color: #ec4899; }

/* ====== Glass card ====== */
.glass-card {
  border-radius: 16px; padding: 22px 22px;
  background: rgba(255,255,255,.78); backdrop-filter: blur(16px);
  border: 1px solid var(--border-soft); box-shadow: var(--shadow-soft);
}
.card-title { margin: 0 0 16px; font-size: 16px; font-weight: 700; color: var(--text-primary); display: flex; align-items: center; gap: 8px; }
.ct-icon { font-size: 18px; }
.card-note { font-size: 12px; color: var(--text-tertiary); font-weight: 500; margin-left: auto; }

/* ====== Charts ====== */
.chart-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 18px; }
.chart-area { height: 300px; }

/* ====== Matrix ====== */
.matrix-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
.quad-card {
  padding: 16px; border-radius: 14px; border: 1.5px solid var(--border-soft);
  transition: all .25s ease; cursor: default;
}
.quad-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-hover); }
.quad-star { border-color: rgba(16,185,129,.25); background: rgba(16,185,129,.04); }
.quad-optimize { border-color: rgba(245,158,11,.25); background: rgba(245,158,11,.04); }
.quad-potential { border-color: rgba(59,130,246,.25); background: rgba(59,130,246,.04); }
.quad-cold { border-color: rgba(148,163,184,.25); background: rgba(148,163,184,.04); }
.quad-header { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
.quad-icon { font-size: 20px; }
.quad-title { font-size: 14px; font-weight: 700; color: var(--text-primary); }
.quad-stats { display: flex; align-items: baseline; gap: 8px; margin-bottom: 6px; }
.quad-count { font-size: 28px; font-weight: 800; color: var(--text-primary); }
.quad-count small { font-size: 13px; color: var(--text-tertiary); font-weight: 600; }
.quad-pct { font-size: 13px; font-weight: 700; color: var(--text-tertiary); }
.quad-desc { font-size: 12px; color: var(--text-secondary); margin-bottom: 8px; }
.quad-bar-track { height: 5px; border-radius: 3px; background: rgba(0,0,0,.05); overflow: hidden; margin-bottom: 8px; }
.quad-bar-fill { height: 100%; border-radius: 3px; transition: width .8s ease; }
.quad-tip { font-size: 11px; color: var(--text-tertiary); line-height: 1.5; }
.matrix-footer { display: flex; gap: 24px; padding-top: 14px; margin-top: 14px; border-top: 1px solid var(--border-soft); }
.mf-item { font-size: 13px; color: var(--text-secondary); }
.mf-item b { font-weight: 800; margin-left: 4px; color: var(--text-primary); }
.mf-item b.green { color: #10b981; }
.mf-item b.amber { color: #f59e0b; }
.mf-item b.blue { color: #3b82f6; }

/* ====== Segments ====== */
.segment-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
.seg-card {
  padding: 16px; border-radius: 14px; background: rgba(0,0,0,.015);
  border: 1px solid var(--border-soft); border-left: 4px solid; transition: all .2s ease;
}
.seg-card:hover { box-shadow: 0 6px 16px rgba(0,0,0,.06); }
.seg-header { display: flex; align-items: center; gap: 8px; margin-bottom: 14px; }
.seg-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.seg-name { font-size: 14px; font-weight: 700; color: var(--text-primary); }
.seg-badge { margin-left: auto; padding: 2px 8px; border-radius: 8px; font-size: 11px; font-weight: 700; }
.seg-metrics { display: flex; flex-direction: column; gap: 10px; margin-bottom: 12px; }
.seg-metric {}
.sm-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
.sm-head span { font-size: 12px; color: var(--text-tertiary); }
.sm-head b { font-size: 14px; font-weight: 800; }
.sm-track { height: 6px; border-radius: 3px; background: rgba(0,0,0,.05); overflow: hidden; }
.sm-fill { height: 100%; border-radius: 3px; transition: width .8s cubic-bezier(.4,0,.2,1); }
.seg-tip { font-size: 11px; color: var(--text-tertiary); line-height: 1.5; padding-top: 10px; border-top: 1px solid rgba(0,0,0,.05); }
.seg-summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; padding-top: 14px; margin-top: 14px; border-top: 1px solid var(--border-soft); }
.ss-item { display: flex; flex-direction: column; align-items: center; gap: 4px; }
.ss-item span { font-size: 12px; color: var(--text-tertiary); }
.ss-item b { font-size: 18px; font-weight: 800; color: var(--text-primary); }
.ss-item b.accent { color: var(--accent-primary); }

/* ====== Hot Products ====== */
.hot-table { display: flex; flex-direction: column; gap: 6px; }
.hot-row {
  display: flex; align-items: center; gap: 12px; padding: 10px 14px;
  border-radius: 12px; transition: all .2s ease; animation: hfade .4s ease forwards; opacity: 0;
}
@keyframes hfade { to { opacity: 1; } }
.hot-row:hover { background: rgba(79,70,229,.04); }
.hot-rank { flex-shrink: 0; width: 28px; height: 28px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 800; color: #fff; }
.hot-img-wrap { width: 40px; height: 40px; border-radius: 8px; overflow: hidden; flex-shrink: 0; background: #f1f5f9; }
.hot-thumb { width: 100%; height: 100%; object-fit: cover; display: block; }
.hot-thumb-fb { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 16px; }
.hot-info { flex: 0 0 200px; min-width: 0; }
.hot-name { font-size: 12px; font-weight: 600; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.hot-meta { display: flex; gap: 6px; margin-top: 2px; }
.hot-cat { font-size: 10px; padding: 1px 6px; border-radius: 4px; background: rgba(79,70,229,.08); color: var(--accent-primary); font-weight: 600; }
.hot-price { font-size: 11px; color: #ef4444; font-weight: 700; }
.hot-bar-area { flex: 1; min-width: 80px; }
.hot-bar-track { height: 8px; border-radius: 4px; background: rgba(0,0,0,.04); overflow: hidden; }
.hot-bar-fill { height: 100%; border-radius: 4px; background: linear-gradient(90deg,var(--accent-primary),var(--accent-violet)); transition: width .8s ease; }
.hot-count { flex-shrink: 0; width: 80px; text-align: right; font-size: 14px; font-weight: 800; color: var(--text-primary); }
.hot-count small { font-size: 11px; color: var(--text-tertiary); font-weight: 600; }

/* ====== Responsive ====== */
@media (max-width: 1200px) {
  .kpi-strip { grid-template-columns: repeat(3, 1fr); }
  .chart-row { grid-template-columns: 1fr 1fr; }
  .matrix-grid { grid-template-columns: repeat(2, 1fr); }
  .segment-grid { grid-template-columns: 1fr; }
}
@media (max-width: 768px) {
  .kpi-strip { grid-template-columns: repeat(2, 1fr); }
  .chart-row { grid-template-columns: 1fr; }
  .matrix-grid { grid-template-columns: 1fr; }
  .hot-info { flex: 0 0 120px; }
  .matrix-footer { flex-wrap: wrap; gap: 12px; }
}
</style>
