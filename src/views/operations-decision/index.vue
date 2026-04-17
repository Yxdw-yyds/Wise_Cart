<template>
  <div class="workspace-page route-fade-in ops-page">
    <div class="ops-hero">
      <div class="hero-shapes"><div class="hs hs1"></div><div class="hs hs2"></div><div class="hs hs3"></div></div>
      <div class="hero-inner">
        <div>
          <h2 class="hero-title">📊 推荐触达分析与效果预估</h2>
          <p class="hero-desc">基于 TopK 推荐结果、商品 CTR 与用户分层，复算推荐覆盖、类目曝光和分层质量</p>
        </div>
        <div class="hero-badges">
          <span class="hbadge"><span class="hbadge-dot pulse-green"></span>离线分析</span>
          <span class="hbadge">数据集: baby/Tmall</span>
        </div>
      </div>
    </div>

    <div class="kpi-strip">
      <div v-for="kpi in kpiCards" :key="kpi.key" class="kpi-box" :class="kpi.accent">
        <div class="kpi-icon">{{ kpi.icon }}</div>
        <div class="kpi-body">
          <div class="kpi-label">{{ kpi.label }}</div>
          <div class="kpi-val"><CountUp :value="kpi.value" :suffix="kpi.suffix" /></div>
          <div class="kpi-sub">{{ kpi.note }}</div>
        </div>
      </div>
    </div>

    <div class="insight-row">
      <div class="glass-card">
        <h3 class="card-title"><span class="ct-icon">🎯</span>推荐类目曝光</h3>
        <div class="reach-list">
          <div v-for="item in categoryExposureItems" :key="item.name" class="reach-item">
            <div class="reach-head">
              <span class="reach-label">{{ item.name }}</span>
              <div class="reach-nums">
                <b>{{ item.count.toLocaleString("zh-CN") }}</b>
                <span class="reach-pct">{{ item.rate }}%</span>
              </div>
            </div>
            <div class="reach-track">
              <div class="reach-fill" :style="{ width: item.rate + '%', background: item.color }"></div>
            </div>
          </div>
        </div>
      </div>

      <div class="glass-card">
        <h3 class="card-title"><span class="ct-icon">👥</span>人群分层结构</h3>
        <div class="bucket-list">
          <div v-for="item in bucketItems" :key="item.key" class="bucket-item">
            <div class="bucket-head">
              <span class="bucket-dot" :style="{ background: item.color }"></span>
              <span class="bucket-name">{{ item.label }}</span>
              <span class="bucket-count">{{ item.count.toLocaleString("zh-CN") }} 人</span>
              <span class="bucket-badge">{{ item.rate }}%</span>
            </div>
            <div class="bucket-bar-track">
              <div class="bucket-bar-fill" :style="{ width: item.rate + '%', background: item.color }"></div>
            </div>
            <div class="bucket-metrics">
              <div class="bm-item">
                <span class="bm-label">覆盖用户</span>
                <b class="bm-val">{{ item.reach }}</b>
              </div>
              <div class="bm-item">
                <span class="bm-label">覆盖率</span>
                <b class="bm-val">{{ item.coverage }}</b>
              </div>
              <div class="bm-item">
                <span class="bm-label">预估点击</span>
                <b class="bm-val">{{ item.click }}</b>
              </div>
              <div class="bm-item">
                <span class="bm-label">预估转化</span>
                <b class="bm-val">{{ item.convert }}</b>
              </div>
              <div class="bm-item">
                <span class="bm-label">点击率</span>
                <span class="cvr-badge" :class="item.cvrClass">{{ item.ctr }}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="glass-card summary-panel">
      <div class="sp-header">
        <h3 class="card-title"><span class="ct-icon">⚙️</span>推荐触达概览</h3>
      </div>
      <div class="preview-strip">
        <div class="preview-item">
          <span class="pv-label">推荐曝光量</span>
          <span class="pv-val">{{ recommendationStats.exposureCount.toLocaleString("zh-CN") }}</span>
        </div>
        <div class="preview-divider"></div>
        <div class="preview-item">
          <span class="pv-label">人均推荐位</span>
          <span class="pv-val accent">{{ recommendationStats.avgItemsPerUser.toFixed(1) }}</span>
        </div>
        <div class="preview-divider"></div>
        <div class="preview-item">
          <span class="pv-label">触达商品数</span>
          <span class="pv-val">{{ recommendationStats.uniqueRecommendedItems.toLocaleString("zh-CN") }}</span>
        </div>
        <div class="preview-divider"></div>
        <div class="preview-item">
          <span class="pv-label">平均商品 CTR</span>
          <span class="pv-val green">{{ recommendationStats.avgCtr.toFixed(2) }}%</span>
        </div>
        <div class="preview-divider"></div>
        <div class="preview-item">
          <span class="pv-label">Top1 集中度</span>
          <span class="pv-val" :class="recommendationStats.top1Concentration >= 8 ? 'orange' : 'green'">{{ recommendationStats.top1Concentration.toFixed(2) }}%</span>
        </div>
      </div>
    </div>

    <div class="insight-row insight-row--full">
      <div class="glass-card">
        <h3 class="card-title"><span class="ct-icon">💴</span>价格带曝光分布</h3>
        <div class="compare-grid">
          <div v-for="item in priceBandItems" :key="item.name" class="compare-box">
            <div class="compare-label">{{ item.name }}</div>
            <div class="compare-vals">
              <div class="compare-current">
                <span class="cv-val">{{ item.count.toLocaleString("zh-CN") }}</span>
                <span class="cv-tag">曝光量</span>
              </div>
              <span class="compare-arrow up">{{ item.rate }}%</span>
              <div class="compare-baseline">
                <span class="cv-val dim">{{ item.perUser }}</span>
                <span class="cv-tag dim">人均曝光</span>
              </div>
            </div>
            <div class="compare-track">
              <div class="compare-fill" :style="{ width: item.rate + '%' }"></div>
            </div>
          </div>
        </div>
      </div>

    </div>

  </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { defineRouteMeta } from "@kesplus/kesplus";
