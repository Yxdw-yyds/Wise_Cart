<template>
  <div class="biz-flow">
    <div class="header"><h2>推荐系统完整业务流</h2><p>从用户行为到推荐转化的全链路</p></div>
    <div class="flow">
      <div class="stage"><div class="icon">📊</div><div class="title">用户行为采集</div><div class="content">
        <div class="item"><span>浏览</span><span>{{ behaviorStats.view || 0 }}</span></div>
        <div class="item"><span>点击</span><span>{{ behaviorStats.click || 0 }}</span></div>
        <div class="item"><span>收藏</span><span>{{ behaviorStats.fav || 0 }}</span></div>
        <div class="item"><span>购物车</span><span>{{ behaviorStats.cart || 0 }}</span></div>
        <div class="item"><span>购买</span><span>{{ behaviorStats.buy || 0 }}</span></div>
      </div></div>
      <div class="arrow">→</div>
      <div class="stage"><div class="icon">🎯</div><div class="title">兴趣向量</div><div class="content">
        <div v-for="(p, c) in interestNormalized" :key="c" class="interest">
          <div>{{ categoryLabels[c] }}</div><div class="bar"><div class="fill" :style="{ width: p + '%', backgroundColor: getCategoryColor(c) }"></div></div>
          <div>{{ p }}%</div>
        </div>
      </div></div>
      <div class="arrow">→</div>
      <div class="stage"><div class="icon">🤖</div><div class="title">多模型推荐</div><div class="content">
        <div v-for="m in models" :key="m.key" class="model"><div>{{ m.name }}</div><div>{{ (m.weight * 100).toFixed(0) }}%</div></div>
      </div></div>
      <div class="arrow">→</div>
      <div class="stage"><div class="icon">🔀</div><div class="title">推荐融合</div><div class="content">
        <div class="item"><span>融合方式</span><span>加权平均</span></div>
        <div class="item"><span>推荐数量</span><span>{{ recommendations.length }}</span></div>
        <div class="item"><span>平均分数</span><span>{{ avgScore }}</span></div>
      </div></div>
      <div class="arrow">→</div>
      <div class="stage"><div class="icon">👆</div><div class="title">用户交互</div><div class="content">
        <div class="item"><span>点击率</span><span>{{ metrics.ctr }}</span></div>
        <div class="item"><span>转化率</span><span>{{ metrics.cvr }}</span></div>
        <div class="item"><span>总转化</span><span>{{ metrics.totalConversions }}</span></div>
      </div></div>
    </div>
    <div class="details">
      <div class="grid">
        <div class="card"><h3>推荐结果</h3>
          <div class="table">
            <div class="thead"><div>排名</div><div>商品</div><div>分数</div><div>模型</div></div>
            <div v-for="(r, i) in recommendations.slice(0, 8)" :key="r.itemId" class="tr">
              <div>{{ i + 1 }}</div><div>{{ r.product?.name }}</div><div class="badge">{{ (r.fusedScore * 100).toFixed(0) }}</div>
              <div><span v-for="m in r.models" :key="m" class="tag">{{ m }}</span></div>
            </div>
          </div>
        </div>
        <div class="card"><h3>转化漏斗</h3>
          <div class="funnel">
            <div class="fitem"><div>浏览</div><div class="fbar" style="width: 100%"><span>{{ conversionFunnel.view }}</span></div></div>
            <div class="fitem"><div>点击</div><div class="fbar" :style="{ width: conversionFunnel.viewToClick + '%' }"><span>{{ conversionFunnel.viewToClick.toFixed(1) }}%</span></div></div>
            <div class="fitem"><div>收藏</div><div class="fbar" :style="{ width: conversionFunnel.clickToFav + '%' }"><span>{{ conversionFunnel.clickToFav.toFixed(1) }}%</span></div></div>
            <div class="fitem"><div>购物车</div><div class="fbar" :style="{ width: conversionFunnel.favToCart + '%' }"><span>{{ conversionFunnel.favToCart.toFixed(1) }}%</span></div></div>
            <div class="fitem"><div>购买</div><div class="fbar" :style="{ width: conversionFunnel.cartToBuy + '%' }"><span>{{ conversionFunnel.cartToBuy.toFixed(1) }}%</span></div></div>
          </div>
        </div>
      </div>
      <div class="metrics"><h3>关键指标</h3>
        <div class="mgrid">
          <div class="mbox"><div>推荐点击率</div><div class="val">{{ metrics.ctr }}</div></div>
          <div class="mbox"><div>转化率</div><div class="val">{{ metrics.cvr }}</div></div>
          <div class="mbox"><div>总推荐数</div><div class="val">{{ metrics.totalRecommendations }}</div></div>
          <div class="mbox"><div>总转化数</div><div class="val">{{ metrics.totalConversions }}</div></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue';
