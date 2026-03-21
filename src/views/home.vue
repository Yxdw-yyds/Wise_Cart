<template>
  <div class="taobao-home">
    <!-- 顶部导航栏 - 淘宝风格 -->
    <header class="taobao-header">
      <div class="header-inner">
        <div class="logo-area" @click="$router.push('/home')">
          <span class="logo-text">{{ $t('home.brand') }}</span>
        </div>
        <div class="search-area">
          <el-input
            v-model="searchKeyword"
            :placeholder="$t('home.searchPlaceholder')"
            class="search-input"
            size="large"
            clearable
            @keyup.enter="onSearch"
          >
            <template #append>
              <el-button type="primary" @click="onSearch">
                {{ $t('home.search') }}
              </el-button>
            </template>
          </el-input>
        </div>
        <div class="header-actions">
          <div class="action-item" @click="$router.push('/user-info')">
            <el-icon :size="22"><User /></el-icon>
            <span>{{ $t('message.user.myAccount') }}</span>
          </div>
          <div class="action-item cart-item" @click="goCart">
            <el-badge :value="cartCount" :hidden="cartCount === 0" class="cart-badge">
              <el-icon :size="24"><ShoppingCart /></el-icon>
            </el-badge>
            <span>{{ $t('home.cart') }}</span>
          </div>
        </div>
      </div>
    </header>

    <!-- 分类导航 -->
    <nav class="category-nav">
      <div class="category-inner">
        <a
          v-for="cat in categories"
          :key="cat.id"
          class="category-item"
          :class="{ active: activeCategory === cat.id }"
          href="javascript:;"
          @click="activeCategory = cat.id"
        >
          {{ cat.name }}
        </a>
      </div>
    </nav>

    <!-- 主内容区 -->
    <main class="main-content">
      <!-- 轮播横幅 -->
      <section class="banner-section">
        <el-carousel height="360px" :interval="4000" indicator-position="inside">
          <el-carousel-item v-for="(banner, i) in banners" :key="i">
            <div class="banner-item" :style="{ background: banner.bg }">
              <div class="banner-content">
                <h2>{{ banner.title }}</h2>
                <p>{{ banner.subtitle }}</p>
              </div>
            </div>
          </el-carousel-item>
        </el-carousel>
      </section>

      <!-- 限时抢购 -->
      <section class="flash-sale">
        <div class="section-header">
          <span class="section-title">
            <el-icon><Timer /></el-icon>
            {{ $t('home.flashSale') }}
          </span>
          <span class="countdown">{{ $t('home.endsIn') }} 02:35:18</span>
        </div>
        <div class="flash-products">
          <div
            v-for="item in flashProducts"
            :key="item.id"
            class="product-card flash-card"
            @click="viewProduct(item)"
          >
            <div class="product-img-wrap">
              <div class="product-img" :style="{ background: item.bg }"></div>
              <span class="price-tag">¥{{ item.price }}</span>
            </div>
            <div class="product-info">
              <div class="product-title">{{ item.name }}</div>
              <div class="product-meta">
                <span class="original-price">¥{{ item.originalPrice }}</span>
                <span class="sold">{{ $t('home.sold') }} {{ item.sold }}{{ $t('home.soldUnit') }}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 商品推荐 -->
      <section class="product-section">
        <div class="section-header">
          <span class="section-title">{{ $t('home.recommend') }}</span>
        </div>
        <div class="product-grid">
          <div
            v-for="item in products"
            :key="item.id"
            class="product-card"
            @click="viewProduct(item)"
          >
            <div class="product-img-wrap">
              <div class="product-img" :style="{ background: item.bg }"></div>
              <span v-if="item.tag" class="product-tag">{{ item.tag }}</span>
            </div>
            <div class="product-info">
              <div class="product-title">{{ item.name }}</div>
              <div class="product-price">
                <span class="current-price">¥{{ item.price }}</span>
                <span v-if="item.originalPrice" class="original-price">¥{{ item.originalPrice }}</span>
              </div>
              <div class="product-meta">
                <span class="sold">{{ $t('home.sold') }} {{ item.sold }}{{ $t('home.soldUnit') }}</span>
                <span class="shop-name">{{ item.shop }}</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>

    <!-- 底部 -->
    <footer class="taobao-footer">
      <div class="footer-inner">
        <p>© {{ new Date().getFullYear() }} {{ $t('home.brand') }} - {{ $t('home.footer') }}</p>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { User, ShoppingCart, Timer } from "@element-plus/icons-vue";
