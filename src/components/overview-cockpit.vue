<template>
  <div class="dashboard-page p-16px">
    <el-card shadow="never" class="dashboard-header-card">
      <div class="dashboard-header">
        <div>
          <h2 class="dashboard-title">首页总览驾驶舱</h2>
          <p class="dashboard-subtitle">聚焦核心指标、趋势变化与异常预警</p>
        </div>
        <el-radio-group v-model="period" size="default" class="period-switch">
          <el-radio-button label="today">今日</el-radio-button>
          <el-radio-button label="week">近7日</el-radio-button>
          <el-radio-button label="month">近30日</el-radio-button>
        </el-radio-group>
      </div>
    </el-card>

    <div class="metrics-grid">
      <el-card
        v-for="metric in currentData.metrics"
        :key="metric.key"
        shadow="hover"
        class="metric-card"
      >
        <div class="metric-label">{{ metric.label }}</div>
        <div class="metric-value">{{ formatMetricValue(metric) }}</div>
        <div
          class="metric-trend"
          :class="metric.trendDirection === 'up' ? 'trend-up' : 'trend-down'"
        >
          {{ metric.trendDirection === "up" ? "↑" : "↓" }} {{ metric.trend }}
        </div>
      </el-card>
    </div>

    <div class="charts-grid">
      <el-card shadow="never" class="panel-card">
        <template #header>
          <div class="panel-title">用户趋势</div>
        </template>
        <div ref="userTrendRef" class="chart-box"></div>
      </el-card>

      <el-card shadow="never" class="panel-card">
        <template #header>
          <div class="panel-title">商品热度趋势</div>
        </template>
        <div ref="productTrendRef" class="chart-box"></div>
      </el-card>

      <el-card shadow="never" class="panel-card funnel-panel">
        <template #header>
          <div class="panel-title">转化漏斗</div>
        </template>
        <div ref="funnelRef" class="chart-box funnel-chart"></div>
        <div class="funnel-list">
          <div
            v-for="item in currentData.funnel"
            :key="item.stage"
            class="funnel-item"
          >
            <span>{{ item.stage }}</span>
            <span class="funnel-item-rate">{{ item.rateFromPrev }}</span>
          </div>
        </div>
      </el-card>
    </div>

    <div class="bottom-grid">
      <el-card shadow="never" class="panel-card">
        <template #header>
          <div class="panel-title">异常预警</div>
        </template>
        <div class="list-wrap">
          <div v-for="alert in currentData.alerts" :key="alert.id" class="list-item">
            <div class="list-main">
              <div class="list-title">{{ alert.title }}</div>
              <div class="list-detail">{{ alert.detail }}</div>
            </div>
            <div class="list-meta">
              <el-tag :type="alertLevelTypeMap[alert.level]" size="small">
                {{ alertLevelTextMap[alert.level] }}
              </el-tag>
              <el-tag size="small" effect="plain">
                {{ alertStatusTextMap[alert.status] }}
              </el-tag>
              <span class="list-time">{{ alert.timestamp }}</span>
            </div>
          </div>
        </div>
      </el-card>

      <el-card shadow="never" class="panel-card">
        <template #header>
          <div class="panel-title">待处理事项</div>
        </template>
        <div class="list-wrap">
          <div v-for="todo in currentData.todos" :key="todo.id" class="list-item">
            <div class="list-main">
              <div class="list-title">{{ todo.title }}</div>
              <div class="list-detail">{{ todo.owner }} · {{ todo.deadline }}</div>
            </div>
            <div class="list-meta">
              <el-tag :type="todo.priority === 'high' ? 'danger' : todo.priority === 'medium' ? 'warning' : 'info'" size="small">
                {{ priorityTextMap[todo.priority] }}
              </el-tag>
              <el-tag size="small" effect="plain">
                {{ todoStatusTextMap[todo.status] }}
              </el-tag>
            </div>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import * as echarts from "echarts";

