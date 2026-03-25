<template>
  <div class="metrics-grid">
    <el-card v-for="(item, index) in metricsCards" :key="item.key" shadow="hover" class="metric-card" :style="{ animationDelay: `${index * 0.05}s` }">
      <div class="metric-label">{{ item.label }}</div>
      <div class="metric-main">
        <div class="metric-value">{{ item.value }}</div>
        <div class="trend" :class="item.delta >= 0 ? 'up' : 'down'">
          <span>{{ item.delta >= 0 ? "↑" : "↓" }}</span>
          {{ Math.abs(item.delta).toFixed(1) }}%
        </div>
      </div>
      <div class="metric-sub">环比 {{ item.delta >= 0 ? "增长" : "下降" }} {{ Math.abs(item.delta).toFixed(1) }}%</div>
    </el-card>
  </div>
</template>

<script setup>
defineProps({
  metricsCards: { type: Array, default: () => [] }
});
</script>

<style scoped>
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.metric-card {
  min-height: 120px;
  border-radius: 16px;
  opacity: 0;
  animation: fadeInUp 0.5s ease-out forwards;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.metric-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 20px rgba(0,0,0,0.08) !important;
}

.metric-label {
  color: var(--text-tertiary);
  font-size: 13px;
}

.metric-main {
  margin-top: 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.metric-value {
  font-size: 26px;
  font-weight: 800;
  color: var(--text-primary);
}

.metric-sub {
  margin-top: 10px;
  color: var(--text-tertiary);
  font-size: 12px;
}

.trend {
  border-radius: 999px;
  padding: 6px 10px;
  font-size: 12px;
  font-weight: 700;
}

.trend.up {
  color: #0f9f63;
  background: rgba(25, 179, 107, 0.12);
}

.trend.down {
  color: #dc2626;
  background: rgba(243, 91, 107, 0.12);
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(15px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 1200px) {
  .metrics-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 900px) {
  .metrics-grid {
    grid-template-columns: 1fr;
  }
}
</style>
