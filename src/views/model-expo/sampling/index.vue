<template>
  <ModelExpoSampling />
</template>

<script setup>
import { defineRouteMeta } from "@kesplus/kesplus";
import ModelExpoSampling from "@/components/model-expo/sampling.vue";

defineOptions({ name: "ModelExpoSamplingPage" });

defineRouteMeta({
  name: "modelExpoSampling",
  title: "课程负采样与排序",
  icon: "Histogram",
  isKeepAlive: true,
});
</script>