import { loadOpsAnalytics } from "@/composables/useCcdrecData";

defineOptions({ name: "WorkbenchOperationsDecisionPage" });

defineRouteMeta({
  name: "workbenchOperationsDecision",
  title: "运营决策",
  icon: "Operation",
  isKeepAlive: true,
});

const CountUp = {
  props: { value: { type: [Number, String], default: 0 }, suffix: { type: String, default: "" } },
  setup(props) {
    return () => {
      const target = typeof props.value === "number" ? props.value : parseFloat(props.value) || 0;
      return props.suffix === "%"
        ? `${target}${props.suffix}`
        : `${Math.round(target).toLocaleString("zh-CN")}${props.suffix}`;
    };
  },
};

const ops = ref(null);
const recommendationStats = computed(() => ops.value?.recommendationStats || {
  coveredUsers: 0,
  exposureCount: 0,
  avgItemsPerUser: 0,
  uniqueRecommendedItems: 0,
  avgCtr: 0,
  expectedClicks: 0,
  expectedConversions: 0,
  top1Concentration: 0,
  categoryExposure: [],
  priceBandExposure: [],
});

const totalAudience = computed(() => ops.value?.audienceBuckets?.total ?? 0);
const recommendCoverageRate = computed(() =>
  totalAudience.value ? Number(((recommendationStats.value.coveredUsers / totalAudience.value) * 100).toFixed(1)) : 0
);

const kpiCards = computed(() => [
  { key: "users", icon: "👤", label: "总用户规模", value: totalAudience.value, suffix: "", note: "离线样本全集", accent: "blue" },
  { key: "covered", icon: "📡", label: "已覆盖用户", value: recommendationStats.value.coveredUsers, suffix: "", note: `覆盖率 ${recommendCoverageRate.value}%`, accent: "purple" },
  { key: "clicks", icon: "👆", label: "预估点击", value: recommendationStats.value.expectedClicks, suffix: "", note: "基于 TopK 商品 CTR 复算", accent: "green" },
  { key: "convert", icon: "🔄", label: "预估转化", value: recommendationStats.value.expectedConversions, suffix: "", note: "结合活跃度权重估算", accent: "amber" },
]);

