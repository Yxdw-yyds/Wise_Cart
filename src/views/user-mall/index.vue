<template>
  <div ref="mallPageRef" class="mall-page route-scroll-page route-fade-in">
    <header class="mall-header">
      <div class="brand" @click="router.push('/user-mall')">
        <span class="brand-wise">Wise</span>
        <span class="brand-cart">Cart</span>
        <span class="brand-sub">用户商城</span>
      </div>

      <div class="header-search">
        <el-autocomplete
          v-model="searchKeyword"
          :fetch-suggestions="querySearch"
          placeholder="搜索商品、分类或店铺"
          class="search-input"
          clearable
          @select="onSuggestSelect"
          @keyup.enter="onSearch"
        >
          <template #append>
            <el-button type="primary" @click="onSearch">搜索</el-button>
          </template>
        </el-autocomplete>
        <div class="hot-keywords">
          <span class="hot-label">热门：</span>
          <button v-for="keyword in hotKeywords" :key="keyword" type="button" class="hot-pill" @click="applyKeyword(keyword)">
            {{ keyword }}
          </button>
        </div>
      </div>

      <div class="header-right">
        <el-button plain @click="router.push('/user-profile')">个人画像</el-button>
        <el-dropdown trigger="click" @command="onUserCommand">
          <div class="avatar-wrap">
            <div class="user-avatar">U</div>
            <span class="user-name">用户</span>
            <el-icon class="arrow-icon"><ArrowDown /></el-icon>
          </div>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="profile">个人画像</el-dropdown-item>
              <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </header>

    <section class="hero">
      <div class="hero-copy">
        <div class="hero-eyebrow">Personalized Retail</div>
        <div class="hero-title">猜你喜欢 + 兴趣 Top50 推荐</div>
        <div class="hero-subtitle">根据你的浏览与行为数据，系统实时给出更相关的商品与推荐理由，提升发现效率。</div>
        <div class="hero-actions">
          <el-button type="primary" @click="scrollToSection('guess-anchor')">查看猜你喜欢</el-button>
          <el-button plain @click="router.push('/user-profile')">查看个人画像</el-button>
        </div>
      </div>
      <div class="hero-visual">
        <div class="visual-card">
          <span class="visual-kicker">推荐匹配度</span>
          <strong>{{ matchRate }}%</strong>
          <p>基于当前样本估算的推荐匹配强度，分值越高表示个性化结果越贴合你的兴趣。</p>
        </div>
      </div>
    </section>

    <div class="summary-row">
      <el-card shadow="never" class="summary-item">
        <span>候选商品</span>
        <b>{{ products.length }}</b>
      </el-card>
      <el-card shadow="never" class="summary-item">
        <span>猜你喜欢</span>
        <b>{{ guessLikeList.length }}</b>
      </el-card>
      <el-card shadow="never" class="summary-item">
        <span>Top50商品</span>
        <b>{{ top50List.length }}</b>
      </el-card>
      <el-card shadow="never" class="summary-item">
        <span>平均兴趣分</span>
        <b>{{ avgInterest }}</b>
      </el-card>
    </div>

    <section class="section-card">
      <div class="section-head">
        <div>
          <h3>商品池</h3>
          <p>可按关键词和分类筛选，支持快速定位商品。</p>
        </div>
      </div>

      <div v-if="isMallLoading" class="products-grid">
        <div v-for="idx in 8" :key="idx" class="product-skeleton">
          <el-skeleton animated>
            <template #template>
              <el-skeleton-item variant="image" class="skeleton-cover" />
              <el-skeleton-item variant="h3" class="skeleton-line skeleton-title" />
              <el-skeleton-item variant="text" class="skeleton-line" />
              <el-skeleton-item variant="text" class="skeleton-line skeleton-short" />
            </template>
          </el-skeleton>
        </div>
      </div>

      <div v-else-if="filteredProducts.length" class="products-grid">
        <article v-for="item in filteredProducts" :key="item.id" class="product-card">
          <div class="cover-wrap">
            <div class="cover" :style="{ background: item.imgBg }">
              <span class="cover-category">{{ categoryLabel(item.category) }}</span>
            </div>
            <div class="card-tags">
              <span v-for="tag in item.tags" :key="tag" class="tag-chip">{{ tag }}</span>
            </div>
          </div>
          <div class="name">{{ item.name }}</div>
          <div class="product-desc">{{ item.categoryHint }}</div>
          <div class="meta-line">
            <span class="price">¥{{ item.price }}</span>
            <span class="original-price">¥{{ item.originalPrice }}</span>
          </div>
          <div class="meta-line meta-sub">
            <span class="shop">{{ item.shop }}</span>
            <span class="stock">库存 {{ item.stock }}</span>
          </div>
        </article>
      </div>

      <el-empty v-else description="没有匹配的商品，试试其他关键词。">
        <el-button type="primary" @click="resetSearch">重置筛选</el-button>
      </el-empty>
    </section>

    <section id="guess-anchor" class="section-card">
      <div class="section-head">
        <div>
          <h3>猜你喜欢</h3>
          <p>根据最近行为计算的高相关商品。</p>
        </div>
        <el-button link type="primary" @click="refreshGuess">刷新推荐</el-button>
      </div>

      <div v-if="isGuessLoading" class="guess-grid">
        <div v-for="idx in 3" :key="idx" class="guess-skeleton">
          <el-skeleton animated>
            <template #template>
              <el-skeleton-item variant="h3" class="skeleton-line skeleton-title" />
              <el-skeleton-item variant="text" class="skeleton-line" />
              <el-skeleton-item variant="text" class="skeleton-line skeleton-short" />
            </template>
          </el-skeleton>
        </div>
      </div>

      <el-row v-else-if="guessLikeList.length" :gutter="12">
        <el-col v-for="item in guessLikeList" :key="item.productId" :xs="24" :sm="12" :lg="8">
          <div class="guess-card">
            <div class="guess-top">
              <div class="guess-name">{{ item.name }}</div>
              <span class="reason-badge">{{ item.reasonTag }}</span>
            </div>
            <div class="guess-score">推荐得分 {{ item.score }}</div>
            <div class="guess-reason">{{ item.reason }}</div>
            <div class="guess-footer">
              <span>{{ categoryLabel(item.category) }}</span>
              <strong>¥{{ item.price }}</strong>
            </div>
          </div>
        </el-col>
      </el-row>

      <el-empty v-else description="当前没有推荐结果，请稍后再试。"></el-empty>
    </section>

    <section class="section-card">
      <div class="section-head">
        <div>
          <h3>兴趣 Top50 商品</h3>
          <p>可按分类、价格带和热度排序。</p>
        </div>
      </div>
      <div class="toolbar">
        <el-select v-model="activeCategory" class="filter-item">
          <el-option label="全部分类" value="all" />
          <el-option v-for="(label, key) in categoryLabels" :key="key" :label="label" :value="key" />
        </el-select>
        <el-select v-model="priceBand" class="filter-item">
          <el-option label="全部价格带" value="all" />
          <el-option label="0-50" value="low" />
          <el-option label="50-150" value="mid" />
          <el-option label="150+" value="high" />
        </el-select>
        <el-select v-model="top50Sort" class="filter-item">
          <el-option label="按兴趣分" value="interest" />
          <el-option label="按热度分" value="hot" />
        </el-select>
        <el-switch v-model="onlyOnline" inline-prompt active-text="仅在线" inactive-text="全部" />
      </div>
      <el-table :data="top50List" border>
        <el-table-column prop="rank" label="排名" width="70" />
        <el-table-column prop="name" label="商品名" min-width="230" />
        <el-table-column label="分类" width="120">
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
import { computed, ref, watch } from "vue";
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
const mallPageRef = ref(null);
const searchKeyword = ref("");
const isMallLoading = ref(true);
const isGuessLoading = ref(true);
const hotKeywords = ["矿泉水", "燕麦片", "零食", "清洁用品"];
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

