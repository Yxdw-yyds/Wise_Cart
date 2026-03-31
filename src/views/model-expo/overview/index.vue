<template>
  <ModelExpoOverview />
</template>

<script setup>
import { defineRouteMeta } from "@kesplus/kesplus";
import ModelExpoOverview from "@/components/model-expo/overview.vue";

defineOptions({ name: "ModelExpoOverviewPage" });

defineRouteMeta({
  name: "modelExpoOverview",
  title: "CCDRec 推荐模型技术说明",
  icon: "DataBoard",
  isKeepAlive: true,
});
</script>
