<template>
  <div class="workspace-page route-fade-in">
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
  title: "用户行为诊断",
  icon: "DataLine",
  isKeepAlive: true,
});
</script>
