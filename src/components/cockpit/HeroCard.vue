<template>
  <el-card shadow="never" class="hero-card slide-in-top">
    <div class="hero-head">
      <div>
        <h2>首页总览驾驶舱</h2>
        <p>数据集：{{ summary?.dataset || "-" }}，生成时间：{{ manifest?.generatedAt || "-" }}</p>
      </div>
      <el-segmented :model-value="rangeKey" @update:model-value="$emit('update:rangeKey', $event)" :options="rangeOptions" />
    </div>
  </el-card>
</template>

<script setup>
defineProps({
  manifest: { type: Object, default: () => ({}) },
  summary: { type: Object, default: () => ({}) },
  rangeKey: { type: String, default: "30d" },
  rangeOptions: { type: Array, default: () => [] }
});
defineEmits(["update:rangeKey"]);
</script>

<style scoped>
.hero-card {
  padding: 6px 4px;
  border-radius: 18px;
  background: linear-gradient(130deg, rgba(59, 130, 246, 0.12), rgba(255, 255, 255, 0.95) 45%, rgba(245, 158, 11, 0.12));
  animation: slideIn 0.5s ease-out forwards;
}

.hero-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.hero-head h2 {
  margin: 0;
  font-size: 28px;
  font-weight: 800;
}

.hero-head p {
  margin: 8px 0 0;
  color: var(--text-tertiary);
}

@keyframes slideIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 900px) {
  .hero-head {
    display: grid;
  }
}
</style>