/**
 * @typedef {{ key: string, label: string, value: number, unit: string, trend: string, trendDirection: 'up'|'down' }} DashboardMetric
 * @typedef {{ date: string, dau: number, pv: number, ctr: number, addToCartRate: number, orderRate: number, payRate: number, gmv: number, productHeat: number, recEffect: number }} TrendPoint
 * @typedef {{ stage: string, count: number, rateFromPrev: string }} FunnelItem
 * @typedef {{ id: string, type: string, level: 'high'|'medium'|'low', title: string, detail: string, timestamp: string, status: 'new'|'processing'|'resolved' }} AlertItem
 * @typedef {{ id: string, title: string, owner: string, deadline: string, priority: 'high'|'medium'|'low', status: 'pending'|'processing'|'done' }} TodoItem
 */

defineOptions({
  name: "OverviewCockpit",
});

const period = ref("today");

const alertLevelTypeMap = {
  high: "danger",
  medium: "warning",
  low: "info",
};

const alertLevelTextMap = {
  high: "高",
  medium: "中",
  low: "低",
};

const alertStatusTextMap = {
  new: "待处理",
  processing: "处理中",
  resolved: "已恢复",
};

const priorityTextMap = {
  high: "高优先级",
  medium: "中优先级",
  low: "低优先级",
};

const todoStatusTextMap = {
  pending: "待办",
  processing: "进行中",
  done: "已完成",
};