window.setTimeout(() => {
  isMallLoading.value = false;
}, 550);

window.setTimeout(() => {
  isGuessLoading.value = false;
}, 800);

const matchRate = computed(() => {
  if (!guessLikeList.value.length) return 0;
  const total = guessLikeList.value.reduce((sum, item) => sum + (Number(item.score) || 0), 0);
  return Math.min(99, (total / guessLikeList.value.length).toFixed(1));
});

const avgInterest = computed(() => {
  if (!top50List.value.length) return 0;
  const total = top50List.value.reduce((sum, item) => sum + (Number(item.interestScore) || 0), 0);
  return (total / top50List.value.length).toFixed(1);
});

const suggestionPool = computed(() => {
  const categoryItems = Object.values(categoryLabels);
  const productNames = products.value.map((item) => item.name);
  const shops = [...new Set(products.value.map((item) => item.shop))];
  return [...new Set([...hotKeywords, ...categoryItems, ...productNames, ...shops])];
});

const filteredProducts = computed(() => {
  const kw = searchKeyword.value.trim().toLowerCase();
  return products.value.filter((p) => {
    const matchedKeyword =
      !kw ||
      p.name.toLowerCase().includes(kw) ||
      p.shop.toLowerCase().includes(kw) ||
      categoryLabel(p.category).toLowerCase().includes(kw);
    const matchedCategory = activeCategory.value === "all" || p.category === activeCategory.value;
    return matchedKeyword && matchedCategory;
  });
});

const categoryLabel = (key) => categoryLabels[key] || key;