import { defineRouteMeta } from "@kesplus/kesplus";

defineOptions({
  name: "TaobaoHome",
});

defineRouteMeta({
  name: "home",
  title: "首页",
  layout: { navigation: null },
  isKeepAlive: true,
  icon: "HomeFilled",
  isAffix: true,
});

const router = useRouter();
const searchKeyword = ref("");
const activeCategory = ref("all");
const cartCount = ref(3);

const categories = [
  { id: "all", name: "全部" },
  { id: "women", name: "女装" },
  { id: "men", name: "男装" },
  { id: "digital", name: "数码" },
  { id: "home", name: "家居" },
  { id: "beauty", name: "美妆" },
  { id: "food", name: "食品" },
  { id: "baby", name: "母婴" },
];

const banners = [
  { title: "春季新品", subtitle: "全场满299减50", bg: "linear-gradient(135deg, #ff6b6b 0%, #ff8e53 100%)" },
  { title: "限时特惠", subtitle: "品质好物 低至5折", bg: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)" },
  { title: "品牌日", subtitle: "大牌直降 抢先购", bg: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)" },
];

const flashProducts = [
  { id: 1, name: "无线蓝牙耳机", price: "89", originalPrice: "199", sold: "2.3万", bg: "linear-gradient(180deg, #667eea 0%, #764ba2 100%)" },
  { id: 2, name: "便携充电宝", price: "49", originalPrice: "99", sold: "1.8万", bg: "linear-gradient(180deg, #f093fb 0%, #f5576c 100%)" },
  { id: 3, name: "智能手环", price: "129", originalPrice: "299", sold: "5.6万", bg: "linear-gradient(180deg, #4facfe 0%, #00f2fe 100%)" },
  { id: 4, name: "保温杯", price: "39", originalPrice: "79", sold: "3.2万", bg: "linear-gradient(180deg, #43e97b 0%, #38f9d7 100%)" },
  { id: 5, name: "护眼台灯", price: "79", originalPrice: "159", sold: "8.1万", bg: "linear-gradient(180deg, #fa709a 0%, #fee140 100%)" },
];

const products = [
  { id: 10, name: "纯棉T恤 男女同款 多色可选", price: "59.9", originalPrice: "99", sold: "1.2万", shop: "品质衣橱", tag: "新品", bg: "linear-gradient(180deg, #a8edea 0%, #fed6e3 100%)" },
  { id: 11, name: "休闲牛仔裤 高腰显瘦", price: "89", originalPrice: "169", sold: "5.6万", shop: "潮流服饰", tag: "爆款", bg: "linear-gradient(180deg, #d299c2 0%, #fef9d7 100%)" },
  { id: 12, name: "家用豆浆机 静音破壁", price: "199", originalPrice: "399", sold: "2.3万", shop: "厨房好物", bg: "linear-gradient(180deg, #89f7fe 0%, #66a6ff 100%)" },
  { id: 13, name: "运动鞋 透气网面", price: "159", originalPrice: "299", sold: "8.9万", shop: "运动户外", tag: "热卖", bg: "linear-gradient(180deg, #ffecd2 0%, #fcb69f 100%)" },
  { id: 14, name: "护肤品套装 补水保湿", price: "128", originalPrice: "256", sold: "4.5万", shop: "美妆专营", bg: "linear-gradient(180deg, #ff9a9e 0%, #fecfef 100%)" },
  { id: 15, name: "儿童玩具 益智积木", price: "78", originalPrice: "158", sold: "6.7万", shop: "母婴优选", bg: "linear-gradient(180deg, #a1c4fd 0%, #c2e9fb 100%)" },
  { id: 16, name: "零食大礼包 混合装", price: "49.9", originalPrice: "89", sold: "12万", shop: "美食天地", tag: "超值", bg: "linear-gradient(180deg, #fbc2eb 0%, #a6c1ee 100%)" },
  { id: 17, name: "USB-C 快充线 3条装", price: "19.9", originalPrice: "39", sold: "15万", shop: "数码配件", bg: "linear-gradient(180deg, #84fab0 0%, #8fd3f4 100%)" },
];

