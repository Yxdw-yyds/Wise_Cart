<template>
  <div ref="mallPageRef" class="mall-page route-scroll-page route-fade-in">
    <header class="mall-header">
      <div class="brand" @click="router.push('/user-mall')">
        <span class="brand-wise">Wise&nbsp;</span><span class="brand-cart">Cart&nbsp;</span><span class="brand-sub">商城</span>
      </div>
      <div class="header-spacer"></div>
      <div class="header-search">
        <el-autocomplete
          v-model="searchKeyword"
          :fetch-suggestions="querySearch"
          placeholder="搜索商品、品类或店铺"
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
          <span class="hot-label">热门搜索</span>
          <button
            v-for="keyword in hotKeywords"
            :key="keyword"
            type="button"
            class="hot-pill"
            @click="applyKeyword(keyword)"
          >
            {{ keyword }}
          </button>
        </div>
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
      <div class="hero-copy">
        <div class="hero-eyebrow">Personalized Retail Experience</div>
        <div class="hero-title">猜你喜欢 + Top50 兴趣榜</div>
        <div class="hero-subtitle">基于用户行为标签与偏好向量生成的可解释推荐结果。</div>
        <div class="hero-actions">
          <el-button type="primary" @click="scrollToSection('guess-anchor')">查看推荐</el-button>
          <el-button plain @click="router.push('/user-profile')">查看画像</el-button>
        </div>
      </div>
      <div class="hero-visual">
        <div class="visual-card">
          <span class="visual-kicker">推荐亮点</span>
          <strong>个性化命中率 92%</strong>
          <p>融合兴趣偏好、热度得分与 CTR 表现，突出“为什么推荐给你”。</p>
        </div>
        <div class="visual-points">
          <div class="visual-point"><span>6</span>大品类偏好</div>
          <div class="visual-point"><span>50</span>条候选榜单</div>
          <div class="visual-point"><span>3</span>类推荐理由</div>
        </div>
      </div>
    </section>

    <section class="section-card">
      <div class="section-head">
        <div>
          <h3>商品流</h3>
          <p>统一卡片比例与信息层级，突出价格、标签和店铺信息。</p>
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

      <el-empty v-else description="没有找到匹配商品，试试热门搜索词或切换分类。">
        <template #image>
          <div class="empty-illustration">🔎</div>
        </template>
        <el-button type="primary" @click="resetSearch">清空筛选</el-button>
      </el-empty>
    </section>

    <section id="guess-anchor" class="section-card">
      <div class="section-head">
        <div>
          <h3>猜你喜欢</h3>
          <p>增加推荐理由标签，让个性化逻辑更易被感知。</p>
        </div>
        <el-button link type="primary" @click="refreshGuess">换一批</el-button>
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
            <div class="guess-score">推荐分：{{ item.score }}</div>
            <div class="guess-reason">{{ item.reason }}</div>
            <div class="guess-footer">
              <span>{{ categoryLabel(item.category) }}</span>
              <strong>¥{{ item.price }}</strong>
            </div>
          </div>
        </el-col>
      </el-row>

      <el-empty v-else description="当前暂无推荐，系统会优先回退到热门商品。">
        <template #image>
          <div class="empty-illustration">✨</div>
        </template>
      </el-empty>
    </section>

    <section class="section-card">
      <div class="section-head">
        <div>
          <h3>用户兴趣 Top50 商品</h3>
          <p>保留筛选能力，同时优化中等屏宽下的布局伸缩。</p>
        </div>
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
const hotKeywords = ["无糖气泡水", "高蛋白酸奶", "美妆精华", "蓝牙耳机"];
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
  display: flex;
  align-items: flex-start;
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
  cursor: pointer;
  flex-shrink: 0;
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
  font-size: 38px;
  font-style: italic;
  background-image: linear-gradient(135deg, #ff6700, #ff9a44);
}

.brand-cart {
  font-size: 38px;
  font-style: italic;
  background-image: linear-gradient(135deg, #295bff, #65b5ff);
}

.brand-sub {
  margin-left: 8px;
  font-size: 30px;
  background-image: linear-gradient(135deg, #10b981, #06b6d4);
}

.header-spacer {
  flex: 1;
}

.header-search {
  flex: 0 1 620px;
}

.search-input,
:deep(.search-input .el-input) {
  width: 100%;
}

:deep(.search-input .el-input-group__append .el-button) {
  color: #ffffff;
  font-weight: 700;
  background: linear-gradient(135deg, #2a56f6 0%, #22a8e3 100%);
}

:deep(.search-input .el-input-group__append .el-button:hover) {
  color: #ffffff;
  filter: saturate(1.08) brightness(0.98);
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
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 12px;
  padding-top: 2px;
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
  border-radius: 24px;
  padding: 30px 26px;
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(300px, 0.8fr);
  gap: 18px;
  background: linear-gradient(120deg, #ff7a18 0%, #ffb347 38%, #ffdc7d 100%);
  color: #fff;
  box-shadow: 0 16px 32px rgba(255, 122, 24, 0.22);
}

.hero-eyebrow {
  font-size: 12px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  opacity: 0.85;
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
  opacity: 0.94;
}

.hero-actions {
  margin-top: 18px;
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.hero-visual {
  display: grid;
  gap: 14px;
}

.visual-card {
  padding: 20px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.18);
  backdrop-filter: blur(8px);
}

.visual-card strong {
  display: block;
  margin-top: 10px;
  font-size: 26px;
}

.visual-card p {
  margin: 10px 0 0;
  line-height: 1.7;
  opacity: 0.94;
}

.visual-kicker {
  font-size: 12px;
  opacity: 0.82;
  text-transform: uppercase;
  letter-spacing: 0.12em;
}

.visual-points {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.visual-point {
  padding: 16px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.15);
  text-align: center;
  font-size: 13px;
}

.visual-point span {
  display: block;
  font-size: 26px;
  font-weight: 900;
  line-height: 1.2;
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

.empty-illustration {
  width: 88px;
  height: 88px;
  margin: 0 auto 8px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 36px;
  background: linear-gradient(135deg, rgba(255, 183, 71, 0.16), rgba(93, 134, 255, 0.16));
}

@media (max-width: 1200px) {
  .hero {
    grid-template-columns: 1fr;
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

  .hero {
    padding: 24px 18px;
  }

  .brand-wise,
  .brand-cart {
    font-size: 30px;
  }

  .brand-sub {
    font-size: 24px;
  }

  .hero-title {
    font-size: 28px;
  }

  .visual-points,
  .products-grid,
  .guess-grid,
  .toolbar {
    grid-template-columns: 1fr;
  }

  .header-right {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>
