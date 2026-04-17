const baseURL = "";

async function request(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

const CCDREC_ENDPOINT =
  import.meta.env.VITE_CCDREC_ENDPOINT || "http://127.0.0.1:8000/recommend";

const DEFAULT_MODELS = {
  ccdrec: {
    name: "CCDRec",
    endpoint: CCDREC_ENDPOINT,
    weight: 0.6,
    timeout: 5000,
    enabled: true,
  },
  collaborative: {
    name: "协同过滤",
    weight: 0.25,
    timeout: 3000,
    enabled: true,
  },
  content: {
    name: "内容推荐",
    weight: 0.15,
    timeout: 1500,
    enabled: true,
  },
};

const recommendationCache = new Map();
const CACHE_TTL = 5 * 60 * 1000;

function getCacheKey(userId, topK, filters = {}) {
  return `${userId}_${topK}_${JSON.stringify(filters)}`;
}

function isCacheValid(timestamp) {
  return Date.now() - timestamp < CACHE_TTL;
}

async function fetchCCDRecRecommendations(userId, topK = 10) {
  try {
    const response = await fetch(DEFAULT_MODELS.ccdrec.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, top_k: topK, filter_history: true }),
      signal: AbortSignal.timeout(DEFAULT_MODELS.ccdrec.timeout),
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const resData = await response.json();
    
    const payload = resData.data || resData.content?.data || resData;

    return {
      model: "ccdrec",
      items: payload.recommendations || payload.items || [],
      scores: payload.scores || [],
      timestamp: Date.now(),
    };
  } catch (error) {
    console.warn("CCDRec API failed, using offline benchmark data as fallback.", error.message);
    try {
      const { loadUserTopK } = await import("@/composables/useCcdrecData");
      let mockUserId = userId;
      if (typeof userId === "string" && userId.startsWith("user_")) {
        mockUserId = parseInt(userId.replace("user_", ""), 10) || 1;
        mockUserId = mockUserId.toString();
      }
      const items = await loadUserTopK("baby", mockUserId);
      const limitItems = (items && items.length > 0 ? items : ["2459", "2322", "1543", "938", "1886", "1046", "3808", "4096", "2326"])
        .slice(0, topK)
        .map(id => {
          const num = parseInt(id, 10);
          return num % 2000 === 0 ? 2000 : num % 2000;
        });
      
      const uniqueItems = Array.from(new Set(limitItems));
      
      return {
        model: "ccdrec",
        items: uniqueItems,
        scores: uniqueItems.map((_, idx) => 1.0 - (idx / uniqueItems.length) * 0.5),
        timestamp: Date.now(),
      };
    } catch (mockError) {
      console.error("Fallback data loading failed:", mockError);
      return { model: "ccdrec", items: [], scores: [], error: error.message };
    }
  }
}

function getBehaviorWeight(action) {
  return { view: 1, click: 2, fav: 3, cart: 4, buy: 5 }[action] || 0.5;
}

function buildUserHistory(userBehavior) {
  const history = new Map();
  userBehavior.forEach((event, index) => {
    const productId = event.productId || Number(event.itemId) || event.itemId;
    if (!productId) return;
    if (!history.has(productId)) {
      history.set(productId, { score: 0, ts: 0, category: event.category });
    }
    const entry = history.get(productId);
    entry.score += getBehaviorWeight(event.action);
    entry.ts = Math.max(entry.ts, event.ts || new Date(event.vtime || 0).getTime() || index);
    entry.category = event.category || entry.category;
  });
  return history;
}

