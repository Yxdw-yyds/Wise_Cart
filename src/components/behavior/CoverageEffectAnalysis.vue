<template>
  <el-card shadow="never" class="coverage-card">
    <template #header>
      <div class="panel-head">
        <span>推荐覆盖与转化效果</span>
        <span class="panel-note">按人群分层</span>
      </div>
    </template>
    <div class="coverage-grid">
      <div v-for="segment in segments" :key="segment.key" class="segment-card">
        <div class="segment-header">
          <div class="segment-name">{{ segment.name }}</div>
          <div class="segment-ratio">{{ segment.ratio }}%</div>
        </div>
        <div class="segment-metrics">
          <div class="metric">
            <span>覆盖率</span>
            <div class="metric-bar">
              <div class="metric-fill" :style="{ width: `${segment.coverage}%`, background: segment.color }"></div>
            </div>
            <strong>{{ segment.coverage }}%</strong>
          </div>
          <div class="metric">
            <span>转化率</span>
            <div class="metric-bar">
              <div class="metric-fill" :style="{ width: `${segment.convertRate}%`, background: segment.color }"></div>
            </div>
            <strong>{{ segment.convertRate }}%</strong>
          </div>
        </div>
        <div class="segment-suggestion">{{ segment.suggestion }}</div>
      </div>
    </div>

    <div class="coverage-summary">
      <div class="summary-row">
        <span>总覆盖用户</span>
        <strong>{{ totalCoveredUsers.toLocaleString("zh-CN") }}</strong>
      </div>
      <div class="summary-row">
        <span>总转化用户</span>
        <strong>{{ totalConvertedUsers.toLocaleString("zh-CN") }}</strong>
      </div>
      <div class="summary-row">
        <span>整体转化率</span>
        <strong>{{ overallConvertRate }}%</strong>
      </div>
    </div>
  </el-card>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  opsData: { type: Object, default: null },
  summaryData: { type: Object, default: null },
});

const segments = computed(() => {
  if (!props.opsData) return [];

  const buckets = props.opsData.audienceBuckets || {};
  const total = buckets.total || 1;
  const groups = props.opsData.groupEffects || [];

  return [
    {
      key: "high",
      name: "高活跃用户",
      ratio: ((buckets.high / total) * 100).toFixed(1),
      coverage: 92,
      convertRate: 8.2,
      color: "#10b981",
      suggestion: "✓ 表现良好，建议提高推荐频次和商品质量",
    },
    {
      key: "mid",
      name: "中活跃用户",
      ratio: ((buckets.mid / total) * 100).toFixed(1),
      coverage: 68,
      convertRate: 2.1,
      color: "#3b82f6",
      suggestion: "⚠ 覆盖和转化都需改善，建议增加触达和优化推荐",
    },
    {
      key: "low",
      name: "低活跃用户",
      ratio: ((buckets.low / total) * 100).toFixed(1),
      coverage: 42,
      convertRate: 0.3,
      color: "#f59e0b",
      suggestion: "✗ 需要激活策略，优先恢复访问频次",
    },
  ];
});

const totalCoveredUsers = computed(() => {
  if (!props.opsData) return 0;
  return props.opsData.strategyReach?.recommend || 0;
});

const totalConvertedUsers = computed(() => {
  if (!props.opsData) return 0;
  const groups = props.opsData.groupEffects || [];
  return groups.reduce((sum, g) => sum + (g.convert || 0), 0);
});

const overallConvertRate = computed(() => {
  if (totalCoveredUsers.value === 0) return 0;
  return ((totalConvertedUsers.value / totalCoveredUsers.value) * 100).toFixed(2);
});
</script>

<style scoped>
.coverage-card {
  border-radius: 16px;
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.panel-note {
  color: var(--text-tertiary);
  font-size: 12px;
}

.coverage-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.segment-card {
  padding: 14px;
  border-radius: 12px;
  background: var(--bg-muted);
  border: 1px solid var(--border-soft);
  transition: all 0.3s ease;
}

.segment-card:hover {
  border-color: var(--border-default);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
}

.segment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.segment-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.segment-ratio {
  font-size: 12px;
  color: var(--text-tertiary);
  background: var(--bg-elevated);
  padding: 4px 8px;
  border-radius: 6px;
}

.segment-metrics {
  display: grid;
  gap: 10px;
  margin-bottom: 10px;
}

.metric {
  display: grid;
  gap: 4px;
}

.metric span {
  font-size: 12px;
  color: var(--text-secondary);
}

.metric-bar {
  height: 6px;
  border-radius: 3px;
  background: var(--border-soft);
  overflow: hidden;
}

.metric-fill {
  height: 100%;
  border-radius: inherit;
  transition: width 0.3s ease;
}

.metric strong {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-primary);
}

.segment-suggestion {
  font-size: 11px;
  color: var(--text-tertiary);
  line-height: 1.6;
  padding-top: 8px;
  border-top: 1px solid var(--border-soft);
}

.coverage-summary {
  padding-top: 12px;
  border-top: 1px solid var(--border-soft);
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.summary-row {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.summary-row span {
  font-size: 12px;
  color: var(--text-tertiary);
}

.summary-row strong {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
}

@media (max-width: 1200px) {
  .coverage-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 900px) {
  .coverage-grid,
  .coverage-summary {
    grid-template-columns: 1fr;
  }
}
</style>
