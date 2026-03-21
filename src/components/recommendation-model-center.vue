<template>
  <div class="rmc-page">
    <el-card shadow="never" class="rmc-header">
      <div class="header-row">
        <div>
          <h2 class="title">推荐与模型中心（CCDRec）</h2>
          <p class="subtitle">展示模型资产、推荐效果、个性化推荐结果与 A/B 实验结论</p>
        </div>
        <el-tag type="success" size="large">当前线上模型：{{ onlineModel.version }}</el-tag>
      </div>
    </el-card>

    <div class="value-strip">
      <div class="value-card">
        <span>当前线上模型</span>
        <strong>{{ onlineModel.version }}</strong>
        <em>{{ onlineModel.metrics }}</em>
      </div>
      <div class="value-card">
        <span>推荐GMV贡献</span>
        <strong>28.6%</strong>
        <em>较对照组 +27.7%</em>
      </div>
      <div class="value-card">
        <span>实验显著性</span>
        <strong>p-value &lt; 0.05</strong>
        <em>核心指标均达显著</em>
      </div>
    </div>

    <el-card shadow="never">
      <el-tabs v-model="activeSubTab">
        <el-tab-pane label="模型管理" name="model" lazy>
          <el-table :data="modelList" border>
            <el-table-column prop="version" label="模型版本" min-width="120" />
            <el-table-column prop="trainTime" label="训练时间" min-width="150" />
            <el-table-column prop="featureVersion" label="输入特征版本" min-width="140" />
            <el-table-column prop="metrics" label="评估指标" min-width="220" />
            <el-table-column label="线上状态" min-width="100">
              <template #default="scope">
                <el-tag :type="scope.row.online ? 'success' : 'info'">{{ scope.row.online ? "线上" : "离线" }}</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="推荐效果分析" name="effect" lazy>
          <div class="grid two">
            <el-card shadow="never" class="panel">
              <template #header>推荐曝光量趋势</template>
              <div ref="exposureRef" class="chart" />
            </el-card>
            <el-card shadow="never" class="panel">
              <template #header>CTR / CVR / GMV贡献</template>
              <div ref="contribRef" class="chart" />
            </el-card>
            <el-card shadow="never" class="panel">
              <template #header>推荐位效果对比</template>
              <div ref="positionRef" class="chart" />
            </el-card>
            <el-card shadow="never" class="panel">
              <template #header>人群分层效果对比</template>
              <div ref="segmentRef" class="chart" />
            </el-card>
            <el-card shadow="never" class="panel wide">
              <template #header>模型版本效果对比</template>
              <div ref="versionRef" class="chart" />
            </el-card>
          </div>
        </el-tab-pane>

        <el-tab-pane label="个性化推荐" name="personal" lazy>
          <div class="personal-top">
            <el-select v-model="selectedUserId" placeholder="选择用户" style="width: 220px">
              <el-option v-for="u in userOptions" :key="u.userId" :label="u.label" :value="u.userId" />
            </el-select>
            <el-button type="primary" @click="refreshAuditTime">人工校验推荐结果</el-button>
            <span class="audit-time">最近校验时间：{{ auditTime }}</span>
          </div>

          <el-table :data="currentUserRecs" border>
            <el-table-column prop="itemName" label="推荐商品" min-width="160" />
            <el-table-column prop="score" label="推荐分" min-width="100" />
            <el-table-column label="推荐理由" min-width="260">
              <template #default="scope">
                <div class="reason-chips">
                  <el-tag v-for="reason in parseReasons(scope.row.reason)" :key="reason" effect="plain" round>
                    {{ reason }}
                  </el-tag>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="category" label="品类" min-width="120" />
            <el-table-column label="校验结果" min-width="120">
              <template #default="scope">
                <el-tag :type="scope.row.checked ? 'success' : 'warning'">{{ scope.row.checked ? "已校验" : "待校验" }}</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="A/B实验" name="ab" lazy>
          <el-card shadow="never" class="panel">
            <template #header>实验配置</template>
            <el-descriptions :column="2" border>
              <el-descriptions-item label="实验名称">{{ abConfig.name }}</el-descriptions-item>
              <el-descriptions-item label="实验周期">{{ abConfig.period }}</el-descriptions-item>
              <el-descriptions-item label="实验组">{{ abConfig.groupA }}</el-descriptions-item>
              <el-descriptions-item label="对照组">{{ abConfig.groupB }}</el-descriptions-item>
              <el-descriptions-item label="分流比例">{{ abConfig.traffic }}</el-descriptions-item>
              <el-descriptions-item label="目标指标">{{ abConfig.goal }}</el-descriptions-item>
            </el-descriptions>
          </el-card>

          <div class="grid two mt12">
            <el-card shadow="never" class="panel">
              <template #header>实验组/对照组数据</template>
              <el-table :data="abMetrics" border>
                <el-table-column prop="metric" label="指标" min-width="120" />
                <el-table-column prop="control" label="对照组" min-width="100" />
                <el-table-column prop="experiment" label="实验组" min-width="100" />
                <el-table-column prop="uplift" label="提升率" min-width="100" />
                <el-table-column prop="pValue" label="p-value" min-width="100" />
              </el-table>
            </el-card>
            <el-card shadow="never" class="panel">
              <template #header>提升率显著性分析</template>
              <div ref="abRef" class="chart" />
            </el-card>
          </div>

          <el-card shadow="never" class="panel mt12">
            <template #header>实验结论</template>
            <div class="conclusion">{{ abConclusion }}</div>
          </el-card>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import * as echarts from "echarts";