function buildItemCooccurrence(userBehavior) {
  const byUser = new Map();

  userBehavior.forEach((event, index) => {
    const userId = event.userId || "anonymous";
    const productId = event.productId || Number(event.itemId) || event.itemId;
    if (!productId) return;
    if (!byUser.has(userId)) byUser.set(userId, []);
    byUser.get(userId).push({
      productId,
      action: event.action,
      ts: event.ts || new Date(event.vtime || 0).getTime() || index,
    });
  });

  const cooccurrence = new Map();

  byUser.forEach((events) => {
    const deduped = Array.from(
      events
        .sort((a, b) => a.ts - b.ts)
        .reduce((acc, event) => {
          const existing = acc.get(event.productId) || { score: 0, ts: 0 };
          existing.score += getBehaviorWeight(event.action);
          existing.ts = Math.max(existing.ts, event.ts);
          acc.set(event.productId, existing);
          return acc;
        }, new Map())
    );

    for (let i = 0; i < deduped.length; i += 1) {
      const [sourceId, sourceMeta] = deduped[i];
      if (!cooccurrence.has(sourceId)) cooccurrence.set(sourceId, new Map());

      for (let j = 0; j < deduped.length; j += 1) {
        if (i === j) continue;
        const [targetId, targetMeta] = deduped[j];
        const pairScore = (sourceMeta.score + targetMeta.score) / 2;
        const pairMap = cooccurrence.get(sourceId);
        pairMap.set(targetId, (pairMap.get(targetId) || 0) + pairScore);
      }
    }
  });

  return cooccurrence;
}

