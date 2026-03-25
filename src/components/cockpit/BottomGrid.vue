<template>
  <div class="bottom-grid slide-in-bottom delay-1">
    <el-card shadow="never" class="panel-card">
      <template #header><div class="panel-title">训练与效果告警</div></template>
      <el-table :data="alerts" border stripe>
        <el-table-column prop="title" label="告警" />
        <el-table-column prop="detail" label="详情" />
      </el-table>
    </el-card>
    <el-card shadow="never" class="panel-card">
      <template #header><div class="panel-title">热门推荐商品（Top10聚合）</div></template>
      <el-table :data="opsHotItems" border stripe>
        <el-table-column prop="itemId" label="itemId" />
        <el-table-column prop="count" label="推荐次数" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
defineProps({
  alerts: { type: Array, default: () => [] },
  opsHotItems: { type: Array, default: () => [] }
});
</script>

<style scoped>
.bottom-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  animation: slideInBottom 0.6s ease-out forwards;
  animation-fill-mode: both;
}

.delay-1 {
  animation-delay: 0.15s;
}

.panel-card {
  border-radius: 16px;
  transition: box-shadow 0.3s ease;
}

.panel-card:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.05) !important;
}

.panel-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-weight: 800;
  color: var(--text-primary);
}

@keyframes slideInBottom {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 900px) {
  .bottom-grid {
    grid-template-columns: 1fr;
  }
}
</style>