defineOptions({ name: "RecommendationModelCenter" });

const activeSubTab = ref("model");
const auditTime = ref("未校验");
const selectedUserId = ref("u1001");

const modelList = [
  { version: "CCDRec-v2.4.1", trainTime: "2026-03-18 02:10", featureVersion: "feat_20260317", metrics: "AUC 0.812 / NDCG@10 0.463", online: true },
  { version: "CCDRec-v2.3.7", trainTime: "2026-03-10 01:55", featureVersion: "feat_20260309", metrics: "AUC 0.801 / NDCG@10 0.447", online: false },
  { version: "CCDRec-v2.2.9", trainTime: "2026-02-28 02:20", featureVersion: "feat_20260227", metrics: "AUC 0.794 / NDCG@10 0.439", online: false },
];
const onlineModel = computed(() => modelList.find((i) => i.online) || modelList[0]);

const effectData = {
  exposureX: ["03-15", "03-16", "03-17", "03-18", "03-19", "03-20", "03-21"],
  exposureY: [84, 88, 92, 96, 101, 109, 115],
  contrib: { ctr: 13.1, cvr: 3.4, gmv: 28.6 },
  positions: [
    { name: "首页猜你喜欢", ctr: 14.2 },
    { name: "购物车猜你想买", ctr: 11.6 },
    { name: "详情页相关推荐", ctr: 9.8 },
    { name: "支付后推荐", ctr: 8.9 },
  ],
  segments: [
    { name: "新客", cvr: 2.3 },
    { name: "老客", cvr: 3.8 },
    { name: "会员", cvr: 4.5 },
  ],
  versions: [
    { name: "v2.2.9", gmv: 19.8 },
    { name: "v2.3.7", gmv: 23.4 },
    { name: "v2.4.1", gmv: 28.6 },
  ],
};

const userOptions = [
  { userId: "u1001", label: "u1001 - 高活跃会员" },
  { userId: "u2033", label: "u2033 - 新客价格敏感" },
  { userId: "u4188", label: "u4188 - 酒水偏好用户" },
];