const querySearch = (queryString, cb) => {
  const keyword = queryString.trim().toLowerCase();
  const suggestions = suggestionPool.value
    .filter((item) => !keyword || item.toLowerCase().includes(keyword))
    .slice(0, 8)
    .map((value) => ({ value }));
  cb(suggestions);
};

const applyKeyword = (keyword) => {
  searchKeyword.value = keyword;
  onSearch();
};

const onSuggestSelect = ({ value }) => {
  searchKeyword.value = value;
};

const onSearch = () => {
  isMallLoading.value = true;
  window.setTimeout(() => {
    isMallLoading.value = false;
  }, 240);
};

const resetSearch = () => {
  searchKeyword.value = "";
  activeCategory.value = "all";
  onSearch();
};

const scrollToSection = (id) => {
  const container = mallPageRef.value;
  const target = document.getElementById(id);
  if (container && target) {
    const offset = 10;
    const top =
      target.getBoundingClientRect().top -
      container.getBoundingClientRect().top +
      container.scrollTop -
      offset;
    container.scrollTo({ top, behavior: "smooth" });
    return;
  }
  target?.scrollIntoView({ behavior: "smooth", block: "start" });
};

watch([activeCategory, priceBand, onlyOnline, top50Sort], () => {
  isGuessLoading.value = true;
  window.setTimeout(() => {
    isGuessLoading.value = false;
  }, 220);
});

const onUserCommand = (cmd) => {
  if (cmd === "profile") {
    router.push("/user-profile");
  } else if (cmd === "logout") {
    localStorage.removeItem("loginRole");
    localStorage.removeItem("userInfo");
    window.location.assign(`${window.location.origin}${window.location.pathname}#/login`);
  }
};
</script>

<style scoped>
.mall-page {
  height: 100vh;
  overflow-y: auto;
  overflow-x: hidden;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  background:
    radial-gradient(circle at top left, rgba(255, 202, 124, 0.35), transparent 28%),
    radial-gradient(circle at top right, rgba(93, 134, 255, 0.18), transparent 24%),
    linear-gradient(180deg, #f8fafc 0%, #eef4ff 100%);
  padding: 14px;
}

.mall-header {
  display: grid;
  grid-template-columns: auto minmax(320px, 760px) auto;
  align-items: start;
  justify-content: space-between;
  gap: 14px;
  padding: 16px 18px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06);
  backdrop-filter: blur(12px);
}