function fetchCollaborativeRecommendations(userId, topK, userBehavior, allProducts) {
  try {
    const userHistory = buildUserHistory(userBehavior);
    const cooccurrence = buildItemCooccurrence(userBehavior);
    const seenItems = new Set(userHistory.keys());
    const categoryAffinity = {};

    userBehavior.forEach(({ category, action }) => {
      categoryAffinity[category] = (categoryAffinity[category] || 0) + getBehaviorWeight(action);
    });

    const candidateScores = new Map();

    userHistory.forEach((historyMeta, sourceId) => {
      const neighbors = cooccurrence.get(sourceId);
      if (!neighbors) return;

      neighbors.forEach((neighborScore, targetId) => {
        if (seenItems.has(targetId)) return;
        candidateScores.set(
          targetId,
          (candidateScores.get(targetId) || 0) + neighborScore * historyMeta.score
        );
      });
    });

    const scored = allProducts
      .filter((p) => p.online && !seenItems.has(p.id))
      .map((p) => ({
        id: p.id,
        score:
          (candidateScores.get(p.id) || 0) +
          (categoryAffinity[p.category] || 0) * 2 +
          (p.hotScore || 0) * 0.15,
      }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);

    return {
      model: "collaborative",
      items: scored.map((s) => s.id),
      scores: scored.map((s) => s.score),
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error("协同过滤推荐失败:", error);
    return {
      model: "collaborative",
      items: [],
      scores: [],
      error: error.message,
    };
  }
}

function fetchContentRecommendations(userId, topK, allProducts) {
  try {
    const scored = allProducts
      .filter((p) => p.online)
      .map((p) => ({
        id: p.id,
        score:
          (p.hotScore || 0) * 0.55 +
          (p.ctr || 0) * 1.1 +
          ((p.tags || []).includes("新品") ? 3 : 0) +
          ((p.tags || []).includes("热销") ? 2 : 0),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);

    return {
      model: "content",
      items: scored.map((s) => s.id),
      scores: scored.map((s) => s.score),
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error("内容推荐失败:", error);
    return { model: "content", items: [], scores: [], error: error.message };
  }
}

function fuseRecommendations(results, topK = 10, runtimeModels = DEFAULT_MODELS) {
  const itemScores = new Map();

  results.forEach((result) => {
    if (result.error || !result.items.length) return;

    const model = runtimeModels[result.model];
    const weight = model.weight;

    result.items.forEach((itemId, idx) => {
      const modelScore = result.scores[idx] || 0;
      const normalizedScore = modelScore / (Math.max(...result.scores) || 1);
      const weightedScore = normalizedScore * weight;

      if (!itemScores.has(itemId)) {
        itemScores.set(itemId, { score: 0, models: [], details: {} });
      }

      const entry = itemScores.get(itemId);
      entry.score += weightedScore;
      entry.models.push(result.model);
      entry.details[result.model] = {
        score: modelScore,
        rank: idx + 1,
      };
    });
  });

  return Array.from(itemScores.entries())
    .map(([itemId, data]) => ({
      itemId,
      fusedScore: Number(data.score.toFixed(4)),
      models: data.models,
      details: data.details,
    }))
    .sort((a, b) => b.fusedScore - a.fusedScore)
    .slice(0, topK);
}

function buildRerankContext(userBehavior = []) {
  const categoryAffinity = {};
  const itemExposure = new Map();
  const itemActions = new Map();

  userBehavior.forEach((event) => {
    const productId = event.productId || Number(event.itemId) || event.itemId;
    if (!productId) return;

    categoryAffinity[event.category] =
      (categoryAffinity[event.category] || 0) + getBehaviorWeight(event.action);
    itemExposure.set(productId, (itemExposure.get(productId) || 0) + 1);
    itemActions.set(productId, event.action);
  });

  return { categoryAffinity, itemExposure, itemActions };
}

function rerankRecommendations(fusedItems, allProducts, userBehavior = [], topK = 10) {
  const { categoryAffinity, itemExposure, itemActions } = buildRerankContext(userBehavior);

  const reranked = fusedItems.map((item, index) => {
    const product = allProducts.find((p) => p.id === item.itemId);
    const categoryScore = (categoryAffinity[product?.category] || 0) / 20;
    const hotScore = (product?.hotScore || 0) / 100;
    const ctrScore = (product?.ctr || 0) / 20;
    const noveltyScore = (product?.tags || []).includes("新品") ? 0.08 : 0;
    const repeatedPenalty = Math.min((itemExposure.get(item.itemId) || 0) * 0.03, 0.18);
    const purchasedPenalty = itemActions.get(item.itemId) === "buy" ? 0.35 : 0;
    const sourceBonus = item.models.length >= 2 ? 0.06 : 0;
    const rerankScore =
      item.fusedScore * 0.58 +
      categoryScore * 0.18 +
      hotScore * 0.10 +
      ctrScore * 0.08 +
      noveltyScore +
      sourceBonus -
      repeatedPenalty -
      purchasedPenalty;
    const boundedScore = Math.max(0, Math.min(rerankScore, 0.9999));

    return {
      ...item,
      product,
      rerankScore: Number(boundedScore.toFixed(4)),
      originalRank: index + 1,
    };
  });

  return reranked
    .sort((a, b) => b.rerankScore - a.rerankScore)
    .slice(0, topK);
}

function generateExplanation(itemId, fusedResult, userProfile, product) {
  const { models, details } = fusedResult;
  const reasons = [];

  if (models.includes("ccdrec")) {
    reasons.push("CCDRec 深度学习模型推荐");
  }

  if (models.includes("collaborative")) {
    reasons.push("基于相似用户偏好");
  }

  if (models.includes("content")) {
    if (product?.tags?.includes("新品")) {
      reasons.push("新品上架推荐");
    } else {
      reasons.push("热销商品推荐");
    }
  }

  if (userProfile?.categoryPercents?.[product?.category] > 20) {
    reasons.push(`你对${product?.category}类目兴趣较高`);
  }

  return {
    primary: reasons[0] || "个性化推荐",
    secondary: reasons.slice(1),
    confidence: Number((0.6 + Math.random() * 0.35).toFixed(2)),
  };
}

const feedbackQueue = [];
const FEEDBACK_BATCH_SIZE = 10;
const FEEDBACK_FLUSH_INTERVAL = 30000;

function recordFeedback(userId, itemId, action, metadata = {}) {
  feedbackQueue.push({
    userId,
    itemId,
    action,
    timestamp: Date.now(),
    ...metadata,
  });

  if (feedbackQueue.length >= FEEDBACK_BATCH_SIZE) {
    flushFeedback();
  }
}

async function flushFeedback() {
  if (feedbackQueue.length === 0) return;

  const batch = feedbackQueue.splice(0, FEEDBACK_BATCH_SIZE);
  try {
    await request(`${baseURL}/api/feedback/batch`, {
      method: "POST",
      body: JSON.stringify({ events: batch }),
    });
    console.log(`已上传 ${batch.length} 条反馈`);
  } catch (error) {
    console.error("反馈上传失败:", error);
    feedbackQueue.unshift(...batch);
  }
}

setInterval(flushFeedback, FEEDBACK_FLUSH_INTERVAL);

const AB_TESTS = {
  model_weight_v1: {
    name: "模型权重测试 V1",
    variants: {
      control: { ccdrec: 0.6, collaborative: 0.25, content: 0.15 },
      variant_a: { ccdrec: 0.7, collaborative: 0.2, content: 0.1 },
      variant_b: { ccdrec: 0.5, collaborative: 0.3, content: 0.2 },
    },
    enabled: false,
  },
};

function getABTestVariant(userId, testKey) {
  const test = AB_TESTS[testKey];
  if (!test || !test.enabled) return "control";

  const hash = userId
    .toString()
    .split("")
    .reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const variants = Object.keys(test.variants);
  return variants[hash % variants.length];
}

function buildRuntimeModels(userId, testKey) {
  const runtimeModels = Object.fromEntries(
    Object.entries(DEFAULT_MODELS).map(([key, config]) => [key, { ...config }])
  );

  if (!testKey) {
    return { models: runtimeModels, variant: null, weights: null };
  }

  const test = AB_TESTS[testKey];
  if (!test || !test.enabled) {
    return { models: runtimeModels, variant: "control", weights: null };
  }

  const variant = getABTestVariant(userId, testKey);
  const weights = test.variants[variant];

  Object.entries(weights).forEach(([model, weight]) => {
    if (runtimeModels[model]) {
      runtimeModels[model].weight = weight;
    }
  });

  return { models: runtimeModels, variant, weights };
}

function applyModelWeightOverrides(runtimeModels, modelWeights = null) {
  if (!modelWeights) return runtimeModels;

  Object.entries(modelWeights).forEach(([model, weight]) => {
    if (runtimeModels[model] && typeof weight === "number") {
      runtimeModels[model].weight = weight / 100;
    }
  });

  return runtimeModels;
}

export async function getEnhancedRecommendations({
  userId,
  topK = 10,
  userBehavior = [],
  allProducts = [],
  userProfile = {},
  useCache = true,
  abTestKey = null,
  modelWeights = null,
}) {
  const cacheKey = getCacheKey(userId, topK, { abTestKey, modelWeights });

  if (useCache && recommendationCache.has(cacheKey)) {
    const cached = recommendationCache.get(cacheKey);
    if (isCacheValid(cached.timestamp)) {
      return cached.data;
    }
  }

  const runtime = buildRuntimeModels(userId, abTestKey);
  applyModelWeightOverrides(runtime.models, modelWeights);

  const fetchLimit = topK * 4;
  
  const [ccdrec, collaborative, content] = await Promise.all([
    runtime.models.ccdrec.enabled
      ? fetchCCDRecRecommendations(userId, fetchLimit)
      : Promise.resolve({}),
    runtime.models.collaborative.enabled
      ? Promise.resolve(
          fetchCollaborativeRecommendations(
            userId,
            fetchLimit,
            userBehavior,
            allProducts
          )
        )
      : Promise.resolve({}),
    runtime.models.content.enabled
      ? Promise.resolve(fetchContentRecommendations(userId, fetchLimit, allProducts))
      : Promise.resolve({}),
  ]);

  const results = [ccdrec, collaborative, content].filter(
    (r) => r.items?.length > 0
  );
  const fused = fuseRecommendations(results, Math.max(topK * 2, topK), runtime.models);
  const reranked = rerankRecommendations(fused, allProducts, userBehavior, topK);

  const recommendations = reranked.map((item) => {
    const product = item.product;
    const explanation = generateExplanation(
      item.itemId,
      item,
      userProfile,
      product
    );

    return {
      itemId: item.itemId,
      product,
      fusedScore: item.rerankScore,
      baseScore: item.fusedScore,
      models: item.models,
      explanation,
      details: item.details,
      originalRank: item.originalRank,
    };
  });

  const result = {
    userId,
    recommendations,
    timestamp: Date.now(),
    modelCount: results.length,
    abTest: runtime.variant,
  };

  recommendationCache.set(cacheKey, {
    data: result,
    timestamp: Date.now(),
  });

  return result;
}

export function getRecommendationStats() {
  return {
    cacheSize: recommendationCache.size,
    feedbackQueueSize: feedbackQueue.length,
    models: Object.entries(DEFAULT_MODELS).map(([key, config]) => ({
      key,
      name: config.name,
      weight: config.weight,
      enabled: config.enabled,
    })),
  };
}

export function clearRecommendationCache() {
  recommendationCache.clear();
}

export { recordFeedback, flushFeedback };
