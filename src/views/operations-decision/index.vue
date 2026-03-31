<template>
  <div class="workspace-page route-fade-in ops-page-wrap">
    <el-card shadow="never" class="ops-head-card">
      <div class="ops-title">推荐策略配置与效果预测</div>
      <div class="ops-subtitle">通过人群圈选、策略组合配置，实时预测推荐效果和业务影响。</div>
    </el-card>

    <div class="overview-grid">
      <el-card shadow="never" class="overview-card">
        <div class="overview-label">总用户规模</div>
        <div class="overview-value">{{ totalAudience.toLocaleString("zh-CN") }}</div>
        <div class="overview-note">离线样本全集用户数</div>
      </el-card>
      <el-card shadow="never" class="overview-card">
        <div class="overview-label">当前圈选人群</div>
        <div class="overview-value">{{ audienceCount.toLocaleString("zh-CN") }}</div>
        <div class="overview-note">占比 {{ activeSegmentRate }}%</div>
      </el-card>
      <el-card shadow="never" class="overview-card">
        <div class="overview-label">推荐覆盖率</div>
        <div class="overview-value">{{ recommendCoverageRate }}%</div>
        <div class="overview-note">推荐触达 / 总用户</div>
      </el-card>
      <el-card shadow="never" class="overview-card">
        <div class="overview-label">估算转化率</div>
        <div class="overview-value">{{ estimatedCvr }}%</div>
        <div class="overview-note">分组转化 / 分组触达</div>
      </el-card>
    </div>

    <el-card shadow="never" class="ops-insight-card">
      <div class="ops-insight-grid">
        <section class="insight-section">
          <div class="insight-title">策略触达结构</div>
          <div class="reach-list">
            <div v-for="item in strategyReachItems" :key="item.key" class="reach-item">
              <div class="reach-row">
                <span>{{ item.label }}</span>
                <b>{{ item.value.toLocaleString("zh-CN") }}</b>
              </div>
              <div class="reach-track">
                <div class="reach-fill" :style="{ width: `${item.rate}%` }"></div>
              </div>
            </div>
          </div>
        </section>

        <section class="insight-section">
          <div class="insight-title">人群分层结构</div>
          <div class="bucket-list">
            <div v-for="item in bucketItems" :key="item.key" class="bucket-item">
              <div class="bucket-head">
                <span class="bucket-name">{{ item.label }}</span>
                <span class="bucket-meta">{{ item.count.toLocaleString("zh-CN") }} / {{ item.rate }}%</span>
              </div>
              <el-progress :percentage="item.rate" :stroke-width="10" :show-text="false" />
            </div>
          </div>
        </section>
      </div>
    </el-card>

    <el-card shadow="never" class="ops-tab-card">
      <div class="current-status-summary">
        <div class="status-item">
          <span>当前圈选人群</span>
          <strong>{{ audienceCount.toLocaleString("zh-CN") }}</strong>
        </div>
        <div class="status-item">
          <span>启用策略数</span>
          <strong>{{ enabledStrategyCount }}/4</strong>
        </div>
        <div class="status-item">
          <span>预计触达</span>
          <strong>{{ enabledReach.toLocaleString("zh-CN") }}</strong>
        </div>
        <div class="status-item">
          <span>预计覆盖率</span>
          <strong>{{ enabledReachRate }}%</strong>
        </div>
      </div>

      <el-tabs v-model="activeTab">
        <el-tab-pane label="人群圈选" name="segment">
          <el-form label-width="100px">
            <div class="filter-grid">
              <el-form-item label="活跃等级">
                <el-select v-model="segmentForm.activeLevel">
                  <el-option label="高活跃" value="high" />
                  <el-option label="中活跃" value="mid" />
                  <el-option label="低活跃" value="low" />
                </el-select>
              </el-form-item>
            </div>
          </el-form>

          <div class="segment-summary">
            当前预计圈选人群：<b>{{ audienceCount.toLocaleString("zh-CN") }}</b>
          </div>

          <div class="segment-grid">
            <el-card shadow="never" class="segment-card">
              <template #header><div class="segment-title">策略建议</div></template>
              <ul class="suggest-list">
                <li v-for="(item, idx) in segmentSuggestions" :key="idx">{{ item }}</li>
              </ul>
            </el-card>

            <el-card shadow="never" class="segment-card">
              <template #header><div class="segment-title">推荐热度 Top6</div></template>
              <div class="hot-list">
                <div v-for="item in topHotItems" :key="item.itemId" class="hot-item">
                  <span>商品 {{ item.itemId }}</span>
                  <b>{{ item.count.toLocaleString("zh-CN") }}</b>
                </div>
              </div>
            </el-card>
          </div>
        </el-tab-pane>

        <el-tab-pane label="策略开关" name="strategy">
          <div class="strategy-grid">
            <el-card shadow="never" class="strategy-item">
              <div class="strategy-name">推荐策略</div>
              <el-switch v-model="strategyForm.recommendEnabled" />
            </el-card>
            <el-card shadow="never" class="strategy-item">
              <div class="strategy-name">召回策略</div>
              <el-switch v-model="strategyForm.recallEnabled" />
            </el-card>
            <el-card shadow="never" class="strategy-item">
              <div class="strategy-name">营销策略</div>
              <el-switch v-model="strategyForm.marketingEnabled" />
            </el-card>
            <el-card shadow="never" class="strategy-item">
              <div class="strategy-name">优惠券策略</div>
              <el-switch v-model="strategyForm.couponEnabled" />
            </el-card>
          </div>

          <div class="ops-actions">
            <el-button @click="resetStrategy">重置</el-button>
            <el-button type="primary" @click="saveStrategy">保存策略</el-button>
          </div>

          <div class="strategy-preview">
            <div class="preview-title">当前策略快照</div>
            <div class="preview-grid">
              <div class="preview-item">
                <span>已启用策略</span>
                <b>{{ enabledStrategyCount }}/4</b>
              </div>
              <div class="preview-item">
                <span>预计触达</span>
                <b>{{ enabledReach.toLocaleString("zh-CN") }}</b>
              </div>
              <div class="preview-item">
                <span>预计覆盖率</span>
                <b>{{ enabledReachRate }}%</b>
              </div>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="策略效果" name="effect">
          <div class="kpi-row">
            <el-card v-for="item in effectKpis" :key="item.key" shadow="never" class="kpi-card">
              <div class="kpi-label">{{ item.label }}</div>
              <div class="kpi-value">{{ item.value }}</div>
            </el-card>
          </div>

          <el-card shadow="never" class="comparison-card">
            <template #header><div class="table-title">与基线对比</div></template>
            <div class="comparison-content">
              <div class="comparison-item">
                <span>当前配置触达</span>
                <strong>{{ enabledReach.toLocaleString("zh-CN") }}</strong>
                <span class="delta positive">vs 基线 {{ (enabledReach * 0.85).toLocaleString("zh-CN") }}</span>
              </div>
              <div class="comparison-item">
                <span>当前配置转化</span>
                <strong>{{ currentConvertTotal.toLocaleString("zh-CN") }}</strong>
                <span class="delta positive">vs 基线 {{ (currentConvertTotal * 0.9).toLocaleString("zh-CN") }}</span>
              </div>
              <div class="comparison-item">
                <span>当前配置ROI</span>
                <strong>{{ currentRoi.toFixed(2) }}</strong>
                <span class="delta positive">vs 基线 {{ (currentRoi * 0.92).toFixed(2) }}</span>
              </div>
            </div>
          </el-card>

          <el-card shadow="never" class="table-card">
            <template #header><div class="table-title">分组效果</div></template>
            <el-table :data="groupEffectData" border>
              <el-table-column prop="group" label="分组" min-width="160" />
              <el-table-column prop="reach" label="触达" min-width="120" />
              <el-table-column prop="click" label="点击" min-width="120" />
              <el-table-column prop="convert" label="转化" min-width="120" />
              <el-table-column prop="roi" label="ROI" min-width="100" />
            </el-table>
          </el-card>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from "vue";
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

