/**
 * 天猫真实数据 composable — 仅供推荐仪表盘使用
 * 从预处理好的 JSON 文件加载天猫推荐数据集的真实行为数据
 */

import { computed, ref } from "vue";

// ============ 类目标签映射 ============
const TMALL_CATEGORY_LABELS = {
  美妆个护: "美妆个护",
  女装服饰: "女装服饰",
  食品零食: "食品零食",
  母婴用品: "母婴用品",
  家居家纺: "家居家纺",
  数码电器: "数码电器",
  家用电器: "家用电器",
  运动户外: "运动户外",
  图书音像: "图书音像",
  汽车用品: "汽车用品",
  家居建材: "家居建材",
  箱包配饰: "箱包配饰",
  综合百货: "综合百货",
};

// ============ 类目颜色映射 ============
const TMALL_CATEGORY_COLORS = {
  美妆个护: "#FF69B4",
  女装服饰: "#FF6B6B",
  食品零食: "#FFA07A",
  母婴用品: "#4ECDC4",
  家居家纺: "#45B7D1",
  数码电器: "#9B59B6",
  家用电器: "#3498DB",
  运动户外: "#2ECC71",
  图书音像: "#F39C12",
  汽车用品: "#E74C3C",
  家居建材: "#95A5A6",
  箱包配饰: "#E67E22",
  综合百货: "#7F8C8D",
};

// ============ Action 权重 ============
const ACTION_WEIGHT = {
  view: 1,
  click: 1.5,
  fav: 2.5,
  cart: 3.5,
  buy: 5,
};

// ============ 数据缓存 ============
let productsCache = null;
let behaviorsCache = null;
let summaryCache = null;
let opsCache = null;

async function loadTmallProducts() {
  if (productsCache) return productsCache;
  const mod = await import("@/models/tmall/tmall-products.json");
  productsCache = mod.default || mod;
  return productsCache;
}

async function loadTmallBehaviors() {
  if (behaviorsCache) return behaviorsCache;
  const mod = await import("@/models/tmall/tmall-behaviors.json");
  behaviorsCache = mod.default || mod;
  return behaviorsCache;
}

async function loadTmallSummary() {
  if (summaryCache) return summaryCache;
  const mod = await import("@/models/tmall/tmall-summary.json");
  summaryCache = mod.default || mod;
  return summaryCache;
}

async function loadTmallOps() {
  if (opsCache) return opsCache;
  const mod = await import("@/models/tmall/tmall-ops.json");
  opsCache = mod.default || mod;
  return opsCache;
}

/**
 * 构建用户兴趣向量
 */
function buildTmallInterestVector(behaviorLog) {
  const base = {};
  // 初始化所有类目
  Object.keys(TMALL_CATEGORY_LABELS).forEach((cat) => {
    base[cat] = 1;
  });
  behaviorLog.forEach((event) => {
    const w = ACTION_WEIGHT[event.action] || 0;
    if (base.hasOwnProperty(event.category)) {
      base[event.category] += w;
    }
  });
  return base;
}

/**
 * 构建用户画像
 */
function buildTmallUserProfile(interestVector) {
  const total =
    Object.values(interestVector).reduce((sum, n) => sum + n, 0) || 1;
  const categoryPercents = Object.fromEntries(
    Object.entries(interestVector).map(([k, v]) => [
      k,
      Number(((v / total) * 100).toFixed(1)),
    ])
  );
  const sorted = Object.entries(categoryPercents).sort((a, b) => b[1] - a[1]);
  const topCategory = sorted[0][0];
  const secondCategory = sorted[1][0];
  const tags = ["天猫用户", "活跃用户", "多类目偏好"];
  const summary = `当前最感兴趣类目为${topCategory}，其次是${secondCategory}，推荐侧会优先展示相关商品。`;
  return { categoryPercents, tags, summary };
}

/**
 * 主 composable
 */
export function useTmallData() {
  const products = ref([]);
  const behaviorLog = ref([]);
  const summary = ref(null);
  const ops = ref(null);
  const loading = ref(false);
  const loaded = ref(false);

  const interestVector = computed(() =>
    buildTmallInterestVector(behaviorLog.value)
  );
  const userProfile = computed(() =>
    buildTmallUserProfile(interestVector.value)
  );

  /**
   * 加载所有天猫数据
   */
  async function loadAll() {
    if (loaded.value) return;
    loading.value = true;
    try {
      const [prods, behavs, sum, op] = await Promise.all([
        loadTmallProducts(),
        loadTmallBehaviors(),
        loadTmallSummary(),
        loadTmallOps(),
      ]);

      // 为产品补充 imgBg 渐变备用背景、categoryHint
      products.value = prods.map((p, idx) => ({
        ...p,
        categoryHint: `${p.category} · ${p.shop}`,
        imgBg: `linear-gradient(135deg, hsl(${(idx * 27) % 360}, 85%, 78%), hsl(${((idx * 27 + 45) % 360)}, 88%, 68%))`,
      }));

      // 转换行为日志：给每条行为加上 ts (时间戳)
      behaviorLog.value = behavs.map((b) => ({
        ...b,
        ts: new Date(b.vtime).getTime() || Date.now(),
      }));

      summary.value = sum;
      ops.value = op;
      loaded.value = true;
    } catch (e) {
      console.error("加载天猫数据失败:", e);
    } finally {
      loading.value = false;
    }
  }

  return {
    products,
    behaviorLog,
    summary,
    ops,
    loading,
    loaded,
    interestVector,
    userProfile,
    loadAll,
    categoryLabels: TMALL_CATEGORY_LABELS,
    categoryColors: TMALL_CATEGORY_COLORS,
  };
}
