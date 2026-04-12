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
          <div class="product-content-scroll">
            <div v-if="rec.pictUrl" class="image-wrapper">
              <img 
                :src="rec.pictUrl" 
                :alt="rec.name"
                class="product-image"
                @error="handleImageError"
                @load="handleImageLoad"
              />
            </div>
            <div v-else class="image-placeholder">无图片</div>
            <div class="item-id">{{ rec.itemId }}</div>
            <div class="product-name-scroll">
              <div class="product-name">{{ rec.name }}</div>
            </div>
            <div class="product-price">¥{{ rec.price }}</div>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { defineRouteMeta } from "@kesplus/kesplus";
import { loadUserTopK, loadUserRecommendationWithImages } from "@/composables/useCcdrecData";

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

const userRecRows = computed(() => userRecs.value);

const getRankClass = (rank) => {
  if (rank === 1) return "rank-gold";
  if (rank <= 3) return "rank-silver";
  if (rank <= 10) return "rank-bronze";
  return "";
};

const handleImageError = (e) => {
  // 图片加载失败时，隐藏图片元素并显示占位符
  e.target.style.display = "none";
  const wrapper = e.target.parentElement;
  if (wrapper) {
    const placeholder = document.createElement("div");
    placeholder.className = "image-placeholder";
    placeholder.textContent = "图片加载失败";
    wrapper.appendChild(placeholder);
  }
};

const handleImageLoad = (e) => {
  // 图片加载成功，隐藏占位符
  const wrapper = e.target.parentElement;
  if (wrapper) {
    const placeholders = wrapper.querySelectorAll(".image-placeholder");
    placeholders.forEach((p) => p.style.display = "none");
  }
};

const loadUserRecs = async () => {
  userRecs.value = await loadUserRecommendationWithImages("baby", userId.value);
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
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 16px;
}

.rec-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
  padding: 12px;
  border-radius: 12px;
  background: linear-gradient(135deg, #e0c3fc, #8ec5fc);
  border: none;
  color: #303133;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  overflow: hidden;
  min-height: 300px;
  max-height: 320px;
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
  z-index: 2;
}

.product-content-scroll {
  width: 100%;
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 2px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding-top: 8px;
}

.product-content-scroll::-webkit-scrollbar {
  width: 4px;
}

.product-content-scroll::-webkit-scrollbar-track {
  background: transparent;
}

.product-content-scroll::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 2px;
}

.product-content-scroll::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.4);
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

.product-image {
  width: 120px;
  height: 120px;
  object-fit: cover;
  border-radius: 8px;
  background: #f5f5f5;
  display: block;
}

.image-wrapper {
  position: relative;
  width: 120px;
  height: 120px;
  border-radius: 8px;
  background: #f5f5f5;
  overflow: hidden;
}

.image-placeholder {
  width: 120px;
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: #f5f5f5;
  color: #999;
  font-size: 12px;
}

.item-id {
  font-size: 12px;
  font-weight: 600;
  color: #666;
  text-align: center;
}

.product-name-scroll {
  width: 100%;
  max-height: 60px;
  overflow: hidden;
  padding: 0 2px;
}

.product-name {
  font-size: 12px;
  color: #303133;
  text-align: center;
  word-break: break-all;
  line-height: 1.4;
  white-space: normal;
}

.product-price {
  font-size: 14px;
  font-weight: 600;
  color: #e4393c;
}
</style>