import { useUserMallData } from '@/composables/useUserMallData';
import { useEnhancedRecommendation, getDashboardData } from '@/services/enhancedRecommendationComposer';

defineOptions({ name: 'BusinessFlowVisualization' });

const { products, behaviorLog, categoryLabels } = useUserMallData();
const { recommendations, userProfile, analysis, loadRecommendations, updateUserProfile, updateAnalysis } = useEnhancedRecommendation();

const conversionFunnel = ref({ view: 0, viewToClick: 0, clickToFav: 0, favToCart: 0, cartToBuy: 0 });
const behaviorStats = ref({ view: 0, click: 0, fav: 0, cart: 0, buy: 0 });
const models = ref([
  { key: 'ccdrec', name: 'CCDRec', weight: 0.6 },
  { key: 'collaborative', name: '协同过滤', weight: 0.25 },
  { key: 'content', name: '内容推荐', weight: 0.15 },
]);

const colorMap = { drink: '#FF6B6B', snack: '#4ECDC4', daily: '#45B7D1', food: '#FFA07A', beauty: '#FF69B4', digital: '#9B59B6' };

function getCategoryColor(c) { return colorMap[c] || '#95A5A6'; }

const interestNormalized = computed(() => userProfile.value?.interestNormalized || {});
const metrics = computed(() => analysis.value?.overview || {});
const avgScore = computed(() => {
  if (!recommendations.value.length) return '0.00';
  return (recommendations.value.reduce((a, r) => a + r.fusedScore, 0) / recommendations.value.length).toFixed(2);
});

function updateBehaviorStats() {
  const s = { view: 0, click: 0, fav: 0, cart: 0, buy: 0 };
  behaviorLog.value.forEach(({ action }) => { if (s.hasOwnProperty(action)) s[action]++; });
  behaviorStats.value = s;
}

onMounted(async () => {
  updateBehaviorStats();
  await loadRecommendations({ userBehavior: behaviorLog.value, allProducts: products.value });
  updateUserProfile(behaviorLog.value);
  updateAnalysis();
  const d = getDashboardData(behaviorLog.value, products.value);
  conversionFunnel.value = d.funnel;
});
</script>

