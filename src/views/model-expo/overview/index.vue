<template>
  <ModelExpoOverview />
</template>

<script setup>
import { defineRouteMeta } from "@kesplus/kesplus";
import ModelExpoOverview from "@/components/model-expo/overview.vue";

defineOptions({ name: "ModelExpoOverviewPage" });

defineRouteMeta({
  name: "modelExpoOverview",
  title: "算法总览",
  icon: "DataBoard",
  isKeepAlive: true,
});
</script>
