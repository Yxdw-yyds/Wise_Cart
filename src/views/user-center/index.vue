<template>
  <div class="workspace-page route-fade-in">
    <OverviewCockpit />
  </div>
</template>

<script setup>
import { defineRouteMeta } from "@kesplus/kesplus";
import OverviewCockpit from "@/components/overview-cockpit.vue";

defineOptions({
  name: "UserCenterDashboardPage",
});

defineRouteMeta({
  name: "userCenter",
  title: "é¦–é¡µæ€»è§ˆé©¾é©¶èˆ±",
  icon: "DataBoard",
  isKeepAlive: true,
});
</script>
