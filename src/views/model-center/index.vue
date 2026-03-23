<template>
  <div class="model-page-wrap route-fade-in">
    <RecommendationModelCenter />
  </div>
</template>

<script setup>
import { defineRouteMeta } from "@kesplus/kesplus";
import RecommendationModelCenter from "@/components/recommendation-model-center.vue";

defineOptions({
  name: "WorkbenchModelPage",
});

defineRouteMeta({
  name: "workbenchModel",
  title: "推荐与模型分析",
  icon: "TrendCharts",
  isKeepAlive: true,
});
</script>

<style scoped>
.model-page-wrap {
  height: calc(100vh - 86px);
  overflow-y: auto;
  overflow-x: hidden;
  padding: 12px;
}
</style>
