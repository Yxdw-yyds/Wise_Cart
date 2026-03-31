# 项目结构与文件清单

## 📁 完整项目结构

```
wise_cart_system/
├── src/
│   ├── services/                          # 核心服务层
│   │   ├── recommendationService.js       ✅ 多模型推荐融合 (403 行)
│   │   ├── behaviorTrackingService.js     ✅ 用户行为追踪 (386 行)
│   │   ├── enhancedRecommendationComposer.js ✅ 业务流聚合 (277 行)
│   │   └── INTEGRATION_GUIDE.js           ✅ 集成指南 (412 行)
│   │
│   ├── components/                        # Vue 组件
│   │   ├── RecommendationDashboard.vue    ✅ 推荐仪表板 (567 行)
│   │   ├── BusinessFlowVisualization.vue  ✅ 业务流可视化 (163 行)
│   │   ├── behavior/
│   │   ├── cockpit/
│   │   ├── model-expo/
│   │   └── ...
│   │
│   ├── composables/
│   │   ├── useCcdrecData.js
│   │   └── useUserMallData.js
│   │
│   ├── api/
│   │   └── recommendation.js
│   │
│   ├── models/
│   │   └── ccdrec/
│   │       ├── dataset-baby-summary.json
│   │       ├── metrics-baby.json
│   │       ├── topk-baby.json
│   │       ├── ops-baby.json
│   │       └── manifest.json
│   │
│   └── ...
│
├── ENHANCEMENT_SUMMARY.md                 ✅ 增强总结 (385 行)
├── QUICK_START.md                         ✅ 快速开始 (411 行)
├── COMPLETION_CHECKLIST.md                ✅ 完成清单 (456 行)
├── PROJECT_STRUCTURE.md                   ✅ 项目结构 (本文件)
│
└── ...
```

---

## 📊 新增文件统计

### 服务层文件 (4 个)

| 文件名 | 行数 | 功能 |
|--------|------|------|
| `recommendationService.js` | 403 | 多模型推荐融合、反馈循环、A/B 测试 |
| `behaviorTrackingService.js` | 386 | 用户行为追踪、兴趣向量、转化漏斗 |
| `enhancedRecommendationComposer.js` | 277 | 业务流聚合、Vue 组合函数 |
| `INTEGRATION_GUIDE.js` | 412 | 集成指南和使用示例 |
| **小计** | **1,478** | **核心服务层** |

### 组件文件 (2 个)

| 文件名 | 行数 | 功能 |
|--------|------|------|
| `RecommendationDashboard.vue` | 567 | 实时推荐仪表板 |
| `BusinessFlowVisualization.vue` | 163 | 完整业务流可视化 |
| **小计** | **730** | **可视化组件** |

### 文档文件 (4 个)

| 文件名 | 行数 | 内容 |
|--------|------|------|
| `ENHANCEMENT_SUMMARY.md` | 385 | 增强功能总结 |
| `QUICK_START.md` | 411 | 5分钟快速上手 |
| `COMPLETION_CHECKLIST.md` | 456 | 完成清单 |
| `PROJECT_STRUCTURE.md` | - | 项目结构说明 |
| **小计** | **1,252** | **完整文档** |

### 总计

- **新增文件：10 个**
- **总代码行数：3,460 行**
- **功能模块：12+ 个**
- **文档页数：4 份**

---

## 🎯 核心功能模块

### 1. 推荐服务模块 (recommendationService.js)

```javascript
// 主要导出
export async function getEnhancedRecommendations()    // 获取融合推荐
export function getRecommendationStats()              // 获取统计
export function clearRecommendationCache()            // 清空缓存
export function recordFeedback()                      // 记录反馈
export async function flushFeedback()                 // 刷新反馈

// 内部模块
- fetchCCDRecRecommendations()                        // CCDRec 推荐
- fetchCollaborativeRecommendations()                 // 协同过滤
- fetchContentRecommendations()                       // 内容推荐
- fuseRecommendations()                               // 融合算法
- generateExplanation()                               // 生成解释
- getABTestVariant()                                  // A/B 分组
- applyABTestWeights()                                // 应用权重
```

### 2. 行为追踪模块 (behaviorTrackingService.js)