<style scoped>
.biz-flow { padding: 32px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; }
.header { text-align: center; margin-bottom: 40px; color: white; }
.header h2 { font-size: 32px; font-weight: 800; margin-bottom: 8px; }
.header p { font-size: 16px; opacity: 0.9; }
.flow { display: flex; align-items: center; gap: 16px; margin-bottom: 40px; overflow-x: auto; padding: 20px; background: rgba(255,255,255,0.1); border-radius: 16px; backdrop-filter: blur(10px); }
.stage { flex-shrink: 0; width: 200px; background: white; border-radius: 12px; padding: 20px; box-shadow: 0 8px 24px rgba(0,0,0,0.12); transition: all 0.3s; }
.stage:hover { transform: translateY(-8px); box-shadow: 0 12px 32px rgba(0,0,0,0.16); }
.icon { font-size: 32px; margin-bottom: 12px; }
.title { font-size: 14px; font-weight: 700; color: #2c3e50; margin-bottom: 12px; }
.content { display: flex; flex-direction: column; gap: 8px; }
.item { display: flex; justify-content: space-between; font-size: 12px; }
.item span:first-child { color: #7f8c8d; }
.item span:last-child { font-weight: 700; color: #e74c3c; }
.interest { display: flex; flex-direction: column; gap: 4px; font-size: 11px; }
.interest div:first-child { color: #7f8c8d; font-weight: 500; }
.bar { height: 16px; background: #ecf0f1; border-radius: 8px; overflow: hidden; }
.fill { height: 100%; transition: width 0.3s; }
.interest div:last-child { color: #2c3e50; font-weight: 600; }
.model { padding: 8px; background: #f8f9fa; border-radius: 6px; }
.model div:first-child { font-size: 12px; font-weight: 600; color: #2c3e50; }
.model div:last-child { font-size: 11px; color: #95a5a6; margin-top: 2px; }
.arrow { flex-shrink: 0; font-size: 24px; color: white; font-weight: 700; }
.details { background: white; border-radius: 16px; padding: 32px; box-shadow: 0 12px 40px rgba(0,0,0,0.15); }
.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-bottom: 32px; }
.card { background: #f8f9fa; border-radius: 12px; padding: 24px; }
.card h3 { font-size: 16px; font-weight: 700; color: #2c3e50; margin-bottom: 16px; border-bottom: 2px solid #ecf0f1; padding-bottom: 12px; }
.table { display: flex; flex-direction: column; gap: 8px; }
.thead { display: grid; grid-template-columns: 40px 1fr 80px 100px; gap: 12px; padding: 12px; background: white; border-radius: 8px; font-weight: 700; font-size: 12px; color: #7f8c8d; }
.tr { display: grid; grid-template-columns: 40px 1fr 80px 100px; gap: 12px; padding: 12px; background: white; border-radius: 8px; align-items: center; font-size: 12px; transition: all 0.2s; }
.tr:hover { background: #ecf0f1; }
.tr div:first-child { font-weight: 700; color: #667eea; }
.tr div:nth-child(2) { color: #2c3e50; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.badge { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 4px 8px; border-radius: 6px; font-weight: 700; }
.tag { background: #e8f4f8; color: #3498db; padding: 2px 6px; border-radius: 4px; font-size: 10px; margin-right: 4px; }
.funnel { display: flex; flex-direction: column; gap: 12px; }
.fitem { display: flex; align-items: center; gap: 12px; }
.fitem div:first-child { width: 60px; font-size: 12px; font-weight: 600; color: #2c3e50; }
.fbar { flex: 1; height: 32px; background: linear-gradient(90deg, #667eea 0%, #764ba2 100%); border-radius: 6px; display: flex; align-items: center; justify-content: flex-end; padding-right: 12px; min-width: 60px; transition: all 0.3s; }
.fbar span { color: white; font-weight: 700; font-size: 12px; }
.metrics h3 { font-size: 16px; font-weight: 700; color: #2c3e50; margin-bottom: 16px; border-bottom: 2px solid #ecf0f1; padding-bottom: 12px; }
.mgrid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; }
.mbox { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; padding: 20px; color: white; text-align: center; transition: all 0.3s; }
.mbox:hover { transform: translateY(-4px); box-shadow: 0 8px 20px rgba(102,126,234,0.3); }
.mbox div:first-child { font-size: 12px; opacity: 0.9; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
.val { font-size: 28px; font-weight: 800; }
@media (max-width: 1200px) { .grid { grid-template-columns: 1fr; } }
@media (max-width: 768px) { .biz-flow { padding: 16px; } .header h2 { font-size: 24px; } .mgrid { grid-template-columns: 1fr; } }
</style>
