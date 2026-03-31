# 推荐系统增强 - 快速参考卡

## 🎯 核心接口速查表

### 推荐服务 (recommendationService.js)

```javascript
// 获取融合推荐
await getEnhancedRecommendations({
  userId,           // 用户ID
  topK: 10,         // 推荐数量
  userBehavior,     // 用户行为历史
  allProducts,      // 所有商品
  useCache: true,   // 是否使用缓存
  abTestKey: null   // A/B测试键
})

// 记录反馈
recordFeedback(userId, itemId, action, metadata)

// 刷新反馈
await flushFeedback()

// 获取统计
getRecommendationStats()

// 清空缓存
clearRecommendationCache()
```

### 行为追踪 (behaviorTrackingService.js)

```javascript
// 追踪用户行为
trackBehavior(userId, itemId, action, metadata)
// action: 'view', 'click', 'fav', 'cart', 'buy', 'skip', 'share', 'comment'

// 记录推荐展示
trackRecommendationImpression(recId, items, userId)

// 记录推荐点击
trackRecommendationClick(recId, itemId, action)

// 获取兴趣向量
getUserInterestVector(behaviors)

// 获取转化漏斗
getConversionFunnelStats()

// 获取推荐指标
getRecommendationMetrics()

// 获取追踪统计
getBehaviorTrackingStats()

// 导出行为数据
exportBehaviorData()
```

### 业务流聚合 (enhancedRecommendationComposer.js)

```javascript
// Vue 组合函数
const {
  loading,
  recommendations,
  userProfile,
  analysis,
  loadRecommendations,
  updateUserProfile,
  updateAnalysis,
  trackInteraction
} = useEnhancedRecommendation()

// 获取推荐
await fetchEnhancedRecommendations(params)

// 记录交互
recordRecommendationInteraction(itemId, action, metadata)

// 获取用户档案
getUserProfile(behaviors)

// 获取完整业务流
getFullBusinessFlowData(behaviors, products)

// 获取推荐分析
getRecommendationAnalysis()

// 获取仪表板数据
getDashboardData(behaviors, products)
```

---

## 📊 数据结构速查表

### 推荐结果

```javascript
{
  userId: 'user_001',
  recommendations: [
    {
      itemId: 1,
      product: { name: '商品名', price: 99.9, ... },
      fusedScore: 0.85,
      models: ['ccdrec', 'collaborative'],
      explanation: {
        primary: '推荐理由',
        secondary: ['次要理由1', '次要理由2'],
        confidence: 0.92
      },
      details: {
        ccdrec: { score: 0.9, rank: 1 },
        collaborative: { score: 0.8, rank: 2 }
      },
      rank: 1,
      recId: 'rec_123'
    },
    // ... 更多推荐
  ],
  timestamp: 1711612800000,
  modelCount: 3,
  abTest: 'control'
}
```

### 用户档案

```javascript
{
  user: { id: 'user_001', name: '张三', level: 'VIP', ... },
  interestVector: {
    drink: 10.5,
    snack: 8.3,
    daily: 6.2,
    food: 5.1,
    beauty: 3.8,
    digital: 2.1
  },
  interestNormalized: {
    drink: 35.5,
    snack: 28.0,
    daily: 20.9,
    food: 17.2,
    beauty: 12.8,
    digital: 7.1
  },
  topCategories: [
    { category: 'drink', score: 10.5 },
    { category: 'snack', score: 8.3 },
    { category: 'daily', score: 6.2 }
  ],
  totalBehaviors: 14,
  lastUpdated: 1711612800000
}
```

### 转化漏斗

```javascript
{
  view: 100,           // 浏览数
  viewToClick: 45.5,   // 浏览→点击 (%)
  clickToFav: 32.1,    // 点击→收藏 (%)
  favToCart: 28.6,     // 收藏→购物车 (%)
  cartToBuy: 85.7,     // 购物车→购买 (%)
  viewToBuy: 11.2      // 浏览→购买 (%)
}
```

### 推荐分析

```javascript
{
  overview: {
    totalRecommendations: 50,
    totalClicks: 22,
    totalConversions: 5,
    ctr: '44%',
    cvr: '22.7%'
  },
  funnel: {
    viewToClick: '45.5%',
    clickToFav: '32.1%',
    favToCart: '28.6%',
    cartToBuy: '85.7%',
    viewToBuy: '11.2%'
  },
  efficiency: {
    avgClicksPerRecommendation: 0.44,
    avgConversionsPerClick: 0.227
  }
}
```

---

## 🎨 组件使用速查表

### RecommendationDashboard

```vue
<template>
  <RecommendationDashboard />
</template>

<script setup>
import RecommendationDashboard from '@/components/RecommendationDashboard.vue';
</script>
```

**显示内容：**
- 4个关键指标卡片 (CTR, CVR, 推荐数, 转化数)
- 用户兴趣分布图表
- 个性化推荐列表
- 转化漏斗可视化
- 推荐效率指标
- 实时数据流

### BusinessFlowVisualization

```vue
<template>
  <BusinessFlowVisualization />
</template>

<script setup>
import BusinessFlowVisualization from '@/components/BusinessFlowVisualization.vue';
</script>
```

**显示内容：**
- 5阶段流程图
- 推荐结果详情表格
- 转化漏斗分析
- 关键性能指标

---

## ⚙️ 配置参数速查表

### 模型权重

```javascript
// 在 recommendationService.js 中修改
const MODELS = {
  ccdrec: {
    weight: 0.6,        // 60%
    timeout: 3000,
    enabled: true
  },
  collaborative: {
    weight: 0.25,       // 25%
    timeout: 1000,
    enabled: true
  },
  content: {
    weight: 0.15,       // 15%
    timeout: 800,
    enabled: true
  }
};
```

