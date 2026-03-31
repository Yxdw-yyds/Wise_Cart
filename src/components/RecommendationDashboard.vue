<template>
  <div class="rec-dashboard">
    <div class="metrics-row">
      <div v-for="card in metricCards" :key="card.key" class="metric-card" :class="card.colorClass">
        <div class="mc-icon">{{ card.icon }}</div>
        <div class="mc-label">{{ card.label }}</div>
        <div class="mc-value">{{ card.value }}</div>
        <div class="mc-trend">{{ card.trend }}</div>
      </div>
    </div>
    <div class="main-grid">
      <div class="panel panel-radar">
        <div class="panel-header">
          <span class="panel-title">用户兴趣分布</span>
          <span class="live-badge">● 实时</span>
        </div>
        <div ref="radarRef" class="echart-box"></div>
        <div class="top-cats">
          <div v-for="cat in topCategories" :key="cat.key" class="top-cat-item">
            <span class="cat-dot" :style="{ background: categoryColors[cat.key] }"></span>
            <span class="cat-name">{{ categoryLabels[cat.key] }}</span>
            <span class="cat-pct">{{ cat.percent }}%</span>
          </div>
        </div>
      </div>
      <div class="panel panel-recs">
        <div class="panel-header">
          <span class="panel-title">个性化推荐</span>
          <div class="header-actions">
            <button class="sim-btn" :class="{ running: simRunning }" @click="toggleSim">{{ simRunning ? '⏹ 停止模拟' : '▶ 模拟行为' }}</button>
            <button class="refresh-btn" @click="doRefresh">↻ 刷新</button>
          </div>
        </div>
        <div v-if="loading" class="loading-state">
          <div class="spinner"></div><span>推荐计算中…</span>
        </div>
        <div v-else class="rec-cards-grid">
          <RecommendProductCard
            v-for="rec in recommendations.slice(0,8)" :key="rec.itemId"
            :item-id="rec.itemId" :product="rec.product" :fused-score="rec.fusedScore"
            :rank="rec.rank" :models="rec.models" :explanation="rec.explanation"
            :category-labels="categoryLabels" @interact="handleInteract"
          />
        </div>
        <div class="event-stream">
          <span class="stream-label">事件流</span>
          <transition-group name="stream-item" tag="div" class="stream-list">
            <div v-for="evt in recentEvents.slice(0,6)" :key="evt.id" class="stream-evt">
              <span class="evt-time">{{ evt.timeStr }}</span>
              <span class="evt-action" :class="`act-${evt.action}`">{{ actionLabels[evt.action] || evt.action }}</span>
              <span class="evt-name">{{ evt.productName }}</span>
            </div>
          </transition-group>
        </div>
      </div>
      <div class="panel panel-funnel">
        <div class="panel-header"><span class="panel-title">转化漏斗</span></div>
        <div ref="funnelRef" class="echart-box echart-funnel"></div>
        <div class="funnel-rates">
          <div class="rate-item"><span>浏览→点击</span><b>{{ funnel.viewToClick.toFixed(1) }}%</b></div>
          <div class="rate-item"><span>点击→收藏</span><b>{{ funnel.clickToFav.toFixed(1) }}%</b></div>
          <div class="rate-item"><span>收藏→加购</span><b>{{ funnel.favToCart.toFixed(1) }}%</b></div>
          <div class="rate-item"><span>加购→购买</span><b>{{ funnel.cartToBuy.toFixed(1) }}%</b></div>
        </div>
      </div>
    </div>
    <div class="bottom-grid">
      <div class="panel panel-efficiency">
        <div class="panel-header"><span class="panel-title">推荐效率</span></div>
        <div class="eff-grid">
          <div class="eff-item"><div class="eff-val">{{ behaviorLog.length }}</div><div class="eff-lbl">行为事件总数</div></div>
          <div class="eff-item"><div class="eff-val">{{ behaviorLog.filter(e=>e.action==='buy').length }}</div><div class="eff-lbl">购买次数</div></div>
          <div class="eff-item"><div class="eff-val">{{ behaviorLog.filter(e=>e.action==='cart').length }}</div><div class="eff-lbl">加购次数</div></div>
          <div class="eff-item"><div class="eff-val">{{ recommendations.length }}</div><div class="eff-lbl">当前推荐数</div></div>
        </div>
      </div>
      <div class="panel panel-model-weight">
        <div class="panel-header"><span class="panel-title">模型贡献度</span></div>
        <div class="model-bars">
          <div class="model-bar-item"><span class="mbar-label">CCDRec 深度学习</span><div class="mbar-track"><div class="mbar-fill mbar-ccdrec" style="width:60%"></div></div><span class="mbar-pct">60%</span></div>
          <div class="model-bar-item"><span class="mbar-label">协同过滤</span><div class="mbar-track"><div class="mbar-fill mbar-collaborative" style="width:25%"></div></div><span class="mbar-pct">25%</span></div>
          <div class="model-bar-item"><span class="mbar-label">内容推荐</span><div class="mbar-track"><div class="mbar-fill mbar-content" style="width:15%"></div></div><span class="mbar-pct">15%</span></div>
        </div>
        <div class="avg-score-row"><span>平均融合分数</span><strong>{{ avgScore }}</strong></div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import * as echarts from 'echarts';
