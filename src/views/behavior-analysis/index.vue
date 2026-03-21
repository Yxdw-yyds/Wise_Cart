<template>
  <div class="analysis-page-wrap">
    <UserBehaviorAnalysis />
  </div>
</template>

<script setup>
import { defineRouteMeta } from "@kesplus/kesplus";
import UserBehaviorAnalysis from "@/components/user-behavior-analysis.vue";

defineOptions({
  name: "WorkbenchBehaviorPage",
});

defineRouteMeta({
  name: "workbenchBehavior",
  title: "用户行为分析",
  icon: "DataLine",
  isKeepAlive: true,
});
</script>

<style scoped>
.analysis-page-wrap {
  height: calc(100vh - 86px);
  overflow-y: auto;
  overflow-x: hidden;
  padding: 12px;
}
</style>
