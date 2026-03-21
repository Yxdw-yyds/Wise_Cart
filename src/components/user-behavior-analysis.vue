<template>
  <div class="behavior-page">
    <el-card shadow="never" class="behavior-header">
      <div class="header-row">
        <div>
          <h2 class="title">用户行为分析</h2>
          <p class="subtitle">覆盖画像、路径、漏斗、留存复购与搜索行为的核心分析视图</p>
        </div>
        <el-radio-group v-model="period" size="default">
          <el-radio-button label="today">今日</el-radio-button>
          <el-radio-button label="week">近7日</el-radio-button>
          <el-radio-button label="month">近30日</el-radio-button>
        </el-radio-group>
      </div>
    </el-card>

    <div class="insight-strip">
      <div class="insight-card">
        <span>核心人群</span>
        <strong>25-34岁 · 36%</strong>
        <em>高活跃 + 高复购</em>
      </div>
      <div class="insight-card">
        <span>关键流失节点</span>
        <strong>详情 → 加购</strong>
        <em>流失率 43.4%</em>
      </div>
      <div class="insight-card">
        <span>留存表现</span>
        <strong>7日留存 29%</strong>
        <em>连续4周提升</em>
      </div>
      <div class="insight-card">
        <span>搜索机会词</span>
        <strong>低糖苏打</strong>
        <em>高需求零结果</em>
      </div>
    </div>

    <el-card shadow="never">
      <el-tabs v-model="activeTab" class="analysis-tabs">
        <el-tab-pane label="用户画像" name="portrait">
          <div class="grid two">
            <el-card shadow="never" class="panel"><template #header>用户基础属性分布</template><div ref="attrChartRef" class="chart" /></el-card>
            <el-card shadow="never" class="panel"><template #header>活跃时段分析</template><div ref="activeChartRef" class="chart" /></el-card>
            <el-card shadow="never" class="panel"><template #header>地域分布</template><div ref="regionChartRef" class="chart" /></el-card>
            <el-card shadow="never" class="panel"><template #header>设备分布</template><div ref="deviceChartRef" class="chart" /></el-card>
            <el-card shadow="never" class="panel wide"><template #header>偏好类目分布</template><div ref="categoryChartRef" class="chart" /></el-card>
            
          <el-card shadow="never" class="panel wide">
              <template #header>用户标签云</template>
              
            <div class="tag-cloud">
                <span v-for="item in currentPortrait.tags" :key="item.name" class="tag-item" :style="tagStyle(item.weight)">{{ item.name }}</span>
              </div></el-card></div>
        </el-tab-pane>

        <el-tab-pane label="用户路径分析" name="path">
          <div class="grid one">
            <el-card shadow="never" class="panel"><template #header>用户流转 Sankey 图</template><div ref="sankeyRef" class="chart large" /></el-card>
            <el-card shadow="never" class="panel">
              <template #header>关键流失节点</template>
              <el-table :data="currentPath.lossNodes" border>
                <el-table-column prop="node" label="节点" />
                <el-table-column prop="lossRate" label="流失率" />
                <el-table-column prop="impact" label="影响用户数" />
                <el-table-column prop="action" label="建议动作" />
              </el-table>
            </el-card>
          </div>
        </el-tab-pane>

        <el-tab-pane label="漏斗分析" name="funnel">
          <div class="filters glass-filter">
            <el-select v-model="funnelFilter.channel" placeholder="渠道" style="width: 150px">
              <el-option label="全部渠道" value="all" />
              <el-option label="APP" value="app" />
              <el-option label="小程序" value="mini" />
              <el-option label="H5" value="h5" />
            </el-select>
            <el-select v-model="funnelFilter.category" placeholder="类目" style="width: 150px">
              <el-option label="全部类目" value="all" />
              <el-option label="生鲜" value="fresh" />
              <el-option label="酒水" value="drink" />
              <el-option label="日化" value="daily" />
            </el-select>
            <el-select v-model="funnelFilter.campaign" placeholder="活动" style="width: 150px">
              <el-option label="全部活动" value="all" />
              <el-option label="春季促销" value="spring" />
              <el-option label="会员日" value="vip" />
            </el-select>
            <el-select v-model="funnelFilter.crowd" placeholder="人群" style="width: 150px">
              <el-option label="全部人群" value="all" />
              <el-option label="新客" value="new" />
              <el-option label="老客" value="old" />
              <el-option label="会员" value="member" />
            </el-select>
          </div>
          <div class="grid two">
            <el-card shadow="never" class="panel"><template #header>漏斗转化</template><div ref="funnelRef" class="chart large" /></el-card>
            <el-card shadow="never" class="panel">
              <template #header>阶段转化概览</template>
              <div class="metric-list">
                <div v-for="item in currentFunnel.stages" :key="item.stage" class="metric-row">
                  <span>{{ item.stage }}</span>
                  <span>{{ item.value.toLocaleString('zh-CN') }}</span>
                  <span>{{ item.rate }}</span>
                </div>
              </div>
            </el-card>
          </div>
        </el-tab-pane>

        <el-tab-pane label="留存与复购分析" name="retention">
          <div class="grid two">
            <el-card shadow="never" class="panel"><template #header>次日/7日/30日留存</template><div ref="retentionRef" class="chart" /></el-card>
            <el-card shadow="never" class="panel"><template #header>会员等级复购对比</template><div ref="repurchaseRef" class="chart" /></el-card>
            <el-card shadow="never" class="panel wide"><template #header>渠道用户生命周期价值（LTV）</template><div ref="ltvRef" class="chart" /></el-card>
          </div>
          <el-card shadow="never" class="panel mt12">
            <template #header>新客复购率</template>
            <div class="new-user-box">当前新客复购率：<b>{{ currentRetention.newUserRepurchase }}</b></div>
          </el-card>
        </el-tab-pane>

        <el-tab-pane label="搜索行为分析" name="search">
          <div class="grid two">
            <el-card shadow="never" class="panel">
              <template #header>热搜词</template>
              <el-table :data="currentSearch.hotWords" border>
                <el-table-column prop="word" label="关键词" />
                <el-table-column prop="searches" label="搜索量" />
              </el-table>
            </el-card>
            <el-card shadow="never" class="panel">
              <template #header>零结果搜索词</template>
              <el-table :data="currentSearch.zeroResultWords" border>
                <el-table-column prop="word" label="关键词" />
                <el-table-column prop="searches" label="搜索量" />
              </el-table>
            </el-card>
            <el-card shadow="never" class="panel">
              <template #header>高曝光低点击词</template>
              <el-table :data="currentSearch.highExpoLowClick" border>
                <el-table-column prop="word" label="关键词" />
                <el-table-column prop="expo" label="曝光" />
                <el-table-column prop="ctr" label="CTR" />
              </el-table>
            </el-card>
            <el-card shadow="never" class="panel">
              <template #header>高点击低转化词</template>
              <el-table :data="currentSearch.highClickLowConv" border>
                <el-table-column prop="word" label="关键词" />
                <el-table-column prop="clicks" label="点击" />
                <el-table-column prop="conv" label="转化率" />
              </el-table>
            </el-card>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import * as echarts from "echarts";

