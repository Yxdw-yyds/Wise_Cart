/**
 * 增强的推荐数据组合器
 * 整合推荐服务、行为追踪、用户数据
 * 提供完整的业务流数据
 */

import { computed, ref } from 'vue';
import { getEnhancedRecommendations, recordFeedback } from './recommendationService';
import {
  trackBehavior,
  trackRecommendationImpression,
  trackRecommendationClick,
  getUserInterestVector,
  getConversionFunnelStats,
  getUserConversionPath,
  getRecommendationMetrics,
} from './behaviorTrackingService';

// ============ 推荐结果缓存 ============
const recommendationCache = ref(null);
const recommendationId = ref(null);

// ============ 用户数据 ============
const currentUser = ref({
  id: 'user_001',
  name: '张三',
  level: 'VIP',
  joinDate: '2023-01-15',
});

// ============ 业务流数据聚合 ============

/**
 * 生成推荐 ID
 */
function generateRecommendationId() {
  return `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 获取增强的推荐结果
 */
export async function fetchEnhancedRecommendations({
  userId = currentUser.value.id,
  topK = 10,
  userBehavior = [],
  allProducts = [],
  userProfile = {},
  useCache = true,
  abTestKey = null,
}) {
  try {
    const result = await getEnhancedRecommendations({
      userId,
      topK,
      userBehavior,
      allProducts,
      userProfile,
      useCache,
      abTestKey,
    });

    // 生成推荐 ID 并记录展示
    const recId = generateRecommendationId();
    recommendationId.value = recId;
    recommendationCache.value = result;

    trackRecommendationImpression(
      recId,
      result.recommendations.map(r => r.itemId),
      userId
    );

    return {
      ...result,
      recId,
      recommendations: result.recommendations.map((rec, idx) => ({
        ...rec,
        rank: idx + 1,
        recId,
      })),
    };
  } catch (error) {
    console.error('获取推荐失败:', error);
    return {
      userId,
      recommendations: [],
      error: error.message,
      timestamp: Date.now(),
    };
  }
}

/**
 * 记录推荐项目的用户交互
 */
export function recordRecommendationInteraction(itemId, action, metadata = {}) {
  const recId = recommendationId.value;
  const userId = currentUser.value.id;

  // 记录行为
  trackBehavior(userId, itemId, action, {
    source: 'recommendation',
    recId,
    ...metadata,
  });

  // 记录推荐点击
  if (action === 'click' || action === 'buy' || action === 'cart') {
    trackRecommendationClick(recId, itemId, action);
  }

  // 记录反馈
  recordFeedback(userId, itemId, action, {
    recId,
    ...metadata,
  });
}

/**
 * 获取用户完整档案
 */
export function getUserProfile(behaviors = []) {
  const interestVector = getUserInterestVector(behaviors);
  const normalized = interestVector.getNormalized();
  const topCategories = interestVector.getTopCategories(3);

  return {
    user: currentUser.value,
    interestVector: interestVector.getVector(),
    interestNormalized: normalized,
    topCategories,
    totalBehaviors: behaviors.length,
    lastUpdated: Date.now(),
  };
}

/**
 * 获取完整的业务流数据
 */
export function getFullBusinessFlowData(behaviors = [], products = []) {
  const userProfile = getUserProfile(behaviors);
  const conversionFunnel = getConversionFunnelStats();
  const recommendationMetrics = getRecommendationMetrics();

  return {
    user: userProfile,
    conversion: {
      funnel: conversionFunnel,
      path: getUserConversionPath(currentUser.value.id),
    },
    recommendation: {
      metrics: recommendationMetrics,
      cache: recommendationCache.value,
    },
    timestamp: Date.now(),
  };
}

/**
 * 获取推荐效果分析
 */
export function getRecommendationAnalysis() {
  const metrics = getRecommendationMetrics();
  const funnel = getConversionFunnelStats();

  return {
    overview: {
      totalRecommendations: metrics.totalRecommendations,
      totalClicks: metrics.totalClicks,
      totalConversions: metrics.totalConversions,
      ctr: `${metrics.ctr}%`,
      cvr: `${metrics.cvr}%`,
    },
    funnel: {
      viewToClick: `${funnel.viewToClick}%`,
      clickToFav: `${funnel.clickToFav}%`,
      favToCart: `${funnel.favToCart}%`,
      cartToBuy: `${funnel.cartToBuy}%`,
      viewToBuy: `${funnel.viewToBuy}%`,
    },
    efficiency: {
      avgClicksPerRecommendation: metrics.totalRecommendations > 0
        ? Number((metrics.totalClicks / metrics.totalRecommendations).toFixed(2))
        : 0,
      avgConversionsPerClick: metrics.totalClicks > 0
        ? Number((metrics.totalConversions / metrics.totalClicks).toFixed(2))
        : 0,
    },
  };
}

/**
 * 使用组合器的 Vue 组合函数
 */
export function useEnhancedRecommendation() {
  const loading = ref(false);
  const error = ref('');
  const recommendations = ref([]);
  const userProfile = ref(null);
  const businessFlow = ref(null);
  const analysis = ref(null);

  const loadRecommendations = async (params = {}) => {
    const { silent = false, ...requestParams } = params;
    if (!silent) loading.value = true;
    error.value = '';
    try {
      const result = await fetchEnhancedRecommendations(requestParams);
      recommendations.value = result.recommendations || [];
      return result;
    } catch (e) {
      error.value = e instanceof Error ? e.message : String(e);
      throw e;
    } finally {
      if (!silent) loading.value = false;
    }
  };

  const updateUserProfile = (behaviors = []) => {
    userProfile.value = getUserProfile(behaviors);
  };

  const updateBusinessFlow = (behaviors = [], products = []) => {
    businessFlow.value = getFullBusinessFlowData(behaviors, products);
  };

  const updateAnalysis = () => {
    analysis.value = getRecommendationAnalysis();
  };

  const trackInteraction = (itemId, action, metadata = {}) => {
    recordRecommendationInteraction(itemId, action, metadata);
    updateAnalysis();
  };

  return {
    loading,
    error,
    recommendations,
    userProfile,
    businessFlow,
    analysis,
    loadRecommendations,
    updateUserProfile,
    updateBusinessFlow,
    updateAnalysis,
    trackInteraction,
  };
}

/**
 * 获取实时仪表板数据
 */
export function getDashboardData(behaviors = [], products = []) {
  const userProfile = getUserProfile(behaviors);
  const analysis = getRecommendationAnalysis();
  const businessFlow = getFullBusinessFlowData(behaviors, products);

  return {
    user: {
      name: currentUser.value.name,
      level: currentUser.value.level,
      topCategories: userProfile.topCategories,
      interestNormalized: userProfile.interestNormalized,
    },
    metrics: {
      ctr: analysis.overview.ctr,
      cvr: analysis.overview.cvr,
      totalRecommendations: analysis.overview.totalRecommendations,
      totalConversions: analysis.overview.totalConversions,
    },
    funnel: analysis.funnel,
    efficiency: analysis.efficiency,
    timestamp: Date.now(),
  };
}