const dashboardMock = {
  today: {
    metrics: [
      { key: "dau", label: "DAU", value: 12840, unit: "number", trend: "5.4%", trendDirection: "up" },
      { key: "pv", label: "PV", value: 265430, unit: "number", trend: "3.2%", trendDirection: "up" },
      { key: "ctr", label: "CTR", value: 12.7, unit: "percent", trend: "0.8%", trendDirection: "down" },
      { key: "addToCartRate", label: "加购率", value: 7.3, unit: "percent", trend: "1.1%", trendDirection: "up" },
      { key: "orderRate", label: "下单率", value: 4.1, unit: "percent", trend: "0.5%", trendDirection: "down" },
      { key: "payRate", label: "支付转化率", value: 2.9, unit: "percent", trend: "0.4%", trendDirection: "up" },
      { key: "gmv", label: "GMV", value: 483200, unit: "currency", trend: "6.6%", trendDirection: "up" },
    ],
    trends: [
      { date: "10:00", dau: 5120, pv: 32340, ctr: 11.1, addToCartRate: 6.4, orderRate: 3.5, payRate: 2.2, gmv: 85320, productHeat: 60, recEffect: 72 },
      { date: "12:00", dau: 6940, pv: 52430, ctr: 12.5, addToCartRate: 7.1, orderRate: 3.9, payRate: 2.5, gmv: 128300, productHeat: 68, recEffect: 74 },
      { date: "14:00", dau: 8230, pv: 70210, ctr: 13.2, addToCartRate: 7.5, orderRate: 4.2, payRate: 2.8, gmv: 182650, productHeat: 72, recEffect: 79 },
      { date: "16:00", dau: 9680, pv: 96320, ctr: 12.1, addToCartRate: 7.2, orderRate: 4.0, payRate: 2.7, gmv: 256430, productHeat: 78, recEffect: 76 },
      { date: "18:00", dau: 11020, pv: 152400, ctr: 12.8, addToCartRate: 7.8, orderRate: 4.3, payRate: 3.0, gmv: 358420, productHeat: 82, recEffect: 81 },
      { date: "20:00", dau: 12100, pv: 214320, ctr: 13.0, addToCartRate: 8.0, orderRate: 4.4, payRate: 3.1, gmv: 431700, productHeat: 86, recEffect: 83 },
      { date: "22:00", dau: 12840, pv: 265430, ctr: 12.7, addToCartRate: 7.3, orderRate: 4.1, payRate: 2.9, gmv: 483200, productHeat: 80, recEffect: 77 },
    ],
    funnel: [
      { stage: "浏览", count: 265430, rateFromPrev: "100%" },
      { stage: "点击", count: 33710, rateFromPrev: "12.7%" },
      { stage: "加购", count: 19420, rateFromPrev: "57.6%" },
      { stage: "下单", count: 10880, rateFromPrev: "56.0%" },
      { stage: "支付", count: 7690, rateFromPrev: "70.7%" },
    ],
    alerts: [
      { id: "a1", type: "conversion", level: "high", title: "转化下降", detail: "支付转化率较昨日下降 0.9%", timestamp: "10:25", status: "new" },
      { id: "a2", type: "channel", level: "medium", title: "某渠道流量异常", detail: "渠道A流量环比上升 65%，疑似异常投放", timestamp: "09:42", status: "processing" },
      { id: "a3", type: "recommend", level: "high", title: "某推荐位 CTR 异常", detail: "首页猜你喜欢 CTR 下降至 7.9%", timestamp: "08:57", status: "new" },
    ],
    todos: [
      { id: "t1", title: "排查推荐位素材质量", owner: "运营-陈敏", deadline: "今天 14:00", priority: "high", status: "processing" },
      { id: "t2", title: "复核渠道A投放策略", owner: "投放-王杰", deadline: "今天 17:30", priority: "high", status: "pending" },
      { id: "t3", title: "转化漏斗复盘报告", owner: "数据-李婷", deadline: "明天 10:00", priority: "medium", status: "pending" },
    ],
  },
  week: {
    metrics: [
      { key: "dau", label: "DAU", value: 96420, unit: "number", trend: "7.9%", trendDirection: "up" },
      { key: "pv", label: "PV", value: 1886430, unit: "number", trend: "6.1%", trendDirection: "up" },
      { key: "ctr", label: "CTR", value: 12.4, unit: "percent", trend: "0.6%", trendDirection: "up" },
      { key: "addToCartRate", label: "加购率", value: 7.1, unit: "percent", trend: "0.2%", trendDirection: "down" },
      { key: "orderRate", label: "下单率", value: 4.0, unit: "percent", trend: "0.3%", trendDirection: "up" },
      { key: "payRate", label: "支付转化率", value: 2.8, unit: "percent", trend: "0.1%", trendDirection: "up" },
      { key: "gmv", label: "GMV", value: 3528000, unit: "currency", trend: "8.4%", trendDirection: "up" },
    ],
    trends: [
      { date: "周一", dau: 12840, pv: 265430, ctr: 12.7, addToCartRate: 7.3, orderRate: 4.1, payRate: 2.9, gmv: 483200, productHeat: 80, recEffect: 77 },
      { date: "周二", dau: 13220, pv: 271500, ctr: 12.9, addToCartRate: 7.2, orderRate: 4.0, payRate: 2.8, gmv: 496400, productHeat: 81, recEffect: 78 },
      { date: "周三", dau: 13690, pv: 280300, ctr: 12.3, addToCartRate: 7.0, orderRate: 3.9, payRate: 2.7, gmv: 503200, productHeat: 79, recEffect: 75 },
      { date: "周四", dau: 14120, pv: 294100, ctr: 12.5, addToCartRate: 7.2, orderRate: 4.1, payRate: 2.8, gmv: 525400, productHeat: 83, recEffect: 79 },
      { date: "周五", dau: 14780, pv: 312650, ctr: 12.6, addToCartRate: 7.4, orderRate: 4.2, payRate: 2.9, gmv: 581300, productHeat: 85, recEffect: 82 },
      { date: "周六", dau: 15120, pv: 326200, ctr: 12.2, addToCartRate: 6.9, orderRate: 3.8, payRate: 2.6, gmv: 467800, productHeat: 76, recEffect: 74 },
      { date: "周日", dau: 12650, pv: 236250, ctr: 12.8, addToCartRate: 7.5, orderRate: 4.0, payRate: 2.8, gmv: 470700, productHeat: 78, recEffect: 80 },
    ],
    funnel: [
      { stage: "浏览", count: 1886430, rateFromPrev: "100%" },
      { stage: "点击", count: 233920, rateFromPrev: "12.4%" },
      { stage: "加购", count: 133940, rateFromPrev: "57.3%" },
      { stage: "下单", count: 75400, rateFromPrev: "56.3%" },
      { stage: "支付", count: 52800, rateFromPrev: "70.0%" },
    ],
    alerts: [
      { id: "wa1", type: "conversion", level: "medium", title: "转化下降", detail: "周三支付转化率低于周均值 0.4%", timestamp: "周三 21:30", status: "resolved" },
      { id: "wa2", type: "channel", level: "high", title: "某渠道流量异常", detail: "渠道B在周五出现短时峰值", timestamp: "周五 16:12", status: "processing" },
      { id: "wa3", type: "recommend", level: "medium", title: "某推荐位 CTR 异常", detail: "新品推荐位 CTR 连续两天下滑", timestamp: "周六 10:03", status: "new" },
    ],
    todos: [
      { id: "wt1", title: "完成本周渠道异常归因", owner: "增长-周航", deadline: "今天 18:00", priority: "high", status: "processing" },
      { id: "wt2", title: "优化推荐位排序策略", owner: "算法-赵青", deadline: "明天 12:00", priority: "medium", status: "pending" },
      { id: "wt3", title: "同步周报到管理层", owner: "数据-李婷", deadline: "明天 16:00", priority: "low", status: "pending" },
    ],
  },
  month: {
    metrics: [
      { key: "dau", label: "DAU", value: 428900, unit: "number", trend: "11.2%", trendDirection: "up" },
      { key: "pv", label: "PV", value: 8403600, unit: "number", trend: "9.5%", trendDirection: "up" },
      { key: "ctr", label: "CTR", value: 12.1, unit: "percent", trend: "0.4%", trendDirection: "up" },
      { key: "addToCartRate", label: "加购率", value: 6.9, unit: "percent", trend: "0.7%", trendDirection: "up" },
      { key: "orderRate", label: "下单率", value: 3.8, unit: "percent", trend: "0.2%", trendDirection: "up" },
      { key: "payRate", label: "支付转化率", value: 2.6, unit: "percent", trend: "0.1%", trendDirection: "down" },
      { key: "gmv", label: "GMV", value: 15700000, unit: "currency", trend: "13.6%", trendDirection: "up" },
    ],
    trends: [
      { date: "第1周", dau: 96800, pv: 1843000, ctr: 11.8, addToCartRate: 6.7, orderRate: 3.6, payRate: 2.5, gmv: 3240000, productHeat: 72, recEffect: 73 },
      { date: "第2周", dau: 102500, pv: 1984500, ctr: 12.0, addToCartRate: 6.8, orderRate: 3.7, payRate: 2.6, gmv: 3580000, productHeat: 75, recEffect: 76 },
      { date: "第3周", dau: 108200, pv: 2131000, ctr: 12.3, addToCartRate: 7.0, orderRate: 3.9, payRate: 2.7, gmv: 4012000, productHeat: 79, recEffect: 80 },
      { date: "第4周", dau: 121400, pv: 2445100, ctr: 12.2, addToCartRate: 7.1, orderRate: 4.0, payRate: 2.6, gmv: 4868000, productHeat: 83, recEffect: 82 },
    ],
    funnel: [
      { stage: "浏览", count: 8403600, rateFromPrev: "100%" },
      { stage: "点击", count: 1016846, rateFromPrev: "12.1%" },
      { stage: "加购", count: 579600, rateFromPrev: "57.0%" },
      { stage: "下单", count: 319000, rateFromPrev: "55.0%" },
      { stage: "支付", count: 218600, rateFromPrev: "68.5%" },
    ],
    alerts: [
      { id: "ma1", type: "conversion", level: "high", title: "转化下降", detail: "月末支付转化率出现持续回落", timestamp: "03-20 19:15", status: "processing" },
      { id: "ma2", type: "channel", level: "medium", title: "某渠道流量异常", detail: "新渠道导流质量偏低，跳失率偏高", timestamp: "03-18 11:26", status: "new" },
      { id: "ma3", type: "recommend", level: "low", title: "某推荐位 CTR 异常", detail: "活动推荐位 CTR 波动较大", timestamp: "03-16 09:20", status: "resolved" },
    ],
    todos: [
      { id: "mt1", title: "月度转化治理专项会", owner: "产品-孙颖", deadline: "03-24 10:00", priority: "high", status: "pending" },
      { id: "mt2", title: "渠道质量评分模型调优", owner: "算法-赵青", deadline: "03-26 17:00", priority: "medium", status: "processing" },
      { id: "mt3", title: "复盘推荐位实验结果", owner: "运营-陈敏", deadline: "03-27 15:30", priority: "low", status: "pending" },
    ],
  },
};

