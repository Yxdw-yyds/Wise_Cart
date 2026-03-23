<template>
  <div class="workspace-page route-fade-in">
    <OverviewCockpit />
  </div>
</template>

<script setup>
import { defineRouteMeta } from "@kesplus/kesplus";
import OverviewCockpit from "@/components/overview-cockpit.vue";

defineOptions({
  name: "UserHome",
});

defineRouteMeta({
  name: "home",
  title: "首页总览驾驶舱",
  isKeepAlive: true,
  icon: "HomeFilled",
  isAffix: true,
});
</script>