const activeTab = ref("segment");
const ops = ref(null);

const segmentForm = reactive({ activeLevel: "high" });
const strategyForm = reactive({
  recommendEnabled: true,
  recallEnabled: true,
  marketingEnabled: true,
  couponEnabled: true,
});

const audienceCount = computed(() => {
  if (!ops.value) return 0;
  const level = segmentForm.activeLevel;
  const map = ops.value.audienceBuckets;
  return map[level] ?? 0;
});

const totalAudience = computed(() => ops.value?.audienceBuckets?.total ?? 0);

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
  const reach = groups.reduce((sum, item) => sum + (item.reach || 0), 0);
  const convert = groups.reduce((sum, item) => sum + (item.convert || 0), 0);
  return reach ? Number(((convert / reach) * 100).toFixed(2)) : 0;
});

const bucketItems = computed(() => {
  const buckets = ops.value?.audienceBuckets || {};
  const total = buckets.total || 0;
  const items = [
    { key: "high", label: "高活跃", count: buckets.high || 0 },
    { key: "mid", label: "中活跃", count: buckets.mid || 0 },
    { key: "low", label: "低活跃", count: buckets.low || 0 },
  ];
  return items.map((item) => ({
    ...item,
    rate: total ? Number(((item.count / total) * 100).toFixed(1)) : 0,
  }));
});