defineOptions({ name: "UserBehaviorAnalysis" });

const period = ref("today");
const activeTab = ref("portrait");
const funnelFilter = ref({ channel: "all", category: "all", campaign: "all", crowd: "all" });

const dataMap = {
  today: {
    portrait: {
      attributes: [
        { name: "18-24", value: 18 },
        { name: "25-34", value: 36 },
        { name: "35-44", value: 27 },
        { name: "45+", value: 19 },
      ],
      activeHours: [12, 18, 28, 36, 40, 32, 22, 18],
      hourAxis: ["8", "10", "12", "14", "16", "18", "20", "22"],
      regions: [
        { name: "华东", value: 32 },
        { name: "华南", value: 22 },
        { name: "华北", value: 19 },
        { name: "西南", value: 15 },
        { name: "其他", value: 12 },
      ],
      devices: [
        { name: "iOS", value: 44 },
        { name: "Android", value: 48 },
        { name: "H5", value: 8 },
      ],
      categories: [
        { name: "生鲜", value: 88 },
        { name: "酒水", value: 76 },
        { name: "日化", value: 65 },
        { name: "零食", value: 61 },
        { name: "母婴", value: 44 },
      ],
      tags: [
        { name: "高活跃", weight: 28 }, { name: "价格敏感", weight: 22 }, { name: "会员", weight: 18 },
        { name: "夜间消费", weight: 15 }, { name: "偏好酒水", weight: 17 }, { name: "新客", weight: 14 },
        { name: "复购高", weight: 20 }, { name: "促销响应", weight: 19 }, { name: "高客单", weight: 16 },
      ],
    },
    path: {
      nodes: ["首页", "搜索", "商品详情", "加购", "下单", "支付"],
      links: [
        ["首页", "搜索", 12000], ["首页", "商品详情", 8400], ["搜索", "商品详情", 7600],
        ["商品详情", "加购", 4300], ["加购", "下单", 2600], ["下单", "支付", 1880],
      ],
      lossNodes: [
        { node: "商品详情→加购", lossRate: "43.4%", impact: "3300", action: "优化详情页卖点与价格锚点" },
        { node: "加购→下单", lossRate: "39.5%", impact: "1700", action: "简化结算流程并增加优惠提醒" },
      ],
    },
    funnel: {
      all_all_all_all: [
        { stage: "曝光", value: 280000, rate: "100%" },
        { stage: "点击", value: 35600, rate: "12.7%" },
        { stage: "收藏", value: 12100, rate: "34.0%" },
        { stage: "加购", value: 9400, rate: "77.7%" },
        { stage: "下单", value: 5200, rate: "55.3%" },
        { stage: "支付", value: 3790, rate: "72.9%" },
      ],
      app_all_all_all: [
        { stage: "曝光", value: 160000, rate: "100%" },
        { stage: "点击", value: 23000, rate: "14.4%" },
        { stage: "收藏", value: 8600, rate: "37.4%" },
        { stage: "加购", value: 7000, rate: "81.4%" },
        { stage: "下单", value: 4100, rate: "58.6%" },
        { stage: "支付", value: 3130, rate: "76.3%" },
      ],
    },
    retention: {
      x: ["W1", "W2", "W3", "W4"],
      d1: [41, 43, 42, 44],
      d7: [26, 27, 28, 29],
      d30: [15, 16, 16, 17],
      repurchaseByLevel: [
        { level: "普通", value: 18 }, { level: "银卡", value: 26 }, { level: "金卡", value: 34 }, { level: "黑金", value: 42 },
      ],
      ltvChannels: [
        { channel: "APP", value: 436 }, { channel: "小程序", value: 388 }, { channel: "H5", value: 260 },
      ],
      newUserRepurchase: "18.6%",
    },
    search: {
      hotWords: [
        { word: "草莓", searches: 12200 }, { word: "车厘子", searches: 10800 }, { word: "酸奶", searches: 9200 },
      ],
      zeroResultWords: [
        { word: "低糖苏打", searches: 420 }, { word: "进口蓝莓汁", searches: 310 },
      ],
      highExpoLowClick: [
        { word: "洗衣液", expo: 64000, ctr: "1.3%" }, { word: "抽纸", expo: 59000, ctr: "1.1%" },
      ],
      highClickLowConv: [
        { word: "牛排", clicks: 8300, conv: "2.2%" }, { word: "坚果礼盒", clicks: 7200, conv: "2.5%" },
      ],
    },
  },
};

