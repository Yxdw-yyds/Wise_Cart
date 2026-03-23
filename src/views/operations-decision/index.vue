<template>
  <div class="ops-page-wrap route-fade-in">
    <el-card shadow="never" class="ops-head-card">
      <div class="ops-title">运营决策（CCDRec真实数据）</div>
      <div class="ops-subtitle">由 baby.inter + TopK 离线聚合驱动，不再使用 mock。</div>
    </el-card>

    <el-card shadow="never" class="ops-tab-card">
      <el-tabs v-model="activeTab">
        <el-tab-pane label="人群圈选" name="segment">
          <el-form label-width="100px">
            <div class="filter-grid">
              <el-form-item label="活跃等级">
                <el-select v-model="segmentForm.activeLevel">
                  <el-option label="高" value="high" />
                  <el-option label="中" value="mid" />
                  <el-option label="低" value="low" />
                </el-select>
              </el-form-item>
            </div>
          </el-form>
          <div class="segment-summary">
            估算圈选人群：<b>{{ audienceCount.toLocaleString('zh-CN') }}</b>
          </div>
        </el-tab-pane>

        <el-tab-pane label="策略开关" name="strategy">
          <div class="strategy-grid">
            <el-card shadow="never" class="strategy-item"><div class="strategy-name">推荐策略</div><el-switch v-model="strategyForm.recommendEnabled" /></el-card>
            <el-card shadow="never" class="strategy-item"><div class="strategy-name">召回策略</div><el-switch v-model="strategyForm.recallEnabled" /></el-card>
            <el-card shadow="never" class="strategy-item"><div class="strategy-name">营销策略</div><el-switch v-model="strategyForm.marketingEnabled" /></el-card>
            <el-card shadow="never" class="strategy-item"><div class="strategy-name">优惠券策略</div><el-switch v-model="strategyForm.couponEnabled" /></el-card>
          </div>
          <div class="ops-actions">
            <el-button @click="resetStrategy">重置</el-button>
            <el-button type="primary" @click="saveStrategy">保存策略</el-button>
          </div>
        </el-tab-pane>

        <el-tab-pane label="策略效果" name="effect">
          <div class="kpi-row">
            <el-card v-for="item in effectKpis" :key="item.key" shadow="never" class="kpi-card">
              <div class="kpi-label">{{ item.label }}</div>
              <div class="kpi-value">{{ item.value }}</div>
            </el-card>
          </div>

          <el-card shadow="never" class="table-card">
            <template #header><div class="table-title">分组效果</div></template>
            <el-table :data="groupEffectData" border>
              <el-table-column prop="group" label="分组" min-width="160" />
              <el-table-column prop="reach" label="触达" min-width="120" />
              <el-table-column prop="click" label="点击" min-width="120" />
              <el-table-column prop="convert" label="转化" min-width="120" />
              <el-table-column prop="roi" label="ROI" min-width="100" />
            </el-table>
          </el-card>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup>
import { computed, reactive, ref, onMounted } from "vue";
import { ElMessage } from "element-plus";
import { defineRouteMeta } from "@kesplus/kesplus";
import { loadOpsAnalytics } from "@/composables/useCcdrecData";

defineOptions({ name: "WorkbenchOperationsDecisionPage" });

defineRouteMeta({
  name: "workbenchOperationsDecision",
  title: "运营决策",
  icon: "Operation",
  isKeepAlive: true,
});

const activeTab = ref("segment");
const ops = ref(null);

const segmentForm = reactive({ activeLevel: "high" });
const strategyForm = reactive({ recommendEnabled: true, recallEnabled: true, marketingEnabled: true, couponEnabled: true });

const audienceCount = computed(() => {
  if (!ops.value) return 0;
  const level = segmentForm.activeLevel;
  const map = ops.value.audienceBuckets;
  return map[level] ?? 0;
});

const effectKpis = computed(() => {
  if (!ops.value) return [];
  const r = ops.value.strategyReach;
  return [
    { key: "recommend", label: "推荐触达", value: r.recommend.toLocaleString("zh-CN") },
    { key: "recall", label: "召回触达", value: r.recall.toLocaleString("zh-CN") },
    { key: "marketing", label: "营销触达", value: r.marketing.toLocaleString("zh-CN") },
    { key: "coupon", label: "优惠券触达", value: r.coupon.toLocaleString("zh-CN") },
  ];
});

const groupEffectData = computed(() => (ops.value?.groupEffects || []).map((g) => ({
  ...g,
  reach: g.reach.toLocaleString("zh-CN"),
  click: g.click.toLocaleString("zh-CN"),
  convert: g.convert.toLocaleString("zh-CN"),
  roi: g.roi.toFixed(2),
})));

const resetStrategy = () => {
  strategyForm.recommendEnabled = true;
  strategyForm.recallEnabled = true;
  strategyForm.marketingEnabled = true;
  strategyForm.couponEnabled = true;
};

const saveStrategy = () => {
  ElMessage.success("策略已保存（离线展示环境）");
};

onMounted(async () => {
  ops.value = await loadOpsAnalytics("baby");
});
</script>

<style scoped>
.ops-page-wrap { height: calc(100vh - 86px); overflow-y: auto; overflow-x: hidden; padding: 12px; }
.ops-head-card { margin-bottom: 12px; }
.ops-title { font-size: 24px; font-weight: 700; color: #0f172a; }
.ops-subtitle { margin-top: 6px; color: #64748b; }
.ops-tab-card { border-radius: 14px; }
.filter-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px 14px; }
.segment-summary { margin-top: 8px; padding: 12px; border-radius: 12px; background: #f8fbff; color: #334155; }
.strategy-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
.strategy-item { border-radius: 12px; }
.strategy-name { margin-bottom: 10px; font-size: 15px; font-weight: 600; color: #0f172a; }
.ops-actions { margin-top: 14px; display: flex; justify-content: flex-end; gap: 10px; }
.kpi-row { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin-bottom: 12px; }
.kpi-card { border-radius: 12px; }
.kpi-label { color: #64748b; font-size: 13px; }
.kpi-value { margin-top: 6px; font-size: 28px; font-weight: 700; color: #0f172a; }
.table-card { border-radius: 12px; }
.table-title { font-size: 16px; font-weight: 600; }
@media (max-width: 1200px) { .filter-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } .kpi-row { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 768px) { .filter-grid, .strategy-grid, .kpi-row { grid-template-columns: 1fr; } }
</style>
