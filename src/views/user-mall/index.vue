<template>
  <div class="mall-page">
    <header class="mall-header">
      <div class="brand" @click="router.push('/user-mall')">WiseCart 用户商城</div>
      <div class="header-actions">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索商品"
          class="search-input"
          clearable
          @keyup.enter="onSearch"
        />
        <el-button type="primary" @click="onSearch">搜索</el-button>
        <el-button @click="router.push('/user-profile')">用户画像</el-button>
      </div>
    </header>

    <section class="hero">
      <div class="hero-title">猜你喜欢 + Top50 兴趣榜</div>
      <div class="hero-subtitle">基于行为标签的可解释推荐</div>
    </section>

    <section class="section-card">
      <div class="section-head">
        <h3>商品流</h3>
      </div>
      <div class="products-grid">
        <article v-for="item in filteredProducts" :key="item.id" class="product-card">
          <div class="cover" :style="{ background: item.imgBg }">{{ categoryLabel(item.category) }}</div>
          <div class="name">{{ item.name }}</div>
          <div class="meta-line">
            <span class="price">¥{{ item.price }}</span>
            <span class="shop">{{ item.shop }}</span>
          </div>
        </article>
      </div>
    </section>

    <section class="section-card">
      <div class="section-head">
        <h3>猜你喜欢</h3>
        <el-button link type="primary" @click="refreshGuess">换一批</el-button>
      </div>
      <el-row :gutter="12">
        <el-col v-for="item in guessLikeList" :key="item.productId" :xs="24" :sm="12" :lg="8">
          <div class="guess-card">
            <div class="guess-name">{{ item.name }}</div>
            <div class="guess-score">推荐分：{{ item.score }}</div>
            <div class="guess-reason">推荐理由：{{ item.reason }}</div>
          </div>
        </el-col>
      </el-row>
      <el-empty v-if="!guessLikeList.length" description="暂无推荐，已回退热门商品" />
    </section>

    <section class="section-card">
      <div class="section-head">
        <h3>用户感兴趣 Top50 商品</h3>
      </div>
      <div class="toolbar">
        <el-select v-model="activeCategory" class="filter-item">
          <el-option label="全部类目" value="all" />
          <el-option v-for="(label, key) in categoryLabels" :key="key" :label="label" :value="key" />
        </el-select>
        <el-select v-model="priceBand" class="filter-item">
          <el-option label="全部价格带" value="all" />
          <el-option label="0-50" value="low" />
          <el-option label="50-150" value="mid" />
          <el-option label="150+" value="high" />
        </el-select>
        <el-select v-model="top50Sort" class="filter-item">
          <el-option label="兴趣优先" value="interest" />
          <el-option label="热度优先" value="hot" />
        </el-select>
        <el-switch v-model="onlyOnline" inline-prompt active-text="仅在售" inactive-text="全部" />
      </div>
      <el-table :data="top50List" border>
        <el-table-column prop="rank" label="排名" width="70" />
        <el-table-column prop="name" label="商品名" min-width="230" />
        <el-table-column label="类目" width="120">
          <template #default="{ row }">{{ categoryLabel(row.category) }}</template>
        </el-table-column>
        <el-table-column prop="interestScore" label="兴趣分" width="100" />
        <el-table-column prop="hotScore" label="热度分" width="100" />
        <el-table-column prop="ctr" label="CTR%" width="90" />
        <el-table-column prop="reason" label="推荐理由" min-width="220" />
      </el-table>
    </section>
  </div>
</template>

<script setup>
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import { defineRouteMeta } from "@kesplus/kesplus";
import { useUserMallData } from "@/composables/useUserMallData";

defineOptions({ name: "UserMallPage" });

defineRouteMeta({
  name: "userMall",
  title: "用户商城",
  icon: "Goods",
  isKeepAlive: true,
  anonymous: true,
  layout: {
    navigation: null,
  },
});

const router = useRouter();
const searchKeyword = ref("");
const {
  products,
  guessLikeList,
  top50List,
  activeCategory,
  priceBand,
  onlyOnline,
  top50Sort,
  refreshGuess,
  categoryLabels,
} = useUserMallData();

const filteredProducts = computed(() => {
  const kw = searchKeyword.value.trim().toLowerCase();
  return products.value.filter((p) => {
    const matchedKeyword = !kw || p.name.toLowerCase().includes(kw);
    const matchedCategory = activeCategory.value === "all" || p.category === activeCategory.value;
    return matchedKeyword && matchedCategory;
  });
});

const onSearch = () => {};
const categoryLabel = (key) => categoryLabels[key] || key;
</script>

<style scoped>
.mall-page {
  min-height: 100vh;
  background: #f5f7fb;
  padding: 14px;
}

.mall-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 14px;
  background: #fff;
  box-shadow: 0 6px 18px rgba(15, 23, 42, 0.06);
}

.brand {
  font-size: 24px;
  font-weight: 800;
  cursor: pointer;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.search-input {
  width: 300px;
}

.hero {
  margin-top: 12px;
  border-radius: 14px;
  padding: 18px;
  background: linear-gradient(120deg, #ff7a18, #ffb347);
  color: #fff;
}

.hero-title {
  font-size: 28px;
  font-weight: 800;
}

.hero-subtitle {
  margin-top: 8px;
  opacity: 0.92;
}

.section-card {
  margin-top: 12px;
  background: #fff;
  border-radius: 14px;
  padding: 14px;
  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.04);
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.section-head h3 {
  margin: 0;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.product-card {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 10px;
}

.cover {
  height: 90px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: 700;
}

.name {
  margin-top: 8px;
  font-weight: 600;
}

.meta-line {
  margin-top: 6px;
  display: flex;
  justify-content: space-between;
  color: #64748b;
  font-size: 13px;
}

.price {
  color: #ef4444;
  font-weight: 700;
}

.guess-card {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 12px;
  margin-bottom: 10px;
}

.guess-name {
  font-weight: 700;
}

.guess-score {
  margin-top: 6px;
  color: #334155;
}

.guess-reason {
  margin-top: 4px;
  color: #64748b;
}

.toolbar {
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.filter-item {
  width: 150px;
}

@media (max-width: 1200px) {
  .products-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .mall-header {
    flex-direction: column;
    align-items: stretch;
  }

  .search-input {
    width: 100%;
  }

  .products-grid {
    grid-template-columns: 1fr;
  }
}
</style>
