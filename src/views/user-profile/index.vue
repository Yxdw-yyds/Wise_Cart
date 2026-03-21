<template>
  <div class="profile-page">
    <el-card shadow="never" class="head-card">
      <div class="title">用户画像</div>
      <div class="subtitle">与猜你喜欢共享同一兴趣向量，保证推荐一致</div>
    </el-card>

    <el-row :gutter="12">
      <el-col :xs="24" :lg="14">
        <el-card shadow="never" class="panel-card">
          <template #header>
            <div class="panel-title">类目兴趣百分比</div>
          </template>
          <div class="progress-list">
            <div v-for="item in percentItems" :key="item.key" class="progress-item">
              <div class="row-head">
                <span>{{ item.label }}</span>
                <b>{{ item.percent }}%</b>
              </div>
              <el-progress :percentage="item.percent" :stroke-width="14" />
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :lg="10">
        <el-card shadow="never" class="panel-card">
          <template #header>
            <div class="panel-title">用户标签</div>
          </template>
          <div class="tags">
            <el-tag v-for="tag in userProfile.tags" :key="tag">{{ tag }}</el-tag>
          </div>
          <div class="summary">{{ userProfile.summary }}</div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { defineRouteMeta } from "@kesplus/kesplus";
import { useUserMallData } from "@/composables/useUserMallData";

defineOptions({ name: "UserProfilePage" });

defineRouteMeta({
  name: "userProfile",
  title: "用户画像",
  icon: "PieChart",
  isKeepAlive: true,
  layout: {
    navigation: null,
  },
});

const { userProfile, categoryLabels } = useUserMallData();

const percentItems = computed(() =>
  Object.entries(userProfile.value.categoryPercents)
    .map(([key, percent]) => ({ key, label: categoryLabels[key] || key, percent }))
    .sort((a, b) => b.percent - a.percent)
);
</script>

<style scoped>
.profile-page {
  min-height: 100vh;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 12px;
  background: #f5f7fb;
}

.head-card {
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

.panel-card {
  min-height: 390px;
}

.panel-title {
  font-size: 16px;
  font-weight: 700;
}

.progress-list {
  display: grid;
  gap: 12px;
}

.row-head {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.summary {
  margin-top: 14px;
  border-radius: 12px;
  padding: 12px;
  line-height: 1.6;
  color: #334155;
  background: #f8fbff;
}
</style>