import { useUserMallData } from '@/composables/useUserMallData';
import { useEnhancedRecommendation, getRecommendationAnalysis, getFullBusinessFlowData } from '@/services/enhancedRecommendationComposer';
import RecommendProductCard from '@/components/RecommendProductCard.vue';

defineOptions({ name: 'RecommendationDashboard' });

const { products, behaviorLog, categoryLabels, userProfile: mallUserProfile, interestVector } = useUserMallData();
const { loading, recommendations, userProfile, analysis, loadRecommendations, updateUserProfile, updateAnalysis, trackInteraction } = useEnhancedRecommendation();

const radarRef = ref(null);
const funnelRef = ref(null);
let radarChart = null;
let funnelChart = null;
const funnel = ref({ view:0, viewToClick:0, clickToFav:0, favToCart:0, cartToBuy:0 });
const recentEvents = ref([]);
let evtCounter = 0;

const actionLabels = { view:'浏览', click:'点击', fav:'收藏', cart:'加购', buy:'购买', skip:'跳过' };
const categoryColors = { drink:'#FF6B6B', snack:'#4ECDC4', daily:'#45B7D1', food:'#FFA07A', beauty:'#FF69B4', digital:'#9B59B6' };

const metricCards = computed(() => [
  { key:'ctr',   icon:'📈', label:'推荐点击率', value: analysis.value?.overview?.ctr || '0%',               trend:'实时更新', colorClass:'mc-blue'   },
  { key:'cvr',   icon:'🎯', label:'推荐转化率', value: analysis.value?.overview?.cvr || '0%',               trend:'实时更新', colorClass:'mc-green'  },
  { key:'total', icon:'📦', label:'总推荐次数', value: analysis.value?.overview?.totalRecommendations || 0, trend:'累计统计', colorClass:'mc-purple' },
  { key:'buy',   icon:'🛒', label:'总购买转化', value: analysis.value?.overview?.totalConversions || 0,     trend:'实时统计', colorClass:'mc-orange' },
]);

const topCategories = computed(() => {
  const n = userProfile.value?.interestNormalized || mallUserProfile.value?.categoryPercents || {};
  return Object.entries(n).map(([key,percent])=>({key,percent:+percent||0})).sort((a,b)=>b.percent-a.percent).slice(0,4);
});

const avgScore = computed(() => {
  if (!recommendations.value.length) return '0.00';
  return (recommendations.value.reduce((a,r)=>a+r.fusedScore,0)/recommendations.value.length).toFixed(2);
});

