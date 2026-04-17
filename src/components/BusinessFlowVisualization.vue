<template>
  <div class="biz-flow">
    <div class="header"><h2>推荐系统完整业务流</h2><p>从用户行为到推荐转化的全链路</p></div>
    <div class="flow">
      <template v-for="(stage, index) in flowStages" :key="stage.key">
        <div class="stage" :class="stage.stageClass">
          <div class="stage-glow"></div>
          <div class="icon">{{ stage.icon }}</div>
          <div class="title">{{ stage.title }}</div>
          <div class="stage-kicker">{{ stage.kicker }}</div>
          <div class="content" :class="stage.contentClass">
            <template v-if="stage.key === 'behavior'">
              <div class="item"><span>浏览</span><span>{{ behaviorStats.view || 0 }}</span></div>
              <div class="item"><span>点击</span><span>{{ behaviorStats.click || 0 }}</span></div>
              <div class="item"><span>收藏</span><span>{{ behaviorStats.fav || 0 }}</span></div>
              <div class="item"><span>购物车</span><span>{{ behaviorStats.cart || 0 }}</span></div>
              <div class="item"><span>购买</span><span>{{ behaviorStats.buy || 0 }}</span></div>
            </template>
            <template v-else-if="stage.key === 'interest'">
              <div v-for="item in topInterests" :key="item.key" class="interest">
                <div>{{ categoryLabels[item.key] || item.key }}</div><div class="bar"><div class="fill" :style="{ width: item.pct + '%', backgroundColor: getCategoryColor(item.key) }"></div></div>
                <div>{{ item.pct }}%</div>
              </div>
            </template>
            <template v-else-if="stage.key === 'model'">
              <div v-for="m in models" :key="m.key" class="model"><div>{{ m.name }}</div><div>{{ (m.weight * 100).toFixed(0) }}%</div></div>
            </template>
            <template v-else-if="stage.key === 'fusion'">
              <div class="item"><span>融合方式</span><span>加权平均</span></div>
              <div class="item"><span>推荐数量</span><span>{{ recommendations.length }}</span></div>
              <div class="item"><span>平均分数</span><span>{{ avgScore }}</span></div>
            </template>
            <template v-else>
              <div class="item"><span>点击率</span><span>{{ metrics.ctr }}</span></div>
              <div class="item"><span>转化率</span><span>{{ metrics.cvr }}</span></div>
              <div class="item"><span>总转化</span><span>{{ metrics.totalConversions }}</span></div>
            </template>
          </div>
        </div>
        <div v-if="index < flowStages.length - 1" class="arrow" aria-hidden="true">
          <span class="arrow-line"></span>
          <span class="arrow-core"></span>
          <span class="arrow-head"></span>
        </div>
      </template>
    </div>
    <div class="details">
      <div class="grid">
        <div class="card"><h3>推荐结果</h3>
          <div class="table">
            <div class="thead"><div>排名</div><div>商品</div><div>模型</div></div>
            <div v-for="(r, i) in recommendations.slice(0, 8)" :key="r.itemId" class="tr">
              <div>{{ i + 1 }}</div><div>{{ r.product?.name }}</div>
              <div><span v-for="m in r.models" :key="m" class="tag">{{ m }}</span></div>
            </div>
          </div>
        </div>
        <div class="card"><h3>转化漏斗</h3>
          <div class="funnel">
            <div class="fstage fstage-view">
              <div class="fshape">
                <span>浏览</span>
                <strong>{{ displayFunnel.view }}</strong>
              </div>
            </div>
            <div class="fstage fstage-click">
              <div class="fshape">
                <span>点击</span>
                <strong>{{ displayFunnel.viewToClick.toFixed(1) }}%</strong>
              </div>
            </div>
            <div class="fstage fstage-fav">
              <div class="fshape">
                <span>收藏</span>
                <strong>{{ displayFunnel.clickToFav.toFixed(1) }}%</strong>
              </div>
            </div>
            <div class="fstage fstage-cart">
              <div class="fshape">
                <span>购物车</span>
                <strong>{{ displayFunnel.favToCart.toFixed(1) }}%</strong>
              </div>
            </div>
            <div class="fstage fstage-buy">
              <div class="fshape">
                <span>购买</span>
                <strong>{{ displayFunnel.cartToBuy.toFixed(1) }}%</strong>
              </div>
            </div>
          </div>
          <div class="funnel-summary">
            <div v-for="item in funnelSummary" :key="item.label" class="funnel-summary-item">
              <span>{{ item.label }}</span>
              <strong>{{ item.value }}</strong>
            </div>
          </div>
        </div>
      </div>
      <div class="insight-strip">
        <div class="insight-card">
          <div class="insight-title">推荐洞察</div>
          <div class="insight-list">
            <div v-for="item in recommendationInsights" :key="item.label" class="insight-item">
              <span class="insight-label">{{ item.label }}</span>
              <strong class="insight-value">{{ item.value }}</strong>
            </div>
          </div>
        </div>
        <div class="insight-card">
          <div class="insight-title">模型构成</div>
          <div class="model-stack">
            <div v-for="m in models" :key="m.key" class="model-stack-item">
              <div class="model-stack-head">
                <span>{{ m.name }}</span>
                <b>{{ (m.weight * 100).toFixed(0) }}%</b>
              </div>
              <div class="model-stack-track">
                <div class="model-stack-fill" :style="{ width: (m.weight * 100).toFixed(0) + '%', background: modelFillColor(m.key) }"></div>
              </div>
            </div>
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
import { useTmallData } from '@/composables/useTmallData';
import { useEnhancedRecommendation, getDashboardData } from '@/services/enhancedRecommendationComposer';

