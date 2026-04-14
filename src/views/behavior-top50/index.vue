<template>
  <div class="workspace-page route-fade-in top50-page">
    <!-- ============ Hero Header ============ -->
    <div class="page-hero">
      <div class="hero-shapes">
        <div class="shape s1"></div>
        <div class="shape s2"></div>
        <div class="shape s3"></div>
      </div>
      <div class="hero-inner">
        <h2 class="hero-title">
          <span class="title-sparkle">✨</span>
          个性化推荐 Top 50
          <span class="hero-badge">协同过滤</span>
        </h2>
        <div class="hero-actions">
          <el-select
            v-model="userId"
            filterable
            placeholder="搜索用户ID"
            class="hero-select"
            @change="loadUserRecs"
          >
            <el-option
              v-for="id in userIdOptions"
              :key="id"
              :label="'用户 #' + id"
              :value="id"
            />
          </el-select>
          <el-button
            type="primary"
            class="hero-btn"
            :loading="loading"
            @click="loadUserRecs"
          >🔍 查询推荐</el-button>
        </div>
      </div>
    </div>

    <!-- ============ User Profile Panel ============ -->
    <transition name="pfade">
      <div v-if="userProfile" class="profile-panel">
        <div class="profile-grid">
          <!-- Left: Avatar & Tags -->
          <div class="profile-col-avatar">
            <div class="avatar-wrapper">
              <div class="avatar-glow" :style="{ background: avatarGradient }"></div>
              <div class="avatar-circle" :style="{ background: avatarGradient }">
                <span class="avatar-letter">{{ avatarText }}</span>
              </div>
              <span class="avatar-online"></span>
            </div>
            <h3 class="profile-uid">用户 #{{ userId }}</h3>
            <span class="online-chip"><span class="blink-dot"></span>活跃用户</span>
            <div class="tag-row">
              <span
                v-for="(tag, ti) in userProfile.tags"
                :key="tag"
                class="ptag"
                :style="{ animationDelay: ti * 100 + 'ms' }"
              >{{ tag }}</span>
            </div>
          </div>

          <!-- Center: Interest Bars -->
          <div class="profile-col-bars">
            <h4 class="col-title"><span class="dot" style="background:var(--accent-primary)"></span>兴趣画像分布</h4>
            <div class="bars-list">
              <div
                v-for="([cat, pct], bi) in topCategories"
                :key="cat"
                class="bar-row"
                :style="{ animationDelay: bi * 80 + 200 + 'ms' }"
              >
                <span class="bar-label">{{ cat }}</span>
                <div class="bar-track">
                  <div
                    class="bar-fill"
                    :style="{ width: barsReady ? pct + '%' : '0%', background: getCatColor(cat) }"
                  ></div>
                </div>
                <span class="bar-pct">{{ pct }}%</span>
              </div>
            </div>
            <p class="profile-desc">{{ userProfile.summary }}</p>
          </div>

          <!-- Right: Stats -->
          <div class="profile-col-stats">
            <h4 class="col-title"><span class="dot" style="background:var(--accent-violet)"></span>推荐概览</h4>
            <div class="mini-stats">
              <div class="mini-card">
                <div class="mval">{{ userProfile.totalItems }}</div>
                <div class="mlbl">推荐商品</div>
              </div>
              <div class="mini-card">
                <div class="mval">¥{{ userProfile.avgPrice }}</div>
                <div class="mlbl">平均价格</div>
              </div>
              <div class="mini-card">
                <div class="mval">{{ userProfile.uniqueCategories }}</div>
                <div class="mlbl">涉及品类</div>
              </div>
              <div class="mini-card">
                <div class="mval sm-val">¥{{ userProfile.priceRange[0] }}<span class="sep">~</span>¥{{ userProfile.priceRange[1] }}</div>
                <div class="mlbl">价格区间</div>
              </div>
            </div>
            <div class="top-cat-box">
              <span class="trophy">🏆</span>
              <span>TOP偏好: <strong>{{ userProfile.topCategory }}</strong></span>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <!-- ============ Category Filter ============ -->
    <div v-if="userRecRows.length" class="filter-strip">
      <div class="filter-scroll">
        <button
          v-for="c in categoryTabs"
          :key="c.key"
          class="fpill"
          :class="{ active: filterCat === c.key }"
          @click="filterCat = c.key"
        >
          <span v-if="c.color" class="fpill-dot" :style="{ background: c.color }"></span>
          {{ c.label }}
          <span class="fpill-n">{{ c.count }}</span>
        </button>
      </div>
      <span class="result-hint">共 {{ filteredRecs.length }} 条推荐</span>
    </div>

    <!-- ============ Product Cards ============ -->
    <div v-if="filteredRecs.length" class="cards-grid" :key="gridKey">
      <div
        v-for="(rec, idx) in filteredRecs"
        :key="rec.rank + '-' + rec.itemId"
        class="card-anim"
        :style="{ animationDelay: idx * 32 + 'ms' }"
      >
        <div class="pcard" :class="rankCls(rec.rank)">
          <div class="rank-badge" :class="{ 'rank-top': rec.rank === 1 }" :style="badgeStyle(rec.rank)"><span>{{ rec.rank }}</span></div>
          <div class="cat-chip" :style="chipStyle(rec.category)">{{ rec.category || '未分类' }}</div>

          <div class="img-box">
            <img
              v-if="rec.pictUrl && !failedImgs.has(rec.itemId)"
              :src="rec.pictUrl"
              :alt="rec.name"
              class="pimg"
              loading="lazy"
              @error="onImgErr(rec.itemId)"
            />
            <div v-else class="img-fallback" :style="{ background: catGrad(rec.category) }">
              <span class="fb-icon">📦</span>
            </div>
          </div>

          <div class="card-body">
            <span class="cid">ID: {{ rec.itemId }}</span>
            <p class="cname" :title="rec.name">{{ rec.name }}</p>
            <div class="cfooter">
              <span class="cprice">¥{{ rec.price }}</span>
              <span v-if="rec.shop" class="cshop" :title="rec.shop">{{ rec.shop }}</span>
            </div>
          </div>

          <div class="card-shine"></div>
        </div>
      </div>
    </div>

    <!-- ============ Loading ============ -->
    <div v-if="loading" class="state-box">
      <div class="spinner"></div>
      <p>正在加载推荐数据…</p>
    </div>

    <!-- ============ Empty ============ -->
    <div v-if="!loading && !userRecRows.length" class="state-box empty">
      <div class="empty-ico">🔍</div>
      <h3>请选择用户查看推荐</h3>
      <p>从上方选择器中选择一位用户，查看为其生成的个性化推荐商品</p>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, ref } from "vue";
