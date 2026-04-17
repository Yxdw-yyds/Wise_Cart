import { computed, ref } from "vue";

const cache = {
  manifest: null,
  summary: null,
  metrics: null,
  topk: null,
  ops: null,
  tmallProducts: null,
  tmallBehaviors: null,
};

const ACTION_WEIGHT = {
  view: 1,
  click: 1.5,
  fav: 2.5,
  cart: 3.5,
  buy: 5,
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
  if (name === "tmallBehaviors") mod = await import("@/models/tmall/tmall-behaviors.json");
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

function normalizeItemId(itemId) {
  if (typeof itemId === "number" && Number.isFinite(itemId)) return itemId;
  if (typeof itemId === "string" && itemId.match(/^\d+$/)) return parseInt(itemId, 10);
  return null;
}

function mapItemToProduct(itemId, pMap) {
  const numId = normalizeItemId(itemId);
  if (!numId) return {};
  const mappedId = numId % 2000 === 0 ? 2000 : numId % 2000;
  return pMap[mappedId] || {};
}

function classifyPriceBand(price) {
  const n = Number(price) || 0;
  if (n <= 0) return "未定价";
  if (n < 50) return "50元以下";
  if (n < 100) return "50-99元";
  if (n < 200) return "100-199元";
  return "200元以上";
}

function roundMetric(value, digits = 0) {
  return Number(value.toFixed(digits));
}

function parseBehaviorTs(event) {
  if (Number.isFinite(event?.ts)) return event.ts;
  if (typeof event?.timestamp === "number") return event.timestamp;
  if (typeof event?.vtime === "string") {
    const ts = new Date(event.vtime).getTime();
    if (Number.isFinite(ts)) return ts;
  }
  return NaN;
}

function percentile(sortedValues, ratio) {
  if (!sortedValues.length) return 0;
  const index = Math.min(sortedValues.length - 1, Math.max(0, Math.floor((sortedValues.length - 1) * ratio)));
  return sortedValues[index];
}

function buildAudienceBucketsFromBehaviors(behaviors = [], fallbackBuckets = {}) {
  if (!Array.isArray(behaviors) || !behaviors.length) {
    return {
      audienceBuckets: fallbackBuckets,
      activeLayerMeta: {
        windowDays: 30,
        strategy: "weighted_recent_30d",
        highScoreThreshold: 0,
        lowScoreThreshold: 0,
        totalUsers: fallbackBuckets.total || 0,
      },
    };
  }

  const datedBehaviors = behaviors
    .map((event) => ({ ...event, __ts: parseBehaviorTs(event) }))
    .filter((event) => Number.isFinite(event.__ts) && event.userId);

  if (!datedBehaviors.length) {
    return {
      audienceBuckets: fallbackBuckets,
      activeLayerMeta: {
        windowDays: 30,
        strategy: "weighted_recent_30d",
        highScoreThreshold: 0,
        lowScoreThreshold: 0,
        totalUsers: fallbackBuckets.total || 0,
      },
    };
  }

  const maxTs = Math.max(...datedBehaviors.map((event) => event.__ts));
  const windowDays = 30;
  const windowStart = maxTs - windowDays * 24 * 60 * 60 * 1000;
  const recentBehaviors = datedBehaviors.filter((event) => event.__ts >= windowStart);
  const userScores = new Map();

  recentBehaviors.forEach((event) => {
    const weight = ACTION_WEIGHT[event.action] || 0;
    if (!userScores.has(event.userId)) {
      userScores.set(event.userId, {
        score: 0,
        events: 0,
        weightedActions: { view: 0, click: 0, fav: 0, cart: 0, buy: 0 },
      });
    }
    const entry = userScores.get(event.userId);
    entry.score += weight;
    entry.events += 1;
    if (entry.weightedActions[event.action] !== undefined) {
      entry.weightedActions[event.action] += 1;
    }
  });

  const scoreEntries = Array.from(userScores.entries()).map(([userId, entry]) => ({
    userId,
    ...entry,
    score: Number(entry.score.toFixed(2)),
  }));
  const sortedScores = scoreEntries.map((entry) => entry.score).sort((a, b) => a - b);
  const lowScoreThreshold = percentile(sortedScores, 0.3);
  const highScoreThreshold = percentile(sortedScores, 0.7);

  let high = 0;
  let mid = 0;
  let low = 0;

  scoreEntries.forEach((entry) => {
    if (entry.score >= highScoreThreshold) high += 1;
    else if (entry.score < lowScoreThreshold) low += 1;
    else mid += 1;
  });

  const total = scoreEntries.length;

  return {
    audienceBuckets: { high, mid, low, total },
    activeLayerMeta: {
      windowDays,
      strategy: "weighted_recent_30d",
      highScoreThreshold: Number(highScoreThreshold.toFixed(2)),
      lowScoreThreshold: Number(lowScoreThreshold.toFixed(2)),
      totalUsers: total,
      windowStart,
      windowEnd: maxTs,
    },
  };
}

function buildRecommendationAnalytics(topkData, pMap, summary, audienceBuckets = {}) {
  const users = topkData?.users || {};
  const requestedTotalUsers = audienceBuckets.total || Object.keys(users).length;
  const userEntries = Object.entries(users).slice(0, requestedTotalUsers);
  const totalUsers = userEntries.length;
  const coveredUsers = userEntries.filter(([, recs]) => Array.isArray(recs) && recs.length > 0).length;
  const avgActionsPerUser = Number(summary?.avgActionsPerUser) || 0;

  let exposureCount = 0;
  let weightedCtrScore = 0;
  const uniqueItems = new Set();
  const topItemCounts = {};
  const categoryExposure = {};
  const priceBandExposure = {};

  userEntries.forEach(([, recs]) => {
    const topRecs = Array.isArray(recs) ? recs.slice(0, 10) : [];
    exposureCount += topRecs.length;

    topRecs.forEach((itemId, index) => {
      const product = mapItemToProduct(itemId, pMap);
      const ctrRate = Math.max(0, Math.min(100, Number(product.ctr) || 0)) / 100;
      const category = product.category || "其他类目";
      const priceBand = classifyPriceBand(product.price);
      const itemKey = String(itemId);

      uniqueItems.add(itemKey);
      weightedCtrScore += ctrRate;
      topItemCounts[itemKey] = (topItemCounts[itemKey] || 0) + 1;
      categoryExposure[category] = (categoryExposure[category] || 0) + 1;
      priceBandExposure[priceBand] = (priceBandExposure[priceBand] || 0) + 1;

      if (index === 0) {
        topItemCounts[itemKey] += 0.35;
      }
    });
  });

  const avgItemsPerUser = coveredUsers ? exposureCount / coveredUsers : 0;
  const avgCtrRate = exposureCount ? weightedCtrScore / exposureCount : 0;
  const basePurchaseRate = Math.max(0.025, Math.min(0.16, avgActionsPerUser / 120));

  const bucketProfiles = [
    { key: "high_active", audience: audienceBuckets.high || 0, ctrWeight: 1.22, convertWeight: 1.25 },
    { key: "mid_active", audience: audienceBuckets.mid || 0, ctrWeight: 1.0, convertWeight: 1.0 },
    { key: "low_active", audience: audienceBuckets.low || 0, ctrWeight: 0.72, convertWeight: 0.68 },
  ];

  const recommendCoverage = totalUsers ? coveredUsers / totalUsers : 0;
  const groupEffects = bucketProfiles.map((profile) => {
    const reach = Math.round(profile.audience * recommendCoverage);
    const ctrRate = Math.max(0.01, Math.min(0.28, avgCtrRate * profile.ctrWeight));
    const click = Math.round(reach * avgItemsPerUser * ctrRate);
    const convertRate = Math.max(0.015, Math.min(0.2, basePurchaseRate * profile.convertWeight));
    const convert = Math.min(click, Math.round(click * convertRate));
    return {
      group: profile.key,
      reach,
      click,
      convert,
      ctrRate: roundMetric(ctrRate * 100, 2),
      convertRate: roundMetric(convertRate * 100, 2),
    };
  });

  const totalClicks = groupEffects.reduce((sum, item) => sum + item.click, 0);
  const totalConversions = groupEffects.reduce((sum, item) => sum + item.convert, 0);
  const sortedTopItems = Object.entries(topItemCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([itemId, count]) => ({ itemId, count: Math.round(count) }));
  const top1Concentration = coveredUsers ? (sortedTopItems[0]?.count || 0) / coveredUsers : 0;
  const mapExposure = (obj) =>
    Object.entries(obj)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));

  return {
    recommendCoverage,
    groupEffects,
    hotRecommendedItems: sortedTopItems.slice(0, 20),
    recommendationStats: {
      totalUsers,
      coveredUsers,
      uncoveredUsers: Math.max(totalUsers - coveredUsers, 0),
      exposureCount,
      avgItemsPerUser: roundMetric(avgItemsPerUser, 1),
      uniqueRecommendedItems: uniqueItems.size,
      avgCtr: roundMetric(avgCtrRate * 100, 2),
      expectedClicks: totalClicks,
      expectedConversions: totalConversions,
      top1Concentration: roundMetric(top1Concentration * 100, 2),
      categoryExposure: mapExposure(categoryExposure),
      priceBandExposure: mapExposure(priceBandExposure),
    },
  };
}