const bucketItems = computed(() => {
  const b = ops.value?.audienceBuckets || {};
  const total = b.total || 1;
  const effectMap = Object.fromEntries(groupEffectData.value.map((item) => [item.key, item]));
  return [
    { key: "high", label: "高活跃", count: b.high || 0, color: "#10b981" },
    { key: "mid", label: "中活跃", count: b.mid || 0, color: "#3b82f6" },
    { key: "low", label: "低活跃", count: b.low || 0, color: "#f59e0b" },
  ].map((i) => ({
    ...i,
    rate: Number(((i.count / total) * 100).toFixed(1)),
    ...(effectMap[i.key] || { reach: "0", coverage: "0%", click: "0", convert: "0", ctr: "0.00", cvrClass: "cvr-low" }),
  }));
});

const exposureColors = [
  "linear-gradient(90deg,#4f46e5,#7c3aed)",
  "linear-gradient(90deg,#3b82f6,#06b6d4)",
  "linear-gradient(90deg,#0ea5e9,#22d3ee)",
  "linear-gradient(90deg,#14b8a6,#2dd4bf)",
  "linear-gradient(90deg,#10b981,#34d399)",
  "linear-gradient(90deg,#84cc16,#a3e635)",
  "linear-gradient(90deg,#f59e0b,#f97316)",
  "linear-gradient(90deg,#f97316,#ef4444)",
  "linear-gradient(90deg,#94a3b8,#cbd5e1)",
];
const categoryExposureItems = computed(() => {
  const total = recommendationStats.value.exposureCount || 1;
  const categoryExposure = recommendationStats.value.categoryExposure || [];
  const topCategories = categoryExposure.slice(0, 8);
  const otherCount = categoryExposure.slice(8).reduce((sum, item) => sum + (item.count || 0), 0);
  const displayCategories = otherCount > 0 ? [...topCategories, { name: "其他", count: otherCount }] : topCategories;
  return displayCategories.map((item, index) => ({
    ...item,
    rate: Number(((item.count / total) * 100).toFixed(1)),
    color: exposureColors[index % exposureColors.length],
  }));
});

const priceBandItems = computed(() => {
  const orderMap = {
    "200元以上": 4,
    "100-199元": 3,
    "50-99元": 2,
    "50元以下": 1,
    "未定价": 0,
  };
  const total = recommendationStats.value.exposureCount || 1;
  const coveredUsers = recommendationStats.value.coveredUsers || 1;
  return (recommendationStats.value.priceBandExposure || [])
    .map((item) => ({
      ...item,
      rate: Number(((item.count / total) * 100).toFixed(1)),
      perUser: (item.count / coveredUsers).toFixed(2),
    }))
    .sort((a, b) => (orderMap[b.name] ?? -1) - (orderMap[a.name] ?? -1))
    .slice(0, 4);
});

const GROUP_LABELS = { high_active: "高活跃", mid_active: "中活跃", low_active: "低活跃" };
const GROUP_COLORS = { high_active: "#10b981", mid_active: "#3b82f6", low_active: "#f59e0b" };
const groupEffectData = computed(() =>
  (ops.value?.groupEffects || []).map((g) => {
    const audience = g.group === "high_active"
      ? ops.value?.audienceBuckets?.high || 0
      : g.group === "mid_active"
        ? ops.value?.audienceBuckets?.mid || 0
        : ops.value?.audienceBuckets?.low || 0;
    return {
      key: g.group === "high_active" ? "high" : g.group === "mid_active" ? "mid" : "low",
      ...g,
      label: GROUP_LABELS[g.group] || g.group,
      color: GROUP_COLORS[g.group] || "#94a3b8",
      reach: g.reach.toLocaleString("zh-CN"),
      click: g.click.toLocaleString("zh-CN"),
      convert: g.convert.toLocaleString("zh-CN"),
      coverage: audience ? `${((g.reach / audience) * 100).toFixed(1)}%` : "0%",
      ctr: g.reach ? ((g.click / Math.max(g.reach * Math.max(recommendationStats.value.avgItemsPerUser, 1), 1)) * 100).toFixed(2) : "0.00",
      cvrClass: g.convertRate >= 8 ? "cvr-high" : g.convertRate >= 5 ? "cvr-mid" : "cvr-low",
    };
  })
);

onMounted(async () => {
  ops.value = await loadOpsAnalytics("baby");
});
</script>

