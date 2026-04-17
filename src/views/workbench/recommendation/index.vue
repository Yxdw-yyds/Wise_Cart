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

    <div class="tab-scroll-area">
    <div v-show="activeTab === 'dashboard'" class="tab-content">
      <RecommendationDashboard />
    </div>

    <div v-show="activeTab === 'flow'" class="tab-content">
      <BusinessFlowVisualization />
    </div>
    </div><!-- end tab-scroll-area -->
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { defineRouteMeta } from '@kesplus/kesplus';
import { useTmallData } from '@/composables/useTmallData';
import { useEnhancedRecommendation, getDashboardData } from '@/services/enhancedRecommendationComposer';
import RecommendationDashboard from '@/components/RecommendationDashboard.vue';
import BusinessFlowVisualization from '@/components/BusinessFlowVisualization.vue';

defineOptions({ name: '推荐系统工作台' });
defineRouteMeta({ name: 'workbenchRecommendation', title: '推荐系统', icon: 'Promotion', isKeepAlive: true });

const { products, behaviorLog, categoryLabels, loadAll: loadTmallData } = useTmallData();
const { recommendations, analysis, loadRecommendations, updateAnalysis } = useEnhancedRecommendation();

const activeTab = ref('dashboard');
const conversionFunnelData = ref({ view: 0, viewToClick: 0, clickToFav: 0, favToCart: 0, cartToBuy: 0 });

const tabs = [
  { id: 'dashboard', label: '推荐仪表板',  icon: '📊' },
  { id: 'flow',      label: '业务流可视化', icon: '🔄' },
];
const blockedProductPattern = /内衣|文胸|胸罩|睡衣|情趣|泳装|比基尼|抹胸|聚拢|桑蚕丝|蕾丝|性感/i;
const safeProducts = computed(() =>
  products.value.filter((product) => !blockedProductPattern.test(`${product?.name || ''} ${product?.category || ''}`))
);

async function refreshData() {
  await loadRecommendations({ userBehavior: behaviorLog.value, allProducts: safeProducts.value });
  updateAnalysis();
  const d = getDashboardData(behaviorLog.value, safeProducts.value);
  conversionFunnelData.value = {
    view:        d.funnel.view ?? 0,
    viewToClick: parseFloat(d.funnel.viewToClick) || 0,
    clickToFav:  parseFloat(d.funnel.clickToFav)  || 0,
    favToCart:   parseFloat(d.funnel.favToCart)   || 0,
    cartToBuy:   parseFloat(d.funnel.cartToBuy)   || 0,
  };
}

onMounted(async () => {
  await loadTmallData();
  await refreshData();
});
</script>

<style scoped>
.recommendation-page {
  display: flex;
  flex-direction: column;
  gap: 0;
  /* 覆盖 workspace-page 的滚动，让内部 tab-scroll-area 单独滚 */
  overflow: hidden !important;
}

.tabs-header {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.07);
  margin-bottom: 0;
  overflow: hidden;
  flex-shrink: 0;
}

.tab-scroll-area {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 6px 0 0;
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

@media (max-width: 768px) {
  .tabs        { flex-wrap: wrap; }
  .tab         { flex: 0 1 calc(50% - 2px); }
}
</style>
 
