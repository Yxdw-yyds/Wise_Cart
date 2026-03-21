<template>
  <div class="mall-page">
    <header class="mall-header">
      <div class="brand">WiseCart Mall</div>
      <div class="header-actions">
        <el-input v-model="keyword" placeholder="Search products" class="search-input" clearable />
        <el-button type="primary">Search</el-button>
        <el-button @click="showProfile = !showProfile">My Profile</el-button>
      </div>
    </header>

    <section class="banner">
      <div class="banner-title">New Season Deals</div>
      <div class="banner-subtitle">Smart recommendations for you</div>
    </section>

    <section class="section">
      <div class="section-head">
        <h3>Products</h3>
      </div>
      <div class="goods-grid">
        <article v-for="item in filteredProducts" :key="item.id" class="goods-card">
          <div class="goods-cover">{{ item.category }}</div>
          <div class="goods-name">{{ item.name }}</div>
          <div class="goods-meta">
            <span class="price">CNY {{ item.price }}</span>
            <el-button size="small" type="primary" plain>Add to Cart</el-button>
          </div>
        </article>
      </div>
    </section>

    <section class="section">
      <div class="section-head">
        <h3>Guess You Like</h3>
      </div>
      <el-row :gutter="12">
        <el-col v-for="item in guessLike" :key="item.id" :xs="24" :sm="12" :lg="8">
          <div class="like-card">
            <div class="like-name">{{ item.name }}</div>
            <div class="like-reason">{{ item.reason }}</div>
          </div>
        </el-col>
      </el-row>
    </section>

    <section class="section">
      <div class="section-head">
        <h3>Top 50 Interested Products</h3>
      </div>
      <el-table :data="top50Goods" border>
        <el-table-column prop="rank" label="Rank" width="80" />
        <el-table-column prop="name" label="Product Name" min-width="240" />
        <el-table-column prop="category" label="Category" width="130" />
        <el-table-column prop="interest" label="Interest %" width="120" />
        <el-table-column prop="ctr" label="CTR" width="100" />
      </el-table>
    </section>

    <section v-if="showProfile" class="section profile-section">
      <div class="section-head">
        <h3>User Persona</h3>
      </div>
      <el-row :gutter="14">
        <el-col :xs="24" :lg="14">
          <el-card shadow="never">
            <div class="profile-title">Category Interest Percentage</div>
            <div class="progress-list">
              <div v-for="item in interests" :key="item.name" class="progress-item">
                <div class="progress-row">
                  <span>{{ item.name }}</span>
                  <strong>{{ item.percent }}%</strong>
                </div>
                <el-progress :percentage="item.percent" :stroke-width="14" />
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="24" :lg="10">
          <el-card shadow="never">
            <div class="profile-title">Tags</div>
            <div class="tags">
              <el-tag v-for="tag in tags" :key="tag">{{ tag }}</el-tag>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </section>
  </div>
</template>

<script setup>
import { computed, ref } from "vue";
import { defineRouteMeta } from "@kesplus/kesplus";

defineOptions({
  name: "UserMallPage",
});

defineRouteMeta({
  name: "userMall",
  title: "User Mall",
  icon: "Goods",
  isKeepAlive: true,
  anonymous: true,
  layout: {
    navigation: null,
  },
});

const keyword = ref("");
const showProfile = ref(true);

const products = ref([
  { id: 1, category: "Drink", name: "Sparkling Water 500ml", price: "6.90" },
  { id: 2, category: "Snack", name: "Mixed Nuts 250g", price: "29.90" },
  { id: 3, category: "Daily", name: "Laundry Liquid 2kg", price: "39.80" },
  { id: 4, category: "Food", name: "Rice 5kg", price: "59.90" },
  { id: 5, category: "Beverage", name: "Craft Beer 330ml*6", price: "45.00" },
  { id: 6, category: "Home", name: "Kitchen Wipes 80pcs", price: "12.90" },
  { id: 7, category: "Beauty", name: "Moisturizing Mask 10pcs", price: "49.00" },
  { id: 8, category: "Tech", name: "Wireless Earbuds", price: "159.00" },
]);

const filteredProducts = computed(() => {
  const kw = keyword.value.trim().toLowerCase();
  if (!kw) return products.value;
  return products.value.filter((p) => p.name.toLowerCase().includes(kw) || p.category.toLowerCase().includes(kw));
});

const guessLike = ref([
  { id: 1, name: "High Protein Yogurt", reason: "Because you viewed healthy drinks" },
  { id: 2, name: "Dark Chocolate Bar", reason: "Similar users liked this product" },
  { id: 3, name: "Cold Brew Coffee", reason: "Because you prefer beverage category" },
]);

const top50Goods = ref(
  Array.from({ length: 50 }).map((_, i) => ({
    rank: i + 1,
    name: `Popular Product ${i + 1}`,
    category: ["Drink", "Snack", "Daily", "Food", "Beverage"][i % 5],
    interest: 92 - (i % 18),
    ctr: `${(12.5 - i * 0.11).toFixed(1)}%`,
  }))
);

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
.mall-page {
  min-height: 100vh;
  background: #f4f6fb;
  padding: 16px;
}

.mall-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  background: #fff;
  border-radius: 16px;
  padding: 14px 16px;
  box-shadow: 0 6px 24px rgba(15, 23, 42, 0.06);
}

.brand {
  font-size: 24px;
  font-weight: 800;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.search-input {
  width: 320px;
}

.banner {
  margin-top: 14px;
  border-radius: 16px;
  padding: 28px;
  background: linear-gradient(120deg, #4f7cff, #7a93ff 55%, #8b8cff);
  color: #fff;
}

.banner-title {
  font-size: 30px;
  font-weight: 800;
}

.banner-subtitle {
  margin-top: 8px;
  opacity: 0.9;
}

.section {
  margin-top: 14px;
  background: #fff;
  border-radius: 16px;
  padding: 14px;
  box-shadow: 0 6px 24px rgba(15, 23, 42, 0.05);
}

.section-head h3 {
  margin: 0 0 12px;
}

.goods-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.goods-card {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 12px;
}

.goods-cover {
  height: 72px;
  border-radius: 10px;
  background: linear-gradient(135deg, #dbe7ff, #ebf2ff);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
}

.goods-name {
  margin-top: 10px;
  font-weight: 600;
}

.goods-meta {
  margin-top: 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.price {
  color: #e11d48;
  font-weight: 700;
}

.like-card {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 12px;
}

.like-name {
  font-weight: 700;
}

.like-reason {
  margin-top: 6px;
  color: #64748b;
}

.profile-section .profile-title {
  font-weight: 700;
  margin-bottom: 12px;
}

.progress-list {
  display: grid;
  gap: 10px;
}

.progress-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

@media (max-width: 1200px) {
  .goods-grid {
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

  .goods-grid {
    grid-template-columns: 1fr;
  }
}
</style>