import { defineRouteMeta } from "@kesplus/kesplus";
import { loadUserTopK, loadUserRecommendationWithImages } from "@/composables/useCcdrecData";

defineOptions({ name: "推荐前50查询页面" });

defineRouteMeta({
  name: "workbenchBehaviorTop50",
  title: "推荐前50查询",
  icon: "Search",
  isKeepAlive: true,
});

/* ---- constants ---- */
const CAT_COLORS = {
  "美妆个护": "#FF69B4", "女装服饰": "#FF6B6B", "食品零食": "#FFA07A",
  "母婴用品": "#4ECDC4", "家居家纺": "#45B7D1", "数码电器": "#9B59B6",
  "家用电器": "#3498DB", "运动户外": "#2ECC71", "图书音像": "#F39C12",
  "汽车用品": "#E74C3C", "家居建材": "#95A5A6", "箱包配饰": "#E67E22",
  "综合百货": "#7F8C8D",
};

const CAT_TAG = {
  "女装服饰": "时尚达人", "美妆个护": "美妆控", "数码电器": "科技发烧友",
  "家居家纺": "居家生活家", "食品零食": "美食爱好者", "母婴用品": "母婴关注",
  "家用电器": "品质生活", "运动户外": "运动达人", "图书音像": "文艺青年",
  "箱包配饰": "穿搭达人", "综合百货": "百货达人", "汽车用品": "车友族",
  "家居建材": "装修达人",
};