### 缓存配置

```javascript
// 推荐结果缓存时间
const CACHE_TTL = 5 * 60 * 1000;  // 5 分钟

// 行为事件批处理
const eventQueue = new BehaviorEventQueue(
  20,      // 批处理大小
  10000    // 刷新间隔 (10 秒)
);
```

### 行为权重

```javascript
const ACTION_WEIGHTS = {
  view: 1,      // 浏览
  click: 1.5,   // 点击
  fav: 2.5,     // 收藏
  cart: 3.5,    // 购物车
  buy: 5,       // 购买
  skip: -0.5,   // 跳过
  share: 2,     // 分享
  comment: 1.8  // 评论
};
```

---

## 🔍 常见场景速查表

### 场景1：获取推荐

```javascript
const result = await fetchEnhancedRecommendations({
  userId: 'user_001',
  topK: 10,
  userBehavior: behaviorLog.value,
  allProducts: products.value
});

console.log(result.recommendations);
```

### 场景2：追踪行为

```javascript
// 浏览
trackBehavior(userId, itemId, 'view', { category: 'drink' });

// 购买
trackBehavior(userId, itemId, 'buy', { price: 99.9 });
```

### 场景3：记录推荐交互

```javascript
// 记录推荐展示
trackRecommendationImpression(recId, itemIds, userId);

// 记录推荐点击
trackRecommendationClick(recId, itemId, 'click');
```

### 场景4：获取分析数据

```javascript
const analysis = getRecommendationAnalysis();
console.log('CTR:', analysis.overview.ctr);
console.log('CVR:', analysis.overview.cvr);
```

### 场景5：A/B 测试

```javascript
const result = await fetchEnhancedRecommendations({
  userId,
  topK: 10,
  userBehavior,
  allProducts,
  abTestKey: 'model_weight_v1'
});

console.log('用户分组:', result.abTest);
```

---

## 🚨 错误处理速查表

### 推荐失败处理

```javascript
try {
  const result = await loadRecommendations({
    userBehavior: behaviorLog.value,
    allProducts: products.value
  });

  if (!result.recommendations.length) {
    // 降级处理
    return getDefaultRecommendations();
  }
} catch (error) {
  console.error('推荐失败:', error);
  return getDefaultRecommendations();
}
```

### 缓存问题处理

```javascript
// 清空缓存
clearRecommendationCache();

// 禁用缓存
const result = await loadRecommendations({
  userBehavior,
  allProducts,
  useCache: false  // 禁用缓存
});
```

### 性能优化

```javascript
// 减少推荐数量
const result = await loadRecommendations({
  userBehavior,
  allProducts,
  topK: 5  // 只获取 5 个
});

// 定期清空缓存
setInterval(() => {
  clearRecommendationCache();
}, 30 * 60 * 1000);  // 每 30 分钟
```

---

## 📈 监控指标速查表

### 推荐质量指标

| 指标 | 含义 | 目标值 |
|------|------|--------|
| CTR | 推荐点击率 | > 40% |
| CVR | 推荐转化率 | > 20% |
| 平均分数 | 融合分数平均值 | > 0.7 |

### 转化漏斗指标

| 指标 | 含义 | 目标值 |
|------|------|--------|
| 浏览→点击 | 初始吸引力 | > 40% |
| 点击→收藏 | 兴趣确认 | > 30% |
| 收藏→购物车 | 购买意向 | > 25% |
| 购物车→购买 | 最终转化 | > 80% |

### 系统性能指标

| 指标 | 含义 | 目标值 |
|------|------|--------|
| 响应时间 | 推荐生成耗时 | < 1s |
| 缓存命中率 | 缓存效率 | > 70% |
| 模型覆盖率 | 推荐覆盖度 | > 90% |

---

## 📚 文档导航速查表

| 文档 | 用途 | 阅读时间 |
|------|------|---------|
| `QUICK_START.md` | 快速上手 | 5 分钟 |
| `ENHANCEMENT_SUMMARY.md` | 功能详解 | 15 分钟 |
| `PROJECT_STRUCTURE.md` | 项目结构 | 10 分钟 |
| `COMPLETION_CHECKLIST.md` | 完成清单 | 10 分钟 |
| `INTEGRATION_GUIDE.js` | 集成指南 | 30 分钟 |
| `README_ENHANCEMENT.md` | 最终总结 | 10 分钟 |

---

## 🎓 学习路径速查表

### 初级 (1-2 小时)
1. 阅读 `QUICK_START.md`
2. 查看组件代码
3. 运行基础示例

### 中级 (2-4 小时)
1. 阅读 `ENHANCEMENT_SUMMARY.md`
2. 研究服务层代码
3. 理解数据流向

### 高级 (4+ 小时)
1. 阅读 `INTEGRATION_GUIDE.js`
2. 修改配置参数
3. 添加自定义模型

---

## 🔗 快速链接

```
核心服务：
  src/services/recommendationService.js
  src/services/behaviorTrackingService.js
  src/services/enhancedRecommendationComposer.js

可视化组件：
  src/components/RecommendationDashboard.vue
  src/components/BusinessFlowVisualization.vue

文档：
  QUICK_START.md
  ENHANCEMENT_SUMMARY.md
  PROJECT_STRUCTURE.md
  COMPLETION_CHECKLIST.md
  README_ENHANCEMENT.md
```

---

**快速参考卡 - 打印版本**

建议打印此文档作为快速参考！

---

**最后更新：2026-03-28**
