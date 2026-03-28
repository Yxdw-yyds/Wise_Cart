<template>
  <CcdrecVisualization />
</template>

<script setup>
import { defineRouteMeta } from "@kesplus/kesplus";
import CcdrecVisualization from "@/components/model-expo/ccdrec-visualization.vue";

defineOptions({ name: "ModelExpoCcdrecVisualizationPage" });

defineRouteMeta({
  name: "modelExpoCcdrecVisualization",
  title: "算法流程图",
  icon: "DataAnalysis",
  isKeepAlive: true,
});
</script>