function renderRadar() {
  if (!radarChart) return;
  const n = userProfile.value?.interestNormalized || mallUserProfile.value?.categoryPercents || {};
  const entries = Object.entries(n);
  if (!entries.length) return;
  radarChart.setOption({
    backgroundColor:'transparent', tooltip:{ trigger:'item' },
    radar:{ radius:'62%', axisName:{ color:'#334155', fontSize:11 },
      splitArea:{ areaStyle:{ color:['rgba(79,70,229,0.03)','rgba(79,70,229,0.08)'] } },
      axisLine:{ lineStyle:{ color:'#cbd5e1' } }, splitLine:{ lineStyle:{ color:'#e2e8f0' } },
      indicator: entries.map(([key])=>({ name: categoryLabels[key]||key, max:40 })),
    },
    series:[{ type:'radar', areaStyle:{ color:'rgba(79,70,229,0.15)' }, lineStyle:{ color:'#4f46e5', width:2.5 },
      symbol:'circle', symbolSize:5, itemStyle:{ color:'#4f46e5' },
      data:[{ value: entries.map(([,v])=>v), name:'兴趣分布' }] }],
  });
}

function renderFunnel() {
  if (!funnelChart) return;
  const f = funnel.value;
  funnelChart.setOption({
    backgroundColor:'transparent', tooltip:{ trigger:'item' },
    series:[{ type:'funnel', left:'10%', width:'80%', top:10, bottom:10, sort:'descending', gap:4,
      label:{ show:true, position:'inside', color:'#fff', fontWeight:700, fontSize:12 },
      itemStyle:{ borderWidth:0 },
      data:[
        { value:100,                        name:'浏览', itemStyle:{ color:'#667eea' } },
        { value:Math.max(f.viewToClick,1),  name:'点击', itemStyle:{ color:'#764ba2' } },
        { value:Math.max(f.clickToFav,0.5), name:'收藏', itemStyle:{ color:'#f093fb' } },
        { value:Math.max(f.favToCart,0.2),  name:'加购', itemStyle:{ color:'#4facfe' } },
        { value:Math.max(f.cartToBuy,0.1),  name:'购买', itemStyle:{ color:'#43e97b' } },
      ],
    }],
  });
}

async function doRefresh() {
  await loadRecommendations({ userBehavior: behaviorLog.value, allProducts: products.value });
  updateUserProfile(behaviorLog.value);
  updateAnalysis();
  const flow = getFullBusinessFlowData(behaviorLog.value, products.value);
  const f = flow.conversion?.funnel || {};
  funnel.value = {
    view:        f.view        ?? behaviorLog.value.filter(e=>e.action==='view').length,
    viewToClick: parseFloat(f.viewToClick) || 0,
    clickToFav:  parseFloat(f.clickToFav)  || 0,
    favToCart:   parseFloat(f.favToCart)   || 0,
    cartToBuy:   parseFloat(f.cartToBuy)   || 0,
  };
  await nextTick();
  renderRadar();
  renderFunnel();
}

function handleInteract({ itemId, action }) {
  const product = products.value.find(p=>p.id===itemId);
  trackInteraction(itemId, action, { rank: recommendations.value.findIndex(r=>r.itemId===itemId)+1 });
  pushEvent({ product, action });
  updateAnalysis();
}

function pushEvent({ product, action }) {
  evtCounter++;
  recentEvents.value.unshift({
    id: evtCounter, action,
    productName: product?.name || `商品${evtCounter}`,
    timeStr: new Date().toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit',second:'2-digit'}),
  });
  if (recentEvents.value.length > 20) recentEvents.value.pop();
}

const simRunning = ref(false);
let simTimer = null;

function toggleSim() {
  if (simRunning.value) {
    clearInterval(simTimer); simTimer = null; simRunning.value = false;
  } else {
    simRunning.value = true;
    simTimer = setInterval(async () => {
      const actions = ['view','view','view','fav','cart','buy'];
      const p = products.value[Math.floor(Math.random() * products.value.length)];
      const action = actions[Math.floor(Math.random() * actions.length)];
      behaviorLog.value.push({ productId: p.id, category: p.category, action, ts: Date.now() });
      pushEvent({ product: p, action });
      evtCounter++;
      if (evtCounter % 5 === 0) { await doRefresh(); }
      else { updateAnalysis(); renderRadar(); }
    }, 1500);
  }
}