const currentData = computed(() => useDashboardData(period.value));

const userTrendRef = ref(null);
const productTrendRef = ref(null);
const funnelRef = ref(null);

let userTrendChart;
let productTrendChart;
let funnelChart;

const useDashboardData = (selectedPeriod) => {
  return dashboardMock[selectedPeriod] ?? dashboardMock.today;
};

const formatMetricValue = (metric) => {
  if (metric.unit === "percent") {
    return `${metric.value}%`;
  }
  if (metric.unit === "currency") {
    return `￥${Number(metric.value).toLocaleString("zh-CN")}`;
  }
  return Number(metric.value).toLocaleString("zh-CN");
};

const setUserTrendOption = () => {
  const source = currentData.value.trends;
  userTrendChart?.setOption({
    tooltip: {
      trigger: "axis",
      valueFormatter: (value) => Number(value).toLocaleString("zh-CN"),
    },
    grid: { left: 48, right: 56, top: 20, bottom: 28 },
    legend: { top: 0, textStyle: { color: "#4b5563" } },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: source.map((item) => item.date),
      axisLine: { lineStyle: { color: "#d9e2f2" } },
    },
    yAxis: [
      {
        type: "value",
        name: "DAU",
        position: "left",
        axisLine: { show: false },
        axisLabel: {
          formatter: (value) => Number(value).toLocaleString("zh-CN"),
        },
        splitLine: { lineStyle: { color: "#eef2f8" } },
      },
      {
        type: "value",
        name: "PV",
        position: "right",
        axisLine: { show: false },
        axisLabel: {
          formatter: (value) => Number(value).toLocaleString("zh-CN"),
        },
        splitLine: { show: false },
      },
    ],
    series: [
      {
        name: "DAU",
        type: "line",
        smooth: true,
        showSymbol: false,
        lineStyle: { width: 2, color: "#2563eb" },
        areaStyle: { color: "rgba(37,99,235,0.12)" },
        data: source.map((item) => item.dau),
      },
      {
        name: "PV",
        type: "line",
        yAxisIndex: 1,
        smooth: true,
        showSymbol: false,
        lineStyle: { width: 2, color: "#0ea5e9" },
        data: source.map((item) => item.pv),
      },
    ],
  });
};

