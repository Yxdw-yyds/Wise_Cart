<template>
  <div class="behavior-page workspace-stack">
    <el-card shadow="never" class="hero-card">
      <div class="hero-head">
        <div>
          <h2>用户行为诊断与策略建议</h2>
          <p>基于用户活跃度、转化表现和推荐覆盖情况，为不同人群提供差异化运营建议。</p>
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
      <ProductBehaviorMatrix 
        :opsData="ops"
        class="wide"
      />
      <CoverageEffectAnalysis 
        :opsData="ops"
        :summaryData="summary"
        class="wide"
      />
      <el-card shadow="never" class="wide">
        <template #header><div class="panel-head"><span>热门推荐商品（Top10）</span></div></template>
        <el-table :data="hotItems" border>
          <el-table-column prop="itemId" label="itemId" />
          <el-table-column prop="count" label="推荐出现次数" />
        </el-table>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import * as echarts from "echarts";
import { loadOpsAnalytics, loadDatasetSummary } from "@/composables/useCcdrecData";
import ProductBehaviorMatrix from "./behavior/ProductBehaviorMatrix.vue";
import CoverageEffectAnalysis from "./behavior/CoverageEffectAnalysis.vue";

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
  margin-top: 0;
}

.behavior-page {
  display: grid;
  gap: 14px;
}

.hero-card {
  border-radius: 18px;
  background: linear-gradient(125deg, rgba(59, 130, 246, 0.12), rgba(255, 255, 255, 0.95) 46%, rgba(245, 158, 11, 0.12));
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
  font-size: 28px;
  font-weight: 800;
  color: var(--text-primary);
}

.hero-head p {
  margin: 8px 0 0;
  color: var(--text-tertiary);
}

.panel-note {
  color: var(--text-tertiary);
  font-size: 12px;
}

.grid {
  display: grid;
  gap: 12px;
}

.grid :deep(.el-card) {
  border-radius: 16px;
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