function onResize() { radarChart?.resize(); funnelChart?.resize(); }

watch(() => behaviorLog.value.length, () => { updateUserProfile(behaviorLog.value); renderRadar(); });

onMounted(async () => {
  await nextTick();
  radarChart  = radarRef.value  ? echarts.init(radarRef.value)  : null;
  funnelChart = funnelRef.value ? echarts.init(funnelRef.value) : null;
  await doRefresh();
  window.addEventListener('resize', onResize);
});

onBeforeUnmount(() => {
  if (simTimer) clearInterval(simTimer);
  window.removeEventListener('resize', onResize);
  radarChart?.dispose(); funnelChart?.dispose();
});
</script>

<style scoped>
.rec-dashboard { display:flex; flex-direction:column; gap:16px; font-family:'PingFang SC','Microsoft YaHei',system-ui,sans-serif; }

.metrics-row { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:12px; }
.metric-card { border-radius:14px; padding:18px 20px; display:flex; flex-direction:column; gap:6px; box-shadow:0 2px 12px rgba(0,0,0,0.07); transition:transform 0.2s ease,box-shadow 0.2s ease; }
.metric-card:hover { transform:translateY(-3px); box-shadow:0 8px 24px rgba(0,0,0,0.12); }
.mc-blue   { background:linear-gradient(135deg,#e0edff,#c7d9ff); }
.mc-green  { background:linear-gradient(135deg,#d1fae5,#a7f3d0); }
.mc-purple { background:linear-gradient(135deg,#ede9fe,#ddd6fe); }
.mc-orange { background:linear-gradient(135deg,#fff7ed,#fed7aa); }
.mc-icon  { font-size:22px; }
.mc-label { font-size:11px; font-weight:600; color:#64748b; text-transform:uppercase; letter-spacing:0.5px; }
.mc-value { font-size:28px; font-weight:800; color:#1e293b; line-height:1; }
.mc-trend { font-size:11px; color:#94a3b8; }

.main-grid { display:grid; grid-template-columns:minmax(240px,280px) 1fr minmax(220px,260px); gap:14px; align-items:start; }
.panel { background:#fff; border-radius:16px; padding:18px; box-shadow:0 2px 12px rgba(0,0,0,0.07); }
.panel-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:14px; }
.panel-title { font-size:14px; font-weight:700; color:#1e293b; }
.live-badge { font-size:10px; font-weight:700; color:#10b981; background:rgba(16,185,129,0.1); padding:2px 8px; border-radius:999px; animation:pulse 2s infinite; }
@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }

.echart-box { width:100%; height:260px; }
.echart-funnel { height:300px; }
.top-cats { display:flex; flex-direction:column; gap:6px; margin-top:10px; border-top:1px solid #f1f5f9; padding-top:10px; }
.top-cat-item { display:flex; align-items:center; gap:8px; font-size:12px; }
.cat-dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; }
.cat-name { flex:1; color:#475569; }
.cat-pct  { font-weight:700; color:#1e293b; }

.header-actions { display:flex; gap:8px; }
.sim-btn,.refresh-btn { font-size:12px; font-weight:600; padding:5px 12px; border-radius:8px; border:none; cursor:pointer; transition:all 0.2s; }
.sim-btn { background:#4f46e5; color:#fff; }
.sim-btn:hover { background:#4338ca; }
.sim-btn.running { background:#ef4444; }
.refresh-btn { background:#f1f5f9; color:#475569; }
.refresh-btn:hover { background:#e2e8f0; }

.loading-state { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:12px; height:200px; color:#94a3b8; font-size:13px; }
.spinner { width:32px; height:32px; border:3px solid #e2e8f0; border-top-color:#4f46e5; border-radius:50%; animation:spin 0.8s linear infinite; }
@keyframes spin { to{transform:rotate(360deg)} }

.rec-cards-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:10px; margin-bottom:14px; }

.event-stream { border-top:1px solid #f1f5f9; padding-top:12px; display:flex; flex-direction:column; gap:6px; }
.stream-label { font-size:11px; font-weight:700; color:#94a3b8; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:4px; }
.stream-list { display:flex; flex-direction:column; gap:5px; }
.stream-evt { display:flex; align-items:center; gap:8px; font-size:12px; padding:5px 8px; background:#f8fafc; border-radius:7px; }
.evt-time  { color:#94a3b8; min-width:64px; }
.evt-name  { color:#334155; flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.evt-action { font-size:10px; font-weight:700; padding:2px 7px; border-radius:999px; min-width:34px; text-align:center; }
.act-view  { background:#e0edff; color:#4f46e5; }
.act-click { background:#e0edff; color:#4f46e5; }
.act-fav   { background:#fee2e2; color:#ef4444; }
.act-cart  { background:#fff7ed; color:#f59e0b; }
.act-buy   { background:#d1fae5; color:#10b981; }
.act-skip  { background:#f1f5f9; color:#94a3b8; }
.stream-item-enter-active { transition:all 0.3s ease; }
.stream-item-enter-from   { opacity:0; transform:translateY(-8px); }

.funnel-rates { display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-top:10px; border-top:1px solid #f1f5f9; padding-top:10px; }
.rate-item { display:flex; justify-content:space-between; align-items:center; font-size:11px; padding:4px 6px; background:#f8fafc; border-radius:6px; }
.rate-item span { color:#64748b; }
.rate-item b    { color:#1e293b; font-weight:700; }

.bottom-grid { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
.eff-grid { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:10px; }
.eff-item { text-align:center; padding:12px 8px; background:#f8fafc; border-radius:10px; }
.eff-val  { font-size:24px; font-weight:800; color:#1e293b; }
.eff-lbl  { font-size:11px; color:#94a3b8; margin-top:4px; }

.model-bars { display:flex; flex-direction:column; gap:12px; }
.model-bar-item { display:flex; align-items:center; gap:10px; }
.mbar-label { font-size:12px; color:#475569; width:90px; flex-shrink:0; }
.mbar-track { flex:1; height:10px; background:#f1f5f9; border-radius:999px; overflow:hidden; }
.mbar-fill  { height:100%; border-radius:999px; transition:width 0.6s cubic-bezier(0.4,0,0.2,1); }
.mbar-ccdrec        { background:linear-gradient(90deg,#4f46e5,#8b5cf6); }
.mbar-collaborative { background:linear-gradient(90deg,#10b981,#34d399); }
.mbar-content       { background:linear-gradient(90deg,#f59e0b,#fbbf24); }
.mbar-pct { font-size:12px; font-weight:700; color:#1e293b; width:32px; text-align:right; }
.avg-score-row { display:flex; justify-content:space-between; align-items:center; margin-top:14px; padding-top:12px; border-top:1px solid #f1f5f9; font-size:13px; color:#64748b; }
.avg-score-row strong { font-size:18px; font-weight:800; color:#4f46e5; }

@media (max-width:1280px) { .main-grid { grid-template-columns:1fr; } .rec-cards-grid { grid-template-columns:repeat(2,minmax(0,1fr)); } }
@media (max-width:900px)  { .metrics-row { grid-template-columns:repeat(2,minmax(0,1fr)); } .bottom-grid { grid-template-columns:1fr; } .eff-grid { grid-template-columns:repeat(2,minmax(0,1fr)); } }
@media (max-width:600px)  { .rec-dashboard { padding:0; } .metrics-row { grid-template-columns:1fr 1fr; } .rec-cards-grid { grid-template-columns:1fr 1fr; } }
</style>
