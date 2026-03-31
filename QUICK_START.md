# 快速开始指南

## 🚀 5分钟快速上手

### 第一步：导入服务

```javascript
// 在你的 Vue 组件中
import { useEnhancedRecommendation } from '@/services/enhancedRecommendationComposer';
import { trackBehavior } from '@/services/behaviorTrackingService';
```

### 第二步：初始化推荐

```javascript
const {
  recommendations,
  userProfile,
  analysis,
  loadRecommendations,
  trackInteraction,
} = useEnhancedRecommendation();

// 加载推荐
await loadRecommendations({
  userBehavior: behaviorLog.value,
  allProducts: products.value,
});
```

### 第三步：记录用户交互

```javascript
// 用户点击推荐商品
function handleClick(itemId) {
  trackInteraction(itemId, 'click', {
    rank: 1,
    source: 'recommendation',
  });
}

// 用户购买商品
function handleBuy(itemId, price) {
  trackBehavior('user_001', itemId, 'buy', {
    price,
    source: 'recommendation',
  });
}
```

### 第四步：显示推荐结果

```vue
<template>
  <div>
    <div v-for="(rec, idx) in recommendations" :key="rec.itemId">
      <div>{{ idx + 1 }}. {{ rec.product?.name }}</div>
      <div>分数: {{ (rec.fusedScore * 100).toFixed(0) }}</div>
      <div>{{ rec.explanation?.primary }}</div>
      <button @click="handleClick(rec.itemId)">查看详情</button>
    </div>
  </div>
</template>
```

### 第五步：查看分析数据

```javascript
// 获取推荐效果分析
const analysis = getRecommendationAnalysis();
console.log('点击率:', analysis.overview.ctr);
console.log('转化率:', analysis.overview.cvr);
console.log('转化漏斗:', analysis.funnel);
```

---

## 📊 使用可视化组件

### 推荐仪表板

```vue
<template>
  <RecommendationDashboard />
</template>

<script setup>
import RecommendationDashboard from '@/components/RecommendationDashboard.vue';
</script>
```

### 业务流可视化

```vue
<template>
  <BusinessFlowVisualization />
</template>

<script setup>
import BusinessFlowVisualization from '@/components/BusinessFlowVisualization.vue';
</script>
```

---

## 🎯 常见场景

### 场景1：获取用户推荐

```javascript
async function getRecommendationsForUser(userId) {
  const result = await fetchEnhancedRecommendations({
    userId,
    topK: 10,
    userBehavior: behaviorLog,
    allProducts: products,
  });
  
  return result.recommendations;
}
```

### 场景2：追踪用户行为

```javascript
// 浏览商品
trackBehavior(userId, itemId, 'view', { category: 'drink' });

// 收藏商品
trackBehavior(userId, itemId, 'fav', { timestamp: Date.now() });

// 加入购物车
trackBehavior(userId, itemId, 'cart', { quantity: 2 });

// 购买商品
trackBehavior(userId, itemId, 'buy', { price: 99.9, orderId: 'order_123' });
```

### 场景3：A/B 测试

```javascript
// 启用 A/B 测试
const result = await fetchEnhancedRecommendations({
  userId,
  topK: 10,
  userBehavior,
  allProducts,
  abTestKey: 'model_weight_v1', // 指定测试
});

console.log('用户分组:', result.abTest); // 'control', 'variant_a', 或 'variant_b'
```

### 场景4：获取用户档案

```javascript
const profile = getUserProfile(behaviorLog);

console.log('用户兴趣分布:', profile.interestNormalized);
// { drink: 25.5, snack: 18.3, daily: 12.1, ... }

console.log('用户顶级类目:', profile.topCategories);
// [{ category: 'drink', score: 10.5 }, ...]
```

### 场景5：获取转化数据

```javascript
const funnel = getConversionFunnelStats();

console.log('浏览→点击:', funnel.viewToClick, '%');
console.log('点击→收藏:', funnel.clickToFav, '%');
console.log('收藏→购物车:', funnel.favToCart, '%');
console.log('购物车→购买:', funnel.cartToBuy, '%');
```

---

## 🔧 配置调整

### 修改模型权重

编辑 `src/services/recommendationService.js`:

```javascript
const MODELS = {
  ccdrec: {
    name: 'CCDRec',
    endpoint: 'http://127.0.0.1:8000/recommend',
    weight: 0.7,  // 增加权重
    timeout: 3000,
    enabled: true,
  },
  collaborative: {
    name: '协同过滤',
    weight: 0.2,  // 减少权重
    timeout: 1000,
    enabled: true,
  },
  content: {
    name: '内容推荐',
    weight: 0.1,  // 减少权重
    timeout: 800,
    enabled: true,
  },
};
```

