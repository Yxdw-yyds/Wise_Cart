<template>
  <div class="workspace-page route-fade-in">
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
