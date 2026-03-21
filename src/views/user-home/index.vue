<template>
  <div class="user-home-page">
    <el-card shadow="never" class="hero-card">
      <div class="hero-title">Welcome back, {{ userName }}</div>
      <div class="hero-subtitle">Products, recommendations, and Top50 interest list</div>
    </el-card>

    <el-card shadow="never" class="section-card">
      <template #header>
        <div class="section-title">Products</div>
      </template>
      <div class="goods-grid">
        <div v-for="item in products" :key="item.id" class="goods-item">
          <div class="goods-img">{{ item.tag }}</div>
          <div class="goods-name">{{ item.name }}</div>
          <div class="goods-price">CNY {{ item.price }}</div>
        </div>
      </div>
    </el-card>

    <el-card shadow="never" class="section-card">
      <template #header>
        <div class="section-title">Guess You Like</div>
      </template>
      <el-row :gutter="12">
        <el-col v-for="item in guessLike" :key="item.id" :xs="24" :sm="12" :lg="8">
          <div class="guess-card">
            <div class="guess-name">{{ item.name }}</div>
            <div class="guess-reason">{{ item.reason }}</div>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <el-card shadow="never" class="section-card">
      <template #header>
        <div class="section-title">Top 50 Interested Products</div>
      </template>
      <el-table :data="top50Goods" border>
        <el-table-column prop="rank" label="Rank" width="80" />
        <el-table-column prop="name" label="Product Name" min-width="220" />
        <el-table-column prop="category" label="Category" width="120" />
        <el-table-column prop="interest" label="Interest" width="120" />
        <el-table-column prop="ctr" label="CTR" width="110" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { defineRouteMeta } from "@kesplus/kesplus";

defineOptions({
  name: "UserHomePage",
});

defineRouteMeta({
  name: "userHome",
  title: "User Home",
  icon: "Goods",
  isKeepAlive: true,
});

const userName = ref("User");

const products = ref([
  { id: 1, tag: "Drink", name: "Sparkling Water 500ml", price: "6.90" },
  { id: 2, tag: "Snack", name: "Mixed Nuts 250g", price: "29.90" },
  { id: 3, tag: "Daily", name: "Laundry Liquid 2kg", price: "39.80" },
  { id: 4, tag: "Food", name: "Rice 5kg", price: "59.90" },
  { id: 5, tag: "Beverage", name: "Craft Beer 330ml*6", price: "45.00" },
  { id: 6, tag: "Home", name: "Kitchen Wipes 80pcs", price: "12.90" },
]);

const guessLike = ref([
  { id: 11, name: "High Protein Yogurt", reason: "Based on your recent healthy drink views" },
  { id: 12, name: "Dark Chocolate Bar", reason: "Similar users buy this often" },
  { id: 13, name: "Cold Brew Coffee", reason: "Matches your beverage preference" },
]);

const top50Goods = ref(
  Array.from({ length: 50 }).map((_, i) => ({
    rank: i + 1,
    name: `Popular Product ${i + 1}`,
    category: ["Beverage", "Snack", "Daily", "Food", "Drink"][i % 5],
    interest: 95 - (i % 20),
    ctr: `${(12.5 - i * 0.12).toFixed(1)}%`,
  }))
);
</script>

<style scoped>
.user-home-page {
  height: calc(100vh - 86px);
  overflow-y: auto;
  overflow-x: hidden;
  padding: 12px;
}

.hero-card {
  margin-bottom: 12px;
}

.hero-title {
  font-size: 24px;
  font-weight: 700;
  color: #0f172a;
}

.hero-subtitle {
  margin-top: 6px;
  color: #64748b;
}

.section-card {
  margin-bottom: 12px;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
}

.goods-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.goods-item {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 12px;
  background: #f8fbff;
}

.goods-img {
  width: 64px;
  height: 64px;
  border-radius: 10px;
  background: linear-gradient(135deg, #4f7cff, #8b8cff);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
}

.goods-name {
  margin-top: 10px;
  font-weight: 600;
}

.goods-price {
  margin-top: 6px;
  color: #ef4444;
  font-weight: 700;
}

.guess-card {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 12px;
  margin-bottom: 10px;
  background: #ffffff;
}

.guess-name {
  font-size: 15px;
  font-weight: 600;
}

.guess-reason {
  margin-top: 6px;
  color: #64748b;
}

@media (max-width: 1200px) {
  .goods-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .goods-grid {
    grid-template-columns: 1fr;
  }
}
</style>
