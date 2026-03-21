<template>
  <OverviewCockpit />
</template>

<script setup>
import { defineRouteMeta } from "@kesplus/kesplus";
import OverviewCockpit from "@/components/overview-cockpit.vue";

defineOptions({
  name: "UserCenterDashboardPage",
});

defineRouteMeta({
  name: "userCenter",
  title: "首页总览驾驶舱",
  icon: "DataBoard",
  isKeepAlive: true,
});
</script>