<style scoped>
.ops-page { display: flex; flex-direction: column; gap: 18px; padding-bottom: 40px; }
.ops-hero {
  position: relative; border-radius: 16px; padding: 20px 28px; overflow: hidden; flex-shrink: 0;
  background: linear-gradient(135deg, #1e1b4b 0%, #312e81 35%, #4f46e5 70%, #7c3aed 100%);
  color: #fff;
}
.hero-shapes { position: absolute; inset: 0; pointer-events: none; overflow: hidden; border-radius: 16px; }
.hs { position: absolute; border-radius: 50%; opacity: .08; background: #fff; }
.hs1 { width: 260px; height: 260px; top: -80px; right: -50px; }
.hs2 { width: 120px; height: 120px; bottom: -40px; left: 10%; }
.hs3 { width: 80px; height: 80px; top: 30%; right: 35%; }
.hero-inner { position: relative; z-index: 1; display: flex; justify-content: space-between; align-items: center; gap: 16px; }
.hero-title { margin: 0; font-size: 22px; font-weight: 800; display: flex; align-items: center; gap: 8px; }
.hero-desc { margin: 4px 0 0; font-size: 13px; opacity: .7; }
.hero-badges { display: flex; gap: 10px; }
.hbadge { display: inline-flex; align-items: center; gap: 6px; padding: 4px 14px; border-radius: 10px; font-size: 12px; font-weight: 600; background: rgba(255,255,255,.12); backdrop-filter: blur(4px); border: 1px solid rgba(255,255,255,.15); }
.pulse-green { width: 7px; height: 7px; border-radius: 50%; background: #34d399; animation: pgr 2s ease-in-out infinite; }
@keyframes pgr { 0%,100%{ opacity:1; box-shadow:0 0 0 0 rgba(52,211,153,.5); } 50%{ opacity:.8; box-shadow:0 0 0 6px rgba(52,211,153,0); } }

.kpi-strip { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
.kpi-box {
  display: flex; align-items: flex-start; gap: 14px; padding: 18px 18px;
  border-radius: 16px; background: rgba(255,255,255,.78); backdrop-filter: blur(14px);
  border: 1px solid var(--border-soft); box-shadow: var(--shadow-soft);
}
.kpi-icon { font-size: 28px; flex-shrink: 0; margin-top: 2px; }
.kpi-label { font-size: 12px; color: var(--text-tertiary); font-weight: 600; }
.kpi-val { font-size: 26px; font-weight: 800; margin: 2px 0; }
.kpi-box.blue .kpi-val { color: #3b82f6; }
.kpi-box.purple .kpi-val { color: #7c3aed; }
.kpi-box.green .kpi-val { color: #10b981; }
.kpi-box.amber .kpi-val { color: #f59e0b; }
.kpi-sub { font-size: 11px; color: var(--text-tertiary); }

.glass-card {
  border-radius: 16px; padding: 22px 22px;
  background: rgba(255,255,255,.78); backdrop-filter: blur(16px);
  border: 1px solid var(--border-soft); box-shadow: var(--shadow-soft);
}
.card-title { margin: 0 0 16px; font-size: 16px; font-weight: 700; color: var(--text-primary); display: flex; align-items: center; gap: 8px; }
.ct-icon { font-size: 18px; }
.insight-row { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
.insight-row--full { grid-template-columns: 1fr; }

.reach-list { display: flex; flex-direction: column; gap: 14px; }
.reach-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
.reach-label { font-size: 13px; font-weight: 600; color: var(--text-secondary); }
.reach-nums { display: flex; align-items: baseline; gap: 8px; }
.reach-nums b { font-size: 15px; color: var(--text-primary); }
.reach-pct { font-size: 12px; color: var(--text-tertiary); font-weight: 600; }
.reach-track { height: 8px; border-radius: 4px; background: rgba(0,0,0,.05); overflow: hidden; }
.reach-fill { height: 100%; border-radius: 4px; transition: width .8s cubic-bezier(.4,0,.2,1); }

.bucket-list { display: flex; flex-direction: column; gap: 10px; }
.bucket-item { padding: 10px 14px; border-radius: 12px; border: 1.5px solid transparent; transition: all .2s ease; background: rgba(0,0,0,.015); }
.bucket-item:hover { background: rgba(0,0,0,.03); }
.bucket-head { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
.bucket-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.bucket-name { font-size: 13px; font-weight: 600; color: var(--text-secondary); }
.bucket-count { margin-left: auto; font-size: 13px; color: var(--text-primary); font-weight: 700; }
.bucket-badge { padding: 2px 8px; border-radius: 8px; font-size: 11px; font-weight: 700; background: rgba(79,70,229,.08); color: var(--accent-primary); }
.bucket-bar-track { height: 6px; border-radius: 3px; background: rgba(0,0,0,.05); overflow: hidden; }
.bucket-bar-fill { height: 100%; border-radius: 3px; transition: width .8s cubic-bezier(.4,0,.2,1); }
.bucket-metrics { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 10px; margin-top: 12px; }
.bm-item { display: flex; flex-direction: column; gap: 4px; padding: 8px 10px; border-radius: 10px; background: rgba(255,255,255,.65); border: 1px solid rgba(148,163,184,.12); }
.bm-label { font-size: 11px; color: var(--text-tertiary); font-weight: 600; }
.bm-val { font-size: 13px; color: var(--text-primary); font-weight: 800; }
.summary-panel .card-title { margin-bottom: 0; }
.preview-strip {
  display: flex; align-items: center; justify-content: space-around; margin-top: 18px;
  padding: 14px 20px; border-radius: 14px;
  background: linear-gradient(135deg, rgba(79,70,229,.06), rgba(139,92,246,.08));
  border: 1px solid rgba(79,70,229,.12);
}
.preview-item { display: flex; flex-direction: column; align-items: center; gap: 4px; }
.pv-label { font-size: 11px; color: var(--text-tertiary); font-weight: 600; }
.pv-val { font-size: 20px; font-weight: 800; color: var(--text-primary); }
.pv-val.accent { color: var(--accent-primary); }
.pv-val.green { color: #10b981; }
.pv-val.orange { color: #f59e0b; }
.preview-divider { width: 1px; height: 36px; background: rgba(0,0,0,.08); }

.compare-grid { display: flex; flex-direction: column; gap: 14px; width: 100%; }
.compare-box { padding: 16px 18px; border-radius: 12px; background: rgba(0,0,0,.02); width: 100%; }
.compare-label { font-size: 12px; color: var(--text-tertiary); font-weight: 600; margin-bottom: 8px; }
.compare-vals { display: grid; grid-template-columns: minmax(140px, 1fr) auto minmax(140px, 1fr); align-items: center; gap: 18px; width: 100%; }
.compare-current, .compare-baseline { display: flex; flex-direction: column; gap: 2px; }
.compare-current { align-items: flex-start; }
.compare-baseline { align-items: flex-end; text-align: right; }
.cv-val { font-size: 20px; font-weight: 800; color: var(--text-primary); }
.cv-val.dim { color: var(--text-tertiary); font-size: 16px; }
.cv-tag { font-size: 10px; font-weight: 600; color: var(--text-tertiary); }
.cv-tag.dim { opacity: .6; }
.compare-arrow { display: inline-flex; align-items: center; justify-content: center; min-width: 86px; text-align: center; font-size: 14px; font-weight: 800; padding: 4px 12px; border-radius: 8px; color: #10b981; background: rgba(16,185,129,.1); }
.compare-track { margin-top: 12px; height: 8px; border-radius: 999px; background: rgba(0,0,0,.05); overflow: hidden; }
.compare-fill { height: 100%; border-radius: 999px; background: linear-gradient(90deg,#10b981,#34d399); transition: width .8s cubic-bezier(.4,0,.2,1); }

.cvr-badge { padding: 2px 8px; border-radius: 6px; font-size: 12px; font-weight: 700; }
.cvr-high { background: rgba(16,185,129,.1); color: #10b981; }
.cvr-mid { background: rgba(59,130,246,.1); color: #3b82f6; }
.cvr-low { background: rgba(245,158,11,.1); color: #f59e0b; }

@media (max-width: 1200px) {
  .kpi-strip, .insight-row { grid-template-columns: 1fr 1fr; }
  .preview-strip { flex-wrap: wrap; gap: 16px; }
  .preview-divider { display: none; }
  .bucket-metrics { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}

@media (max-width: 768px) {
  .hero-inner, .hero-badges, .kpi-strip, .insight-row { grid-template-columns: 1fr; display: grid; }
  .hero-badges { display: flex; flex-wrap: wrap; }
  .compare-vals { grid-template-columns: 1fr; justify-items: start; }
  .compare-baseline { align-items: flex-start; text-align: left; }
  .bucket-metrics { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
</style>