dataMap.week = dataMap.today;
dataMap.month = dataMap.today;

const current = computed(() => dataMap[period.value] || dataMap.today);
const currentPortrait = computed(() => current.value.portrait);
const currentPath = computed(() => current.value.path);
const currentRetention = computed(() => current.value.retention);
const currentSearch = computed(() => current.value.search);

const currentFunnel = computed(() => {
  const key = `${funnelFilter.value.channel}_${funnelFilter.value.category}_${funnelFilter.value.campaign}_${funnelFilter.value.crowd}`;
  const allKey = "all_all_all_all";
  const stages = current.value.funnel[key] || current.value.funnel[`${funnelFilter.value.channel}_all_all_all`] || current.value.funnel[allKey];
  return { stages };
});

const attrChartRef = ref(null);
const activeChartRef = ref(null);
const regionChartRef = ref(null);
const deviceChartRef = ref(null);
const categoryChartRef = ref(null);
const sankeyRef = ref(null);
const funnelRef = ref(null);
const retentionRef = ref(null);
const repurchaseRef = ref(null);
const ltvRef = ref(null);

let attrChart;
let activeChart;
let regionChart;
let deviceChart;
let categoryChart;
let sankeyChart;
let funnelChart;
let retentionChart;
let repurchaseChart;
let ltvChart;