const GRADIENTS = [
  "linear-gradient(135deg,#667eea,#764ba2)",
  "linear-gradient(135deg,#f093fb,#f5576c)",
  "linear-gradient(135deg,#4facfe,#00f2fe)",
  "linear-gradient(135deg,#43e97b,#38f9d7)",
  "linear-gradient(135deg,#fa709a,#fee140)",
  "linear-gradient(135deg,#a18cd1,#fbc2eb)",
  "linear-gradient(135deg,#fccb90,#d57eeb)",
  "linear-gradient(135deg,#e0c3fc,#8ec5fc)",
];

/* ---- state ---- */
const userId = ref("0");
const userIdOptions = ref([]);
const userRecs = ref([]);
const loading = ref(false);
const filterCat = ref("all");
const barsReady = ref(false);
const gridKey = ref(0);
const failedImgs = ref(new Set());

/* ---- computed ---- */
const userRecRows = computed(() => userRecs.value);

const userProfile = computed(() => {
  const recs = userRecRows.value;
  if (!recs.length) return null;

  const cc = {};
  let sum = 0, vc = 0;
  recs.forEach((r) => {
    const c = r.category || "未分类";
    cc[c] = (cc[c] || 0) + 1;
    if (r.price > 0) { sum += r.price; vc++; }
  });

  const n = recs.length || 1;
  const dist = {};
  Object.entries(cc).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => { dist[k] = Number(((v / n) * 100).toFixed(1)); });

  const sorted = Object.entries(dist);
  const topCat = sorted[0]?.[0] || "未知";
  const topPct = sorted[0]?.[1] || 0;
  const avg = vc > 0 ? Math.round(sum / vc) : 0;
  const uq = Object.keys(cc).length;
  const prices = recs.filter((r) => r.price > 0).map((r) => r.price);
  const pr = prices.length ? [Math.min(...prices), Math.max(...prices)] : [0, 0];

  const tags = [];
  if (uq >= 7) tags.push("兴趣广泛"); else if (uq >= 4) tags.push("多元探索"); else tags.push("精准聚焦");
  if (avg >= 200) tags.push("品质追求"); else if (avg >= 80) tags.push("理性消费"); else tags.push("高性价比");
  if (CAT_TAG[topCat]) tags.push(CAT_TAG[topCat]);
  if (topPct >= 30) tags.push("核心用户");

  return {
    distribution: dist, topCategory: topCat, avgPrice: avg,
    uniqueCategories: uq, priceRange: pr, tags, totalItems: recs.length,
    summary: `推荐商品覆盖${uq}个品类，以「${topCat}」为主(${topPct}%)，均价¥${avg}，算法侧重兴趣匹配与热度综合排序。`,
  };
});

const topCategories = computed(() => {
  if (!userProfile.value) return [];
  return Object.entries(userProfile.value.distribution).slice(0, 7);
});

const avatarGradient = computed(() => GRADIENTS[(parseInt(userId.value) || 0) % GRADIENTS.length]);
const avatarText = computed(() => { const s = String(userId.value); return s.length <= 2 ? s : s.slice(0, 2); });

const categoryTabs = computed(() => {
  const recs = userRecRows.value;
  const cc = {};
  recs.forEach((r) => { const c = r.category || "未分类"; cc[c] = (cc[c] || 0) + 1; });
  const list = [{ key: "all", label: "全部", count: recs.length, color: null }];
  Object.entries(cc).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => list.push({ key: k, label: k, count: v, color: CAT_COLORS[k] || "#888" }));
  return list;
});

const filteredRecs = computed(() => {
  if (filterCat.value === "all") return userRecRows.value;
  return userRecRows.value.filter((r) => r.category === filterCat.value);
});

