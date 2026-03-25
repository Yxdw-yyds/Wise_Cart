<template>
  <div class="workspace-page route-fade-in">
    <el-card shadow="never" class="topk-card">
      <template #header>
        <div class="head">
          <h3>个性化推荐前50查询</h3>
          <p>按用户ID查看离线推荐前50商品</p>
        </div>
      </template>

      <div class="top50-action-bar">
        <el-select v-model="userId" filterable placeholder="请选择用户ID" style="width: 260px" @change="loadUserRecs">
          <el-option v-for="id in userIdOptions" :key="id" :label="id" :value="id" />
        </el-select>
        <el-button type="primary" @click="loadUserRecs">查询前50</el-button>
      </div>

      <div class="top50-table-chunk-grid">
        <el-table v-for="(colData, i) in chunkedRecRows" :key="i" :data="colData" border stripe size="small">
          <el-table-column prop="rank" label="排名" width="80" align="center" />
          <el-table-column prop="itemId" label="商品ID" />
        </el-table>
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

const userRecRows = computed(() => userRecs.value.map((itemId, idx) => ({ rank: idx + 1, itemId })));

const chunkedRecRows = computed(() => {
  const rs = userRecRows.value;
  const chunk1 = rs.slice(0, 17);
  const chunk2 = rs.slice(17, 34);
  const chunk3 = rs.slice(34, 50);
  return [chunk1, chunk2, chunk3];
});

const loadUserRecs = async () => {
  userRecs.value = await loadUserTopK("baby", userId.value);
};

onMounted(async () => {
  const users = await loadUserTopK("baby");
  userIdOptions.value = Object.keys(users).slice(0, 300);
  if (!userIdOptions.value.includes(userId.value) && userIdOptions.value.length) {
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

.top50-table-chunk-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 24px;
}
</style>