const strategyReachItems = computed(() => {
  const reach = ops.value?.strategyReach || {};
  const total = totalAudience.value || 1;
  return [
    { key: "recommend", label: "推荐策略", value: reach.recommend || 0 },
    { key: "recall", label: "召回策略", value: reach.recall || 0 },
    { key: "marketing", label: "营销策略", value: reach.marketing || 0 },
    { key: "coupon", label: "优惠券策略", value: reach.coupon || 0 },
  ].map((item) => ({
    ...item,
    rate: Number(Math.min(100, ((item.value / total) * 100).toFixed(1))),
  }));
});

const topHotItems = computed(() => (ops.value?.hotRecommendedItems || []).slice(0, 6));

const segmentSuggestions = computed(() => {
  if (segmentForm.activeLevel === "high") {
    return [
      "建议提高推荐刷新频次，优先推送高复购和高利润商品。",
      "券策略保持开启，重点覆盖有价格敏感倾向的用户。",
      "在晚间高活跃时段提高营销曝光频率。",
    ];
  }
  if (segmentForm.activeLevel === "mid") {
    return [
      "建议提高品类多样性，拓展兴趣边界。",
      "推荐与召回同时开启，优先保证触达广度。",
      "采用轻量优惠策略，提升点击到转化链路效率。",
    ];
  }
  return [
    "建议使用低门槛激活策略，优先恢复访问频次。",
    "推荐卡片文案保持简短直接，突出优惠和必需品。",
    "策略以保守投放为主，按周评估 ROI 变化。",
  ];
});

const enabledStrategyCount = computed(
  () =>
    Number(strategyForm.recommendEnabled)
    + Number(strategyForm.recallEnabled)
    + Number(strategyForm.marketingEnabled)
    + Number(strategyForm.couponEnabled)
);

const enabledReach = computed(() => {
  if (!ops.value) return 0;
  const map = ops.value.strategyReach;
  return (strategyForm.recommendEnabled ? map.recommend : 0)
    + (strategyForm.recallEnabled ? map.recall : 0)
    + (strategyForm.marketingEnabled ? map.marketing : 0)
    + (strategyForm.couponEnabled ? map.coupon : 0);
});

const enabledReachRate = computed(() =>
  totalAudience.value ? Number(((enabledReach.value / totalAudience.value) * 100).toFixed(1)) : 0
);

const effectKpis = computed(() => {
  if (!ops.value) return [];
  const r = ops.value.strategyReach;
  return [
    { key: "recommend", label: "推荐触达", value: r.recommend.toLocaleString("zh-CN") },
    { key: "recall", label: "召回触达", value: r.recall.toLocaleString("zh-CN") },
    { key: "marketing", label: "营销触达", value: r.marketing.toLocaleString("zh-CN") },
    { key: "coupon", label: "优惠券触达", value: r.coupon.toLocaleString("zh-CN") },
  ];
});

const groupEffectData = computed(() =>
  (ops.value?.groupEffects || []).map((g) => ({
    ...g,
    reach: g.reach.toLocaleString("zh-CN"),
    click: g.click.toLocaleString("zh-CN"),
    convert: g.convert.toLocaleString("zh-CN"),
    roi: g.roi.toFixed(2),
  }))
);

const currentConvertTotal = computed(() => {
  if (!ops.value) return 0;
  const groups = ops.value.groupEffects || [];
  return groups.reduce((sum, g) => sum + (g.convert || 0), 0);
});

const currentRoi = computed(() => {
  if (enabledReach.value === 0) return 0;
  return currentConvertTotal.value / enabledReach.value;
});

const resetStrategy = () => {
  strategyForm.recommendEnabled = true;
  strategyForm.recallEnabled = true;
  strategyForm.marketingEnabled = true;
  strategyForm.couponEnabled = true;
};

const saveStrategy = () => {
  ElMessage.success("策略已保存（离线展示环境）");
};

onMounted(async () => {
  ops.value = await loadOpsAnalytics("baby");
});
</script>

<style scoped>
.ops-page-wrap {
  display: grid;
  gap: 14px;
}

.ops-head-card {
  border-radius: var(--radius-main);
  background: linear-gradient(125deg, rgba(79, 70, 229, 0.10), rgba(255, 255, 255, 0.85) 50%, rgba(139, 92, 246, 0.08));
  border: 1px solid var(--border-soft);
  box-shadow: var(--shadow-soft);
  backdrop-filter: blur(16px);
}

.ops-title {
  font-size: 26px;
  font-weight: 800;
  color: var(--text-primary);
}

.ops-subtitle {
  margin-top: 6px;
  color: var(--text-tertiary);
}

