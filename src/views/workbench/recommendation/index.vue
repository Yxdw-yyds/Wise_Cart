<template>
  <div class="workspace-page route-fade-in recommendation-page">
    <!-- 标签页切换 -->
    <div class="tabs-header">
      <div class="tabs">
        <div
          v-for="tab in tabs"
          :key="tab.id"
          class="tab"
          :class="{ active: activeTab === tab.id }"
          @click="activeTab = tab.id"
        >
          <span class="tab-icon">{{ tab.icon }}</span>
          <span class="tab-label">{{ tab.label }}</span>
        </div>
      </div>
    </div>

    <div v-show="activeTab === 'dashboard'" class="tab-content">
      <RecommendationDashboard />
    </div>

    <div v-show="activeTab === 'flow'" class="tab-content">
      <BusinessFlowVisualization />
    </div>

    <!-- A/B 测试与模型调参 -->
    <div v-show="activeTab === 'abtest'" class="tab-content">
      <div class="abtest-wrap">
        <el-card shadow="never" class="ab-card">
          <template #header>
            <div class="ab-card-head">
              <span>模型权重调节</span>
              <el-tag type="info" size="small">实时预览，不影响线上</el-tag>
            </div>
          </template>
          <div class="weight-sliders">
            <div v-for="m in modelConfig" :key="m.key" class="weight-row">
              <div class="wr-info">
                <span class="wr-name">{{ m.name }}</span>
                <span class="wr-desc">{{ m.desc }}</span>
              </div>
              <div class="wr-slider">
                <el-slider v-model="m.weight" :min="0" :max="100" :step="5" show-input input-size="small" @change="onWeightChange" />
              </div>
              <div class="wr-chip" :class="`chip-${m.key}`">{{ m.weight }}%</div>
            </div>
          </div>
          <div class="weight-warn" v-if="totalWeight !== 100">⚠ 当前权重总和为 {{ totalWeight }}%，推荐设置为 100%</div>
          <div class="weight-ok" v-else>✓ 权重总和 100%，配置有效</div>
          <div class="ab-actions">
            <el-button @click="resetWeights">重置默认</el-button>
            <el-button type="primary" @click="applyWeights">应用配置</el-button>
          </div>
        </el-card>

        <el-card shadow="never" class="ab-card">
          <template #header><span>模型贡献度分布</span></template>
          <div ref="pieRef" class="ab-chart"></div>
          <div class="model-legend">
            <div v-for="m in modelConfig" :key="m.key" class="legend-item">
              <span class="legend-dot" :style="{ background: m.color }"></span>
              <span class="legend-name">{{ m.name }}</span>
              <span class="legend-pct">{{ m.weight }}%</span>
              <el-progress :percentage="m.weight" :stroke-width="6" :show-text="false" :color="m.color" class="legend-bar" />
            </div>
          </div>
        </el-card>

        <el-card shadow="never" class="ab-card ab-card-wide">
          <template #header>
            <div class="ab-card-head">
              <span>A/B 方案对比（离线基准）</span>
              <el-button size="small" type="primary" plain @click="runABTest">运行对比</el-button>
            </div>
          </template>
          <div class="ab-variants">
            <div
              v-for="variant in abVariants"
              :key="variant.id"
              class="ab-variant"
              :class="{ 'ab-variant--active': selectedVariant === variant.id }"
              @click="selectedVariant = variant.id"
            >
              <div class="variant-head">
                <span class="variant-name">{{ variant.name }}</span>
                <el-tag :type="variant.tagType" size="small">{{ variant.tag }}</el-tag>
              </div>
              <div class="variant-weights">
                <div v-for="(w, k) in variant.weights" :key="k" class="vw-item">
                  <span>{{ modelNames[k] }}</span>
                  <div class="vw-bar-wrap"><div class="vw-bar" :style="{ width: w + '%', background: modelColors[k] }"></div></div>
                  <span>{{ w }}%</span>
                </div>
              </div>
              <div class="variant-metrics">
                <div class="vm-item"><span>预估 CTR</span><strong>{{ variant.estCtr }}</strong></div>
                <div class="vm-item"><span>预估 CVR</span><strong>{{ variant.estCvr }}</strong></div>
                <div class="vm-item"><span>覆盖率</span><strong>{{ variant.coverage }}</strong></div>
              </div>
            </div>
          </div>
          <div v-if="abResult" class="ab-result">
            <div class="abr-title">对比结果</div>
            <div class="abr-grid">
              <div v-for="(row, i) in abResult" :key="i" class="abr-row">
                <span class="abr-label">{{ row.label }}</span>
                <div class="abr-bars">
                  <div v-for="bar in row.bars" :key="bar.name" class="abr-bar-wrap">
                    <span class="abr-bar-name">{{ bar.name }}</span>
                    <div class="abr-bar-track"><div class="abr-bar-fill" :style="{ width: bar.pct + '%', background: bar.color }"></div></div>
                    <span class="abr-bar-val">{{ bar.val }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </div>
    </div>

    <!-- 详情分析 -->
    <div v-show="activeTab === 'details'" class="tab-content">
      <el-card shadow="never" class="details-card">
        <template #header>
          <div class="card-header">
            <h3>推荐详情分析</h3>
            <el-button type="primary" size="small" @click="refreshData">刷新数据</el-button>
          </div>
        </template>
        <div class="details-grid">
          <div class="stat-box" v-for="stat in detailStats" :key="stat.key">
            <div class="stat-label">{{ stat.label }}</div>
            <div class="stat-value">{{ stat.value }}</div>
            <div class="stat-desc">{{ stat.desc }}</div>
          </div>
        </div>
        <div class="recommendations-section">
          <h4>最新推荐结果</h4>
          <el-table :data="recommendations.slice(0, 10)" stripe border>
            <el-table-column prop="rank" label="排名" width="60" />
            <el-table-column prop="product.name" label="商品名称" min-width="180" />
            <el-table-column label="类目" width="90">
              <template #default="{ row }">
                <el-tag size="small">{{ categoryLabels[row.product?.category] }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="融合分数" width="130">
              <template #default="{ row }">
                <el-progress :percentage="Math.round(row.fusedScore * 100)" :color="getScoreColor(row.fusedScore)" :stroke-width="8" />
              </template>
            </el-table-column>
            <el-table-column label="推荐理由" min-width="160">
              <template #default="{ row }">{{ row.explanation?.primary }}</template>
            </el-table-column>
            <el-table-column label="模型来源" width="150">
              <template #default="{ row }">
                <div class="model-tags">
                  <el-tag v-for="model in row.models" :key="model" size="small" :type="modelTagType[model]">{{ model }}</el-tag>
                </div>
              </template>
            </el-table-column>
          </el-table>
        </div>
        <div class="funnel-section">
          <h4>转化漏斗分析</h4>
          <div class="funnel-stats">
            <div v-for="f in funnelSteps" :key="f.label" class="funnel-item">
              <div class="funnel-label">{{ f.label }}</div>
              <div class="funnel-bar" :style="{ width: f.width, background: f.color }">
                <span>{{ f.display }}</span>
              </div>
            </div>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { defineRouteMeta } from '@kesplus/kesplus';
import { ElMessage } from 'element-plus';
import * as echarts from 'echarts';
import { useUserMallData } from '@/composables/useUserMallData';
import { useEnhancedRecommendation, getDashboardData } from '@/services/enhancedRecommendationComposer';
import RecommendationDashboard from '@/components/RecommendationDashboard.vue';
import BusinessFlowVisualization from '@/components/BusinessFlowVisualization.vue';

defineOptions({ name: '推荐系统工作台' });
defineRouteMeta({ name: 'workbenchRecommendation', title: '推荐系统', icon: 'Promotion', isKeepAlive: true });

const { products, behaviorLog, categoryLabels } = useUserMallData();
const { recommendations, analysis, loadRecommendations, updateAnalysis } = useEnhancedRecommendation();

const activeTab = ref('dashboard');
const conversionFunnelData = ref({ view: 0, viewToClick: 0, clickToFav: 0, favToCart: 0, cartToBuy: 0 });
const abResult = ref(null);
const selectedVariant = ref('control');
const pieRef = ref(null);
let pieChart = null;

const tabs = [
  { id: 'dashboard', label: '推荐仪表板',  icon: '📊' },
  { id: 'flow',      label: '业务流可视化', icon: '🔄' },
  { id: 'abtest',    label: 'A/B 测试',    icon: '🧪' },
  { id: 'details',   label: '详情分析',    icon: '📈' },
];

const modelConfig = reactive([
  { key: 'ccdrec',        name: 'CCDRec 深度学习', desc: '基于扩散模型的协同过滤', weight: 60, color: '#295bff' },
  { key: 'collaborative', name: '协同过滤',         desc: '基于用户行为相似性',     weight: 25, color: '#10b981' },
  { key: 'content',       name: '内容推荐',         desc: '基于商品热度与新品标签', weight: 15, color: '#f59e0b' },
]);

const modelNames  = { ccdrec: 'CCDRec', collaborative: '协同过滤', content: '内容推荐' };
const modelColors = { ccdrec: '#295bff', collaborative: '#10b981', content: '#f59e0b' };
const modelTagType = { ccdrec: '', collaborative: 'success', content: 'warning' };
const totalWeight = computed(() => modelConfig.reduce((s, m) => s + m.weight, 0));

function resetWeights() { modelConfig[0].weight = 60; modelConfig[1].weight = 25; modelConfig[2].weight = 15; renderPie(); }
function onWeightChange() { renderPie(); }
function applyWeights() {
  if (totalWeight.value !== 100) { ElMessage.warning(`权重总和为 ${totalWeight.value}%，请调整为 100%`); return; }
  ElMessage.success('权重配置已应用（演示环境）');
}

const abVariants = [
  { id: 'control',   name: '对照组（当前）',      tag: 'Control',   tagType: '',        weights: { ccdrec: 60, collaborative: 25, content: 15 }, estCtr: '6.2%', estCvr: '2.1%', coverage: '100%' },
  { id: 'variant_a', name: '方案A（强化深度学习）', tag: 'Variant A', tagType: 'success', weights: { ccdrec: 75, collaborative: 15, content: 10 }, estCtr: '7.1%', estCvr: '2.4%', coverage: '98%'  },
  { id: 'variant_b', name: '方案B（均衡策略）',    tag: 'Variant B', tagType: 'warning', weights: { ccdrec: 45, collaborative: 35, content: 20 }, estCtr: '5.8%', estCvr: '2.0%', coverage: '100%' },
];

function runABTest() {
  abResult.value = [
    { label: '预估点击率', bars: [{ name: '对照组', val: '6.2%', pct: 62, color: '#295bff' }, { name: '方案A', val: '7.1%', pct: 71, color: '#10b981' }, { name: '方案B', val: '5.8%', pct: 58, color: '#f59e0b' }] },
    { label: '预估转化率', bars: [{ name: '对照组', val: '2.1%', pct: 42, color: '#295bff' }, { name: '方案A', val: '2.4%', pct: 48, color: '#10b981' }, { name: '方案B', val: '2.0%', pct: 40, color: '#f59e0b' }] },
    { label: '推荐覆盖率', bars: [{ name: '对照组', val: '100%', pct: 100, color: '#295bff' }, { name: '方案A', val: '98%', pct: 98, color: '#10b981' }, { name: '方案B', val: '100%', pct: 100, color: '#f59e0b' }] },
  ];
  ElMessage.success('A/B 对比分析完成');
}

const detailStats = computed(() => [
  { key: 'total',   label: '总推荐数',  value: analysis.value?.overview?.totalRecommendations || 0, desc: '今日推荐总数' },
  { key: 'clicks',  label: '总点击数',  value: analysis.value?.overview?.totalClicks || 0,          desc: '用户点击次数' },
  { key: 'convert', label: '总转化数',  value: analysis.value?.overview?.totalConversions || 0,     desc: '用户购买次数' },
  { key: 'ctr',     label: '点击率',    value: analysis.value?.overview?.ctr || '0%',               desc: '每条推荐的点击率' },
  { key: 'cvr',     label: '转化率',    value: analysis.value?.overview?.cvr || '0%',               desc: '每次点击的转化率' },
  { key: 'avg',     label: '平均融合分', value: avgScore.value,                                     desc: '推荐融合分均值' },
]);

const avgScore = computed(() => {
  if (!recommendations.value.length) return '0.00';
  return (recommendations.value.reduce((a, r) => a + r.fusedScore, 0) / recommendations.value.length).toFixed(2);
});

function getScoreColor(score) {
  if (score >= 0.8) return '#10b981';
  if (score >= 0.5) return '#f59e0b';
  return '#ef4444';
}

const funnelSteps = computed(() => {
  const f = conversionFunnelData.value;
  return [
    { label: '浏览', width: '100%',                          display: f.view || 0,                        color: '#667eea' },
    { label: '点击', width: `${f.viewToClick || 0}%`,        display: `${(f.viewToClick||0).toFixed(1)}%`, color: '#764ba2' },
    { label: '收藏', width: `${f.clickToFav  || 0}%`,        display: `${(f.clickToFav ||0).toFixed(1)}%`, color: '#f093fb' },
    { label: '加购', width: `${f.favToCart   || 0}%`,        display: `${(f.favToCart  ||0).toFixed(1)}%`, color: '#4facfe' },
    { label: '购买', width: `${f.cartToBuy   || 0}%`,        display: `${(f.cartToBuy  ||0).toFixed(1)}%`, color: '#43e97b' },
  ];
});

function renderPie() {
  if (!pieChart) return;
  pieChart.setOption({
    backgroundColor: 'transparent',
    tooltip: { trigger: 'item', formatter: '{b}: {c}%' },
    series: [{
      type: 'pie',
      radius: ['40%', '68%'],
      center: ['50%', '50%'],
      label: { show: false },
      emphasis: { label: { show: true, fontSize: 14, fontWeight: 700 } },
      data: modelConfig.map(m => ({ value: m.weight, name: m.name, itemStyle: { color: m.color } })),
    }],
  });
}

async function refreshData() {
  await loadRecommendations({ userBehavior: behaviorLog.value, allProducts: products.value });
  updateAnalysis();
  const d = getDashboardData(behaviorLog.value, products.value);
  conversionFunnelData.value = {
    view:        d.funnel.view ?? 0,
    viewToClick: parseFloat(d.funnel.viewToClick) || 0,
    clickToFav:  parseFloat(d.funnel.clickToFav)  || 0,
    favToCart:   parseFloat(d.funnel.favToCart)   || 0,
    cartToBuy:   parseFloat(d.funnel.cartToBuy)   || 0,
  };
}

function onResize() { pieChart?.resize(); }

watch(activeTab, async (v) => {
  if (v === 'abtest') {
    await nextTick();
    if (!pieChart && pieRef.value) {
      pieChart = echarts.init(pieRef.value);
      renderPie();
    }
  }
});

onMounted(async () => {
  await refreshData();
  window.addEventListener('resize', onResize);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', onResize);
  pieChart?.dispose();
});
</script>

<style scoped>
.recommendation-page {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.tabs-header {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.07);
  margin-bottom: 14px;
  overflow: hidden;
}

.tabs { display: flex; }

.tab {
  flex: 1;
  padding: 14px 16px;
  text-align: center;
  cursor: pointer;
  border-bottom: 3px solid transparent;
  transition: all 0.25s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: #64748b;
  font-weight: 500;
  font-size: 14px;
}

.tab:hover { background: #f8fafc; color: #295bff; }
.tab.active { color: #295bff; border-bottom-color: #295bff; background: #f0f4ff; }
.tab-icon { font-size: 16px; }
.tab-content { animation: fadeIn 0.25s ease; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }

.abtest-wrap {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.ab-card { border-radius: 14px; }
.ab-card-wide { grid-column: 1 / -1; }
.ab-card-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.weight-sliders { display: flex; flex-direction: column; gap: 18px; }

.weight-row {
  display: grid;
  grid-template-columns: 180px 1fr 52px;
  gap: 12px;
  align-items: center;
}

.wr-info { display: flex; flex-direction: column; gap: 2px; }
.wr-name { font-size: 13px; font-weight: 700; color: #1e293b; }
.wr-desc { font-size: 11px; color: #94a3b8; }
.wr-chip { font-size: 12px; font-weight: 800; text-align: center; padding: 4px 8px; border-radius: 8px; background: #f1f5f9; color: #1e293b; }
.weight-warn { margin-top: 10px; padding: 8px 12px; border-radius: 8px; background: #fff7ed; color: #f59e0b; font-size: 13px; font-weight: 600; }
.weight-ok   { margin-top: 10px; padding: 8px 12px; border-radius: 8px; background: #f0fdf4; color: #10b981; font-size: 13px; font-weight: 600; }
.ab-actions  { margin-top: 14px; display: flex; justify-content: flex-end; gap: 8px; }
.ab-chart    { width: 100%; height: 200px; }
.model-legend { display: flex; flex-direction: column; gap: 12px; margin-top: 12px; }
.legend-item  { display: flex; align-items: center; gap: 10px; }
.legend-dot   { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.legend-name  { font-size: 13px; color: #475569; width: 100px; }
.legend-pct   { font-size: 13px; font-weight: 700; color: #1e293b; width: 36px; }
.legend-bar   { flex: 1; }

.ab-variants { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; margin-bottom: 14px; }
.ab-variant  { border: 2px solid #e2e8f0; border-radius: 12px; padding: 14px; cursor: pointer; transition: all 0.2s ease; }
.ab-variant:hover { border-color: #295bff; box-shadow: 0 4px 16px rgba(41,91,255,0.1); }
.ab-variant--active { border-color: #295bff; background: #f0f4ff; }
.variant-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
.variant-name { font-size: 13px; font-weight: 700; color: #1e293b; }
.variant-weights { display: flex; flex-direction: column; gap: 8px; margin-bottom: 10px; }
.vw-item { display: flex; align-items: center; gap: 8px; font-size: 11px; color: #64748b; }
.vw-item span:first-child { width: 60px; }
.vw-bar-wrap { flex: 1; height: 6px; background: #e2e8f0; border-radius: 999px; overflow: hidden; }
.vw-bar      { height: 100%; border-radius: 999px; transition: width 0.4s ease; }
.vw-item span:last-child { width: 30px; text-align: right; font-weight: 700; color: #1e293b; }
.variant-metrics { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
.vm-item { background: #f8fafc; border-radius: 8px; padding: 6px 8px; text-align: center; }
.vm-item span   { display: block; font-size: 10px; color: #94a3b8; margin-bottom: 2px; }
.vm-item strong { font-size: 14px; font-weight: 800; color: #1e293b; }

.ab-result  { border-top: 1px solid #f1f5f9; padding-top: 14px; }
.abr-title  { font-size: 13px; font-weight: 700; color: #1e293b; margin-bottom: 10px; }
.abr-grid   { display: flex; flex-direction: column; gap: 12px; }
.abr-row    { display: flex; align-items: center; gap: 12px; }
.abr-label  { font-size: 12px; color: #64748b; width: 70px; flex-shrink: 0; }
.abr-bars   { flex: 1; display: flex; flex-direction: column; gap: 5px; }
.abr-bar-wrap  { display: flex; align-items: center; gap: 8px; }
.abr-bar-name  { font-size: 11px; color: #94a3b8; width: 50px; }
.abr-bar-track { flex: 1; height: 8px; background: #f1f5f9; border-radius: 999px; overflow: hidden; }
.abr-bar-fill  { height: 100%; border-radius: 999px; transition: width 0.5s ease; }
.abr-bar-val   { font-size: 11px; font-weight: 700; color: #1e293b; width: 36px; text-align: right; }

.details-card { border-radius: 14px; }
.card-header  { display: flex; justify-content: space-between; align-items: center; }
.card-header h3 { margin: 0; font-size: 15px; font-weight: 700; }

.details-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 20px;
}

.stat-box { padding: 14px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 10px; color: #fff; text-align: center; }
.stat-label { font-size: 11px; opacity: 0.85; margin-bottom: 6px; }
.stat-value { font-size: 22px; font-weight: 800; margin-bottom: 4px; }
.stat-desc  { font-size: 10px; opacity: 0.75; }

.recommendations-section { margin-bottom: 20px; }
.recommendations-section h4 { margin: 0 0 12px; font-size: 14px; font-weight: 700; color: #1e293b; }
.model-tags { display: flex; gap: 4px; flex-wrap: wrap; }

.funnel-section { padding-top: 20px; border-top: 1px solid #f1f5f9; }
.funnel-section h4 { margin: 0 0 12px; font-size: 14px; font-weight: 700; color: #1e293b; }
.funnel-stats { display: flex; flex-direction: column; gap: 10px; }
.funnel-item  { display: flex; align-items: center; gap: 12px; }
.funnel-label { width: 44px; font-size: 12px; font-weight: 600; color: #475569; }
.funnel-bar   { min-width: 60px; height: 30px; border-radius: 5px; display: flex; align-items: center; justify-content: flex-end; padding-right: 12px; transition: width 0.4s ease; }
.funnel-bar span { color: #fff; font-weight: 700; font-size: 12px; }

@media (max-width: 1200px) {
  .abtest-wrap  { grid-template-columns: 1fr; }
  .ab-card-wide { grid-column: auto; }
  .ab-variants  { grid-template-columns: 1fr 1fr; }
  .details-grid { grid-template-columns: repeat(3, 1fr); }
}

@media (max-width: 768px) {
  .tabs        { flex-wrap: wrap; }
  .tab         { flex: 0 1 calc(50% - 2px); }
  .ab-variants { grid-template-columns: 1fr; }
  .details-grid { grid-template-columns: repeat(2, 1fr); }
  .weight-row  { grid-template-columns: 1fr; }
}
</style>
 