defineOptions({ name: 'BusinessFlowVisualization' });

const { products, behaviorLog, categoryLabels, categoryColors, loadAll: loadTmallData } = useTmallData();
const { recommendations, userProfile, analysis, loadRecommendations, updateUserProfile, updateAnalysis } = useEnhancedRecommendation();
const blockedProductPattern = /内衣|文胸|胸罩|睡衣|情趣|泳装|比基尼|抹胸|聚拢|桑蚕丝|蕾丝|性感/i;
const safeProducts = computed(() =>
  products.value.filter((product) => !blockedProductPattern.test(`${product?.name || ''} ${product?.category || ''}`))
);

const conversionFunnel = ref({ view: 0, viewToClick: 0, clickToFav: 0, favToCart: 0, cartToBuy: 0 });
const behaviorStats = ref({ view: 0, click: 0, fav: 0, cart: 0, buy: 0 });
const models = ref([
  { key: 'ccdrec', name: 'CCDRec', weight: 0.6 },
  { key: 'collaborative', name: '协同过滤', weight: 0.25 },
  { key: 'content', name: '内容推荐', weight: 0.15 },
]);

function getCategoryColor(c) { return categoryColors[c] || '#95A5A6'; }

const interestNormalized = computed(() => userProfile.value?.interestNormalized || {});
const topInterests = computed(() => {
  const n = interestNormalized.value;
  return Object.entries(n)
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([key, pct]) => ({ key, pct }));
});
const metrics = computed(() => analysis.value?.overview || {});
const avgScore = computed(() => {
  if (!recommendations.value.length) return '0.00';
  return (recommendations.value.reduce((a, r) => a + r.fusedScore, 0) / recommendations.value.length).toFixed(3);
});
const displayFunnel = computed(() => {
  const view = behaviorStats.value.view || 0;
  const click = Math.min(behaviorStats.value.click || 0, view);
  const fav = Math.min(behaviorStats.value.fav || 0, click);
  const cart = Math.min(behaviorStats.value.cart || 0, fav);
  const buy = Math.min(behaviorStats.value.buy || 0, cart);
  const rate = (from, to) => (from > 0 ? Number(((to / from) * 100).toFixed(1)) : 0);

  return {
    view,
    click,
    fav,
    cart,
    buy,
    viewToClick: rate(view, click),
    clickToFav: rate(click, fav),
    favToCart: rate(fav, cart),
    cartToBuy: rate(cart, buy),
  };
});
const flowStages = computed(() => [
  { key: 'behavior', icon: '📊', title: '用户行为采集', kicker: '原始行为流', stageClass: 'stage-behavior', contentClass: '' },
  { key: 'interest', icon: '🎯', title: '兴趣向量', kicker: '偏好抽取', stageClass: 'stage-interest-card', contentClass: 'content-interest' },
  { key: 'model', icon: '🤖', title: '多模型推荐', kicker: '候选召回', stageClass: 'stage-model', contentClass: '' },
  { key: 'fusion', icon: '🔀', title: '推荐融合', kicker: '重排评分', stageClass: 'stage-fusion', contentClass: '' },
  { key: 'interaction', icon: '👆', title: '用户交互', kicker: '反馈闭环', stageClass: 'stage-feedback', contentClass: '' },
]);
const recommendationInsights = computed(() => {
  const top = recommendations.value.slice(0, 8);
  const uniqueModels = new Set(top.flatMap((item) => item.models || []));
  const uniqueCats = new Set(top.map((item) => item.product?.category).filter(Boolean));
  return [
    { label: 'Top8 平均分', value: avgScore.value },
    { label: '覆盖品类', value: `${uniqueCats.size} 类` },
    { label: 'Top8 入围模型数', value: `${uniqueModels.size} 个` },
  ];
});
const funnelSummary = computed(() => [
  { label: '浏览→点击', value: `${displayFunnel.value.viewToClick.toFixed(1)}%` },
  { label: '点击→收藏', value: `${displayFunnel.value.clickToFav.toFixed(1)}%` },
  { label: '加购→购买', value: `${displayFunnel.value.cartToBuy.toFixed(1)}%` },
]);
function modelFillColor(key) {
  return key === 'ccdrec'
    ? 'linear-gradient(90deg,#667eea,#764ba2)'
    : key === 'collaborative'
      ? 'linear-gradient(90deg,#10b981,#34d399)'
      : 'linear-gradient(90deg,#f59e0b,#fb923c)';
}

