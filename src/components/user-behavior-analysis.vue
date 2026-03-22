<template>
  <div class="behavior-page">
    <el-card shadow="never">
      <h2>用户行为分析（CCDRec真实数据）</h2>
      <p>基于 baby.inter + TopK 聚合。无法从当前训练产物直接推导的业务字段展示为空。</p>
    </el-card>

    <div class="grid two mt12">
      <el-card shadow="never">
        <template #header>用户行为分层</template>
        <div ref="bucketRef" class="chart"></div>
      </el-card>
      <el-card shadow="never">
        <template #header>TopK覆盖情况</template>
        <div ref="coverageRef" class="chart"></div>
      </el-card>
      <el-card shadow="never" class="wide">
        <template #header>热门推荐商品（Top10）</template>
        <el-table :data="hotItems" border>
          <el-table-column prop="itemId" label="itemId" />
          <el-table-column prop="count" label="推荐出现次数" />
        </el-table>
      </el-card>
      <el-card shadow="never" class="wide">
        <template #header>不可推导字段</template>
        <el-empty description="搜索词、地域、设备、订单金额等在线业务日志字段在当前训练产物中不存在" />
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import * as echarts from "echarts";
import { loadOpsAnalytics, loadDatasetSummary } from "@/composables/useCcdrecData";

defineOptions({ name: "UserBehaviorAnalysis" });

const ops = ref(null);
const summary = ref(null);
const bucketRef = ref(null);
const coverageRef = ref(null);
let bucketChart;
let coverageChart;

const hotItems = computed(() => (ops.value?.hotRecommendedItems || []).slice(0, 10));

const renderCharts = () => {
  if (!ops.value || !summary.value) return;
  const b = ops.value.audienceBuckets;
  const covered = ops.value.strategyReach.recommend;
  const uncovered = Math.max(summary.value.users - covered, 0);

  bucketChart?.setOption({
    tooltip: { trigger: "item" },
    series: [{ type: "pie", radius: ["45%", "70%"], data: [
      { name: "高活跃", value: b.high },
      { name: "中活跃", value: b.mid },
      { name: "低活跃", value: b.low },
    ] }],
  });

  coverageChart?.setOption({
    tooltip: { trigger: "item" },
    series: [{ type: "pie", radius: ["45%", "70%"], data: [
      { name: "TopK已覆盖", value: covered },
      { name: "未覆盖", value: uncovered },
    ] }],
  });
};

const resize = () => {
  bucketChart?.resize();
  coverageChart?.resize();
};

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
.mt12 { margin-top: 12px; }
.grid { display: grid; gap: 12px; }
.grid.two { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.wide { grid-column: 1 / -1; }
.chart { height: 320px; }
@media (max-width: 900px) { .grid.two { grid-template-columns: 1fr; } }
</style>