const userRecsMap = {
  u1001: [
    { itemName: "进口酸奶 12杯装", score: 0.94, reason: "因为浏览了乳品专区；相似用户喜欢", category: "乳品", checked: true },
    { itemName: "冷萃咖啡礼盒", score: 0.91, reason: "因为偏好咖啡品类", category: "饮料", checked: true },
    { itemName: "高蛋白面包", score: 0.89, reason: "因为浏览了健康零食", category: "烘焙", checked: false },
  ],
  u2033: [
    { itemName: "家庭装抽纸", score: 0.88, reason: "因为浏览了日用品频道", category: "日化", checked: false },
    { itemName: "平价牛奶组合", score: 0.86, reason: "因为偏好高性价比品类", category: "乳品", checked: false },
  ],
  u4188: [
    { itemName: "精酿啤酒组合", score: 0.93, reason: "因为偏好酒水品类", category: "酒水", checked: true },
    { itemName: "下酒零食礼盒", score: 0.87, reason: "相似用户喜欢", category: "零食", checked: false },
  ],
};

const currentUserRecs = computed(() => userRecsMap[selectedUserId.value] || []);

const abConfig = {
  name: "CCDRec-v2.4.1 首页推荐重排实验",
  period: "2026-03-12 ~ 2026-03-21",
  groupA: "实验组：CCDRec-v2.4.1",
  groupB: "对照组：v2.3.7",
  traffic: "50% / 50%",
  goal: "CTR、CVR、GMV贡献",
};

const abMetrics = [
  { metric: "CTR", control: "11.8%", experiment: "13.1%", uplift: "+11.0%", pValue: "0.013" },
  { metric: "CVR", control: "3.1%", experiment: "3.4%", uplift: "+9.7%", pValue: "0.029" },
  { metric: "GMV贡献", control: "22.4%", experiment: "28.6%", uplift: "+27.7%", pValue: "0.008" },
];

const abConclusion = "实验组在 CTR、CVR、GMV贡献三项核心指标上均显著优于对照组（p-value < 0.05），建议将 CCDRec-v2.4.1 全量上线，并继续跟踪 14 天稳定性。";

const exposureRef = ref(null);
const contribRef = ref(null);
const positionRef = ref(null);
const segmentRef = ref(null);
const versionRef = ref(null);
const abRef = ref(null);

let exposureChart;
let contribChart;
let positionChart;
let segmentChart;
let versionChart;
let abChart;

const renderEffectCharts = () => {
  exposureChart?.setOption({
    tooltip: { trigger: "axis" },
    xAxis: { type: "category", data: effectData.exposureX },
    yAxis: { type: "value", name: "万" },
    series: [{ type: "line", smooth: true, data: effectData.exposureY, areaStyle: { color: "rgba(59,130,246,.16)" }, lineStyle: { color: "#3b82f6" } }],
  });

  contribChart?.setOption({
    tooltip: { trigger: "item" },
    series: [{ type: "pie", radius: ["45%", "70%"], data: [
      { name: "CTR贡献", value: effectData.contrib.ctr },
      { name: "CVR贡献", value: effectData.contrib.cvr },
      { name: "GMV贡献", value: effectData.contrib.gmv },
    ] }],
  });

  positionChart?.setOption({
    tooltip: { trigger: "axis" },
    xAxis: { type: "category", data: effectData.positions.map((i) => i.name), axisLabel: { interval: 0, rotate: 12 } },
    yAxis: { type: "value", axisLabel: { formatter: "{value}%" } },
    series: [{ type: "bar", data: effectData.positions.map((i) => i.ctr), itemStyle: { color: "#0ea5e9" } }],
  });

  segmentChart?.setOption({
    tooltip: { trigger: "axis" },
    xAxis: { type: "category", data: effectData.segments.map((i) => i.name) },
    yAxis: { type: "value", axisLabel: { formatter: "{value}%" } },
    series: [{ type: "bar", data: effectData.segments.map((i) => i.cvr), itemStyle: { color: "#22c55e" } }],
  });

  versionChart?.setOption({
    tooltip: { trigger: "axis" },
    xAxis: { type: "category", data: effectData.versions.map((i) => i.name) },
    yAxis: { type: "value", axisLabel: { formatter: "{value}%" } },
    series: [{ type: "line", smooth: true, data: effectData.versions.map((i) => i.gmv), lineStyle: { color: "#f59e0b" }, areaStyle: { color: "rgba(245,158,11,.15)" } }],
  });
};

