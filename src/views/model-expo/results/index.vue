<template>
  <ModelExpoResults />
</template>

<script setup>
import { defineRouteMeta } from "@kesplus/kesplus";
import ModelExpoResults from "@/components/model-expo/results.vue";

defineOptions({ name: "ModelExpoResultsPage" });

defineRouteMeta({
  name: "modelExpoResults",
  title: "结果与案例",
  icon: "Trophy",
  isKeepAlive: true,
});
</script>