const initChart = (el) => (el ? echarts.init(el) : null);

const renderPortraitCharts = () => {
  attrChart?.setOption({ tooltip: { trigger: "item" }, series: [{ type: "pie", radius: ["42%", "68%"], data: currentPortrait.value.attributes }] });
  activeChart?.setOption({ tooltip: { trigger: "axis" }, xAxis: { type: "category", data: currentPortrait.value.hourAxis }, yAxis: { type: "value" }, series: [{ type: "line", smooth: true, data: currentPortrait.value.activeHours, areaStyle: { color: "rgba(59,130,246,.18)" } }] });
  regionChart?.setOption({ tooltip: { trigger: "axis" }, xAxis: { type: "value" }, yAxis: { type: "category", data: currentPortrait.value.regions.map((i) => i.name) }, series: [{ type: "bar", data: currentPortrait.value.regions.map((i) => i.value), itemStyle: { color: "#60a5fa" } }] });
  deviceChart?.setOption({ tooltip: { trigger: "item" }, series: [{ type: "pie", radius: "65%", data: currentPortrait.value.devices }] });
  categoryChart?.setOption({ tooltip: { trigger: "axis" }, xAxis: { type: "category", data: currentPortrait.value.categories.map((i) => i.name) }, yAxis: { type: "value" }, series: [{ type: "bar", barWidth: 26, data: currentPortrait.value.categories.map((i) => i.value), itemStyle: { color: "#3b82f6", borderRadius: [4, 4, 0, 0] } }] });
};

const renderPathCharts = () => {
  const nodes = currentPath.value.nodes.map((name) => ({ name }));
  const links = currentPath.value.links.map(([source, target, value]) => ({ source, target, value }));
  sankeyChart?.setOption({
    tooltip: { trigger: "item" },
    series: [{ type: "sankey", nodeAlign: "justify", emphasis: { focus: "adjacency" }, data: nodes, links, lineStyle: { color: "gradient", curveness: 0.5 } }],
  });
};

const renderFunnelCharts = () => {
  funnelChart?.setOption({
    tooltip: { trigger: "item" },
    series: [{
      type: "funnel",
      width: "75%",
      left: "12%",
      top: 20,
      bottom: 20,
      sort: "descending",
      gap: 3,
      label: { show: true, position: "inside", color: "#fff", formatter: ({ name, value }) => `${name}\n${value.toLocaleString('zh-CN')}` },
      data: currentFunnel.value.stages.map((i) => ({ name: i.stage, value: i.value })),
    }],
  });
};

const renderRetentionCharts = () => {
  retentionChart?.setOption({
    tooltip: { trigger: "axis" }, legend: {}, xAxis: { type: "category", data: currentRetention.value.x }, yAxis: { type: "value", axisLabel: { formatter: "{value}%" } },
    series: [
      { name: "次日留存", type: "line", smooth: true, data: currentRetention.value.d1 },
      { name: "7日留存", type: "line", smooth: true, data: currentRetention.value.d7 },
      { name: "30日留存", type: "line", smooth: true, data: currentRetention.value.d30 },
    ],
  });
  repurchaseChart?.setOption({ xAxis: { type: "category", data: currentRetention.value.repurchaseByLevel.map((i) => i.level) }, yAxis: { type: "value", axisLabel: { formatter: "{value}%" } }, series: [{ type: "bar", data: currentRetention.value.repurchaseByLevel.map((i) => i.value), itemStyle: { color: "#f59e0b" } }] });
  ltvChart?.setOption({ xAxis: { type: "category", data: currentRetention.value.ltvChannels.map((i) => i.channel) }, yAxis: { type: "value" }, series: [{ type: "line", smooth: true, data: currentRetention.value.ltvChannels.map((i) => i.value), areaStyle: { color: "rgba(16,185,129,.18)" }, lineStyle: { color: "#10b981" } }] });
};