/* ---- methods ---- */
const getCatColor = (c) => CAT_COLORS[c] || "#8896ab";
const catGrad = (c) => { const col = getCatColor(c); return `linear-gradient(135deg, ${col}55, ${col}99)`; };
const chipStyle = (c) => { const col = getCatColor(c); return { background: col + "18", color: col, border: `1px solid ${col}33` }; };
const rankCls = (r) => (r === 1 ? "rk-first" : "");

const badgeStyle = (rank) => {
  const t = Math.min((rank - 1) / 49, 1); // 0 → 1
  // Hue: 10 (red-orange) → 260 (blue-purple)
  const hue = Math.round(10 + t * 250);
  // Saturation: 92% → 62%
  const sat = Math.round(92 - t * 30);
  // Lightness: deep → light  (44% → 68%)
  const lit1 = Math.round(44 + t * 24);
  const lit2 = Math.round(38 + t * 28);
  return {
    background: `linear-gradient(135deg, hsl(${hue}, ${sat}%, ${lit1}%), hsl(${hue + 25}, ${sat}%, ${lit2}%))`,
    boxShadow: `0 3px 10px hsla(${hue}, ${sat}%, ${lit1}%, 0.38)`,
  };
};

const onImgErr = (id) => { failedImgs.value = new Set([...failedImgs.value, id]); };

const loadUserRecs = async () => {
  loading.value = true;
  barsReady.value = false;
  filterCat.value = "all";
  failedImgs.value = new Set();
  try {
    userRecs.value = await loadUserRecommendationWithImages("baby", userId.value);
    gridKey.value++;
    await nextTick();
    setTimeout(() => { barsReady.value = true; }, 150);
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  const users = await loadUserTopK("baby");
  userIdOptions.value = Object.keys(users).slice(0, 300);
  if (!userIdOptions.value.includes(userId.value) && userIdOptions.value.length) {
    userId.value = userIdOptions.value[0];
  }
  await loadUserRecs();
});
</script>

<style scoped>
/* ================== page ================== */
.top50-page { display: flex; flex-direction: column; gap: 20px; padding-bottom: 40px; }