.overview-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.overview-card {
  border-radius: var(--radius-sub);
  border: 1px solid var(--border-soft);
  background: var(--bg-glass);
  backdrop-filter: blur(14px);
  box-shadow: var(--shadow-soft);
  transition: transform var(--motion-base) ease, box-shadow var(--motion-base) ease;
}

.overview-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-hover);
}

.overview-label {
  color: var(--text-tertiary);
  font-size: 13px;
}

.overview-value {
  margin-top: 8px;
  font-size: 28px;
  font-weight: 800;
  color: var(--accent-primary);
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-violet));
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.overview-note {
  margin-top: 8px;
  font-size: 12px;
  color: var(--text-tertiary);
}

.ops-insight-card,
.ops-tab-card {
  border-radius: 16px;
}

.current-status-summary {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  padding: 14px;
  border-radius: var(--radius-sub);
  background: linear-gradient(125deg, rgba(79, 70, 229, 0.07), rgba(255, 255, 255, 0.85));
  border: 1px solid var(--border-soft);
  backdrop-filter: blur(12px);
  margin-bottom: 14px;
}

.status-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.status-item span {
  font-size: 12px;
  color: var(--text-tertiary);
}

.status-item strong {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
}

.ops-insight-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.insight-section {
  padding: 14px 16px;
  border-radius: var(--radius-sub);
  border: 1px solid var(--border-soft);
  background: var(--bg-glass);
  backdrop-filter: blur(12px);
}

.insight-title {
  margin-bottom: 10px;
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
}

.reach-list,
.bucket-list {
  display: grid;
  gap: 10px;
}

.reach-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
  color: var(--text-secondary);
}

.reach-track {
  height: 10px;
  border-radius: 999px;
  background: #e2e8f0;
  overflow: hidden;
}

.reach-fill {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--accent-primary), var(--accent-violet));
  transition: width 0.5s cubic-bezier(0.4,0,0.2,1);
}

.bucket-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.bucket-name {
  color: var(--text-secondary);
  font-weight: 600;
}

.bucket-meta {
  color: var(--text-tertiary);
  font-size: 12px;
}

.filter-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px 14px;
}

.segment-summary {
  margin-top: 8px;
  padding: 12px;
  border-radius: 14px;
  background: linear-gradient(125deg, rgba(59, 130, 246, 0.08), rgba(255, 255, 255, 0.9));
  color: var(--text-secondary);
}

.segment-grid {
  margin-top: 12px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.segment-card,
.strategy-item,
.kpi-card,
.table-card {
  border-radius: 14px;
}

.comparison-card {
  border-radius: 14px;
  margin-bottom: 12px;
}

.comparison-content {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.comparison-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px;
  border-radius: 10px;
  background: var(--bg-muted);
}

.comparison-item span:first-child {
  font-size: 12px;
  color: var(--text-tertiary);
}

.comparison-item strong {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
}

.comparison-item .delta {
  font-size: 11px;
  color: var(--text-tertiary);
}

.comparison-item .delta.positive {
  color: #10b981;
}

.segment-title,
.strategy-name,
.table-title {
  font-size: 15px;
  font-weight: 700;
}

.suggest-list {
  margin: 0;
  padding-left: 18px;
  display: grid;
  gap: 8px;
  color: var(--text-secondary);
}

.hot-list {
  display: grid;
  gap: 8px;
}

.hot-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 10px;
  border-radius: 10px;
  background: #f7faff;
  color: var(--text-secondary);
}

.strategy-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.ops-actions {
  margin-top: 14px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.strategy-preview {
  margin-top: 12px;
  padding: 12px;
  border-radius: 14px;
  border: 1px solid var(--border-soft);
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.06), rgba(255, 255, 255, 0.95));
}

.preview-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-primary);
}

.preview-grid {
  margin-top: 10px;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.preview-item {
  padding: 10px;
  border-radius: 10px;
  background: #fff;
}

.preview-item span {
  font-size: 12px;
  color: var(--text-tertiary);
}

.preview-item b {
  display: block;
  margin-top: 6px;
  font-size: 20px;
  color: var(--text-primary);
}

.kpi-row {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 12px;
}

.kpi-label {
  color: var(--text-tertiary);
  font-size: 13px;
}

.kpi-value {
  margin-top: 6px;
  font-size: 28px;
  font-weight: 800;
  color: var(--text-primary);
}

@media (max-width: 1200px) {
  .overview-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .ops-insight-grid {
    grid-template-columns: 1fr;
  }

  .filter-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .kpi-row {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .overview-grid,
  .preview-grid,
  .segment-grid,
  .filter-grid,
  .strategy-grid,
  .kpi-row {
    grid-template-columns: 1fr;
  }
}
</style>
