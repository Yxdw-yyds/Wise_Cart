<template>
  <el-card shadow="never" class="matrix-card">
    <template #header>
      <div class="panel-head">
        <span>商品行为矩阵分析</span>
        <span class="panel-note">浏览量 vs 转化率</span>
      </div>
    </template>
    <div class="matrix-container">
      <div class="matrix-grid">
        <!-- 左上象限：浏览高、转化低 -->
        <div class="quadrant quadrant-lu">
          <div class="quadrant-title">需要优化的商品</div>
          <div class="quadrant-icon">⚠️</div>
          <div class="quadrant-desc">浏览高、转化低</div>
          <div class="quadrant-count">{{ quadrants.lu.count }} 件</div>
          <div class="quadrant-suggestion">建议：检查定价、详情页、评价或库存</div>
        </div>

        <!-- 右上象限：浏览高、转化高 -->
        <div class="quadrant quadrant-ru">
          <div class="quadrant-title">明星商品</div>
          <div class="quadrant-icon">⭐</div>
          <div class="quadrant-desc">浏览高、转化高</div>
          <div class="quadrant-count">{{ quadrants.ru.count }} 件</div>
          <div class="quadrant-suggestion">建议：优先推荐，提高库存和曝光</div>
        </div>

        <!-- 左下象限：浏览低、转化低 -->
        <div class="quadrant quadrant-ld">
          <div class="quadrant-title">冷门商品</div>
          <div class="quadrant-icon">❄️</div>
          <div class="quadrant-desc">浏览低、转化低</div>
          <div class="quadrant-count">{{ quadrants.ld.count }} 件</div>
          <div class="quadrant-suggestion">建议：考虑下架或重新定位</div>
        </div>

        <!-- 右下象限：浏览低、转化高 -->
        <div class="quadrant quadrant-rd">
          <div class="quadrant-title">潜力商品</div>
          <div class="quadrant-icon">🚀</div>
          <div class="quadrant-desc">浏览低、转化高</div>
          <div class="quadrant-count">{{ quadrants.rd.count }} 件</div>
          <div class="quadrant-suggestion">建议：增加曝光和推荐，挖掘潜力</div>
        </div>
      </div>

      <div class="matrix-axes">
        <div class="axis-x">浏览量 →</div>
        <div class="axis-y">转化率 →</div>
      </div>
    </div>

    <div class="matrix-summary">
      <div class="summary-item">
        <span>总商品数</span>
        <strong>{{ totalItems }}</strong>
      </div>
      <div class="summary-item">
        <span>明星商品占比</span>
        <strong>{{ starRatio }}%</strong>
      </div>
      <div class="summary-item">
        <span>需优化商品占比</span>
        <strong>{{ needOptimizeRatio }}%</strong>
      </div>
    </div>
  </el-card>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  opsData: { type: Object, default: null },
});

// 模拟商品行为数据
const quadrants = computed(() => {
  const hotItems = props.opsData?.hotRecommendedItems || [];
  const totalItems = hotItems.length || 100;

  return {
    lu: { count: Math.round(totalItems * 0.18), label: "需要优化" },
    ru: { count: Math.round(totalItems * 0.22), label: "明星商品" },
    ld: { count: Math.round(totalItems * 0.35), label: "冷门商品" },
    rd: { count: Math.round(totalItems * 0.25), label: "潜力商品" },
  };
});

const totalItems = computed(() => {
  return quadrants.value.lu.count + quadrants.value.ru.count + 
         quadrants.value.ld.count + quadrants.value.rd.count;
});

const starRatio = computed(() => {
  return totalItems.value > 0 
    ? ((quadrants.value.ru.count / totalItems.value) * 100).toFixed(1)
    : 0;
});

const needOptimizeRatio = computed(() => {
  return totalItems.value > 0 
    ? ((quadrants.value.lu.count / totalItems.value) * 100).toFixed(1)
    : 0;
});
</script>

<style scoped>
.matrix-card {
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

.matrix-container {
  position: relative;
  margin-bottom: 16px;
}

.matrix-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 20px;
}

.quadrant {
  padding: 16px;
  border-radius: 12px;
  border: 2px solid var(--border-soft);
  text-align: center;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.quadrant::before {
  content: "";
  position: absolute;
  inset: 0;
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
}

.quadrant:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.08);
}

.quadrant-lu {
  background: rgba(245, 158, 11, 0.06);
  border-color: rgba(245, 158, 11, 0.3);
}

.quadrant-lu:hover::before {
  background: rgba(245, 158, 11, 0.08);
  opacity: 1;
}

.quadrant-ru {
  background: rgba(16, 185, 129, 0.06);
  border-color: rgba(16, 185, 129, 0.3);
}

.quadrant-ru:hover::before {
  background: rgba(16, 185, 129, 0.08);
  opacity: 1;
}

.quadrant-ld {
  background: rgba(100, 116, 139, 0.06);
  border-color: rgba(100, 116, 139, 0.3);
}

.quadrant-ld:hover::before {
  background: rgba(100, 116, 139, 0.08);
  opacity: 1;
}

.quadrant-rd {
  background: rgba(59, 130, 246, 0.06);
  border-color: rgba(59, 130, 246, 0.3);
}

.quadrant-rd:hover::before {
  background: rgba(59, 130, 246, 0.08);
  opacity: 1;
}

.quadrant-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.quadrant-icon {
  font-size: 28px;
  margin: 8px 0;
}

.quadrant-desc {
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.quadrant-count {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.quadrant-suggestion {
  font-size: 11px;
  color: var(--text-tertiary);
  line-height: 1.5;
}

.matrix-axes {
  position: relative;
  height: 40px;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  padding: 0 8px;
  color: var(--text-tertiary);
  font-size: 12px;
}

.axis-x {
  position: absolute;
  bottom: 0;
  right: 0;
}

.axis-y {
  position: absolute;
  left: 0;
  bottom: 0;
}

.matrix-summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--border-soft);
}

.summary-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.summary-item span {
  font-size: 12px;
  color: var(--text-tertiary);
}

.summary-item strong {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
}

@media (max-width: 900px) {
  .matrix-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .matrix-summary {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
</style>