/* ================== hero ================== */
.page-hero {
  position: relative; border-radius: 16px; padding: 14px 24px; overflow: visible;
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 40%, #a855f7 70%, #ec4899 100%);
  color: #fff; flex-shrink: 0;
}
.hero-shapes { position: absolute; inset: 0; pointer-events: none; overflow: hidden; border-radius: 16px; }
.shape { position: absolute; border-radius: 50%; opacity: .12; background: #fff; }
.s1 { width: 160px; height: 160px; top: -50px; right: -30px; animation: hfloat 8s ease-in-out infinite alternate; }
.s2 { width: 90px; height: 90px; bottom: -25px; left: 15%; animation: hfloat 10s ease-in-out infinite alternate-reverse; }
.s3 { width: 60px; height: 60px; top: 10%; right: 30%; animation: hfloat 6s ease-in-out infinite alternate; }
@keyframes hfloat { from { transform: translateY(0) scale(1); } to { transform: translateY(-10px) scale(1.06); } }

.hero-inner { position: relative; z-index: 1; display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: nowrap; }
.hero-title { margin: 0; font-size: 20px; font-weight: 800; display: flex; align-items: center; gap: 8px; white-space: nowrap; }
.title-sparkle { font-size: 22px; filter: drop-shadow(0 2px 4px rgba(0,0,0,.2)); }
.hero-badge { font-size: 11px; font-weight: 700; padding: 2px 10px; border-radius: 10px; background: rgba(255,255,255,.2); backdrop-filter: blur(4px); letter-spacing: .03em; }
.hero-actions { display: flex; gap: 10px; align-items: center; flex-shrink: 0; }

.hero-select { width: 200px; }
.hero-select :deep(.el-select__wrapper),
.hero-select :deep(.el-input__wrapper) { background: rgba(255,255,255,.18) !important; border: 1px solid rgba(255,255,255,.3) !important; backdrop-filter: blur(8px); }
.hero-select :deep(.el-input__inner) { color: #fff !important; }
.hero-select :deep(.el-input__inner::placeholder) { color: rgba(255,255,255,.6) !important; }
.hero-select :deep(.el-select__caret) { color: rgba(255,255,255,.7) !important; }
.hero-btn { font-weight: 700; padding: 10px 24px; background: rgba(255,255,255,.22) !important; border: 1px solid rgba(255,255,255,.35) !important; backdrop-filter: blur(8px); color: #fff !important; }
.hero-btn:hover { background: rgba(255,255,255,.34) !important; }

/* ================== profile ================== */
.profile-panel {
  border-radius: 20px; padding: 28px 28px 24px;
  background: rgba(255,255,255,.78); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(148,163,184,.18); box-shadow: 0 10px 40px rgba(0,0,0,.05);
}
.profile-grid { display: grid; grid-template-columns: 200px 1fr 260px; gap: 32px; align-items: start; }

/* avatar col */
.profile-col-avatar { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 10px; }
.avatar-wrapper { position: relative; width: 80px; height: 80px; margin-bottom: 4px; }
.avatar-glow { position: absolute; inset: -10px; border-radius: 50%; filter: blur(18px); opacity: .35; animation: aglow 3s ease-in-out infinite; }
@keyframes aglow { 0%,100%{ opacity:.3; transform:scale(1); } 50%{ opacity:.5; transform:scale(1.06); } }
.avatar-circle { position: relative; width: 80px; height: 80px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 24px rgba(0,0,0,.15); z-index: 1; }
.avatar-letter { color: #fff; font-size: 28px; font-weight: 800; text-shadow: 0 2px 4px rgba(0,0,0,.2); }
.avatar-online { position: absolute; bottom: 2px; right: 2px; width: 16px; height: 16px; border-radius: 50%; background: #10b981; border: 3px solid #fff; z-index: 2; }
.profile-uid { margin: 0; font-size: 18px; font-weight: 700; color: var(--text-primary); }
.online-chip { display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; color: #10b981; background: rgba(16,185,129,.1); border: 1px solid rgba(16,185,129,.2); }
.blink-dot { width: 6px; height: 6px; border-radius: 50%; background: #10b981; animation: bdot 2s ease-in-out infinite; }
@keyframes bdot { 0%,100%{ opacity:1; } 50%{ opacity:.3; } }
.tag-row { display: flex; flex-wrap: wrap; gap: 6px; justify-content: center; }
.ptag { padding: 3px 10px; border-radius: 10px; font-size: 11px; font-weight: 600; background: linear-gradient(135deg,rgba(79,70,229,.08),rgba(139,92,246,.12)); color: var(--accent-primary); border: 1px solid rgba(79,70,229,.15); animation: tpop .4s ease forwards; opacity: 0; transform: scale(.8); }
@keyframes tpop { to { opacity:1; transform:scale(1); } }

/* bars col */
.profile-col-bars { display: flex; flex-direction: column; gap: 12px; }
.col-title { margin: 0; display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 700; color: var(--text-primary); }
.dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.bars-list { display: flex; flex-direction: column; gap: 9px; }
.bar-row { display: flex; align-items: center; gap: 10px; animation: brin .5s ease forwards; opacity: 0; transform: translateX(-10px); }
@keyframes brin { to { opacity:1; transform:translateX(0); } }
.bar-label { width: 60px; font-size: 12px; font-weight: 600; color: var(--text-secondary); text-align: right; flex-shrink: 0; }
.bar-track { flex: 1; height: 10px; border-radius: 5px; background: rgba(0,0,0,.05); overflow: hidden; }
.bar-fill { height: 100%; border-radius: 5px; transition: width 1s cubic-bezier(.4,0,.2,1); position: relative; }
.bar-fill::after { content: ''; position: absolute; inset: 0; border-radius: 5px; background: linear-gradient(90deg,transparent,rgba(255,255,255,.3)); }
.bar-pct { width: 42px; font-size: 12px; font-weight: 700; color: var(--text-secondary); text-align: right; flex-shrink: 0; }
.profile-desc { margin: 0; font-size: 12px; color: var(--text-tertiary); line-height: 1.6; padding-top: 6px; border-top: 1px solid rgba(0,0,0,.05); }

/* stats col */
.profile-col-stats { display: flex; flex-direction: column; gap: 12px; }
.mini-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.mini-card { padding: 14px 10px; border-radius: 14px; background: linear-gradient(135deg,rgba(248,250,255,.9),rgba(240,244,255,.7)); border: 1px solid rgba(148,163,184,.12); text-align: center; transition: transform .2s, box-shadow .2s; }
.mini-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,.06); }
.mval { font-size: 18px; font-weight: 800; color: var(--accent-primary); margin-bottom: 2px; }
.sm-val { font-size: 13px; }
.sep { margin: 0 2px; color: var(--text-tertiary); }
.mlbl { font-size: 11px; color: var(--text-tertiary); font-weight: 600; }
.top-cat-box { display: flex; align-items: center; gap: 8px; padding: 10px 14px; border-radius: 12px; background: linear-gradient(135deg,rgba(245,158,11,.08),rgba(245,158,11,.15)); border: 1px solid rgba(245,158,11,.2); font-size: 13px; color: var(--text-secondary); }
.trophy { font-size: 18px; }

/* profile transition */
.pfade-enter-active { transition: all .5s cubic-bezier(.4,0,.2,1); }
.pfade-leave-active { transition: all .3s ease; }
.pfade-enter-from { opacity: 0; transform: translateY(-20px); }
.pfade-leave-to { opacity: 0; transform: translateY(-10px); }

/* ================== filter ================== */
.filter-strip { display: flex; align-items: center; gap: 12px; overflow-x: auto; -webkit-overflow-scrolling: touch; flex-shrink: 0; min-height: 44px; padding: 4px 0; }
.filter-strip::-webkit-scrollbar { height: 0; }
.filter-scroll { display: flex; gap: 8px; padding: 2px; flex-shrink: 0; flex-wrap: wrap; }
.result-hint { margin-left: auto; font-size: 13px; color: var(--text-tertiary); white-space: nowrap; font-weight: 600; flex-shrink: 0; }

.fpill { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: 20px; border: 1px solid rgba(148,163,184,.2); background: rgba(255,255,255,.7); backdrop-filter: blur(8px); font-size: 13px; font-weight: 600; color: var(--text-secondary); cursor: pointer; white-space: nowrap; transition: all .25s ease; flex-shrink: 0; }
.fpill:hover { background: rgba(79,70,229,.06); border-color: rgba(79,70,229,.2); }
.fpill.active { background: linear-gradient(135deg,var(--accent-primary),var(--accent-secondary)); color: #fff; border-color: transparent; box-shadow: 0 4px 12px rgba(79,70,229,.3); }
.fpill-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.fpill.active .fpill-dot { background: #fff !important; }
.fpill-n { padding: 1px 7px; border-radius: 10px; font-size: 11px; font-weight: 700; background: rgba(0,0,0,.06); }
.fpill.active .fpill-n { background: rgba(255,255,255,.25); color: #fff; }

/* ================== cards grid ================== */
.cards-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(185px, 1fr)); gap: 16px; }

@keyframes cslide { from { opacity:0; transform:translateY(22px) scale(.96); } to { opacity:1; transform:translateY(0) scale(1); } }
.card-anim { animation: cslide .5s ease forwards; opacity: 0; will-change: transform, opacity; }

.pcard {
  position: relative; border-radius: 16px; padding: 16px 14px; display: flex; flex-direction: column; align-items: center; gap: 10px;
  background: rgba(255,255,255,.82); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(148,163,184,.15); cursor: pointer; overflow: hidden; min-height: 290px;
  transition: transform .3s cubic-bezier(.4,0,.2,1), box-shadow .3s cubic-bezier(.4,0,.2,1), border-color .3s ease;
}
.pcard:hover { transform: translateY(-6px) scale(1.02); box-shadow: 0 16px 40px rgba(79,70,229,.12), 0 4px 12px rgba(0,0,0,.06); border-color: rgba(79,70,229,.25); }

/* card shine */
.card-shine { position: absolute; top: 0; left: -80%; width: 60%; height: 100%; background: linear-gradient(105deg,transparent 40%,rgba(255,255,255,.5) 50%,transparent 60%); transform: skewX(-20deg); pointer-events: none; transition: left .7s ease; }
.pcard:hover .card-shine { left: 130%; }

/* rank badge — gradient applied via inline style */
.rank-badge { position: absolute; top: 10px; left: 10px; width: 32px; height: 32px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 800; color: #fff; z-index: 2; transition: transform .2s ease; }
.rank-top { width: 36px; height: 36px; font-size: 15px; }

/* rank-1 card tint */
.rk-first { border-color: rgba(245,175,25,.3); background: linear-gradient(135deg,rgba(255,248,230,.92),rgba(255,255,255,.85)); }

/* category chip */
.cat-chip { position: absolute; top: 10px; right: 10px; padding: 3px 8px; border-radius: 8px; font-size: 10px; font-weight: 700; z-index: 2; white-space: nowrap; }

/* image */
.img-box { width: 110px; height: 110px; border-radius: 12px; overflow: hidden; background: #f5f7fa; flex-shrink: 0; margin-top: 16px; }
.pimg { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform .3s ease; }
.pcard:hover .pimg { transform: scale(1.08); }
.img-fallback { width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; }
.fb-icon { font-size: 28px; }

/* card body */
.card-body { width: 100%; flex: 1; display: flex; flex-direction: column; gap: 6px; min-height: 0; }
.cid { font-size: 10px; font-weight: 600; color: var(--text-tertiary); text-align: center; }
.cname { font-size: 12px; font-weight: 500; color: var(--text-primary); text-align: center; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; line-height: 1.5; margin: 0; }
.cfooter { margin-top: auto; display: flex; flex-direction: column; align-items: center; gap: 2px; }
.cprice { font-size: 16px; font-weight: 800; color: #e4393c; }
.cshop { font-size: 10px; color: var(--text-tertiary); max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* ================== states ================== */
.state-box { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; padding: 60px 40px; color: var(--text-tertiary); border-radius: 20px; background: rgba(255,255,255,.6); backdrop-filter: blur(12px); border: 1px solid rgba(148,163,184,.15); }
.state-box.empty { padding: 80px 40px; text-align: center; }
.empty-ico { font-size: 56px; margin-bottom: 8px; animation: hfloat 3s ease-in-out infinite alternate; }
.state-box h3 { margin: 0 0 8px; font-size: 18px; color: var(--text-primary); }
.state-box p { margin: 0; font-size: 14px; }
.spinner { width: 40px; height: 40px; border: 4px solid rgba(79,70,229,.15); border-top-color: var(--accent-primary); border-radius: 50%; animation: spin .8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* ================== responsive ================== */
@media (max-width: 1024px) {
  .profile-grid { grid-template-columns: 1fr; gap: 24px; }
  .profile-col-avatar { flex-direction: row; flex-wrap: wrap; gap: 12px; text-align: left; }
  .avatar-wrapper { margin-bottom: 0; }
  .tag-row { justify-content: flex-start; }
}
@media (max-width: 640px) {
  .hero-inner { flex-direction: column; align-items: flex-start; }
  .hero-actions { width: 100%; flex-wrap: wrap; }
  .hero-select { flex: 1; min-width: 160px; }
  .cards-grid { grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 12px; }
}
</style>
