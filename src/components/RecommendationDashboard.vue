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
            <button class="sim-btn" :class="{ running: simRunning }" @click="toggleSim">{{ simRunning ? '⏹ 停止回放' : '▶ 回放行为' }}</button>
            <button class="refresh-btn" @click="doRefresh">↻ 刷新</button>
          </div>
        </div>
        <div v-if="loading" class="loading-state">
          <div class="spinner"></div><span>推荐计算中…</span>
        </div>
        <div v-else class="rec-cards-grid">
          <RecommendProductCard
            v-for="rec in recommendations.slice(0,6)" :key="rec.itemId"
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
import { useTmallData } from '@/composables/useTmallData';
import { useEnhancedRecommendation, getRecommendationAnalysis, getFullBusinessFlowData } from '@/services/enhancedRecommendationComposer';
import RecommendProductCard from '@/components/RecommendProductCard.vue';

defineOptions({ name: 'RecommendationDashboard' });

const { products, behaviorLog, categoryLabels, categoryColors, userProfile: tmallUserProfile, interestVector, loadAll: loadTmallData } = useTmallData();
const { loading, recommendations, userProfile, analysis, loadRecommendations, updateUserProfile, updateAnalysis, trackInteraction } = useEnhancedRecommendation();

const radarRef = ref(null);
const funnelRef = ref(null);
let radarChart = null;
let funnelChart = null;
const funnel = ref({ view:0, viewToClick:0, clickToFav:0, favToCart:0, cartToBuy:0 });
const recentEvents = ref([]);
let evtCounter = 0;
let simReplayIndex = 0; // 真实行为回放索引

const actionLabels = { view:'浏览', click:'点击', fav:'收藏', cart:'加购', buy:'购买', skip:'跳过' };

const metricCards = computed(() => [
  { key:'ctr',   icon:'📈', label:'推荐点击率', value: analysis.value?.overview?.ctr || '0%',               trend:'实时更新', colorClass:'mc-blue'   },
  { key:'cvr',   icon:'🎯', label:'推荐转化率', value: analysis.value?.overview?.cvr || '0%',               trend:'实时更新', colorClass:'mc-green'  },
  { key:'total', icon:'📦', label:'总推荐次数', value: analysis.value?.overview?.totalRecommendations || 0, trend:'累计统计', colorClass:'mc-purple' },
  { key:'buy',   icon:'🛒', label:'总购买转化', value: analysis.value?.overview?.totalConversions || 0,     trend:'实时统计', colorClass:'mc-orange' },
]);

const topCategories = computed(() => {
  const n = userProfile.value?.interestNormalized || tmallUserProfile.value?.categoryPercents || {};
  return Object.entries(n).map(([key,percent])=>({key,percent:+percent||0})).sort((a,b)=>b.percent-a.percent).slice(0,6);
});

const avgScore = computed(() => {
  if (!recommendations.value.length) return '0.00';
  return (recommendations.value.reduce((a,r)=>a+r.fusedScore,0)/recommendations.value.length).toFixed(2);
});

