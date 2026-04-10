/**
 * 用户行为追踪服务
 * 负责：
 * 1. 实时行为事件采集
 * 2. 行为数据聚合与分析
 * 3. 用户兴趣向量更新
 * 4. 转化漏斗追踪
 */

// ============ 行为事件定义 ============
export const BEHAVIOR_ACTIONS = {
  VIEW: 'view',           // 浏览
  CLICK: 'click',         // 点击
  FAV: 'fav',             // 收藏
  CART: 'cart',           // 加入购物车
  BUY: 'buy',             // 购买
  SKIP: 'skip',           // 跳过
  SHARE: 'share',         // 分享
  COMMENT: 'comment',     // 评论
};

// 行为权重（用于兴趣计算）
const ACTION_WEIGHTS = {
  view: 1,
  click: 1.5,
  fav: 2.5,
  cart: 3.5,
  buy: 5,
  skip: -0.5,
  share: 2,
  comment: 1.8,
};

// ============ 行为事件队列 ============
class BehaviorEventQueue {
  constructor(batchSize = 20, flushInterval = 10000) {
    this.queue = [];
    this.batchSize = batchSize;
    this.flushInterval = flushInterval;
    this.timer = null;
    this.startAutoFlush();
  }

  add(event) {
    this.queue.push({
      ...event,
      timestamp: Date.now(),
      sessionId: this.getSessionId(),
    });

    if (this.queue.length >= this.batchSize) {
      this.flush();
    }
  }

  async flush() {
    if (this.queue.length === 0) return;

    const batch = this.queue.splice(0, this.batchSize);
    try {
      // 这里可以发送到后端
      console.log(`[行为追踪] 上传 ${batch.length} 条事件`);
      // await request.post('/api/behavior/batch', { data: { events: batch } });
    } catch (error) {
      console.error('[行为追踪] 上传失败:', error);
      this.queue.unshift(...batch);
    }
  }

  startAutoFlush() {
    this.timer = setInterval(() => this.flush(), this.flushInterval);
  }

  stopAutoFlush() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  getSessionId() {
    if (!window.__sessionId) {
      window.__sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    return window.__sessionId;
  }

  getQueueSize() {
    return this.queue.length;
  }
}

const eventQueue = new BehaviorEventQueue();

// ============ 用户兴趣向量 ============
class UserInterestVector {
  constructor(initialBehaviors = []) {
    this.vector = {
      drink: 0,
      snack: 0,
      daily: 0,
      food: 0,
      beauty: 0,
      digital: 0,
    };
    this.updateFromBehaviors(initialBehaviors);
  }

  updateFromBehaviors(behaviors) {
    behaviors.forEach(({ category, action }) => {
      const weight = ACTION_WEIGHTS[action] || 0;
      // 动态支持新类目（如天猫真实类目）
      if (!this.vector.hasOwnProperty(category)) {
        this.vector[category] = 0;
      }
      this.vector[category] += weight;
    });
  }

  addBehavior(category, action) {
    const weight = ACTION_WEIGHTS[action] || 0;
    if (!this.vector.hasOwnProperty(category)) {
      this.vector[category] = 0;
    }
    this.vector[category] += weight;
  }

  getVector() {
    return { ...this.vector };
  }

  getNormalized() {
    const total = Object.values(this.vector).reduce((sum, v) => sum + Math.max(0, v), 0) || 1;
    return Object.fromEntries(
      Object.entries(this.vector).map(([k, v]) => [k, Number((Math.max(0, v) / total * 100).toFixed(1))])
    );
  }

  getTopCategories(n = 3) {
    return Object.entries(this.vector)
      .sort((a, b) => b[1] - a[1])
      .slice(0, n)
      .map(([category, score]) => ({ category, score }));
  }

  reset() {
    Object.keys(this.vector).forEach(key => {
      this.vector[key] = 0;
    });
  }
}

// ============ 转化漏斗追踪 ============
class ConversionFunnel {
  constructor() {
    this.stages = {
      view: 0,
      click: 0,
      fav: 0,
      cart: 0,
      buy: 0,
    };
    this.userJourney = new Map(); // userId -> [events]
  }

  recordEvent(userId, itemId, action) {
    if (this.stages.hasOwnProperty(action)) {
      this.stages[action]++;
    }

    if (!this.userJourney.has(userId)) {
      this.userJourney.set(userId, []);
    }

    this.userJourney.get(userId).push({
      itemId,
      action,
      timestamp: Date.now(),
    });
  }

  getConversionRate(fromStage, toStage) {
    const from = this.stages[fromStage] || 0;
    const to = this.stages[toStage] || 0;
    return from > 0 ? Number((to / from * 100).toFixed(2)) : 0;
  }