export async function loadCcdrecManifest() {
  return loadJson("manifest");
}

export async function loadAllTmallProducts() {
  return loadJson("tmallProducts");
}

export async function loadDatasetSummary(dataset = "baby") {
  if (dataset !== "baby") throw new Error("Only baby dataset is supported in v1");
  const summary = await loadJson("summary");
  return { ...summary, dataset: "baby/Tmall" };
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
  const topk = await loadJson("topk");
  const summary = await loadJson("summary");
  const tmallBehaviors = await loadJson("tmallBehaviors");
  const pMap = await getProductMap();
  const audienceDerived = buildAudienceBucketsFromBehaviors(tmallBehaviors, ops.audienceBuckets);
  const derived = buildRecommendationAnalytics(topk, pMap, summary, audienceDerived.audienceBuckets);
  const mergedOps = {
    ...ops,
    audienceBuckets: audienceDerived.audienceBuckets,
    activeLayerMeta: audienceDerived.activeLayerMeta,
    ...derived,
  };

  // Enrich hot items with product details
  if (mergedOps.hotRecommendedItems && pMap) {
    mergedOps.hotRecommendedItems = mergedOps.hotRecommendedItems.map((item) => {
      const numId = parseInt(item.itemId);
      const mappedId = numId % 2000 === 0 ? 2000 : numId % 2000;
      const product = pMap[mappedId] || {};
      let pictUrl = product.pictUrl || "";
      if (pictUrl) pictUrl = pictUrl.trim().replace(/\s+/g, "");
      return {
        ...item,
        name: product.name || `商品 ${item.itemId}`,
        pictUrl,
        category: product.category || "",
        price: product.price || 0,
        shop: product.shop || "",
        };
      });
  }

  if (!filters || !filters.activeLevel) return mergedOps;

  const level = filters.activeLevel;
  const count = mergedOps.audienceBuckets?.[level] || 0;

  return {
    ...mergedOps,
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
