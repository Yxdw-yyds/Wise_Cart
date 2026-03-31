<template>
  <div class="insights-panel">
    <div class="insights-header">
      <h3>运营决策建议</h3>
      <p>基于当前数据自动生成的可执行建议</p>
    </div>
    <div class="insights-list">
      <div v-for="(insight, idx) in insights" :key="idx" class="insight-card" :style="{ '--insight-color': insight.color }">
        <div class="insight-icon">{{ insight.icon }}</div>
        <div class="insight-content">
          <div class="insight-title">{{ insight.title }}</div>
          <div class="insight-desc">{{ insight.description }}</div>
          <div class="insight-action">{{ insight.action }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  opsData: { type: Object, default: null },
  summaryData: { type: Object, default: null },
});

const insights = computed(() => {
  if (!props.opsData || !props.summaryData) return [];

  const suggestions = [];
  const ops = props.opsData;
  const summary = props.summaryData;

  // 分析高活跃用户
  const highActiveBucket = ops.audienceBuckets?.high || 0;
  const highActiveRate = highActiveBucket / (ops.audienceBuckets?.total || 1);
  const highActiveConvertRate = ops.groupEffects?.[0]?.convert / ops.groupEffects?.[0]?.reach || 0;

  if (highActiveConvertRate > 0.08) {
    suggestions.push({
      icon: "📈",
      title: "高活跃用户表现优异",
      description: `高活跃用户转化率达 ${(highActiveConvertRate * 100).toFixed(1)}%，处于良好水平`,
      action: "建议：提高推荐刷新频次，优先推送高利润商品和新品",
      color: "#10b981",
    });
  } else if (highActiveConvertRate < 0.05) {
    suggestions.push({
      icon: "⚠️",
      title: "高活跃用户转化率偏低",
      description: `高活跃用户转化率仅 ${(highActiveConvertRate * 100).toFixed(1)}%，存在优化空间`,
      action: "建议：检查推荐商品质量、详情页体验或价格竞争力",
      color: "#f59e0b",
    });
  }

  // 分析中活跃用户
  const midActiveBucket = ops.audienceBuckets?.mid || 0;
  const midActiveCoverage = ops.strategyReach?.recommend / (ops.audienceBuckets?.total || 1) || 0;

  if (midActiveCoverage < 0.7) {
    suggestions.push({
      icon: "🎯",
      title: "中活跃用户覆盖不足",
      description: `中活跃用户推荐覆盖率仅 ${(midActiveCoverage * 100).toFixed(1)}%，触达不充分`,
      action: "建议：增加推荐触达频次，尝试轻量优惠策略提升转化",
      color: "#3b82f6",
    });
  }

  // 分析商品行为
  const hotItems = ops.hotRecommendedItems || [];
  const totalRecommendCount = hotItems.reduce((sum, item) => sum + (item.count || 0), 0);
  const topItemConcentration = hotItems.length > 0 ? (hotItems[0].count / totalRecommendCount) : 0;

  if (topItemConcentration > 0.15) {
    suggestions.push({
      icon: "🔥",
      title: "推荐集中度过高",
      description: `Top1 商品占推荐总量的 ${(topItemConcentration * 100).toFixed(1)}%，推荐多样性不足`,
      action: "建议：优化推荐算法参数，增加商品多样性，避免过度集中",
      color: "#ef4444",
    });
  }

  // 分析覆盖率
  const recommendCoverage = ops.recommendCoverage || 0;
  if (recommendCoverage < 0.6) {
    suggestions.push({
      icon: "📊",
      title: "推荐覆盖率需要提升",
      description: `当前推荐覆盖率 ${(recommendCoverage * 100).toFixed(1)}%，仍有大量用户未被触达`,
      action: "建议：扩大推荐人群范围，启用更多策略组合提升覆盖",
      color: "#8b5cf6",
    });
  } else if (recommendCoverage > 0.85) {
    suggestions.push({
      icon: "✅",
      title: "推荐覆盖率表现良好",
      description: `推荐覆盖率达 ${(recommendCoverage * 100).toFixed(1)}%，触达充分`,
      action: "建议：关注转化质量，优化推荐排序和个性化程度",
      color: "#10b981",
    });
  }

  return suggestions.slice(0, 5);
});
</script>

<style scoped>
.insights-panel {
  padding: 20px;
  border-radius: 16px;
  background: var(--bg-elevated);
  border: 1px solid var(--border-soft);
}

.insights-header {
  margin-bottom: 16px;
}

.insights-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
}

.insights-header p {
  margin: 6px 0 0;
  color: var(--text-tertiary);
  font-size: 13px;
}

.insights-list {
  display: grid;
  gap: 12px;
}

.insight-card {
  display: flex;
  gap: 12px;
  padding: 14px;
  border-radius: 12px;
  background: var(--bg-muted);
  border: 1px solid var(--border-soft);
  transition: all 0.3s ease;
}

.insight-card:hover {
  border-color: var(--insight-color);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
}

.insight-icon {
  flex: 0 0 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}

.insight-content {
  flex: 1;
}

.insight-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.insight-desc {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 6px;
  line-height: 1.5;
}

.insight-action {
  font-size: 12px;
  color: var(--insight-color);
  font-weight: 500;
}

@media (max-width: 900px) {
  .insights-list {
    grid-template-columns: 1fr;
  }
}
</style>
