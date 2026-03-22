<template>
  <div class="mall-page">
    <header class="mall-header">
      <div class="brand" @click="router.push('/user-mall')">
        <span class="brand-wise">Wise&nbsp;</span><span class="brand-cart">Cart&nbsp;</span><span class="brand-sub">商城&nbsp;</span>
      </div>
      <div class="header-spacer"></div>
      <div class="header-search">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索商品"
          class="search-input"
          clearable
          @keyup.enter="onSearch"
        >
          <template #append>
            <el-button type="primary" @click="onSearch">搜索</el-button>
          </template>
        </el-input>
      </div>
      <div class="header-spacer"></div>
      <div class="header-right">
        <el-button plain @click="router.push('/user-profile')">用户画像</el-button>
        <el-dropdown trigger="click" @command="onUserCommand">
          <div class="avatar-wrap">
            <div class="user-avatar">U</div>
            <span class="user-name">用户</span>
            <el-icon class="arrow-icon"><ArrowDown /></el-icon>
          </div>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="profile">用户画像</el-dropdown-item>
              <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
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
import { ArrowDown } from "@element-plus/icons-vue";
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

const onUserCommand = (cmd) => {
  if (cmd === "profile") {
    router.push("/user-profile");
  } else if (cmd === "logout") {
    localStorage.removeItem("loginRole");
    localStorage.removeItem("userInfo");
    window.location.assign(
      `${window.location.origin}${window.location.pathname}#/login`
    );
  }
};
</script>

<style scoped>
.mall-page {
  height: 100vh;
  overflow-y: auto;
  overflow-x: hidden;
  background: linear-gradient(180deg, #f8fafc 0%, #f0f4ff 100%);
  padding: 14px;
}

.mall-header {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 18px;
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 6px 24px rgba(15, 23, 42, 0.06);
}

.brand {
  display: flex;
  align-items: baseline;
  cursor: pointer;
  flex-shrink: 0;
  gap: 0;
}

.brand-wise,
.brand-cart,
.brand-sub {
  font-weight: 900;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.brand-wise {
  font-size: 26px;
  font-style: italic;
  background-image: linear-gradient(135deg, #ff6700, #ff9a44);
}

.brand-cart {
  font-size: 26px;
  font-style: italic;
  background-image: linear-gradient(135deg, #6366f1, #a855f7);
}

.brand-sub {
  font-size: 20px;
  background-image: linear-gradient(135deg, #10b981, #06b6d4);
}

.header-spacer {
  flex: 1;
}

.header-search {
  flex: 0 1 420px;
}

.search-input {
  width: 100%;
}

.header-right {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 12px;
}

.avatar-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 8px;
  transition: background 0.2s;
}

.avatar-wrap:hover {
  background: #f1f5f9;
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #ff6700, #ff9a44);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 14px;
}

.user-name {
  font-size: 14px;
  color: #334155;
  font-weight: 500;
}

.arrow-icon {
  font-size: 12px;
  color: #94a3b8;
}

.hero {
  margin-top: 14px;
  border-radius: 16px;
  padding: 28px 24px;
  background: linear-gradient(120deg, #ff6700 0%, #ff9a44 40%, #ffcf4a 100%);
  color: #fff;
  box-shadow: 0 8px 24px rgba(255, 103, 0, 0.2);
}

.hero-title {
  font-size: 28px;
  font-weight: 800;
}

.hero-subtitle {
  margin-top: 8px;
  opacity: 0.92;
  font-size: 15px;
}

.section-card {
  margin-top: 14px;
  background: #fff;
  border-radius: 16px;
  padding: 18px;
  box-shadow: 0 4px 16px rgba(15, 23, 42, 0.04);
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.section-head h3 {
  margin: 0;
  font-size: 17px;
  color: #1e293b;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.product-card {
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 12px;
  background: #fff;
  transition: transform 0.2s, box-shadow 0.2s;
}

.product-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.cover {
  height: 96px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: 700;
  font-size: 14px;
}

.name {
  margin-top: 10px;
  font-weight: 600;
  color: #1e293b;
  font-size: 14px;
}

.meta-line {
  margin-top: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #64748b;
  font-size: 13px;
}

.price {
  color: #ef4444;
  font-weight: 700;
  font-size: 16px;
}

.guess-card {
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 14px;
  margin-bottom: 12px;
  background: #fff;
  transition: box-shadow 0.2s;
}

.guess-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
}

.guess-name {
  font-weight: 700;
  color: #1e293b;
}

.guess-score {
  margin-top: 6px;
  color: #6366f1;
  font-weight: 600;
  font-size: 13px;
}

.guess-reason {
  margin-top: 4px;
  color: #64748b;
  font-size: 13px;
}

.toolbar {
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
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
    flex-wrap: wrap;
  }

  .header-spacer {
    display: none;
  }

  .header-search {
    flex: 1 1 100%;
    order: 10;
    margin-top: 8px;
  }

  .products-grid {
    grid-template-columns: 1fr;
  }
}
</style>
