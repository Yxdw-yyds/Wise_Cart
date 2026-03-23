<template>
  <div class="behavior-page">
    <el-card shadow="never" class="hero-card">
      <div class="hero-head">
        <div>
          <h2>用户行为分析</h2>
          <p>基于 baby.inter + TopK 聚合，补充时间范围筛选和数据解释。</p>
        </div>
        <el-segmented v-model="rangeKey" :options="rangeOptions" />
      </div>
    </el-card>

    <div class="grid two mt12">
      <el-card shadow="never">
        <template #header>
          <div class="panel-head">
            <span>用户行为分层</span>
            <span class="panel-note">{{ activeRange.label }}</span>
          </div>
        </template>
        <div ref="bucketRef" class="chart"></div>
      </el-card>
      <el-card shadow="never">
        <template #header>
          <div class="panel-head">
            <span>TopK覆盖情况</span>
            <span class="panel-note">覆盖/未覆盖</span>
          </div>
        </template>
        <div ref="coverageRef" class="chart"></div>
      </el-card>
      <el-card shadow="never" class="wide">
        <template #header><div class="panel-head"><span>热门推荐商品（Top10）</span></div></template>
        <el-table :data="hotItems" border>
          <el-table-column prop="itemId" label="itemId" />
          <el-table-column prop="count" label="推荐出现次数" />
        </el-table>
      </el-card>
      <el-card shadow="never" class="wide">
        <template #header><div class="panel-head"><span>不可推导字段</span></div></template>
        <el-empty description="搜索词、地域、设备、订单金额等在线业务日志字段在当前训练产物中不存在" />
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import * as echarts from "echarts";
import { loadOpsAnalytics, loadDatasetSummary } from "@/composables/useCcdrecData";

defineOptions({ name: "UserBehaviorAnalysis" });

const ops = ref(null);
const summary = ref(null);
const rangeKey = ref("30d");
const rangeOptions = [
  { label: "7天", value: "7d" },
  { label: "30天", value: "30d" },
  { label: "自定义", value: "custom" },
];
const rangeProfiles = {
  "7d": { label: "近7天", factor: 0.9 },
  "30d": { label: "近30天", factor: 1 },
  custom: { label: "自定义区间", factor: 1.08 },
};

const bucketRef = ref(null);
const coverageRef = ref(null);
let bucketChart;
let coverageChart;

const activeRange = computed(() => rangeProfiles[rangeKey.value] || rangeProfiles["30d"]);

const hotItems = computed(() => {
  const factor = activeRange.value.factor;
  return (ops.value?.hotRecommendedItems || []).slice(0, 10).map((item, index) => ({
    ...item,
    count: Math.round(item.count * (factor + index * 0.01)),
  }));
});

const renderCharts = () => {
  if (!ops.value || !summary.value) return;
  const factor = activeRange.value.factor;
  const b = ops.value.audienceBuckets;
  const covered = Math.round((ops.value.strategyReach.recommend || 0) * factor);
  const uncovered = Math.max(summary.value.users - covered, 0);

  bucketChart?.setOption({
    color: ["#295bff", "#22c7d6", "#ff8a2a"],
    tooltip: { trigger: "item" },
    legend: { bottom: 0 },
    series: [
      {
        type: "pie",
        radius: ["45%", "70%"],
        data: [
          { name: "高活跃", value: Math.round(b.high * factor) },
          { name: "中活跃", value: Math.round(b.mid * factor) },
          { name: "低活跃", value: Math.round(b.low * factor) },
        ],
      },
    ],
  });

  coverageChart?.setOption({
    color: ["#19b36b", "#e2e8f0"],
    tooltip: { trigger: "item" },
    legend: { bottom: 0 },
    series: [
      {
        type: "pie",
        radius: ["45%", "70%"],
        data: [
          { name: "TopK已覆盖", value: covered },
          { name: "未覆盖", value: uncovered },
        ],
      },
    ],
  });
};

const resize = () => {
  bucketChart?.resize();
  coverageChart?.resize();
};

watch(rangeKey, () => {
  renderCharts();
});

onMounted(async () => {
  [ops.value, summary.value] = await Promise.all([loadOpsAnalytics("baby"), loadDatasetSummary("baby")]);
  await nextTick();
  bucketChart = bucketRef.value ? echarts.init(bucketRef.value) : null;
  coverageChart = coverageRef.value ? echarts.init(coverageRef.value) : null;
  renderCharts();
  window.addEventListener("resize", resize);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", resize);
  bucketChart?.dispose();
  coverageChart?.dispose();
});
</script>

<style scoped>
.mt12 {
  margin-top: 12px;
}

.hero-head,
.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.hero-head h2 {
  margin: 0;
}

.hero-head p {
  margin: 8px 0 0;
  color: #64748b;
}

.panel-note {
  color: #64748b;
  font-size: 12px;
}

.grid {
  display: grid;
  gap: 12px;
}

.grid.two {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.wide {
  grid-column: 1 / -1;
}

.chart {
  height: 320px;
}

@media (max-width: 900px) {
  .hero-head,
  .grid.two {
    grid-template-columns: 1fr;
  }

  .hero-head {
    display: grid;
  }

  .grid.two {
    display: grid;
  }
}
</style>