.brand {
  display: flex;
  align-items: baseline;
  gap: 4px;
  cursor: pointer;
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
  font-size: 36px;
  font-style: italic;
  background-image: linear-gradient(135deg, #ff6700, #ff9a44);
}

.brand-cart {
  font-size: 36px;
  font-style: italic;
  background-image: linear-gradient(135deg, #295bff, #65b5ff);
}

.brand-sub {
  margin-left: 6px;
  font-size: 24px;
  background-image: linear-gradient(135deg, #10b981, #06b6d4);
}

.search-input,
:deep(.search-input .el-input) {
  width: 100%;
}

:deep(.search-input .el-input-group__append .el-button) {
  color: #ffffff !important;
  font-weight: 700;
  letter-spacing: 0.02em;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.18);
  background: linear-gradient(135deg, #1e40af 0%, #2563eb 70%, #3b82f6 100%);
}

:deep(.search-input .el-input-group__append .el-button:hover) {
  color: #ffffff !important;
  filter: saturate(1.06) brightness(0.96);
}

.hot-keywords {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.hot-label {
  font-size: 12px;
  color: #64748b;
  line-height: 28px;
}

.hot-pill {
  border: 0;
  border-radius: 999px;
  padding: 6px 12px;
  background: rgba(93, 134, 255, 0.1);
  color: #295bff;
  font-size: 12px;
  cursor: pointer;
  transition: transform 0.2s, background 0.2s;
}

.hot-pill:hover {
  transform: translateY(-1px);
  background: rgba(41, 91, 255, 0.16);
}

.header-right {
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
  border-radius: 24px;
  padding: 30px 26px;
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(260px, 0.8fr);
  gap: 18px;
  background: linear-gradient(120deg, #ff7a18 0%, #ffb347 38%, #ffdc7d 100%);
  color: #fff;
  box-shadow: 0 16px 32px rgba(255, 122, 24, 0.22);
}

.hero-eyebrow {
  font-size: 12px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  opacity: 0.86;
}

.hero-title {
  margin-top: 10px;
  font-size: 34px;
  font-weight: 900;
}

.hero-subtitle {
  margin-top: 10px;
  max-width: 560px;
  font-size: 15px;
  line-height: 1.7;
  opacity: 0.95;
}

.hero-actions {
  margin-top: 18px;
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.visual-card {
  padding: 20px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.18);
  backdrop-filter: blur(8px);
}

.visual-kicker {
  font-size: 12px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  opacity: 0.82;
}

.visual-card strong {
  display: block;
  margin-top: 10px;
  font-size: 28px;
}

.visual-card p {
  margin-top: 10px;
  font-size: 13px;
  line-height: 1.65;
}

.summary-row {
  margin-top: 14px;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.summary-item {
  border-radius: 14px;
}

.summary-item span {
  color: #64748b;
  font-size: 12px;
}

.summary-item b {
  display: block;
  margin-top: 6px;
  font-size: 26px;
  color: #0f172a;
}

.section-card {
  margin-top: 14px;
  background: rgba(255, 255, 255, 0.92);
  border-radius: 20px;
  padding: 18px;
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.04);
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.section-head h3 {
  margin: 0;
  font-size: 17px;
  color: #1e293b;
}

.section-head p {
  margin: 6px 0 0;
  color: #64748b;
  font-size: 13px;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.product-card,
.product-skeleton {
  min-height: 100%;
  border: 1px solid #e2e8f0;
  border-radius: 18px;
  padding: 12px;
  background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
}

.product-card {
  display: flex;
  flex-direction: column;
  transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease;
}

.product-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 16px 28px rgba(15, 23, 42, 0.1);
  border-color: rgba(41, 91, 255, 0.18);
}

.cover-wrap {
  position: relative;
}

.cover {
  aspect-ratio: 4 / 3;
  border-radius: 14px;
  display: flex;
  align-items: flex-end;
  justify-content: flex-start;
  padding: 12px;
  color: #fff;
  font-weight: 700;
  font-size: 14px;
}

.cover-category {
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.18);
  backdrop-filter: blur(6px);
}

.card-tags {
  position: absolute;
  top: 10px;
  right: 10px;
  display: flex;
  gap: 6px;
}

.tag-chip {
  padding: 4px 8px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.88);
  color: #0f172a;
  font-size: 11px;
  font-weight: 700;
}

.name {
  margin-top: 12px;
  min-height: 44px;
  font-weight: 700;
  color: #1e293b;
  font-size: 15px;
  line-height: 1.5;
}

.product-desc {
  min-height: 22px;
  margin-top: 4px;
  color: #64748b;
  font-size: 12px;
}

.meta-line {
  margin-top: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  color: #64748b;
  font-size: 13px;
}

.meta-sub {
  margin-top: 6px;
}

.price {
  color: #ef4444;
  font-weight: 800;
  font-size: 22px;
}

.original-price {
  color: #94a3b8;
  text-decoration: line-through;
}

.shop,
.stock {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.guess-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.guess-card,
.guess-skeleton {
  min-height: 156px;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 14px;
  margin-bottom: 12px;
  background: linear-gradient(180deg, #fffdf8 0%, #ffffff 100%);
}

.guess-card {
  transition: transform 0.2s, box-shadow 0.2s;
}

.guess-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.06);
}

.guess-top,
.guess-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.guess-name {
  font-weight: 700;
  color: #1e293b;
}

.reason-badge {
  border-radius: 999px;
  padding: 4px 10px;
  background: rgba(255, 122, 24, 0.12);
  color: #c2410c;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}

.guess-score {
  margin-top: 10px;
  color: #295bff;
  font-weight: 700;
  font-size: 13px;
}

.guess-reason {
  margin-top: 8px;
  min-height: 42px;
  color: #64748b;
  font-size: 13px;
  line-height: 1.6;
}

.guess-footer {
  margin-top: 14px;
  font-size: 13px;
  color: #64748b;
}

.toolbar {
  margin-bottom: 12px;
  display: grid;
  grid-template-columns: repeat(4, minmax(140px, 180px));
  gap: 10px;
}

.filter-item {
  width: 100%;
}

.skeleton-cover {
  width: 100%;
  height: 0;
  padding-top: 75%;
  border-radius: 14px;
}

.skeleton-line {
  width: 100%;
  margin-top: 12px;
}

.skeleton-title {
  height: 20px;
}

.skeleton-short {
  width: 55%;
}

@media (max-width: 1200px) {
  .hero {
    grid-template-columns: 1fr;
  }

  .summary-row {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .products-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .toolbar {
    grid-template-columns: repeat(2, minmax(140px, 1fr));
  }
}

@media (max-width: 1024px) {
  .products-grid,
  .guess-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .mall-header {
    grid-template-columns: 1fr;
    justify-content: stretch;
  }

  .hero {
    padding: 24px 18px;
  }

  .brand-wise,
  .brand-cart {
    font-size: 30px;
  }

  .brand-sub {
    font-size: 22px;
  }

  .hero-title {
    font-size: 28px;
  }

  .summary-row,
  .products-grid,
  .guess-grid,
  .toolbar {
    grid-template-columns: 1fr;
  }

  .header-right {
    justify-content: flex-end;
  }
}
</style>