const renderAbChart = () => {
  abChart?.setOption({
    tooltip: { trigger: "axis" },
    legend: { data: ["对照组", "实验组"] },
    xAxis: { type: "category", data: ["CTR", "CVR", "GMV贡献"] },
    yAxis: { type: "value", axisLabel: { formatter: "{value}%" } },
    series: [
      { name: "对照组", type: "bar", data: [11.8, 3.1, 22.4], itemStyle: { color: "#94a3b8" } },
      { name: "实验组", type: "bar", data: [13.1, 3.4, 28.6], itemStyle: { color: "#2563eb" } },
    ],
  });
};

const resizeCharts = () => {
  [exposureChart, contribChart, positionChart, segmentChart, versionChart, abChart].forEach((chart) => chart?.resize());
};

const initCharts = async () => {
  await nextTick();
  exposureChart ??= exposureRef.value ? echarts.init(exposureRef.value) : null;
  contribChart ??= contribRef.value ? echarts.init(contribRef.value) : null;
  positionChart ??= positionRef.value ? echarts.init(positionRef.value) : null;
  segmentChart ??= segmentRef.value ? echarts.init(segmentRef.value) : null;
  versionChart ??= versionRef.value ? echarts.init(versionRef.value) : null;
  abChart ??= abRef.value ? echarts.init(abRef.value) : null;
  renderEffectCharts();
  renderAbChart();
};

const refreshAuditTime = () => {
  auditTime.value = new Date().toLocaleString("zh-CN", { hour12: false });
};

const parseReasons = (text) => {
  return String(text).split(/[；;]+/).map((item) => item.trim()).filter(Boolean);
};

onMounted(async () => {
  await initCharts();
  window.addEventListener("resize", resizeCharts);
});

watch(activeSubTab, async (tab) => {
  if (tab === "effect" || tab === "ab") {
    await initCharts();
  }
  await nextTick();
  resizeCharts();
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", resizeCharts);
  [exposureChart, contribChart, positionChart, segmentChart, versionChart, abChart].forEach((chart) => chart?.dispose());
});
</script>

<style scoped>
.rmc-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  animation: fade-up 0.28s ease;
}

.rmc-header,
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

.title {
  margin: 0;
  font-size: 24px;
  line-height: 32px;
  color: var(--text-primary);
}

.subtitle {
  margin: 6px 0 0;
  font-size: 13px;
  color: var(--text-secondary);
}

.value-strip {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.value-card {
  border-radius: var(--radius-sub);
  border: 1px solid var(--border-soft);
  background: rgba(255, 255, 255, 0.78);
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.value-card span {
  font-size: 12px;
  color: var(--text-secondary);
}

.value-card strong {
  font-size: 20px;
  color: var(--text-primary);
}

.value-card em {
  font-style: normal;
  font-size: 12px;
  color: var(--accent-blue);
  font-weight: 700;
}

.grid {
  display: grid;
  gap: 12px;
}

.grid.two {
  grid-template-columns: 1fr 1fr;
}

.panel.wide {
  grid-column: span 2;
}

.chart {
  width: 100%;
  height: 280px;
}

.personal-top {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 12px;
  border-radius: var(--radius-pill);
  border: 1px solid var(--border-soft);
  background: rgba(255, 255, 255, 0.76);
  padding: 8px;
}

.audit-time {
  color: #64748b;
  font-size: 13px;
}

.reason-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.conclusion {
  font-size: 14px;
  line-height: 1.8;
  color: #334155;
  border-left: 3px solid var(--accent-blue);
  padding-left: 12px;
}

.mt12 {
  margin-top: 12px;
}

@keyframes fade-up {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 1200px) {
  .value-strip {
    grid-template-columns: 1fr;
  }

  .grid.two {
    grid-template-columns: 1fr;
  }

  .panel.wide {
    grid-column: span 1;
  }
}
</style>