const setProductTrendOption = () => {
  const source = currentData.value.trends;
  productTrendChart?.setOption({
    tooltip: { trigger: "axis" },
    grid: { left: 40, right: 24, top: 20, bottom: 28 },
    legend: { top: 0, textStyle: { color: "#4b5563" } },
    xAxis: {
      type: "category",
      data: source.map((item) => item.date),
      axisLine: { lineStyle: { color: "#d9e2f2" } },
    },
    yAxis: [
      {
        type: "value",
        name: "热度",
        splitLine: { lineStyle: { color: "#eef2f8" } },
      },
      {
        type: "value",
        name: "效果",
        splitLine: { show: false },
      },
    ],
    series: [
      {
        name: "商品热度",
        type: "bar",
        barWidth: 18,
        itemStyle: { color: "#60a5fa", borderRadius: [4, 4, 0, 0] },
        data: source.map((item) => item.productHeat),
      },
      {
        name: "推荐效果",
        type: "line",
        yAxisIndex: 1,
        smooth: true,
        showSymbol: false,
        lineStyle: { width: 2, color: "#f59e0b" },
        data: source.map((item) => item.recEffect),
      },
    ],
  });
};

const setFunnelOption = () => {
  const source = currentData.value.funnel;
  const colors = ["#2563eb", "#3b82f6", "#60a5fa", "#93c5fd", "#bfdbfe"];
  funnelChart?.setOption({
    tooltip: {
      trigger: "item",
      formatter: (params) => `${params.name}: ${Number(params.value).toLocaleString("zh-CN")}`,
    },
    series: [
      {
        type: "funnel",
        left: "10%",
        top: 10,
        bottom: 10,
        width: "80%",
        sort: "descending",
        gap: 4,
        label: {
          show: true,
          position: "inside",
          color: "#fff",
          formatter: ({ name, value }) => `${name}\n${Number(value).toLocaleString("zh-CN")}`,
        },
        itemStyle: {
          borderColor: "#fff",
          borderWidth: 1,
        },
        data: source.map((item, index) => ({
          name: item.stage,
          value: item.count,
          itemStyle: { color: colors[index] },
        })),
      },
    ],
  });
};