const onSearch = () => {
  if (searchKeyword.value.trim()) {
    // 可接入搜索逻辑
  }
};

const goCart = () => {
  // 可接入购物车页面
};

const viewProduct = (item) => {
  // 可接入商品详情页
};
</script>

<style lang="scss" scoped>
.taobao-home {
  min-height: 100vh;
  background: #f5f5f5;
}

/* 顶部导航 */
.taobao-header {
  background: #ff6700;
  color: #fff;
  box-shadow: 0 2px 8px rgba(255, 103, 0, 0.3);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 12px 20px;
  display: flex;
  align-items: center;
  gap: 24px;
}

.logo-area {
  cursor: pointer;
  flex-shrink: 0;

  .logo-text {
    font-size: 24px;
    font-weight: 700;
    letter-spacing: 2px;
  }
}

.search-area {
  flex: 1;
  max-width: 560px;

  :deep(.search-input) {
    .el-input__wrapper {
      border-radius: 20px 0 0 20px;
      box-shadow: none;
    }
    .el-input-group__append {
      border-radius: 0 20px 20px 0;
      padding: 0;
      .el-button {
        border-radius: 0 20px 20px 0;
        padding: 0 24px;
      }
    }
  }
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-shrink: 0;
}

.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  font-size: 12px;
  gap: 2px;

  &:hover {
    opacity: 0.9;
  }
}

.cart-item {
  position: relative;
}

.cart-badge {
  :deep(.el-badge__content) {
    background: #fff;
    color: #ff6700;
  }
}

/* 分类导航 */
.category-nav {
  background: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.category-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 8px;

  &::-webkit-scrollbar {
    height: 4px;
  }
}

.category-item {
  flex-shrink: 0;
  padding: 12px 16px;
  color: #333;
  text-decoration: none;
  font-size: 14px;
  border-radius: 4px;
  transition: all 0.2s;

  &:hover,
  &.active {
    color: #ff6700;
    background: rgba(255, 103, 0, 0.08);
  }
}

/* 主内容 */
.main-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.banner-section {
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.banner-item {
  height: 100%;
  display: flex;
  align-items: center;
  padding: 0 60px;

  .banner-content {
    h2 {
      font-size: 32px;
      color: #fff;
      margin: 0 0 8px 0;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }
    p {
      font-size: 18px;
      color: rgba(255, 255, 255, 0.95);
      margin: 0;
    }
  }
}

/* 限时抢购 */
.flash-sale {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  display: flex;
  align-items: center;
  gap: 8px;

  .el-icon {
    color: #ff6700;
    font-size: 22px;
  }
}

.countdown {
  font-size: 14px;
  color: #ff6700;
  font-weight: 500;
}

.flash-products {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 16px;
}

@media (max-width: 992px) {
  .flash-products {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 576px) {
  .flash-products {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* 商品推荐 */
.product-section {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

@media (max-width: 992px) {
  .product-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 576px) {
  .product-grid {
    grid-template-columns: 1fr;
  }
}

.product-card {
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  }
}

.flash-card {
  border: 1px solid #f0f0f0;
}

.product-img-wrap {
  position: relative;
  padding-top: 100%;
  overflow: hidden;
}

.product-img {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.price-tag {
  position: absolute;
  bottom: 8px;
  left: 8px;
  background: #ff6700;
  color: #fff;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 16px;
  font-weight: 600;
}

.product-tag {
  position: absolute;
  top: 8px;
  left: 8px;
  background: #ff6700;
  color: #fff;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
}

.product-info {
  padding: 12px;
}

.product-title {
  font-size: 14px;
  color: #333;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.product-price {
  margin-top: 8px;
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.current-price {
  font-size: 18px;
  color: #ff6700;
  font-weight: 600;
}

.original-price {
  font-size: 12px;
  color: #999;
  text-decoration: line-through;
}

.product-meta {
  margin-top: 6px;
  font-size: 12px;
  color: #999;
  display: flex;
  justify-content: space-between;
}

/* 底部 */
.taobao-footer {
  margin-top: 40px;
  padding: 24px;
  background: #fff;
  text-align: center;
  color: #999;
  font-size: 13px;
}
</style>
