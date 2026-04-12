import { computed, ref } from "vue";

const cache = {
  manifest: null,
  summary: null,
  metrics: null,
  topk: null,
  ops: null,
  tmallProducts: null,
};

async function loadJson(name) {
  if (cache[name]) return cache[name];
  let mod;
  if (name === "manifest") mod = await import("@/models/ccdrec/manifest.json");
  if (name === "summary") mod = await import("@/models/ccdrec/dataset-baby-summary.json");
  if (name === "metrics") mod = await import("@/models/ccdrec/metrics-baby.json");
  if (name === "topk") mod = await import("@/models/ccdrec/topk-baby.json");
  if (name === "ops") mod = await import("@/models/ccdrec/ops-baby.json");
  if (name === "tmallProducts") mod = await import("@/models/tmall/tmall-products.json");
  cache[name] = mod.default || mod;
  return cache[name];
}

// 创建商品映射索引
let productMap = null;

async function getProductMap() {
  if (productMap) return productMap;
  const products = await loadJson("tmallProducts");
  productMap = {};
  // 使用商品的 id 字段作为映射键（topk-baby.json中的ID对应product的id）
  if (Array.isArray(products)) {
    products.forEach((product) => {
      productMap[product.id] = product;
    });
  }
  return productMap;
}

export async function loadCcdrecManifest() {
  return loadJson("manifest");
}

export async function loadDatasetSummary(dataset = "baby") {
  if (dataset !== "baby") throw new Error("Only baby dataset is supported in v1");
  return loadJson("summary");
}

export async function loadOfflineMetrics(dataset = "baby") {
  if (dataset !== "baby") throw new Error("Only baby dataset is supported in v1");
  return loadJson("metrics");
}

export async function loadUserTopK(dataset = "baby", userId) {
  if (dataset !== "baby") throw new Error("Only baby dataset is supported in v1");
  const data = await loadJson("topk");
  if (!userId) return data.users;
  return data.users[String(userId)] || [];
}

/**
 * 加载用户推荐的商品详情（包含图片信息）
 * @param {string} dataset - 数据集名称
 * @param {string} userId - 用户ID
 * @returns {Promise<Array>} 包含商品详情的数组
 */
export async function loadUserRecommendationWithImages(dataset = "baby", userId) {
  if (dataset !== "baby") throw new Error("Only baby dataset is supported in v1");
  const topkItemIds = await loadUserTopK(dataset, userId);
  const productMap = await getProductMap();
  
  // 将商品ID转换为包含完整商品信息的数组
  return topkItemIds.map((itemId, index) => {
    let product = {};
    
    // topk-baby.json中的ID通过模2000运算映射到tmall-products.json的ID
    if (typeof itemId === 'string' && itemId.match(/^\d+$/)) {
      const numId = parseInt(itemId);
      // 使用模运算获得1-2000范围内的ID
      const mappedId = numId % 2000 === 0 ? 2000 : numId % 2000;
      product = productMap[mappedId] || {};
    } else if (typeof itemId === 'number') {
      // 如果已经是数字，直接进行模运算
      const mappedId = itemId % 2000 === 0 ? 2000 : itemId % 2000;
      product = productMap[mappedId] || {};
    }
    
    // 验证图片URL是否有效
    let pictUrl = product.pictUrl || "";
    if (pictUrl && typeof pictUrl === "string") {
      // 处理图片URL，移除多余的空格和换行
      pictUrl = pictUrl.trim().replace(/\s+/g, "");
    }
    
    return {
      rank: index + 1,
      itemId: itemId,
      name: product.name || "未知商品",
      pictUrl: pictUrl,
      price: product.price || 0,
      shop: product.shop || "",
      category: product.category || "",
      ctr: product.ctr || 0,
      hotScore: product.hotScore || 0,
      id: product.id || itemId,
    };
  });
}

export async function loadOpsAnalytics(dataset = "baby", filters = {}) {
  if (dataset !== "baby") throw new Error("Only baby dataset is supported in v1");
  const ops = await loadJson("ops");

  if (!filters || !filters.activeLevel) return ops;

  const total = ops.audienceBuckets.total || 0;
  const ratioMap = { high: 0.18, mid: 0.37, low: 0.45 };
  const level = filters.activeLevel;
  const count = Math.floor(total * (ratioMap[level] ?? 1));

  return {
    ...ops,
    filteredAudienceCount: count,
  };
}

export function useCcdrecData() {
  const loading = ref(false);
  const error = ref("");
  const dataset = ref("baby");

  const ready = computed(() => !loading.value && !error.value);

  const wrap = async (fn) => {
    loading.value = true;
    error.value = "";
    try {
      return await fn();
    } catch (e) {
      error.value = e instanceof Error ? e.message : String(e);
      throw e;
    } finally {
      loading.value = false;
    }
  };

  return {
    dataset,
    loading,
    error,
    ready,
    wrap,
  };
}
