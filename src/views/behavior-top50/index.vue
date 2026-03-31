<template>
  <div class="workspace-page route-fade-in">
    <el-card
      shadow="never"
      class="topk-card"
    >
      <template #header>
        <div class="head">
          <h3>个性化推荐前50查询</h3>
          <p>按用户ID查看离线推荐前50商品</p>
        </div>
      </template>

      <div class="top50-action-bar">
        <el-select
          v-model="userId"
          filterable
          placeholder="请选择用户ID"
          style="width: 260px"
          @change="loadUserRecs"
        >
          <el-option
            v-for="id in userIdOptions"
            :key="id"
            :label="id"
            :value="id"
          />
        </el-select>
        <el-button
          type="primary"
          @click="loadUserRecs"
          >查询前50</el-button
        >
      </div>

      <div class="rec-cards-grid">
        <div
          v-for="rec in userRecRows"
          :key="rec.rank"
          class="rec-card"
          :class="getRankClass(rec.rank)"
        >
          <div class="rank-badge">{{ rec.rank }}</div>
          <div class="item-id">{{ rec.itemId }}</div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { defineRouteMeta } from "@kesplus/kesplus";
import { loadUserTopK } from "@/composables/useCcdrecData";

defineOptions({ name: "推荐前50查询页面" });

defineRouteMeta({
  name: "workbenchBehaviorTop50",
  title: "推荐前50查询",
  icon: "Search",
  isKeepAlive: true,
});

const userId = ref("0");
const userIdOptions = ref([]);
const userRecs = ref([]);

const userRecRows = computed(() =>
  userRecs.value.map((itemId, idx) => ({ rank: idx + 1, itemId }))
);

const getRankClass = (rank) => {
  if (rank === 1) return "rank-gold";
  if (rank <= 3) return "rank-silver";
  if (rank <= 10) return "rank-bronze";
  return "";
};

const loadUserRecs = async () => {
  userRecs.value = await loadUserTopK("baby", userId.value);
};

onMounted(async () => {
  const users = await loadUserTopK("baby");
  userIdOptions.value = Object.keys(users).slice(0, 300);
  if (
    !userIdOptions.value.includes(userId.value) &&
    userIdOptions.value.length
  ) {
    userId.value = userIdOptions.value[0];
  }
  await loadUserRecs();
});
</script>

<style scoped>
.topk-card {
  border-radius: 16px;
}

.head h3 {
  margin: 0;
  font-size: 18px;
  color: var(--text-primary);
}

.head p {
  margin: 6px 0 0;
  font-size: 13px;
  color: var(--text-tertiary);
}

.top50-action-bar {
  margin-bottom: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.rec-cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 16px;
}

.rec-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 20px 12px;
  border-radius: 12px;
  background: linear-gradient(135deg, #e0c3fc, #8ec5fc);
  border: none;
  color: #303133;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: default;
}

.rec-card:hover {
  transform: translateY(-4px) scale(1.03);
  box-shadow: 0 8px 24px rgba(140, 120, 200, 0.35);
}

.rank-badge {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 14px;
  color: #fff;
  background: linear-gradient(135deg, #667eea, #764ba2);
  flex-shrink: 0;
}

.rank-gold .rank-badge {
  background: linear-gradient(135deg, #f5af19, #f12711);
  box-shadow: 0 2px 8px rgba(241, 39, 17, 0.4);
}

.rank-silver .rank-badge {
  background: linear-gradient(135deg, #bdc3c7, #8a9bb5);
}

.rank-bronze .rank-badge {
  background: linear-gradient(135deg, #e6a756, #c4722a);
}

.item-id {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  letter-spacing: 0.5px;
}
</style>
