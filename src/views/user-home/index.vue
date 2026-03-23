<template>
  <div class="user-home-page route-scroll-page route-fade-in">
    <el-card shadow="never" class="hero-card">
      <div class="hero-title">欢迎回来，{{ userName }}</div>
      <div class="hero-subtitle">为你精选好物、智能推荐与兴趣榜单</div>
    </el-card>

    <el-card shadow="never" class="section-card">
      <template #header>
        <div class="section-title">精选商品</div>
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
        <div class="section-title">兴趣商品 Top50</div>
      </template>
      <el-table :data="top50Goods" border>
        <el-table-column prop="rank" label="排名" width="70" />
        <el-table-column prop="name" label="商品名称" min-width="220" />
        <el-table-column prop="category" label="类目" width="110" />
        <el-table-column prop="interest" label="兴趣分" width="100" />
        <el-table-column prop="ctr" label="点击率" width="100" />
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
  title: "用户首页",
  icon: "Goods",
  isKeepAlive: true,
});

const userName = ref("用户");

const products = ref([
  { id: 1, tag: "饮品", name: "无糖气泡水 500ml", price: "6.90", bg: "linear-gradient(135deg, #0ea5e9, #6366f1)" },
  { id: 2, tag: "零食", name: "每日坚果 250g", price: "29.90", bg: "linear-gradient(135deg, #f59e0b, #ef4444)" },
  { id: 3, tag: "日化", name: "洗衣凝珠 2kg", price: "39.80", bg: "linear-gradient(135deg, #10b981, #14b8a6)" },
  { id: 4, tag: "粮油", name: "东北香米 5kg", price: "59.90", bg: "linear-gradient(135deg, #f97316, #eab308)" },
  { id: 5, tag: "酒水", name: "精酿白啤 330ml*6", price: "45.00", bg: "linear-gradient(135deg, #8b5cf6, #a855f7)" },
  { id: 6, tag: "家居", name: "厨房湿巾 80抽", price: "12.90", bg: "linear-gradient(135deg, #06b6d4, #0284c7)" },
]);

const guessLike = ref([
  { id: 11, name: "高蛋白酸奶", reason: "基于你最近浏览的健康饮品" },
  { id: 12, name: "黑巧能量棒", reason: "相似用户经常购买此商品" },
  { id: 13, name: "冷萃咖啡液", reason: "与你的饮品偏好高度匹配" },
]);

const top50Goods = ref(
  Array.from({ length: 50 }).map((_, i) => ({
    rank: i + 1,
    name: `热门商品 ${i + 1}`,
    category: ["饮料酒水", "休闲零食", "日化家清", "粮油速食", "个护美妆"][i % 5],
    interest: 95 - (i % 20),
    ctr: `${(12.5 - i * 0.12).toFixed(1)}%`,
  }))
);
</script>

<style scoped>
.user-home-page {
  min-height: 100%;
  padding: 14px;
}

.hero-card {
  margin-bottom: 14px;
  border-radius: 14px;
  background: linear-gradient(120deg, #fff7ed, #fef3c7, #fce7f3);
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
  margin-bottom: 14px;
  border-radius: 14px;
}

.section-title {
  font-size: 17px;
  font-weight: 700;
  color: #1e293b;
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
  color: #1e293b;
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
  font-weight: 600;
  color: #1e293b;
}

.guess-reason {
  margin-top: 6px;
  color: #64748b;
  font-size: 13px;
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