function renderRadar() {
  if (!radarChart) return;
  const n = userProfile.value?.interestNormalized || tmallUserProfile.value?.categoryPercents || {};
  // 只取 Top 8 类目展示，避免雷达图太拥挤
  const entries = Object.entries(n).sort((a,b) => b[1] - a[1]).slice(0, 8);
  if (!entries.length) return;
  radarChart.setOption({
    backgroundColor:'transparent', tooltip:{ trigger:'item' },
    radar:{ radius:'52%', center:['50%','54%'],
      axisName:{ color:'#334155', fontSize:11, padding:[0,4] },
      nameGap: 6,
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
    backgroundColor:'transparent', tooltip:{ trigger:'item', formatter:'{b}: {c}%' },
    series:[{ type:'funnel', left:'5%', width:'60%', top:10, bottom:10, sort:'descending', gap:4,
      label:{ show:true, position:'right', color:'#334155', fontWeight:600, fontSize:12 },
      labelLine:{ show:true, length:8, lineStyle:{ width:1, type:'solid' } },
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

function pushEvent({ product, action, vtime }) {
  evtCounter++;
  recentEvents.value.unshift({
    id: evtCounter, action,
    productName: product?.name || `天猫商品${evtCounter}`,
    timeStr: vtime ? vtime.split(' ')[1] || vtime : new Date().toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit',second:'2-digit'}),
  });
  if (recentEvents.value.length > 20) recentEvents.value.pop();
}

const simRunning = ref(false);
let simTimer = null;
// 保存初始行为日志长度，用于回放时从真实数据中按顺序取事件
let initialBehaviorCount = 0;

function toggleSim() {
  if (simRunning.value) {
    clearInterval(simTimer); simTimer = null; simRunning.value = false;
  } else {
    simRunning.value = true;
    initialBehaviorCount = behaviorLog.value.length;
    // 从当前回放位置开始，逐条回放真实行为
    simTimer = setInterval(async () => {
      if (simReplayIndex >= initialBehaviorCount) {
        simReplayIndex = 0; // 循环回放
      }
      const realEvent = behaviorLog.value[simReplayIndex];
      simReplayIndex++;
      if (!realEvent) return;
      const p = products.value.find(prod => prod.id === realEvent.productId) || products.value[0];
      const action = realEvent.action;
      // 追加到行为日志（模拟实时产生）
      behaviorLog.value.push({ productId: p.id, category: p.category, action, ts: Date.now() });
      pushEvent({ product: p, action, vtime: realEvent.vtime });
      evtCounter++;
      if (evtCounter % 5 === 0) { await doRefresh(); }
      else { updateAnalysis(); renderRadar(); }
    }, 1200);
  }
}

function onResize() { radarChart?.resize(); funnelChart?.resize(); }

watch(() => behaviorLog.value.length, () => { updateUserProfile(behaviorLog.value); renderRadar(); });

onMounted(async () => {
  // 先加载天猫真实数据
  await loadTmallData();
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
/* ─── 整体容器 ─── */
.rec-dashboard {
  display: flex;
  flex-direction: column;
  gap: 12px;
  font-family: 'PingFang SC', 'Microsoft YaHei', system-ui, sans-serif;
}

/* ─── 顶部指标卡 ─── */
.metrics-row { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
.metric-card {
  border-radius: 14px;
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.07);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.metric-card:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0,0,0,0.12); }
.mc-blue   { background: linear-gradient(135deg, #e0edff, #c7d9ff); }
.mc-green  { background: linear-gradient(135deg, #d1fae5, #a7f3d0); }
.mc-purple { background: linear-gradient(135deg, #ede9fe, #ddd6fe); }
.mc-orange { background: linear-gradient(135deg, #fff7ed, #fed7aa); }
.mc-icon  { font-size: 22px; }
.mc-label { font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
.mc-value { font-size: 28px; font-weight: 800; color: #1e293b; line-height: 1; }
.mc-trend { font-size: 11px; color: #94a3b8; }

/* ─── 主网格：3列2行布局 ─── */
/*
  布局结构：
  [雷达图]      [个性化推荐][转化漏斗]
  [推荐效率]    [  (续)    ][模型贡献度]
  第2列和第3列之间无间距，第1列右侧有间距
*/
.main-grid {
  display: grid;
  grid-template-columns: 1fr 2.5fr 1fr;
  grid-template-rows: auto auto;
  gap: 12px;
  align-items: start;
  max-width: 1400px;
}
.main-grid > * { min-width: 0; overflow: hidden; }

/* 中间推荐面板跨两行 */
.panel-recs {
  grid-column: 2;
  grid-row: 1 / 3;
}

/* ─── 面板通用 ─── */
.panel {
  background: #fff;
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.07);
  overflow: hidden;
}
.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
  flex-wrap: wrap;
  gap: 6px;
}
.panel-title { font-size: 14px; font-weight: 700; color: #1e293b; white-space: nowrap; }
.live-badge {
  font-size: 10px;
  font-weight: 700;
  color: #10b981;
  background: rgba(16,185,129,0.1);
  padding: 2px 8px;
  border-radius: 999px;
  animation: pulse 2s infinite;
}
@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }

/* ─── ECharts 图表容器 ─── */
.echart-box { width: 100%; height: 240px; }
.echart-funnel { height: 260px; }

/* ─── 雷达图下方分类列表 ─── */
.top-cats { display: flex; flex-direction: column; gap: 6px; margin-top: 10px; border-top: 1px solid #f1f5f9; padding-top: 10px; }
.top-cat-item { display: flex; align-items: center; gap: 8px; font-size: 12px; }
.cat-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.cat-name { flex: 1; color: #475569; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.cat-pct  { font-weight: 700; color: #1e293b; }

/* ─── 推荐面板操作按钮 ─── */
.header-actions { display: flex; gap: 8px; flex-shrink: 0; }
.sim-btn, .refresh-btn {
  font-size: 12px;
  font-weight: 600;
  padding: 5px 12px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}
.sim-btn { background: #4f46e5; color: #fff; }
.sim-btn:hover { background: #4338ca; }
.sim-btn.running { background: #ef4444; }
.refresh-btn { background: #f1f5f9; color: #475569; }
.refresh-btn:hover { background: #e2e8f0; }

/* ─── 加载状态 ─── */
.loading-state { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; height: 200px; color: #94a3b8; font-size: 13px; }
.spinner { width: 32px; height: 32px; border: 3px solid #e2e8f0; border-top-color: #4f46e5; border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* ─── 推荐卡片网格（3列） ─── */
.rec-cards-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  margin-bottom: 10px;
}

/* ─── 事件流 ─── */
.event-stream { border-top: 1px solid #f1f5f9; padding-top: 12px; display: flex; flex-direction: column; gap: 6px; }
.stream-label { font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
.stream-list  { display: flex; flex-direction: column; gap: 5px; }
.stream-evt   { display: flex; align-items: center; gap: 8px; font-size: 12px; padding: 5px 8px; background: #f8fafc; border-radius: 7px; }
.evt-time     { color: #94a3b8; min-width: 64px; }
.evt-name     { color: #334155; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.evt-action   { font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 999px; min-width: 34px; text-align: center; }
.act-view  { background: #e0edff; color: #4f46e5; }
.act-click { background: #e0edff; color: #4f46e5; }
.act-fav   { background: #fee2e2; color: #ef4444; }
.act-cart  { background: #fff7ed; color: #f59e0b; }
.act-buy   { background: #d1fae5; color: #10b981; }
.act-skip  { background: #f1f5f9; color: #94a3b8; }
.stream-item-enter-active { transition: all 0.3s ease; }
.stream-item-enter-from   { opacity: 0; transform: translateY(-8px); }

/* ─── 漏斗转化率 ─── */
.funnel-rates { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-top: 10px; border-top: 1px solid #f1f5f9; padding-top: 10px; }
.rate-item { display: flex; justify-content: space-between; align-items: center; font-size: 10px; padding: 4px 6px; background: #f8fafc; border-radius: 6px; }
.rate-item span { color: #64748b; }
.rate-item b    { color: #1e293b; font-weight: 700; }

/* ─── 推荐效率（左下，2×2 适应窄列） ─── */
.eff-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
.eff-item { text-align: center; padding: 10px 6px; background: #f8fafc; border-radius: 10px; }
.eff-val  { font-size: 20px; font-weight: 800; color: #1e293b; }
.eff-lbl  { font-size: 10px; color: #94a3b8; margin-top: 3px; }

/* ─── 模型贡献度条 ─── */
.model-bars { display: flex; flex-direction: column; gap: 10px; }
.model-bar-item { display: flex; align-items: center; gap: 6px; }
.mbar-label { font-size: 11px; color: #475569; width: 80px; flex-shrink: 0; }
.mbar-track { flex: 1; height: 8px; background: #f1f5f9; border-radius: 999px; overflow: hidden; }
.mbar-fill  { height: 100%; border-radius: 999px; transition: width 0.6s cubic-bezier(0.4,0,0.2,1); }
.mbar-ccdrec        { background: linear-gradient(90deg, #4f46e5, #8b5cf6); }
.mbar-collaborative { background: linear-gradient(90deg, #10b981, #34d399); }
.mbar-content       { background: linear-gradient(90deg, #f59e0b, #fbbf24); }
.mbar-pct { font-size: 11px; font-weight: 700; color: #1e293b; width: 28px; text-align: right; }
.avg-score-row { display: flex; justify-content: space-between; align-items: center; margin-top: 12px; padding-top: 10px; border-top: 1px solid #f1f5f9; font-size: 12px; color: #64748b; }
.avg-score-row strong { font-size: 16px; font-weight: 800; color: #4f46e5; }

/* ─── 响应式断点 ─── */
@media (max-width: 1000px) {
  .main-grid { grid-template-columns: 1fr; grid-template-rows: auto; }
  .panel-recs { grid-column: auto; grid-row: auto; }
  .rec-cards-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .eff-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
}
@media (max-width: 900px) {
  .metrics-row { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .eff-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 600px) {
  .rec-dashboard { padding: 0; }
  .metrics-row { grid-template-columns: 1fr 1fr; }
  .rec-cards-grid { grid-template-columns: 1fr 1fr; }
}
</style>
