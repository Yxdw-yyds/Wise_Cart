<template>
  <div class="user-home-page route-scroll-page route-fade-in">
    <el-card shadow="never" class="hero-card">
      <div class="hero-title">欢迎回来，{{ userName }}</div>
      <div class="hero-subtitle">基于近期行为与历史偏好，系统为你生成了今日精选清单与推荐候选。</div>
      <div class="hero-metrics">
        <div class="hero-metric">
          <span>Catalog</span>
          <b>{{ products.length }}</b>
        </div>
        <div class="hero-metric">
          <span>Guess Like</span>
          <b>{{ guessLike.length }}</b>
        </div>
        <div class="hero-metric">
          <span>Top50 Items</span>
          <b>{{ top50Goods.length }}</b>
        </div>
        <div class="hero-metric">
          <span>Avg Interest</span>
          <b>{{ avgInterest }}</b>
        </div>
      </div>
    </el-card>

    <el-card shadow="never" class="section-card">
      <template #header>
        <div class="section-title">今日精选商品</div>
      </template>
      <div class="goods-grid">
        <div v-for="item in products" :key="item.id" class="goods-item">
          <div class="goods-img" :style="{ background: item.bg }">{{ item.tag }}</div>
          <div class="goods-name">{{ item.name }}</div>
          <div class="goods-price">¥{{ item.price }}</div>
        </div>
      </div>
    </el-card>

    <el-card shadow="never" class="section-card">
      <template #header>
        <div class="section-title">猜你喜欢</div>
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
        <div class="section-title">兴趣 Top50 商品</div>
      </template>
      <el-table :data="top50Goods" border>
        <el-table-column prop="rank" label="排名" width="70" />
        <el-table-column prop="name" label="商品名" min-width="220" />
        <el-table-column prop="category" label="分类" width="130" />
        <el-table-column prop="interest" label="兴趣分" width="100" />
        <el-table-column prop="ctr" label="CTR" width="100" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { computed, ref } from "vue";
import { defineRouteMeta } from "@kesplus/kesplus";

defineOptions({
  name: "UserHomePage",
});

defineRouteMeta({
  name: "userHome",
  title: "用户首页",
  icon: "Goods",
  isKeepAlive: true,
});

const userName = ref("用户");

const products = ref([
  { id: 1, tag: "饮品", name: "矿泉水 500ml", price: "6.90", bg: "linear-gradient(135deg, #0ea5e9, #6366f1)" },
  { id: 2, tag: "零食", name: "曲奇饼干 250g", price: "29.90", bg: "linear-gradient(135deg, #f59e0b, #ef4444)" },
  { id: 3, tag: "粮油", name: "东北大米 2kg", price: "39.80", bg: "linear-gradient(135deg, #10b981, #14b8a6)" },
  { id: 4, tag: "日用", name: "抽纸 5kg", price: "59.90", bg: "linear-gradient(135deg, #f97316, #eab308)" },
  { id: 5, tag: "饮品", name: "苏打汽水 330ml*6", price: "45.00", bg: "linear-gradient(135deg, #8b5cf6, #a855f7)" },
  { id: 6, tag: "个护", name: "湿巾 80抽", price: "12.90", bg: "linear-gradient(135deg, #06b6d4, #0284c7)" },
]);

const guessLike = ref([
  { id: 11, name: "高纤燕麦片", reason: "你近期多次查看早餐相关商品，且偏好健康谷物类。" },
  { id: 12, name: "无糖酸奶", reason: "你有低糖饮食偏好，适合搭配当前购物清单。" },
  { id: 13, name: "厨房清洁湿巾", reason: "你最近关注家清用品，系统推荐高复购商品。" },
]);

const top50Goods = ref(
  Array.from({ length: 50 }).map((_, i) => ({
    rank: i + 1,
    name: `兴趣商品 ${i + 1}`,
    category: ["饮品", "零食", "粮油", "日用", "个护"][i % 5],
    interest: 95 - (i % 20),
    ctr: `${(12.5 - i * 0.12).toFixed(1)}%`,
  }))
);

const avgInterest = computed(() => {
  if (!top50Goods.value.length) return 0;
  const total = top50Goods.value.reduce((sum, item) => sum + (item.interest || 0), 0);
  return (total / top50Goods.value.length).toFixed(1);
});
</script>

<style scoped>
.user-home-page {
  min-height: 100%;
  padding: 14px;
}

.hero-card {
  margin-bottom: 14px;
  border-radius: 18px;
  background: linear-gradient(125deg, rgba(59, 130, 246, 0.14), rgba(255, 255, 255, 0.92) 45%, rgba(245, 158, 11, 0.13));
}

.hero-title {
  font-size: 28px;
  font-weight: 800;
  color: var(--text-primary);
}

.hero-subtitle {
  margin-top: 6px;
  color: var(--text-tertiary);
}

.hero-metrics {
  margin-top: 14px;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.hero-metric {
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.72);
}

.hero-metric span {
  font-size: 12px;
  color: var(--text-tertiary);
}

.hero-metric b {
  display: block;
  margin-top: 6px;
  font-size: 20px;
  color: var(--text-primary);
}

.section-card {
  margin-bottom: 14px;
  border-radius: 14px;
}

.section-title {
  font-size: 17px;
  font-weight: 700;
  color: var(--text-primary);
}

.goods-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.goods-item {
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 14px;
  background: #fff;
  transition: transform 0.2s, box-shadow 0.2s;
}

.goods-item:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
}

.goods-img {
  width: 100%;
  height: 72px;
  border-radius: 10px;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
}

.goods-name {
  margin-top: 10px;
  font-weight: 600;
  color: var(--text-primary);
}

.goods-price {
  margin-top: 6px;
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
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.06);
}

.guess-name {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
}

.guess-reason {
  margin-top: 6px;
  color: var(--text-tertiary);
  font-size: 13px;
}

@media (max-width: 1200px) {
  .hero-metrics,
  .goods-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .hero-metrics,
  .goods-grid {
    grid-template-columns: 1fr;
  }
}
</style>