function updateBehaviorStats() {
  const s = { view: 0, click: 0, fav: 0, cart: 0, buy: 0 };
  behaviorLog.value.forEach(({ action }) => { if (s.hasOwnProperty(action)) s[action]++; });
  behaviorStats.value = s;
}

onMounted(async () => {
  await loadTmallData();
  updateBehaviorStats();
  if (!recommendations.value.length) {
    await loadRecommendations({ userBehavior: behaviorLog.value, allProducts: safeProducts.value });
  }
  updateUserProfile(behaviorLog.value);
  updateAnalysis();
  const d = getDashboardData(behaviorLog.value, safeProducts.value);
  conversionFunnel.value = {
    view: behaviorStats.value.view || 0,
    viewToClick: parseFloat(d.funnel.viewToClick) || 0,
    clickToFav:  parseFloat(d.funnel.clickToFav)  || 0,
    favToCart:   parseFloat(d.funnel.favToCart)   || 0,
    cartToBuy:   parseFloat(d.funnel.cartToBuy)   || 0,
  };
});
</script>

<style scoped>
.biz-flow { padding: 32px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; }
.header { text-align: center; margin-bottom: 40px; color: white; }
.header h2 { font-size: 32px; font-weight: 800; margin-bottom: 8px; }
.header p { font-size: 16px; opacity: 0.9; }
.flow { display: flex; align-items: center; gap: 16px; margin-bottom: 40px; overflow-x: auto; padding: 24px; background: rgba(255,255,255,0.12); border-radius: 20px; backdrop-filter: blur(12px); }
.stage { position: relative; flex-shrink: 0; width: 210px; background: linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(243,246,255,0.94) 100%); border-radius: 18px; padding: 20px; border: 1px solid rgba(255,255,255,0.75); box-shadow: 0 14px 36px rgba(15,23,42,0.14); transition: transform .3s ease, box-shadow .3s ease; overflow: hidden; }
.stage-interest-card { width: 290px; }
.stage:hover { transform: translateY(-8px) scale(1.01); box-shadow: 0 18px 40px rgba(15,23,42,0.18); }
.stage-glow { position: absolute; inset: -30% auto auto -20%; width: 110px; height: 110px; border-radius: 999px; background: radial-gradient(circle, rgba(102,126,234,0.26) 0%, rgba(102,126,234,0) 72%); pointer-events: none; }
.stage-behavior .stage-glow { background: radial-gradient(circle, rgba(59,130,246,0.24) 0%, rgba(59,130,246,0) 72%); }
.stage-interest-card .stage-glow { background: radial-gradient(circle, rgba(16,185,129,0.24) 0%, rgba(16,185,129,0) 72%); }
.stage-model .stage-glow { background: radial-gradient(circle, rgba(168,85,247,0.24) 0%, rgba(168,85,247,0) 72%); }
.stage-fusion .stage-glow { background: radial-gradient(circle, rgba(245,158,11,0.24) 0%, rgba(245,158,11,0) 72%); }
.stage-feedback .stage-glow { background: radial-gradient(circle, rgba(236,72,153,0.22) 0%, rgba(236,72,153,0) 72%); }
.icon { font-size: 32px; margin-bottom: 12px; }
.title { font-size: 14px; font-weight: 700; color: #2c3e50; margin-bottom: 12px; }
.stage-kicker { font-size: 11px; font-weight: 700; color: #7c8aa5; letter-spacing: .06em; text-transform: uppercase; margin-bottom: 10px; }
.content { display: flex; flex-direction: column; gap: 8px; }
.content-interest { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px 12px; }
.item { display: flex; justify-content: space-between; font-size: 12px; }
.item span:first-child { color: #7f8c8d; }
.item span:last-child { font-weight: 700; color: #e74c3c; }
.interest { display: flex; flex-direction: column; gap: 4px; font-size: 11px; }
.interest div:first-child { color: #7f8c8d; font-weight: 500; }
.bar { height: 12px; background: #ecf0f1; border-radius: 8px; overflow: hidden; }
.fill { height: 100%; transition: width 0.3s; }
.interest div:last-child { color: #2c3e50; font-weight: 600; }
.model { padding: 8px; background: #f8f9fa; border-radius: 6px; }
.model div:first-child { font-size: 12px; font-weight: 600; color: #2c3e50; }
.model div:last-child { font-size: 11px; color: #95a5a6; margin-top: 2px; }
.arrow { position: relative; flex-shrink: 0; width: 56px; height: 18px; display: flex; align-items: center; justify-content: center; opacity: 0.9; }
.arrow-line { position: absolute; left: 6px; right: 10px; height: 1px; border-radius: 999px; background: linear-gradient(90deg, rgba(255,255,255,0.18), rgba(255,255,255,0.62), rgba(255,255,255,0.18)); overflow: hidden; }
.arrow-core { position: absolute; left: 8px; width: 14px; height: 4px; border-radius: 999px; background: linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.75), rgba(255,255,255,0)); filter: blur(0.5px); animation: flowPulse 2.2s ease-in-out infinite; }
.arrow-head { position: absolute; right: 6px; width: 8px; height: 8px; border-top: 2px solid rgba(255,255,255,0.78); border-right: 2px solid rgba(255,255,255,0.78); transform: rotate(45deg); }
@keyframes flowPulse { from { transform: translateX(0); opacity: .2; } 50% { opacity: .75; } to { transform: translateX(28px); opacity: .2; } }
.details { background: white; border-radius: 16px; padding: 24px; box-shadow: 0 12px 40px rgba(0,0,0,0.15); }
.grid { display: grid; grid-template-columns: minmax(0, 1.15fr) minmax(320px, 0.85fr); gap: 20px; margin-bottom: 20px; align-items: start; }
.card { background: linear-gradient(180deg, #fbfcff 0%, #f4f7fb 100%); border-radius: 16px; padding: 20px; border: 1px solid #edf2f7; }
.card h3 { font-size: 16px; font-weight: 700; color: #2c3e50; margin-bottom: 12px; border-bottom: 2px solid #ecf0f1; padding-bottom: 10px; }
.table { display: flex; flex-direction: column; gap: 6px; }
.thead { display: grid; grid-template-columns: 40px minmax(0, 1fr) 132px; gap: 10px; padding: 10px 12px; background: white; border-radius: 8px; font-weight: 700; font-size: 12px; color: #7f8c8d; }
.tr { display: grid; grid-template-columns: 40px minmax(0, 1fr) 132px; gap: 10px; padding: 10px 12px; background: white; border-radius: 8px; align-items: center; font-size: 12px; transition: all 0.2s; }
.tr:hover { background: #ecf0f1; }
.tr div:first-child { font-weight: 700; color: #667eea; }
.tr div:nth-child(2) { color: #2c3e50; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.tag { background: #e8f4f8; color: #3498db; padding: 2px 6px; border-radius: 4px; font-size: 10px; margin-right: 4px; }
.funnel { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 8px 0 4px; }
.fstage { width: 100%; display: flex; justify-content: center; }
.fshape {
  height: 48px;
  color: #1f2937;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 18px;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
  clip-path: polygon(0 0, 100% 0, 94% 100%, 6% 100%);
}
.fshape span { font-size: 12px; font-weight: 700; letter-spacing: 0.2px; }
.fshape strong { font-size: 14px; font-weight: 800; }
.fstage-view .fshape { width: 96%; background: linear-gradient(90deg, #dbeafe 0%, #bfdbfe 100%); }
.fstage-click .fshape { width: 82%; background: linear-gradient(90deg, #c7f9e5 0%, #9ee6cf 100%); }
.fstage-fav .fshape { width: 68%; background: linear-gradient(90deg, #fde68a 0%, #fcd34d 100%); }
.fstage-cart .fshape { width: 54%; background: linear-gradient(90deg, #fdba74 0%, #fb923c 100%); }
.fstage-buy .fshape { width: 40%; background: linear-gradient(90deg, #fca5a5 0%, #f87171 100%); }
.funnel-summary { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; margin-top: 18px; }
.funnel-summary-item { background: rgba(255,255,255,0.82); border: 1px solid #e6edf5; border-radius: 12px; padding: 10px 12px; text-align: center; }
.funnel-summary-item span { display: block; font-size: 11px; color: #64748b; margin-bottom: 4px; }
.funnel-summary-item strong { font-size: 16px; color: #1f2937; }
.insight-strip { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; margin-bottom: 20px; }
.insight-card { background: linear-gradient(180deg,#f8fbff 0%,#f3f6fb 100%); border: 1px solid #e7edf6; border-radius: 14px; padding: 16px; }
.insight-title { font-size: 13px; font-weight: 800; color: #334155; margin-bottom: 12px; }
.insight-list { display: flex; flex-direction: column; gap: 10px; }
.insight-item { display: flex; justify-content: space-between; align-items: center; padding: 10px 12px; background: rgba(255,255,255,0.82); border-radius: 10px; border: 1px solid #edf2f7; }
.insight-label { font-size: 12px; color: #64748b; }
.insight-value { font-size: 16px; color: #1f2937; }
.model-stack { display: flex; flex-direction: column; gap: 12px; }
.model-stack-head { display: flex; justify-content: space-between; align-items: center; font-size: 12px; color: #475569; margin-bottom: 6px; }
.model-stack-head b { color: #1f2937; font-size: 13px; }
.model-stack-track { height: 10px; border-radius: 999px; background: #e9eef5; overflow: hidden; }
.model-stack-fill { height: 100%; border-radius: 999px; transition: width .5s ease; }
.metrics h3 { font-size: 16px; font-weight: 700; color: #2c3e50; margin-bottom: 12px; border-bottom: 2px solid #ecf0f1; padding-bottom: 10px; }
.mgrid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
.mbox { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; padding: 16px 14px; color: white; text-align: center; transition: all 0.3s; }
.mbox:hover { transform: translateY(-4px); box-shadow: 0 8px 20px rgba(102,126,234,0.3); }
.mbox div:first-child { font-size: 12px; opacity: 0.9; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px; }
.val { font-size: 24px; font-weight: 800; line-height: 1.1; }
@media (max-width: 1200px) { .grid { grid-template-columns: 1fr; } .insight-strip { grid-template-columns: 1fr; } .mgrid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 768px) { .biz-flow { padding: 16px; } .header h2 { font-size: 24px; } .mgrid { grid-template-columns: 1fr; } .stage-interest-card { width: 220px; } .content-interest { grid-template-columns: 1fr; } .details { padding: 16px; } .card { padding: 14px; } .thead, .tr { grid-template-columns: 32px minmax(0, 1fr) 92px; gap: 8px; padding: 8px 10px; } .fshape { height: 42px; padding: 0 12px; } .fshape span { font-size: 11px; } .fshape strong { font-size: 12px; } .funnel-summary { grid-template-columns: 1fr; } }
</style>
