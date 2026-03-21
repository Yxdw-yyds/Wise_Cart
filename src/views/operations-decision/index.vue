<template>
  <div class="ops-page-wrap">
    <el-card shadow="never" class="ops-head-card">
      <div class="ops-title">运营决策</div>
      <div class="ops-subtitle">人群圈选、策略配置与策略效果分析</div>
    </el-card>

    <el-card shadow="never" class="ops-tab-card">
      <el-tabs v-model="activeTab">
        <el-tab-pane label="人群圈选" name="segment">
          <el-form label-width="96px">
            <div class="filter-grid">
              <el-form-item label="活跃度">
                <el-select v-model="segmentForm.activeLevel" placeholder="请选择活跃度">
                  <el-option label="高活跃" value="high" />
                  <el-option label="中活跃" value="mid" />
                  <el-option label="低活跃" value="low" />
                </el-select>
              </el-form-item>
              <el-form-item label="价格敏感度">
                <el-select v-model="segmentForm.priceSense" placeholder="请选择价格敏感度">
                  <el-option label="高敏感" value="high" />
                  <el-option label="中敏感" value="mid" />
                  <el-option label="低敏感" value="low" />
                </el-select>
              </el-form-item>
              <el-form-item label="偏好类目">
                <el-select v-model="segmentForm.category" placeholder="请选择偏好类目">
                  <el-option label="酒水饮料" value="drink" />
                  <el-option label="粮油调味" value="food" />
                  <el-option label="日用百货" value="daily" />
                </el-select>
              </el-form-item>
              <el-form-item label="流失风险">
                <el-select v-model="segmentForm.churnRisk" placeholder="请选择流失风险">
                  <el-option label="高风险" value="high" />
                  <el-option label="中风险" value="mid" />
                  <el-option label="低风险" value="low" />
                </el-select>
              </el-form-item>
              <el-form-item label="会员等级">
                <el-select v-model="segmentForm.memberLevel" placeholder="请选择会员等级">
                  <el-option label="普通会员" value="normal" />
                  <el-option label="银卡会员" value="silver" />
                  <el-option label="金卡会员" value="gold" />
                </el-select>
              </el-form-item>
              <el-form-item label="最近行为">
                <el-select v-model="segmentForm.recentAction" placeholder="请选择最近行为">
                  <el-option label="最近7天浏览未下单" value="browse_only" />
                  <el-option label="最近7天加购未支付" value="cart_only" />
                  <el-option label="最近30天已复购" value="repurchase" />
                </el-select>
              </el-form-item>
            </div>
          </el-form>
          <div class="segment-summary">
            当前圈选结果：<b>{{ audienceCount.toLocaleString() }}</b> 人
          </div>
        </el-tab-pane>

        <el-tab-pane label="策略配置" name="strategy">
          <div class="strategy-grid">
            <el-card shadow="never" class="strategy-item">
              <div class="strategy-name">推荐策略</div>
              <el-switch v-model="strategyForm.recommendEnabled" />
            </el-card>
            <el-card shadow="never" class="strategy-item">
              <div class="strategy-name">召回策略</div>
              <el-switch v-model="strategyForm.recallEnabled" />
            </el-card>
            <el-card shadow="never" class="strategy-item">
              <div class="strategy-name">营销触达策略</div>
              <el-switch v-model="strategyForm.marketingEnabled" />
            </el-card>
            <el-card shadow="never" class="strategy-item">
              <div class="strategy-name">优惠券发放策略</div>
              <el-switch v-model="strategyForm.couponEnabled" />
            </el-card>
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
            <template #header>
              <div class="table-title">分群效果对比</div>
            </template>
            <el-table :data="groupEffectData" border>
              <el-table-column prop="group" label="分群" min-width="160" />
              <el-table-column prop="reach" label="触达人数" min-width="120" />
              <el-table-column prop="click" label="点击人数" min-width="120" />
              <el-table-column prop="convert" label="转化人数" min-width="120" />
              <el-table-column prop="roi" label="ROI" min-width="100" />
            </el-table>
          </el-card>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import { defineRouteMeta } from "@kesplus/kesplus";

defineOptions({
  name: "WorkbenchOperationsDecisionPage",
});

defineRouteMeta({
  name: "workbenchOperationsDecision",
  title: "运营决策",
  icon: "Operation",
  isKeepAlive: true,
});

const activeTab = ref("segment");

const segmentForm = reactive({
  activeLevel: "high",
  priceSense: "mid",
  category: "drink",
  churnRisk: "high",
  memberLevel: "gold",
  recentAction: "cart_only",
});

const strategyForm = reactive({
  recommendEnabled: true,
  recallEnabled: true,
  marketingEnabled: true,
  couponEnabled: false,
});

const effectKpis = ref([
  { key: "reach", label: "触达人数", value: "128,420" },
  { key: "click", label: "点击人数", value: "32,115" },
  { key: "convert", label: "转化人数", value: "8,430" },
  { key: "roi", label: "ROI", value: "2.84" },
]);

const groupEffectData = ref([
  { group: "高活跃-高客单", reach: "18,300", click: "6,420", convert: "2,030", roi: "3.42" },
  { group: "价格敏感-促销偏好", reach: "26,100", click: "7,860", convert: "1,880", roi: "2.63" },
  { group: "潜在流失-高风险", reach: "14,560", click: "3,220", convert: "690", roi: "1.78" },
  { group: "新客首单激活", reach: "22,480", click: "6,010", convert: "1,940", roi: "2.95" },
]);

const audienceCount = computed(() => {
  const score =
    (segmentForm.activeLevel === "high" ? 26000 : 15000) +
    (segmentForm.priceSense === "high" ? 6000 : 9000) +
    (segmentForm.churnRisk === "high" ? 7000 : 3000) +
    (segmentForm.memberLevel === "gold" ? 8000 : 5000);
  return score;
});

const resetStrategy = () => {
  strategyForm.recommendEnabled = true;
  strategyForm.recallEnabled = true;
  strategyForm.marketingEnabled = true;
  strategyForm.couponEnabled = false;
};

const saveStrategy = () => {
  ElMessage.success("策略配置已保存");
};
</script>

<style scoped>
.ops-page-wrap {
  height: calc(100vh - 86px);
  overflow-y: auto;
  overflow-x: hidden;
  padding: 12px;
}

.ops-head-card {
  margin-bottom: 12px;
}

.ops-title {
  font-size: 24px;
  font-weight: 700;
  color: #0f172a;
}

.ops-subtitle {
  margin-top: 6px;
  color: #64748b;
}

.ops-tab-card {
  border-radius: 14px;
}

.filter-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px 14px;
}

.segment-summary {
  margin-top: 8px;
  padding: 12px;
  border-radius: 12px;
  background: #f8fbff;
  color: #334155;
}

.strategy-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.strategy-item {
  border-radius: 12px;
}

.strategy-name {
  margin-bottom: 10px;
  font-size: 15px;
  font-weight: 600;
  color: #0f172a;
}

.ops-actions {
  margin-top: 14px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.kpi-row {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 12px;
}

.kpi-card {
  border-radius: 12px;
}

.kpi-label {
  color: #64748b;
  font-size: 13px;
}

.kpi-value {
  margin-top: 6px;
  font-size: 28px;
  font-weight: 700;
  color: #0f172a;
}

.table-card {
  border-radius: 12px;
}

.table-title {
  font-size: 16px;
  font-weight: 600;
}

@media (max-width: 1200px) {
  .filter-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .kpi-row {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .filter-grid,
  .strategy-grid,
  .kpi-row {
    grid-template-columns: 1fr;
  }
}
</style>
