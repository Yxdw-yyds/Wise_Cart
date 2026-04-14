<template>
  <div class="workspace-page route-fade-in ops-page">
    <!-- ====== Hero Header ====== -->
    <div class="ops-hero">
      <div class="hero-shapes"><div class="hs hs1"></div><div class="hs hs2"></div><div class="hs hs3"></div></div>
      <div class="hero-inner">
        <div>
          <h2 class="hero-title">📊 推荐策略配置与效果预测</h2>
          <p class="hero-desc">通过人群圈选、策略组合配置，实时预测推荐效果和业务影响</p>
        </div>
        <div class="hero-badges">
          <span class="hbadge"><span class="hbadge-dot pulse-green"></span>系统在线</span>
          <span class="hbadge">数据集: Baby</span>
        </div>
      </div>
    </div>

    <!-- ====== KPI Overview ====== -->
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

    <!-- ====== Two-column Insight ====== -->
    <div class="insight-row">
      <!-- Strategy Reach -->
      <div class="glass-card">
        <h3 class="card-title"><span class="ct-icon">🎯</span>策略触达结构</h3>
        <div class="reach-list">
          <div v-for="item in strategyReachItems" :key="item.key" class="reach-item">
            <div class="reach-head">
              <span class="reach-label">{{ item.label }}</span>
              <div class="reach-nums">
                <b>{{ item.value.toLocaleString("zh-CN") }}</b>
                <span class="reach-pct">{{ item.rate }}%</span>
              </div>
            </div>
            <div class="reach-track">
              <div class="reach-fill" :style="{ width: item.rate + '%', background: item.color }"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Audience Buckets -->
      <div class="glass-card">
        <h3 class="card-title"><span class="ct-icon">👥</span>人群分层结构</h3>
        <div class="bucket-list">
          <div v-for="item in bucketItems" :key="item.key" class="bucket-item" :class="{ active: segmentForm.activeLevel === item.key }" @click="segmentForm.activeLevel = item.key">
            <div class="bucket-head">
              <span class="bucket-dot" :style="{ background: item.color }"></span>
              <span class="bucket-name">{{ item.label }}</span>
              <span class="bucket-count">{{ item.count.toLocaleString("zh-CN") }} 人</span>
              <span class="bucket-badge">{{ item.rate }}%</span>
            </div>
            <div class="bucket-bar-track">
              <div class="bucket-bar-fill" :style="{ width: item.rate + '%', background: item.color }"></div>
            </div>
          </div>
        </div>
        <div class="bucket-hint">
          <span class="hint-icon">💡</span>
          点击分层可切换人群圈选
        </div>
      </div>
    </div>

    <!-- ====== Strategy Control Panel ====== -->
    <div class="glass-card strategy-panel">
      <div class="sp-header">
        <h3 class="card-title"><span class="ct-icon">⚙️</span>策略配置中心</h3>
        <div class="sp-actions">
          <el-button size="small" @click="resetStrategy">重置</el-button>
          <el-button size="small" type="primary" @click="saveStrategy">💾 保存策略</el-button>
        </div>
      </div>

      <div class="strategy-grid">
        <div v-for="s in strategyItems" :key="s.key" class="strat-card" :class="{ enabled: s.enabled, disabled: !s.enabled }">
          <div class="strat-icon">{{ s.icon }}</div>
          <div class="strat-body">
            <div class="strat-name">{{ s.label }}</div>
            <div class="strat-reach">
              触达: <b>{{ s.enabled ? s.reach.toLocaleString("zh-CN") : 0 }}</b>
            </div>
          </div>
          <el-switch :model-value="s.enabled" @update:model-value="toggleStrategy(s.key, $event)" />
        </div>
      </div>

      <!-- Real-time Preview -->
      <div class="preview-strip">
        <div class="preview-item">
          <span class="pv-label">已启用策略</span>
          <span class="pv-val accent">{{ enabledStrategyCount }}/4</span>
        </div>
        <div class="preview-divider"></div>
        <div class="preview-item">
          <span class="pv-label">预计总触达</span>
          <span class="pv-val">{{ enabledReach.toLocaleString("zh-CN") }}</span>
        </div>
        <div class="preview-divider"></div>
        <div class="preview-item">
          <span class="pv-label">触达强度</span>
          <span class="pv-val" :class="enabledTouchDepth >= 2 ? 'green' : enabledTouchDepth >= 1 ? 'accent' : 'orange'">{{ enabledTouchDepth.toFixed(2) }}x</span>
        </div>
        <div class="preview-divider"></div>
        <div class="preview-item">
          <span class="pv-label">预计转化</span>
          <span class="pv-val">{{ currentConvertTotal.toLocaleString("zh-CN") }}</span>
        </div>
        <div class="preview-divider"></div>
        <div class="preview-item">
          <span class="pv-label">估算ROI</span>
          <span class="pv-val" :class="currentRoi >= 1.5 ? 'green' : 'orange'">{{ currentRoi.toFixed(2) }}</span>
        </div>
      </div>
    </div>

    <!-- ====== Comparison & Effect ====== -->
    <div class="insight-row">
      <!-- Before/After Comparison -->
      <div class="glass-card">
        <h3 class="card-title"><span class="ct-icon">📈</span>策略效果对比</h3>
        <p class="card-desc">全部启用 vs 当前配置</p>
        <div class="compare-grid">
          <div v-for="item in comparisonData" :key="item.key" class="compare-box">
            <div class="compare-label">{{ item.label }}</div>
            <div class="compare-vals">
              <div class="compare-current">
                <span class="cv-val">{{ item.current }}</span>
                <span class="cv-tag">当前</span>
              </div>
              <span class="compare-arrow" :class="item.delta >= 0 ? 'up' : 'down'">
                {{ item.delta >= 0 ? '↑' : '↓' }} {{ Math.abs(item.delta) }}%
              </span>
              <div class="compare-baseline">
                <span class="cv-val dim">{{ item.baseline }}</span>
                <span class="cv-tag dim">全量</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Group Effect Table -->
      <div class="glass-card">
        <h3 class="card-title"><span class="ct-icon">📋</span>分组效果明细</h3>
        <el-table :data="groupEffectData" stripe class="effect-table" size="small">
          <el-table-column prop="group" label="分组" min-width="100">
            <template #default="{ row }">
              <span class="group-chip" :style="{ background: row.color + '18', color: row.color, border: '1px solid ' + row.color + '33' }">{{ row.label }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="reach" label="触达" min-width="90" />
          <el-table-column prop="click" label="点击" min-width="90" />
          <el-table-column prop="convert" label="转化" min-width="90" />
          <el-table-column label="转化率" min-width="80">
            <template #default="{ row }">
              <span class="cvr-badge" :class="row.cvrClass">{{ row.cvr }}%</span>
            </template>
          </el-table-column>
          <el-table-column label="ROI" min-width="80">
            <template #default="{ row }">
              <span :class="row.roiClass">{{ row.roi }}</span>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <!-- ====== Segment Strategy Suggestions ====== -->
    <div class="insight-row">
      <div class="glass-card">
        <h3 class="card-title"><span class="ct-icon">💡</span>策略建议
          <span class="seg-chip">{{ segmentLabel }}</span>
        </h3>
        <div class="suggest-grid">
          <div v-for="(item, idx) in segmentSuggestions" :key="idx" class="suggest-item" :style="{ animationDelay: idx * 100 + 'ms' }">
            <span class="suggest-num">{{ idx + 1 }}</span>
            <span>{{ item }}</span>
          </div>
        </div>
      </div>

      <!-- Hot Products -->
      <div class="glass-card">
        <h3 class="card-title"><span class="ct-icon">🔥</span>推荐热度 Top 8</h3>
        <div class="hot-grid">
          <div v-for="(item, idx) in topHotItems" :key="item.itemId" class="hot-card" :style="{ animationDelay: idx * 60 + 'ms' }">
            <div class="hot-rank" :style="hotRankStyle(idx)">{{ idx + 1 }}</div>
            <div class="hot-img-box">
              <img v-if="item.pictUrl" :src="item.pictUrl" :alt="item.name" class="hot-img" @error="$event.target.style.display='none'" />
              <div v-else class="hot-img-fallback">📦</div>
            </div>
            <div class="hot-info">
              <div class="hot-name">{{ item.name }}</div>
              <div class="hot-meta">
                <span v-if="item.category" class="hot-cat">{{ item.category }}</span>
                <span v-if="item.price" class="hot-price">¥{{ item.price }}</span>
              </div>
              <div class="hot-count">推荐 <b>{{ item.count.toLocaleString("zh-CN") }}</b> 次</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch, h } from "vue";