### 修改缓存时间

编辑 `src/services/recommendationService.js`:

```javascript
const CACHE_TTL = 10 * 60 * 1000; // 改为 10 分钟
```

### 修改事件批处理

编辑 `src/services/behaviorTrackingService.js`:

```javascript
const eventQueue = new BehaviorEventQueue(
  50,      // 批处理大小（改为 50 条）
  60000    // 刷新间隔（改为 60 秒）
);
```

---

## 📈 监控与调试

### 查看实时统计

```javascript
import { getBehaviorTrackingStats } from '@/services/behaviorTrackingService';

const stats = getBehaviorTrackingStats();
console.log('事件队列大小:', stats.eventQueueSize);
console.log('转化漏斗:', stats.conversionFunnel);
console.log('推荐指标:', stats.recommendationMetrics);
```

### 查看推荐统计

```javascript
import { getRecommendationStats } from '@/services/recommendationService';

const stats = getRecommendationStats();
console.log('缓存大小:', stats.cacheSize);
console.log('反馈队列:', stats.feedbackQueueSize);
console.log('模型配置:', stats.models);
```

### 清空缓存

```javascript
import { clearRecommendationCache } from '@/services/recommendationService';

clearRecommendationCache();
```

---

## 🐛 常见问题

### Q1: 推荐为空怎么办？

```javascript
// 检查是否有行为数据
if (!behaviorLog.value.length) {
  console.warn('没有行为数据，使用热门商品');
  return getHotProducts();
}

// 检查是否有商品数据
if (!products.value.length) {
  console.warn('没有商品数据');
  return [];
}
```

### Q2: 如何处理推荐失败？

```javascript
try {
  const result = await loadRecommendations({
    userBehavior: behaviorLog.value,
    allProducts: products.value,
  });
  
  if (!result.recommendations.length) {
    // 降级处理
    return getDefaultRecommendations();
  }
} catch (error) {
  console.error('推荐失败:', error);
  // 返回备选推荐
  return getDefaultRecommendations();
}
```

### Q3: 如何优化推荐性能？

```javascript
// 1. 启用缓存
const result = await loadRecommendations({
  userBehavior,
  allProducts,
  useCache: true,  // 启用缓存
});

// 2. 减少推荐数量
const result = await loadRecommendations({
  userBehavior,
  allProducts,
  topK: 5,  // 只获取 5 个推荐
});

// 3. 定期清空缓存
setInterval(() => {
  clearRecommendationCache();
}, 30 * 60 * 1000); // 每 30 分钟清空一次
```

### Q4: 如何调试行为追踪？

```javascript
// 启用详细日志
const originalLog = console.log;
console.log = function(...args) {
  if (args[0]?.includes('行为追踪')) {
    originalLog.apply(console, args);
  }
};

// 查看事件队列
import { getBehaviorTrackingStats } from '@/services/behaviorTrackingService';
setInterval(() => {
  const stats = getBehaviorTrackingStats();
  console.log('当前事件队列:', stats.eventQueueSize);
}, 5000);
```

---

## 📚 完整示例

### 完整的推荐流程

```javascript
import { useEnhancedRecommendation, recordRecommendationInteraction } from '@/services/enhancedRecommendationComposer';
import { trackBehavior } from '@/services/behaviorTrackingService';

export default {
  setup() {
    const { recommendations, loadRecommendations, trackInteraction } = useEnhancedRecommendation();
    const { products, behaviorLog } = useUserMallData();

    // 1. 加载推荐
    const handleLoadRecommendations = async () => {
      await loadRecommendations({
        userBehavior: behaviorLog.value,
        allProducts: products.value,
      });
    };

    // 2. 处理推荐点击
    const handleRecommendationClick = (rec) => {
      trackInteraction(rec.itemId, 'click', {
        rank: rec.rank,
        score: rec.fusedScore,
      });
    };

    // 3. 处理购买
    const handleBuy = (rec, price) => {
      trackBehavior('user_001', rec.itemId, 'buy', {
        price,
        recId: rec.recId,
        rank: rec.rank,
      });
    };

    // 4. 初始化
    onMounted(() => {
      handleLoadRecommendations();
    });

    return {
      recommendations,
      handleRecommendationClick,
      handleBuy,
    };
  },
};
```

---

## 🎓 下一步

1. **集成到应用** - 在你的页面中使用这些服务
2. **自定义配置** - 根据业务需求调整参数
3. **监控效果** - 定期查看推荐效果指标
4. **迭代优化** - 基于数据进行模型优化
5. **扩展功能** - 添加更多数据集和模型

---

**祝你使用愉快！** 🎉