  getFunnelStats() {
    return {
      view: this.stages.view,
      viewToClick: this.getConversionRate('view', 'click'),
      clickToFav: this.getConversionRate('click', 'fav'),
      favToCart: this.getConversionRate('fav', 'cart'),
      cartToBuy: this.getConversionRate('cart', 'buy'),
      viewToBuy: this.getConversionRate('view', 'buy'),
    };
  }

  getUserJourney(userId) {
    return this.userJourney.get(userId) || [];
  }

  reset() {
    Object.keys(this.stages).forEach(key => {
      this.stages[key] = 0;
    });
    this.userJourney.clear();
  }
}

const conversionFunnel = new ConversionFunnel();

// ============ 推荐效果追踪 ============
class RecommendationTracker {
  constructor() {
    this.recommendations = new Map(); // recId -> { items, timestamp, actions }
    this.metrics = {
      totalRecommendations: 0,
      totalClicks: 0,
      totalConversions: 0,
      ctr: 0,
      cvr: 0,
    };
  }

  recordRecommendation(recId, items, userId) {
    this.recommendations.set(recId, {
      items,
      userId,
      timestamp: Date.now(),
      actions: [],
    });
    this.metrics.totalRecommendations++;
  }

  recordAction(recId, itemId, action) {
    const rec = this.recommendations.get(recId);
    if (!rec) return;

    rec.actions.push({
      itemId,
      action,
      timestamp: Date.now(),
    });

    if (action === 'click') {
      this.metrics.totalClicks++;
    }
    if (action === 'buy') {
      this.metrics.totalConversions++;
    }

    this.updateMetrics();
  }

  updateMetrics() {
    this.metrics.ctr = this.metrics.totalRecommendations > 0
      ? Number((this.metrics.totalClicks / this.metrics.totalRecommendations * 100).toFixed(2))
      : 0;

    this.metrics.cvr = this.metrics.totalClicks > 0
      ? Number((this.metrics.totalConversions / this.metrics.totalClicks * 100).toFixed(2))
      : 0;
  }

  getMetrics() {
    return { ...this.metrics };
  }

  getRecommendationDetails(recId) {
    return this.recommendations.get(recId);
  }

  reset() {
    this.recommendations.clear();
    Object.keys(this.metrics).forEach(key => {
      this.metrics[key] = 0;
    });
  }
}

const recommendationTracker = new RecommendationTracker();

// ============ 主行为追踪接口 ============

/**
 * 记录用户行为
 */
export function trackBehavior(userId, itemId, action, metadata = {}) {
  const event = {
    userId,
    itemId,
    action,
    ...metadata,
  };

  eventQueue.add(event);
  conversionFunnel.recordEvent(userId, itemId, action);

  return event;
}

/**
 * 记录推荐展示
 */
export function trackRecommendationImpression(recId, items, userId) {
  recommendationTracker.recordRecommendation(recId, items, userId);
}

/**
 * 记录推荐点击
 */
export function trackRecommendationClick(recId, itemId, action = 'click') {
  recommendationTracker.recordAction(recId, itemId, action);
}

/**
 * 获取用户兴趣向量
 */
export function getUserInterestVector(behaviors = []) {
  return new UserInterestVector(behaviors);
}

/**
 * 获取转化漏斗数据
 */
export function getConversionFunnelStats() {
  return conversionFunnel.getFunnelStats();
}

/**
 * 获取用户转化路径
 */
export function getUserConversionPath(userId) {
  return conversionFunnel.getUserJourney(userId);
}

/**
 * 获取推荐效果指标
 */
export function getRecommendationMetrics() {
  return recommendationTracker.getMetrics();
}

/**
 * 获取推荐详情
 */
export function getRecommendationDetails(recId) {
  return recommendationTracker.getRecommendationDetails(recId);
}

/**
 * 获取行为追踪统计
 */
export function getBehaviorTrackingStats() {
  return {
    eventQueueSize: eventQueue.getQueueSize(),
    conversionFunnel: conversionFunnel.getFunnelStats(),
    recommendationMetrics: recommendationTracker.getMetrics(),
  };
}

/**
 * 手动刷新事件队列
 */
export async function flushBehaviorEvents() {
  await eventQueue.flush();
}

/**
 * 重置所有追踪数据
 */
export function resetBehaviorTracking() {
  eventQueue.queue = [];
  conversionFunnel.reset();
  recommendationTracker.reset();
}

/**
 * 导出行为数据（用于分析）
 */
export function exportBehaviorData() {
  return {
    conversionFunnel: conversionFunnel.getFunnelStats(),
    recommendationMetrics: recommendationTracker.getMetrics(),
    timestamp: Date.now(),
  };
}