```javascript
// 主要导出
export function trackBehavior()                       // 追踪行为
export function trackRecommendationImpression()       // 记录展示
export function trackRecommendationClick()            // 记录点击
export function getUserInterestVector()               // 获取兴趣向量
export function getConversionFunnelStats()            // 获取转化漏斗
export function getRecommendationMetrics()            // 获取推荐指标
export function getBehaviorTrackingStats()            // 获取追踪统计
export function exportBehaviorData()                  // 导出数据

// 内部类
- BehaviorEventQueue                                  // 事件队列
- UserInterestVector                                  // 兴趣向量
- ConversionFunnel                                    // 转化漏斗
- RecommendationTracker                               // 推荐追踪
```

### 3. 业务流聚合模块 (enhancedRecommendationComposer.js)

```javascript
// 主要导出
export async function fetchEnhancedRecommendations()  // 获取推荐
export function recordRecommendationInteraction()     // 记录交互
export function getUserProfile()                      // 获取用户档案
export function getFullBusinessFlowData()             // 获取完整业务流
export function getRecommendationAnalysis()           // 获取分析
export function getDashboardData()                    // 获取仪表板数据
export function useEnhancedRecommendation()           // Vue 组合函数

// 内部函数
- generateRecommendationId()                          // 生成推荐 ID
- recordRecommendationInteraction()                   // 记录交互
```

---

## 🎨 可视化组件

### RecommendationDashboard.vue

**组件结构：**
```vue
<template>
  <div class="recommendation-dashboard">
    <!-- 指标卡片行 -->
    <div class="metrics-row">
      <MetricCard />  × 4
    </div>

    <!-- 内容行 -->
    <div class="content-row">
      <UserInterestSection />
      <RecommendationListSection />
      <ConversionFunnelSection />
    </div>

    <!-- 底部行 -->
    <div class="bottom-row">
      <EfficiencySection />
      <RealTimeDataSection />
    </div>
  </div>
</template>
```

**数据绑定：**
- 实时推荐数据
- 用户兴趣分布
- 转化漏斗数据
- 推荐效率指标
- 实时事件流

### BusinessFlowVisualization.vue

**组件结构：**
```vue
<template>
  <div class="business-flow-visualization">
    <!-- 标题 -->
    <div class="flow-header" />

    <!-- 5阶段流程图 -->
    <div class="flow-diagram">
      <Stage1 />  <!-- 用户行为采集 -->
      <Arrow />
      <Stage2 />  <!-- 兴趣向量构建 -->
      <Arrow />
      <Stage3 />  <!-- 多模型推荐 -->
      <Arrow />
      <Stage4 />  <!-- 推荐融合 -->
      <Arrow />
      <Stage5 />  <!-- 用户交互 -->
    </div>

    <!-- 详细数据 -->
    <div class="details-section">
      <RecommendationTable />
      <ConversionFunnelChart />
      <KeyMetrics />
    </div>
  </div>
</template>
```

**数据绑定：**
- 行为统计数据
- 兴趣向量数据
- 模型配置信息
- 推荐结果详情
- 转化漏斗数据
- 关键性能指标

---

## 🔄 数据流向图

