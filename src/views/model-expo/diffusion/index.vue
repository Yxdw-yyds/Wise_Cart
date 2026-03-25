<template>
  <ModelExpoDiffusion />
</template>

<script setup>
import { defineRouteMeta } from "@kesplus/kesplus";
import ModelExpoDiffusion from "@/components/model-expo/diffusion.vue";

defineOptions({ name: "ModelExpoDiffusionPage" });

defineRouteMeta({
  name: "modelExpoDiffusion",
  title: "条件扩散重建",
  icon: "Connection",
  isKeepAlive: true,
});
</script>
