<template>
  <div class="user-profile-page">
    <el-card shadow="never" class="profile-head">
      <div class="title">User Profile</div>
      <div class="subtitle">Interest percentages by product category</div>
    </el-card>

    <el-row :gutter="12">
      <el-col :xs="24" :lg="14">
        <el-card shadow="never" class="profile-card">
          <template #header>
            <div class="card-title">Interest Distribution</div>
          </template>
          <div class="progress-list">
            <div v-for="item in interests" :key="item.name" class="progress-item">
              <div class="label-row">
                <span>{{ item.name }}</span>
                <b>{{ item.percent }}%</b>
              </div>
              <el-progress :percentage="item.percent" :stroke-width="14" />
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :lg="10">
        <el-card shadow="never" class="profile-card">
          <template #header>
            <div class="card-title">User Tags</div>
          </template>
          <div class="tags">
            <el-tag v-for="tag in tags" :key="tag" class="tag-item">{{ tag }}</el-tag>
          </div>
          <div class="summary">
            Summary: strongest interests are <b>Drink / Snack</b>, with higher promotion sensitivity.
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { defineRouteMeta } from "@kesplus/kesplus";

defineOptions({
  name: "UserProfilePage",
});

defineRouteMeta({
  name: "userProfile",
  title: "User Profile",
  icon: "PieChart",
  isKeepAlive: true,
});

const interests = ref([
  { name: "Drink", percent: 28 },
  { name: "Snack", percent: 22 },
  { name: "Beverage", percent: 16 },
  { name: "Daily", percent: 14 },
  { name: "Food", percent: 12 },
  { name: "Home", percent: 8 },
]);

const tags = ref(["High Activity", "Price Sensitive", "New Product", "Night Shopper", "Healthy Lifestyle"]);
</script>

<style scoped>
.user-profile-page {
  height: calc(100vh - 86px);
  overflow-y: auto;
  overflow-x: hidden;
  padding: 12px;
}

.profile-head {
  margin-bottom: 12px;
}

.title {
  font-size: 24px;
  font-weight: 700;
  color: #0f172a;
}

.subtitle {
  margin-top: 6px;
  color: #64748b;
}

.profile-card {
  min-height: 380px;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
}

.progress-list {
  display: grid;
  gap: 12px;
}

.label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.tag-item {
  padding: 4px 10px;
}

.summary {
  margin-top: 16px;
  padding: 12px;
  border-radius: 12px;
  background: #f8fbff;
  color: #334155;
  line-height: 1.6;
}
</style>