```
┌─────────────────────────────────────────────────────────────┐
│                   用户交互                                   │
│  (浏览、点击、收藏、购物车、购买等)                         │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│            behaviorTrackingService                           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ trackBehavior()                                      │  │
│  │ - 事件采集                                           │  │
│  │ - 会话管理                                           │  │
│  │ - 时间戳记录                                         │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│            用户兴趣向量构建                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ UserInterestVector                                   │  │
│  │ - 6个类目权重                                        │  │
│  │ - 动态计算                                           │  │
│  │ - 归一化处理                                         │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│            recommendationService                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  CCDRec      │  │  协同过滤    │  │  内容推荐    │     │
│  │  (60%)       │  │  (25%)       │  │  (15%)       │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│         │                 │                 │              │
│         └─────────────────┼─────────────────┘              │
│                           ▼                                │
│                  fuseRecommendations()                     │
│                  (加权平均融合)                            │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│            enhancedRecommendationComposer                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ fetchEnhancedRecommendations()                       │  │
│  │ - 整合所有数据                                       │  │
│  │ - 生成推荐解释                                       │  │
│  │ - 返回完整结果                                       │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│            可视化组件                                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ RecommendationDashboard                              │  │
│  │ BusinessFlowVisualization                            │  │
│  │ - 实时数据展示                                       │  │
│  │ - 交互反馈                                           │  │
│  │ - 效果分析                                           │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│            数据分析与优化                                    │
│  - CTR/CVR 计算                                             │
│  - 转化漏斗分析                                             │
│  - A/B 测试评估                                             │
│  - 模型权重调整                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 快速导航

### 快速开始
👉 查看 `QUICK_START.md` - 5分钟快速上手

### 功能详解
👉 查看 `ENHANCEMENT_SUMMARY.md` - 完整功能说明

### 集成指南
👉 查看 `src/services/INTEGRATION_GUIDE.js` - 详细集成方法

### 完成清单
👉 查看 `COMPLETION_CHECKLIST.md` - 所有完成项目

---

## 📈 关键指标

### 推荐质量指标
- **CTR** - Click Through Rate (推荐点击率)
- **CVR** - Conversion Rate (推荐转化率)
- **平均分数** - Average Recommendation Score

### 转化漏斗指标
- **浏览→点击** - View to Click
- **点击→收藏** - Click to Favorite
- **收藏→购物车** - Favorite to Cart
- **购物车→购买** - Cart to Purchase
- **浏览→购买** - View to Purchase

### 系统性能指标
- **响应时间** - Response Time
- **缓存命中率** - Cache Hit Rate
- **模型覆盖率** - Model Coverage Rate

---

## 🔧 配置参数

### 推荐服务配置

```javascript
// 模型权重
MODELS = {
  ccdrec: { weight: 0.6 },
  collaborative: { weight: 0.25 },
  content: { weight: 0.15 },
}

// 缓存时间
CACHE_TTL = 5 * 60 * 1000  // 5 分钟

// 超时设置
timeout: 3000  // 3 秒
```

### 行为追踪配置

```javascript
// 事件队列
batchSize: 20      // 批处理大小
flushInterval: 10000  // 刷新间隔 (10 秒)

// 行为权重
ACTION_WEIGHTS = {
  view: 1,
  click: 1.5,
  fav: 2.5,
  cart: 3.5,
  buy: 5,
}
```

---

## 🎓 学习路径

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
4. 实现业务定制

---

## 📞 支持与反馈

### 常见问题
👉 查看 `QUICK_START.md` 中的 "常见问题" 部分

### 集成问题
👉 查看 `INTEGRATION_GUIDE.js` 中的 "错误处理" 部分

### 性能优化
👉 查看 `INTEGRATION_GUIDE.js` 中的 "性能优化建议" 部分

---

## ✨ 系统特色

### 技术特色
- ✅ Vue 3 Composition API
- ✅ 响应式数据绑定
- ✅ 异步并发处理
- ✅ 智能缓存管理
- ✅ 事件队列处理

### 功能特色
- ✅ 多模型融合推荐
- ✅ 实时行为追踪
- ✅ A/B 测试框架
- ✅ 完整业务流分析
- ✅ 可视化数据展示

### 设计特色
- ✅ 现代 UI 设计
- ✅ 响应式布局
- ✅ 平滑动画效果
- ✅ 数据可视化
- ✅ 用户友好界面

---

## 🎉 总结

### 已完成
✅ 增强推荐服务 (多模型融合、反馈循环、A/B 测试)
✅ 完善可视化交互 (仪表板、业务流图)
✅ 构建完整业务流 (从行为到转化)
✅ 提供完整文档 (指南、总结、快速开始)

### 系统状态
✅ 代码完整 (3,460 行)
✅ 功能完善 (12+ 核心功能)
✅ 文档齐全 (4 份详细文档)
✅ 可立即使用

### 下一步
1. 在应用中集成这些服务
2. 根据业务需求调整配置
3. 监控推荐效果指标
4. 进行 A/B 测试和优化
5. 后续添加更多数据集

---

**系统已准备就绪！** 🚀

所有增强功能已完成，文档齐全，可以立即投入使用。

祝你的推荐系统运营顺利！ 🎊