const renderAllCharts = () => {
  renderPortraitCharts();
  renderPathCharts();
  renderFunnelCharts();
  renderRetentionCharts();
};

const resizeAllCharts = () => {
  [attrChart, activeChart, regionChart, deviceChart, categoryChart, sankeyChart, funnelChart, retentionChart, repurchaseChart, ltvChart].forEach((chart) => chart?.resize());
};

const tagStyle = (weight) => {
  const size = Math.min(26, 12 + weight * 0.42);
  const opacity = Math.min(1, 0.55 + weight / 40);
  return { fontSize: `${size}px`, opacity };
};

onMounted(async () => {
  await nextTick();
  attrChart = initChart(attrChartRef.value);
  activeChart = initChart(activeChartRef.value);
  regionChart = initChart(regionChartRef.value);
  deviceChart = initChart(deviceChartRef.value);
  categoryChart = initChart(categoryChartRef.value);
  sankeyChart = initChart(sankeyRef.value);
  funnelChart = initChart(funnelRef.value);
  retentionChart = initChart(retentionRef.value);
  repurchaseChart = initChart(repurchaseRef.value);
  ltvChart = initChart(ltvRef.value);
  renderAllCharts();
  window.addEventListener("resize", resizeAllCharts);
});

watch([period, funnelFilter], async () => {
  await nextTick();
  renderAllCharts();
}, { deep: true });

watch(activeTab, async () => {
  await nextTick();
  resizeAllCharts();
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", resizeAllCharts);
  [attrChart, activeChart, regionChart, deviceChart, categoryChart, sankeyChart, funnelChart, retentionChart, repurchaseChart, ltvChart].forEach((chart) => chart?.dispose());
});
</script>

<style scoped>
.behavior-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  animation: fade-up 0.28s ease;
}

.behavior-header,
.panel {
  border-radius: var(--radius-main);
  border: 1px solid var(--border-soft);
  background: var(--bg-glass);
  box-shadow: var(--shadow-soft);
  backdrop-filter: blur(12px);
}

.header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.title { margin: 0; font-size: 24px; line-height: 32px; color: var(--text-primary); }
.subtitle { margin: 6px 0 0; font-size: 13px; color: var(--text-secondary); }

.insight-strip {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.insight-card {
  border-radius: var(--radius-sub);
  border: 1px solid var(--border-soft);
  background: rgba(255, 255, 255, 0.78);
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.insight-card span {
  font-size: 12px;
  color: var(--text-secondary);
}

.insight-card strong {
  font-size: 19px;
  color: var(--text-primary);
  line-height: 1.25;
}

.insight-card em {
  font-style: normal;
  color: var(--accent-blue);
  font-size: 12px;
  font-weight: 700;
}

.grid { display: grid; gap: 12px; }
.grid.two { grid-template-columns: 1fr 1fr; }
.grid.one { grid-template-columns: 1fr; }
.panel.wide { grid-column: span 2; }
.chart { width: 100%; height: 280px; }
.chart.large { height: 360px; }
.tag-cloud {
  min-height: 280px;
  padding: 16px;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-content: flex-start;
  background: rgba(248, 251, 255, 0.8);
  border-radius: var(--radius-sub);
  border: 1px solid var(--border-soft);
}
.tag-item { color: #315fd5; font-weight: 700; }

.glass-filter {
  border-radius: var(--radius-pill);
  border: 1px solid var(--border-soft);
  background: rgba(255, 255, 255, 0.8);
  padding: 8px;
}

.filters { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 12px; }
.metric-list { display: flex; flex-direction: column; gap: 8px; }
.metric-row {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 10px;
  border: 1px solid var(--border-soft);
  padding: 10px;
  font-size: 13px;
  color: #334155;
}
.new-user-box { padding: 4px 2px; font-size: 15px; color: #334155; }
.mt12 { margin-top: 12px; }

@keyframes fade-up {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 1200px) {
  .insight-strip { grid-template-columns: 1fr 1fr; }
  .grid.two { grid-template-columns: 1fr; }
  .panel.wide { grid-column: span 1; }
}

@media (max-width: 768px) {
  .insight-strip { grid-template-columns: 1fr; }
}
</style>