import { ElMessage } from "element-plus";
import { defineRouteMeta } from "@kesplus/kesplus";
import { loadOpsAnalytics } from "@/composables/useCcdrecData";

defineOptions({ name: "WorkbenchOperationsDecisionPage" });

defineRouteMeta({
  name: "workbenchOperationsDecision",
  title: "推荐策略配置",
  icon: "Operation",
  isKeepAlive: true,
});

/* ---- CountUp mini-component ---- */
const CountUp = {
  props: { value: { type: [Number, String], default: 0 }, suffix: { type: String, default: "" } },
  setup(props) {
    const display = ref(0);
    const animate = () => {
      const target = typeof props.value === "number" ? props.value : parseFloat(props.value) || 0;
      const duration = 800;
      const start = performance.now();
      const from = display.value;
      const step = (now) => {
        const t = Math.min((now - start) / duration, 1);
        const ease = 1 - Math.pow(1 - t, 3);
        display.value = Math.round(from + (target - from) * ease);
        if (t < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    watch(() => props.value, animate, { immediate: true });
    return () => {
      const val = props.suffix === "%"
        ? display.value + "%"
        : display.value.toLocaleString("zh-CN") + props.suffix;
      return val;
    };
  },
};

/* ---- state ---- */
const ops = ref(null);
const activeTab = ref("segment");
const segmentForm = reactive({ activeLevel: "high" });
const strategyForm = reactive({
  recommendEnabled: true,
  recallEnabled: true,
  marketingEnabled: true,
  couponEnabled: true,
});

/* ---- computed: basics ---- */
const totalAudience = computed(() => ops.value?.audienceBuckets?.total ?? 0);
const audienceCount = computed(() => {
  if (!ops.value) return 0;
  return ops.value.audienceBuckets[segmentForm.activeLevel] ?? 0;
});
const activeSegmentRate = computed(() =>
  totalAudience.value ? Number(((audienceCount.value / totalAudience.value) * 100).toFixed(1)) : 0
);

const recommendCoverageRate = computed(() =>
  totalAudience.value
    ? Number((((ops.value?.strategyReach?.recommend || 0) / totalAudience.value) * 100).toFixed(1))
    : 0
);

const estimatedCvr = computed(() => {
  const groups = ops.value?.groupEffects || [];
  const reach = groups.reduce((s, g) => s + (g.reach || 0), 0);
  const convert = groups.reduce((s, g) => s + (g.convert || 0), 0);
  return reach ? Number(((convert / reach) * 100).toFixed(2)) : 0;
});

/* ---- KPI strip ---- */
const kpiCards = computed(() => [
  { key: "users", icon: "👤", label: "总用户规模", value: totalAudience.value, suffix: "", note: "离线样本全集", accent: "blue" },
  { key: "audience", icon: "🎯", label: "圈选人群", value: audienceCount.value, suffix: "", note: `占比 ${activeSegmentRate.value}%`, accent: "purple" },
  { key: "coverage", icon: "📡", label: "推荐覆盖率", value: recommendCoverageRate.value, suffix: "%", note: "推荐触达 / 总用户", accent: "green" },
  { key: "cvr", icon: "🔄", label: "估算转化率", value: estimatedCvr.value, suffix: "%", note: "转化 / 触达", accent: "amber" },
]);

/* ---- Bucket items ---- */
const BUCKET_COLORS = { high: "#10b981", mid: "#3b82f6", low: "#f59e0b" };
const bucketItems = computed(() => {
  const b = ops.value?.audienceBuckets || {};
  const total = b.total || 1;
  return [
    { key: "high", label: "高活跃", count: b.high || 0, color: BUCKET_COLORS.high },
    { key: "mid", label: "中活跃", count: b.mid || 0, color: BUCKET_COLORS.mid },
    { key: "low", label: "低活跃", count: b.low || 0, color: BUCKET_COLORS.low },
  ].map((i) => ({ ...i, rate: Number(((i.count / total) * 100).toFixed(1)) }));
});

/* ---- Strategy reach ---- */
const STRAT_COLORS = {
  recommend: "linear-gradient(90deg,#4f46e5,#7c3aed)",
  recall: "linear-gradient(90deg,#3b82f6,#06b6d4)",
  marketing: "linear-gradient(90deg,#f59e0b,#f97316)",
  coupon: "linear-gradient(90deg,#10b981,#34d399)",
};
const strategyReachItems = computed(() => {
  const r = ops.value?.strategyReach || {};
  const total = totalAudience.value || 1;
  return [
    { key: "recommend", label: "推荐策略", value: r.recommend || 0, color: STRAT_COLORS.recommend },
    { key: "recall", label: "召回策略", value: r.recall || 0, color: STRAT_COLORS.recall },
    { key: "marketing", label: "营销策略", value: r.marketing || 0, color: STRAT_COLORS.marketing },
    { key: "coupon", label: "优惠券策略", value: r.coupon || 0, color: STRAT_COLORS.coupon },
  ].map((i) => ({ ...i, rate: Number(Math.min(100, ((i.value / total) * 100)).toFixed(1)) }));
});

/* ---- Strategy items ---- */
const strategyItems = computed(() => {
  const r = ops.value?.strategyReach || {};
  return [
    { key: "recommend", label: "推荐策略", icon: "🎯", reach: r.recommend || 0, enabled: strategyForm.recommendEnabled },
    { key: "recall", label: "召回策略", icon: "🔁", reach: r.recall || 0, enabled: strategyForm.recallEnabled },
    { key: "marketing", label: "营销策略", icon: "📣", reach: r.marketing || 0, enabled: strategyForm.marketingEnabled },
    { key: "coupon", label: "优惠券策略", icon: "🎟️", reach: r.coupon || 0, enabled: strategyForm.couponEnabled },
  ];
});

const toggleStrategy = (key, val) => {
  const formKey = key + "Enabled";
  strategyForm[formKey] = val;
};

const enabledStrategyCount = computed(() =>
  Number(strategyForm.recommendEnabled) + Number(strategyForm.recallEnabled) +
  Number(strategyForm.marketingEnabled) + Number(strategyForm.couponEnabled)
);

const enabledReach = computed(() => {
  if (!ops.value) return 0;
  const m = ops.value.strategyReach;
  return (strategyForm.recommendEnabled ? m.recommend : 0)
    + (strategyForm.recallEnabled ? m.recall : 0)
    + (strategyForm.marketingEnabled ? m.marketing : 0)
    + (strategyForm.couponEnabled ? m.coupon : 0);
});

const enabledTouchDepth = computed(() =>
  totalAudience.value ? enabledReach.value / totalAudience.value : 0
);

/* ---- Full-enabled baseline for comparison ---- */
const fullReach = computed(() => {
  if (!ops.value) return 0;
  const m = ops.value.strategyReach;
  return m.recommend + m.recall + m.marketing + m.coupon;
});

const currentConvertTotal = computed(() => {
  if (!ops.value) return 0;
  return (ops.value.groupEffects || []).reduce((s, g) => s + (g.convert || 0), 0);
});

const fullConvertTotal = computed(() => currentConvertTotal.value);

const currentRoi = computed(() => {
  if (enabledReach.value === 0) return 0;
  return currentConvertTotal.value / enabledReach.value * (enabledStrategyCount.value / 4 * 2 + 0.5);
});

const fullRoi = computed(() => {
  if (fullReach.value === 0) return 0;
  return fullConvertTotal.value / fullReach.value * 2.5;
});

/* ---- Comparison data (current config vs all-enabled) ---- */
const comparisonData = computed(() => {
  const fReach = fullReach.value || 1;
  const cReach = enabledReach.value;
  const fConvert = fullConvertTotal.value;
  const cConvert = Math.round(currentConvertTotal.value * (enabledStrategyCount.value / 4));
  const fROI = fullRoi.value;
  const cROI = currentRoi.value;

  const delta = (c, f) => f ? Number((((c - f) / f) * 100).toFixed(1)) : 0;

  return [
    { key: "reach", label: "预计触达", current: cReach.toLocaleString("zh-CN"), baseline: fReach.toLocaleString("zh-CN"), delta: delta(cReach, fReach) },
    { key: "convert", label: "预计转化", current: cConvert.toLocaleString("zh-CN"), baseline: fConvert.toLocaleString("zh-CN"), delta: delta(cConvert, fConvert) },
    { key: "roi", label: "估算ROI", current: cROI.toFixed(2), baseline: fROI.toFixed(2), delta: delta(cROI, fROI) },
  ];
});

/* ---- Group effect table ---- */
const GROUP_LABELS = { high_active: "高活跃", mid_active: "中活跃", low_active: "低活跃" };
const GROUP_COLORS = { high_active: "#10b981", mid_active: "#3b82f6", low_active: "#f59e0b" };
const groupEffectData = computed(() =>
  (ops.value?.groupEffects || []).map((g) => {
    const cvr = g.reach ? Number(((g.convert / g.reach) * 100).toFixed(2)) : 0;
    return {
      ...g,
      label: GROUP_LABELS[g.group] || g.group,
      color: GROUP_COLORS[g.group] || "#94a3b8",
      reach: g.reach.toLocaleString("zh-CN"),
      click: g.click.toLocaleString("zh-CN"),
      convert: g.convert.toLocaleString("zh-CN"),
      cvr,
      cvrClass: cvr >= 10 ? "cvr-high" : cvr >= 5 ? "cvr-mid" : "cvr-low",
      roi: g.roi.toFixed(2),
      roiClass: g.roi >= 2 ? "roi-high" : g.roi >= 1 ? "roi-mid" : "roi-low",
    };
  })
);

/* ---- Hot items ---- */
const topHotItems = computed(() => (ops.value?.hotRecommendedItems || []).slice(0, 8));
const hotRankStyle = (idx) => {
  const t = idx / 7;
  const hue = Math.round(10 + t * 200);
  const sat = Math.round(88 - t * 20);
  const lit = Math.round(48 + t * 18);
  return {
    background: `linear-gradient(135deg, hsl(${hue},${sat}%,${lit}%), hsl(${hue+20},${sat}%,${lit-6}%))`,
    boxShadow: `0 2px 8px hsla(${hue},${sat}%,${lit}%,.35)`,
  };
};

/* ---- Segment suggestions ---- */
const segmentLabel = computed(() => {
  const m = { high: "高活跃", mid: "中活跃", low: "低活跃" };
  return m[segmentForm.activeLevel] || "";
});

const segmentSuggestions = computed(() => {
  const cvr = estimatedCvr.value;
  const coverage = recommendCoverageRate.value;
  const level = segmentForm.activeLevel;

  const suggestions = [];

  if (level === "high") {
    suggestions.push("建议提高推荐刷新频次，优先推送高复购和高利润商品。");
    suggestions.push("券策略保持开启，重点覆盖有价格敏感倾向的用户。");
    if (cvr > 8) suggestions.push(`当前转化率 ${cvr}% 表现良好，建议加大高活跃人群的推送力度。`);
    else suggestions.push(`当前转化率 ${cvr}%，建议优化推荐排序模型提升精度。`);
    suggestions.push("在晚间高活跃时段提高营销曝光频率。");
  } else if (level === "mid") {
    suggestions.push("建议提高品类多样性，拓展用户兴趣边界。");
    suggestions.push("推荐与召回同时开启，优先保证触达广度。");
    suggestions.push("采用轻量优惠策略，提升点击到转化链路效率。");
    if (coverage >= 80) suggestions.push(`覆盖率 ${coverage}%，可适当收窄人群聚焦高潜力用户。`);
  } else {
    suggestions.push("建议使用低门槛激活策略，优先恢复访问频次。");
    suggestions.push("推荐卡片文案保持简短直接，突出优惠和必需品。");
    suggestions.push("策略以保守投放为主，按周评估 ROI 变化。");
    suggestions.push("结合短信/Push 等多渠道触达，提高唤醒率。");
  }
  return suggestions;
});

/* ---- Actions ---- */
const resetStrategy = () => {
  strategyForm.recommendEnabled = true;
  strategyForm.recallEnabled = true;
  strategyForm.marketingEnabled = true;
  strategyForm.couponEnabled = true;
};

const saveStrategy = () => {
  ElMessage.success("策略已保存（离线展示环境）");
};

/* ---- Init ---- */
onMounted(async () => {
  ops.value = await loadOpsAnalytics("baby");
});
</script>

<style scoped>
/* =========== Layout =========== */
.ops-page { display: flex; flex-direction: column; gap: 18px; padding-bottom: 40px; }

/* =========== Hero =========== */
.ops-hero {
  position: relative; border-radius: 16px; padding: 20px 28px; overflow: hidden; flex-shrink: 0;
  background: linear-gradient(135deg, #1e1b4b 0%, #312e81 35%, #4f46e5 70%, #7c3aed 100%);
  color: #fff; flex-shrink: 0;
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

/* =========== KPI Strip =========== */
.kpi-strip { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
.kpi-box {
  display: flex; align-items: flex-start; gap: 14px; padding: 18px 18px;
  border-radius: 16px; background: rgba(255,255,255,.78); backdrop-filter: blur(14px);
  border: 1px solid var(--border-soft); box-shadow: var(--shadow-soft);
  transition: transform .25s ease, box-shadow .25s ease;
}
.kpi-box:hover { transform: translateY(-3px); box-shadow: var(--shadow-hover); }
.kpi-icon { font-size: 28px; flex-shrink: 0; margin-top: 2px; }
.kpi-label { font-size: 12px; color: var(--text-tertiary); font-weight: 600; }
.kpi-val { font-size: 26px; font-weight: 800; margin: 2px 0; }
.kpi-box.blue .kpi-val { color: #3b82f6; }
.kpi-box.purple .kpi-val { color: #7c3aed; }
.kpi-box.green .kpi-val { color: #10b981; }
.kpi-box.amber .kpi-val { color: #f59e0b; }
.kpi-sub { font-size: 11px; color: var(--text-tertiary); }

/* =========== Glass card =========== */
.glass-card {
  border-radius: 16px; padding: 22px 22px;
  background: rgba(255,255,255,.78); backdrop-filter: blur(16px);
  border: 1px solid var(--border-soft); box-shadow: var(--shadow-soft);
}
.card-title { margin: 0 0 16px; font-size: 16px; font-weight: 700; color: var(--text-primary); display: flex; align-items: center; gap: 8px; }
.ct-icon { font-size: 18px; }
.card-desc { margin: -10px 0 14px; font-size: 12px; color: var(--text-tertiary); }
.insight-row { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }

/* =========== Reach bars =========== */
.reach-list { display: flex; flex-direction: column; gap: 14px; }
.reach-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
.reach-label { font-size: 13px; font-weight: 600; color: var(--text-secondary); }
.reach-nums { display: flex; align-items: baseline; gap: 8px; }
.reach-nums b { font-size: 15px; color: var(--text-primary); }
.reach-pct { font-size: 12px; color: var(--text-tertiary); font-weight: 600; }
.reach-track { height: 8px; border-radius: 4px; background: rgba(0,0,0,.05); overflow: hidden; }
.reach-fill { height: 100%; border-radius: 4px; transition: width .8s cubic-bezier(.4,0,.2,1); }

/* =========== Bucket list =========== */
.bucket-list { display: flex; flex-direction: column; gap: 10px; }
.bucket-item { padding: 10px 14px; border-radius: 12px; cursor: pointer; border: 1.5px solid transparent; transition: all .2s ease; background: rgba(0,0,0,.015); }
.bucket-item:hover { background: rgba(0,0,0,.03); }
.bucket-item.active { border-color: var(--accent-primary); background: rgba(79,70,229,.04); }
.bucket-head { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
.bucket-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.bucket-name { font-size: 13px; font-weight: 600; color: var(--text-secondary); }
.bucket-count { margin-left: auto; font-size: 13px; color: var(--text-primary); font-weight: 700; }
.bucket-badge { padding: 2px 8px; border-radius: 8px; font-size: 11px; font-weight: 700; background: rgba(79,70,229,.08); color: var(--accent-primary); }
.bucket-bar-track { height: 6px; border-radius: 3px; background: rgba(0,0,0,.05); overflow: hidden; }
.bucket-bar-fill { height: 100%; border-radius: 3px; transition: width .8s cubic-bezier(.4,0,.2,1); }
.bucket-hint { margin-top: 10px; font-size: 11px; color: var(--text-tertiary); display: flex; align-items: center; gap: 4px; }
.hint-icon { font-size: 14px; }

/* =========== Strategy Panel =========== */
.strategy-panel { }
.sp-header { display: flex; justify-content: space-between; align-items: center; }
.sp-header .card-title { margin-bottom: 0; }
.sp-actions { display: flex; gap: 8px; }
.strategy-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-top: 18px; }
.strat-card {
  display: flex; align-items: center; gap: 12px; padding: 16px 14px;
  border-radius: 14px; border: 1.5px solid var(--border-soft);
  background: rgba(255,255,255,.85); transition: all .3s ease;
}
.strat-card.enabled { border-color: rgba(79,70,229,.2); background: linear-gradient(135deg, rgba(79,70,229,.04), rgba(139,92,246,.06)); }
.strat-card.disabled { opacity: .55; filter: grayscale(.3); }
.strat-icon { font-size: 24px; flex-shrink: 0; }
.strat-body { flex: 1; min-width: 0; }
.strat-name { font-size: 14px; font-weight: 700; color: var(--text-primary); }
.strat-reach { font-size: 12px; color: var(--text-tertiary); margin-top: 2px; }
.strat-reach b { color: var(--accent-primary); font-size: 14px; transition: all .3s ease; }

/* =========== Preview strip =========== */
.preview-strip {
  display: flex; align-items: center; justify-content: space-around; margin-top: 18px;
  padding: 14px 20px; border-radius: 14px;
  background: linear-gradient(135deg, rgba(79,70,229,.06), rgba(139,92,246,.08));
  border: 1px solid rgba(79,70,229,.12);
}
.preview-item { display: flex; flex-direction: column; align-items: center; gap: 4px; }
.pv-label { font-size: 11px; color: var(--text-tertiary); font-weight: 600; }
.pv-val { font-size: 20px; font-weight: 800; color: var(--text-primary); transition: all .4s ease; }
.pv-val.accent { color: var(--accent-primary); }
.pv-val.green { color: #10b981; }
.pv-val.orange { color: #f59e0b; }
.preview-divider { width: 1px; height: 36px; background: rgba(0,0,0,.08); }

/* =========== Comparison =========== */
.compare-grid { display: flex; flex-direction: column; gap: 14px; }
.compare-box { padding: 14px 16px; border-radius: 12px; background: rgba(0,0,0,.02); }
.compare-label { font-size: 12px; color: var(--text-tertiary); font-weight: 600; margin-bottom: 8px; }
.compare-vals { display: flex; align-items: center; gap: 14px; }
.compare-current, .compare-baseline { display: flex; flex-direction: column; align-items: center; gap: 2px; }
.cv-val { font-size: 20px; font-weight: 800; color: var(--text-primary); }
.cv-val.dim { color: var(--text-tertiary); font-size: 16px; }
.cv-tag { font-size: 10px; font-weight: 600; color: var(--text-tertiary); }
.cv-tag.dim { opacity: .6; }
.compare-arrow { flex: 1; text-align: center; font-size: 14px; font-weight: 800; padding: 4px 10px; border-radius: 8px; }
.compare-arrow.up { color: #10b981; background: rgba(16,185,129,.1); }
.compare-arrow.down { color: #ef4444; background: rgba(239,68,68,.1); }

/* =========== Group effect table =========== */
.effect-table { border-radius: 12px; overflow: hidden; }
.group-chip { display: inline-block; padding: 3px 10px; border-radius: 8px; font-size: 12px; font-weight: 700; }
.cvr-badge { padding: 2px 8px; border-radius: 6px; font-size: 12px; font-weight: 700; }
.cvr-high { background: rgba(16,185,129,.1); color: #10b981; }
.cvr-mid { background: rgba(59,130,246,.1); color: #3b82f6; }
.cvr-low { background: rgba(245,158,11,.1); color: #f59e0b; }
.roi-high { color: #10b981; font-weight: 800; }
.roi-mid { color: #3b82f6; font-weight: 700; }
.roi-low { color: #f59e0b; font-weight: 700; }

/* =========== Suggestions =========== */
.seg-chip { font-size: 11px; font-weight: 700; padding: 2px 10px; border-radius: 8px; background: rgba(79,70,229,.08); color: var(--accent-primary); }
.suggest-grid { display: flex; flex-direction: column; gap: 10px; }
.suggest-item {
  display: flex; align-items: flex-start; gap: 10px; padding: 12px 14px;
  border-radius: 12px; background: rgba(0,0,0,.02); font-size: 13px; color: var(--text-secondary);
  line-height: 1.6; animation: sfade .4s ease forwards; opacity: 0; transform: translateY(8px);
}
@keyframes sfade { to { opacity: 1; transform: translateY(0); } }
.suggest-num { flex-shrink: 0; width: 24px; height: 24px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 800; color: #fff; background: linear-gradient(135deg, var(--accent-primary), var(--accent-violet)); }

/* =========== Hot items =========== */
.hot-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.hot-card {
  display: flex; align-items: center; gap: 10px; padding: 10px 12px;
  border-radius: 12px; background: rgba(0,0,0,.02); transition: all .2s ease;
  animation: sfade .4s ease forwards; opacity: 0; transform: translateY(8px);
}
.hot-card:hover { background: rgba(79,70,229,.04); transform: translateY(-2px); }
.hot-rank { flex-shrink: 0; width: 26px; height: 26px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 800; color: #fff; }
.hot-img-box { width: 44px; height: 44px; border-radius: 8px; overflow: hidden; flex-shrink: 0; background: #f1f5f9; }
.hot-img { width: 100%; height: 100%; object-fit: cover; display: block; }
.hot-img-fallback { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 18px; background: linear-gradient(135deg,#e0e7ff,#f0f4ff); }
.hot-info { flex: 1; min-width: 0; }
.hot-name { font-size: 12px; font-weight: 600; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.hot-meta { display: flex; gap: 6px; align-items: center; margin-top: 2px; }
.hot-cat { font-size: 10px; padding: 1px 6px; border-radius: 4px; background: rgba(79,70,229,.08); color: var(--accent-primary); font-weight: 600; }
.hot-price { font-size: 11px; color: #ef4444; font-weight: 700; }
.hot-count { font-size: 11px; color: var(--text-tertiary); margin-top: 1px; }
.hot-count b { color: var(--accent-primary); }

/* =========== Responsive =========== */
@media (max-width: 1200px) {
  .kpi-strip { grid-template-columns: repeat(2, 1fr); }
  .insight-row { grid-template-columns: 1fr; }
  .strategy-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 768px) {
  .kpi-strip { grid-template-columns: 1fr; }
  .strategy-grid { grid-template-columns: 1fr; }
  .hot-grid { grid-template-columns: 1fr; }
  .preview-strip { flex-wrap: wrap; gap: 10px; }
  .preview-divider { display: none; }
}
</style>
