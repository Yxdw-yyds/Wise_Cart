<template>
  <div class="strategy-comparison">
    <div class="comparison-header">
      <h3>策略效果对比</h3>
      <p>当前配置 vs 推荐配置的预期效果</p>
    </div>
    <div class="comparison-grid">
      <div class="comparison-card">
        <div class="card-label">当前配置</div>
        <div class="card-metrics">
          <div class="metric-row">
            <span>启用策略数</span>
            <strong>{{ currentStrategyCount }}/4</strong>
          </div>
          <div class="metric-row">
            <span>预计触达</span>
            <strong>{{ currentReach.toLocaleString("zh-CN") }}</strong>
          </div>
          <div class="metric-row">
            <span>覆盖率</span>
            <strong>{{ currentCoverageRate }}%</strong>
          </div>
          <div class="metric-row">
            <span>预估转化</span>
            <strong>{{ currentConvert.toLocaleString("zh-CN") }}</strong>
          </div>
        </div>
      </div>

      <div class="comparison-arrow">
        <span>vs</span>
      </div>

      <div class="comparison-card recommended">
        <div class="card-label">推荐配置</div>
        <div class="card-metrics">
          <div class="metric-row">
            <span>启用策略数</span>
            <strong>4/4</strong>
          </div>
          <div class="metric-row">
            <span>预计触达</span>
            <strong>{{ recommendedReach.toLocaleString("zh-CN") }}</strong>
          </div>
          <div class="metric-row">
            <span>覆盖率</span>
            <strong>{{ recommendedCoverageRate }}%</strong>
          </div>
          <div class="metric-row">
            <span>预估转化</span>
            <strong>{{ recommendedConvert.toLocaleString("zh-CN") }}</strong>
          </div>
        </div>
      </div>
    </div>

    <div class="comparison-delta">
      <div class="delta-item">
        <span>触达增加</span>
        <strong :class="{ positive: reachDelta > 0 }">
          {{ reachDelta > 0 ? "+" : "" }}{{ reachDelta.toLocaleString("zh-CN") }}
          ({{ reachDeltaPercent > 0 ? "+" : "" }}{{ reachDeltaPercent.toFixed(1) }}%)
        </strong>
      </div>
      <div class="delta-item">
        <span>转化增加</span>
        <strong :class="{ positive: convertDelta > 0 }">
          {{ convertDelta > 0 ? "+" : "" }}{{ convertDelta.toLocaleString("zh-CN") }}
          ({{ convertDeltaPercent > 0 ? "+" : "" }}{{ convertDeltaPercent.toFixed(1) }}%)
        </strong>
      </div>
    </div>

    <div class="comparison-action">
      <el-button type="primary" @click="applyRecommended">应用推荐配置</el-button>
      <el-button @click="viewDetails">查看详情</el-button>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { ElMessage } from "element-plus";

const props = defineProps({
  opsData: { type: Object, default: null },
  summaryData: { type: Object, default: null },
});

const emit = defineEmits(["apply-config"]);

// 当前配置（假设推荐和召回启用，营销和优惠券关闭）
const currentStrategyCount = computed(() => 2);
const currentReach = computed(() => {
  if (!props.opsData) return 0;
  const reach = props.opsData.strategyReach || {};
  return (reach.recommend || 0) + (reach.recall || 0);
});
const currentCoverageRate = computed(() => {
  if (!props.opsData || !props.summaryData) return 0;
  const total = props.opsData.audienceBuckets?.total || props.summaryData.users || 1;
  return ((currentReach.value / total) * 100).toFixed(1);
});
const currentConvert = computed(() => {
  if (!props.opsData) return 0;
  const groups = props.opsData.groupEffects || [];
  return groups.reduce((sum, g) => sum + (g.convert || 0), 0);
});

// 推荐配置（所有策略启用）
const recommendedReach = computed(() => {
  if (!props.opsData) return 0;
  const reach = props.opsData.strategyReach || {};
  return (reach.recommend || 0) + (reach.recall || 0) + (reach.marketing || 0) + (reach.coupon || 0);
});
const recommendedCoverageRate = computed(() => {
  if (!props.opsData || !props.summaryData) return 0;
  const total = props.opsData.audienceBuckets?.total || props.summaryData.users || 1;
  return ((recommendedReach.value / total) * 100).toFixed(1);
});
const recommendedConvert = computed(() => {
  if (!props.opsData) return 0;
  const groups = props.opsData.groupEffects || [];
  // 假设全策略启用时转化增加 15%
  return Math.round(groups.reduce((sum, g) => sum + (g.convert || 0), 0) * 1.15);
});

// 差异计算
const reachDelta = computed(() => recommendedReach.value - currentReach.value);
const reachDeltaPercent = computed(() => {
  if (currentReach.value === 0) return 0;
  return ((reachDelta.value / currentReach.value) * 100);
});
const convertDelta = computed(() => recommendedConvert.value - currentConvert.value);
const convertDeltaPercent = computed(() => {
  if (currentConvert.value === 0) return 0;
  return ((convertDelta.value / currentConvert.value) * 100);
});

const applyRecommended = () => {
  ElMessage.success("推荐配置已应用，请在策略配置页面查看详情");
  emit("apply-config", {
    recommendEnabled: true,
    recallEnabled: true,
    marketingEnabled: true,
    couponEnabled: true,
  });
};

const viewDetails = () => {
  ElMessage.info("请切换到推荐策略配置页面查看详细配置");
};
</script>

<style scoped>
.strategy-comparison {
  padding: 20px;
  border-radius: 16px;
  background: var(--bg-elevated);
  border: 1px solid var(--border-soft);
}

.comparison-header {
  margin-bottom: 16px;
}

.comparison-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
}

.comparison-header p {
  margin: 6px 0 0;
  color: var(--text-tertiary);
  font-size: 13px;
}

.comparison-grid {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 16px;
  align-items: center;
  margin-bottom: 16px;
}

.comparison-card {
  padding: 16px;
  border-radius: 12px;
  background: var(--bg-muted);
  border: 1px solid var(--border-soft);
}

.comparison-card.recommended {
  border-color: #10b981;
  background: rgba(16, 185, 129, 0.06);
}

.card-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 12px;
}

.card-metrics {
  display: grid;
  gap: 10px;
}

.metric-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
}

.metric-row span {
  color: var(--text-secondary);
}

.metric-row strong {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
}

.comparison-arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.comparison-arrow span {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-tertiary);
}

.comparison-delta {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  padding: 12px;
  border-radius: 12px;
  background: rgba(16, 185, 129, 0.08);
  margin-bottom: 16px;
}

.delta-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.delta-item span {
  font-size: 13px;
  color: var(--text-secondary);
}

.delta-item strong {
  font-size: 14px;
  font-weight: 700;
  color: #10b981;
}

.delta-item strong.positive {
  color: #10b981;
}

.comparison-action {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

@media (max-width: 900px) {
  .comparison-grid {
    grid-template-columns: 1fr;
  }

  .comparison-arrow {
    display: none;
  }

  .comparison-delta {
    grid-template-columns: 1fr;
  }
}
</style>
