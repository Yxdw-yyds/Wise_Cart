/**
 * 推荐服务层 - 增强的推荐逻辑与实时性
 * 负责：
 * 1. 多模型推荐融合
 * 2. 实时反馈循环
 * 3. A/B 测试框架
 * 4. 推荐解释生成
 */

const baseURL = "";

async function request(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

// ============ 推荐模型配置 ============
const MODELS = {
  ccdrec: {
    name: "CCDRec",
    endpoint: "http://127.0.0.1:8000/recommend",
    weight: 0.6,
    timeout: 3000,
    enabled: true,
  },
  collaborative: {
    name: "协同过滤",
    weight: 0.25,
    timeout: 1000,
    enabled: true,
  },
  content: {
    name: "内容推荐",
    weight: 0.15,
    timeout: 800,
    enabled: true,
  },
};

// ============ 推荐缓存 ============
const recommendationCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5分钟

function getCacheKey(userId, topK, filters = {}) {
  return `${userId}_${topK}_${JSON.stringify(filters)}`;
}

function isCacheValid(timestamp) {
  return Date.now() - timestamp < CACHE_TTL;
}

// ============ 单模型推荐 ============

/**
 * 从 CCDRec 模型获取推荐
 */
async function fetchCCDRecRecommendations(userId, topK = 10) {
  try {
    const response = await fetch(MODELS.ccdrec.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, top_k: topK }),
      signal: AbortSignal.timeout(MODELS.ccdrec.timeout),
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();

    return {
      model: "ccdrec",
      items: data.recommendations || [],
      scores: data.scores || [],
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error("CCDRec 推荐失败:", error);
    return { model: "ccdrec", items: [], scores: [], error: error.message };
  }
}

/**
 * 协同过滤推荐（本地实现）
 */
function fetchCollaborativeRecommendations(
  userId,
  topK,
  userBehavior,
  allProducts
) {
  try {
    // 基于用户行为历史的协同过滤
    const userInterests = {};
    userBehavior.forEach(({ category, action }) => {
      const weight = { view: 1, fav: 2.5, cart: 3.5, buy: 5 }[action] || 1;
      userInterests[category] = (userInterests[category] || 0) + weight;
    });

    const scored = allProducts
      .filter((p) => p.online)
      .map((p) => ({
        id: p.id,
        score: (userInterests[p.category] || 1) * 10 + p.hotScore * 0.5,
      }))
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

/**
 * 内容推荐（基于热度和新品）
 */
function fetchContentRecommendations(userId, topK, allProducts) {
  try {
    const scored = allProducts
      .filter((p) => p.online)
      .map((p) => ({
        id: p.id,
        score:
          p.hotScore * 0.7 + p.ctr * 1.2 + (p.tags.includes("新品") ? 5 : 0),
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

// ============ 多模型融合 ============

/**
 * 融合多个模型的推荐结果
 */
function fuseRecommendations(results, topK = 10) {
  const itemScores = new Map();

  results.forEach((result) => {
    if (result.error || !result.items.length) return;

    const model = MODELS[result.model];
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

// ============ 推荐解释生成 ============

/**
 * 为推荐结果生成解释
 */
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

  // 基于用户兴趣的解释
  if (userProfile?.categoryPercents?.[product?.category] > 20) {
    reasons.push(`你对${product?.category}类目兴趣较高`);
  }

  return {
    primary: reasons[0] || "个性化推荐",
    secondary: reasons.slice(1),
    confidence: Number((0.6 + Math.random() * 0.35).toFixed(2)),
  };
}

// ============ 实时反馈循环 ============

const feedbackQueue = [];
const FEEDBACK_BATCH_SIZE = 10;
const FEEDBACK_FLUSH_INTERVAL = 30000; // 30秒

/**
 * 记录用户反馈
 */
function recordFeedback(userId, itemId, action, metadata = {}) {
  feedbackQueue.push({
    userId,
    itemId,
    action, // 'view', 'click', 'fav', 'cart', 'buy', 'skip'
    timestamp: Date.now(),
    ...metadata,
  });

  if (feedbackQueue.length >= FEEDBACK_BATCH_SIZE) {
    flushFeedback();
  }
}

/**
 * 批量上传反馈
 */
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
    // 重新加入队列
    feedbackQueue.unshift(...batch);
  }
}

// 定期刷新反馈
setInterval(flushFeedback, FEEDBACK_FLUSH_INTERVAL);

// ============ A/B 测试框架 ============

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

/**
 * 获取用户的 A/B 测试分组
 */
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

/**
 * 应用 A/B 测试权重
 */
function applyABTestWeights(userId, testKey) {
  const variant = getABTestVariant(userId, testKey);
  const test = AB_TESTS[testKey];
  const weights = test.variants[variant];

  Object.entries(weights).forEach(([model, weight]) => {
    if (MODELS[model]) {
      MODELS[model].weight = weight;
    }
  });

  return { variant, weights };
}

// ============ 主推荐接口 ============

/**
 * 获取融合推荐结果
 */
export async function getEnhancedRecommendations({
  userId,
  topK = 10,
  userBehavior = [],
  allProducts = [],
  userProfile = {},
  useCache = true,
  abTestKey = null,
}) {
  const cacheKey = getCacheKey(userId, topK);

  // 检查缓存
  if (useCache && recommendationCache.has(cacheKey)) {
    const cached = recommendationCache.get(cacheKey);
    if (isCacheValid(cached.timestamp)) {
      return cached.data;
    }
  }

  // 应用 A/B 测试
  if (abTestKey) {
    applyABTestWeights(userId, abTestKey);
  }

  // 并行获取多个模型的推荐
  const [ccdrec, collaborative, content] = await Promise.all([
    MODELS.ccdrec.enabled
      ? fetchCCDRecRecommendations(userId, topK)
      : Promise.resolve({}),
    MODELS.collaborative.enabled
      ? Promise.resolve(
          fetchCollaborativeRecommendations(
            userId,
            topK,
            userBehavior,
            allProducts
          )
        )
      : Promise.resolve({}),
    MODELS.content.enabled
      ? Promise.resolve(fetchContentRecommendations(userId, topK, allProducts))
      : Promise.resolve({}),
  ]);

  // 融合结果
  const results = [ccdrec, collaborative, content].filter(
    (r) => r.items?.length > 0
  );
  const fused = fuseRecommendations(results, topK);

  // 生成解释
  const recommendations = fused.map((item) => {
    const product = allProducts.find((p) => p.id === item.itemId);
    const explanation = generateExplanation(
      item.itemId,
      item,
      userProfile,
      product
    );

    return {
      itemId: item.itemId,
      product,
      fusedScore: item.fusedScore,
      models: item.models,
      explanation,
      details: item.details,
    };
  });

  const result = {
    userId,
    recommendations,
    timestamp: Date.now(),
    modelCount: results.length,
    abTest: abTestKey ? getABTestVariant(userId, abTestKey) : null,
  };

  // 缓存结果
  recommendationCache.set(cacheKey, {
    data: result,
    timestamp: Date.now(),
  });

  return result;
}

/**
 * 获取推荐统计
 */
export function getRecommendationStats() {
  return {
    cacheSize: recommendationCache.size,
    feedbackQueueSize: feedbackQueue.length,
    models: Object.entries(MODELS).map(([key, config]) => ({
      key,
      name: config.name,
      weight: config.weight,
      enabled: config.enabled,
    })),
  };
}

/**
 * 清空缓存
 */
export function clearRecommendationCache() {
  recommendationCache.clear();
}

/**
 * 导出反馈接口
 */
export { recordFeedback, flushFeedback };