const renderCharts = () => {
  setUserTrendOption();
  setProductTrendOption();
  setFunnelOption();
};

const resizeCharts = () => {
  userTrendChart?.resize();
  productTrendChart?.resize();
  funnelChart?.resize();
};

onMounted(async () => {
  await nextTick();
  if (userTrendRef.value) {
    userTrendChart = echarts.init(userTrendRef.value);
  }
  if (productTrendRef.value) {
    productTrendChart = echarts.init(productTrendRef.value);
  }
  if (funnelRef.value) {
    funnelChart = echarts.init(funnelRef.value);
  }
  renderCharts();
  window.addEventListener("resize", resizeCharts);
});

watch(
  () => period.value,
  async () => {
    await nextTick();
    renderCharts();
  }
);

onBeforeUnmount(() => {
  window.removeEventListener("resize", resizeCharts);
  userTrendChart?.dispose();
  productTrendChart?.dispose();
  funnelChart?.dispose();
});
</script>

<style scoped>
.dashboard-page {
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 4px;
  animation: fade-up 0.28s ease;
}

.dashboard-header-card,
.metric-card,
.panel-card {
  border-radius: var(--radius-main);
  border: 1px solid var(--border-soft);
  background: var(--bg-glass);
  box-shadow: var(--shadow-soft);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.dashboard-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  flex-wrap: wrap;
}

.dashboard-title {
  margin: 0;
  font-size: 24px;
  line-height: 32px;
  color: var(--text-primary);
}

.dashboard-subtitle {
  margin: 6px 0 0;
  font-size: 13px;
  color: var(--text-secondary);
}

.period-switch {
  flex-shrink: 0;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  gap: 14px;
}

.metric-card {
  transition: transform var(--motion-base) ease, box-shadow var(--motion-base) ease;
}

.metric-label {
  font-size: 12px;
  color: var(--text-secondary);
  letter-spacing: 0.04em;
}

.metric-value {
  margin-top: 10px;
  font-size: 30px;
  font-weight: 700;
  line-height: 1.1;
  color: var(--text-primary);
}

.metric-trend {
  margin-top: 8px;
  font-size: 12px;
  font-weight: 700;
}

.trend-up {
  color: var(--accent-success);
}

.trend-down {
  color: var(--accent-danger);
}

.charts-grid {
  display: grid;
  grid-template-columns: 1.2fr 1.2fr 1fr;
  gap: 14px;
}

.bottom-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.panel-title {
  font-weight: 700;
  color: var(--text-primary);
  font-size: 15px;
}

.chart-box {
  width: 100%;
  height: 290px;
}

.funnel-panel .chart-box {
  height: 220px;
}

.funnel-list {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.funnel-item {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--text-secondary);
  background: rgba(255, 255, 255, 0.76);
  border-radius: 12px;
  border: 1px solid var(--border-soft);
  padding: 7px 10px;
}

.funnel-item-rate {
  color: var(--accent-blue);
  font-weight: 700;
}

.list-wrap {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.list-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-sub);
  padding: 12px;
  background: rgba(255, 255, 255, 0.66);
  transition: transform var(--motion-base) ease;
}

.list-item:hover {
  transform: translateY(-2px);
}

.list-main {
  min-width: 0;
}

.list-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-primary);
}

.list-detail {
  margin-top: 4px;
  color: var(--text-secondary);
  font-size: 12px;
}

.list-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.list-time {
  font-size: 12px;
  color: #94a3b8;
}

@keyframes fade-up {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 1200px) {
  .charts-grid {
    grid-template-columns: 1fr;
  }

  .bottom-grid {
    grid-template-columns: 1fr;
  }
}
</style>


