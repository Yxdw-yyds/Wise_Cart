<template>
  <div class="rec-card" :class="{ interacted: lastAction }">
    <div class="card-rank">#{{ rank }}</div>
    <!-- 商品图片（支持淘宝CDN回退） -->
    <div class="card-img" :style="imgFallbackStyle">
      <img
        v-if="product?.pictUrl"
        :src="product.pictUrl"
        :alt="product?.name"
        class="product-img"
        @error="onImgError"
        referrerpolicy="no-referrer"
      />
      <span v-else class="img-placeholder">{{ (product?.name || '商品')[0] }}</span>
    </div>
    <div class="card-body">
      <div class="card-name">{{ product?.name || `商品 ${itemId}` }}</div>
      <div class="card-category">
        <span class="cat-tag">{{ categoryLabels[product?.category] || product?.category }}</span>
      </div>
      <div class="card-price">
        <span class="price-now">¥{{ product?.price }}</span>
        <span class="price-ori">¥{{ product?.originalPrice }}</span>
      </div>
      <div class="card-reason">{{ explanation?.primary }}</div>
      <div class="card-score">
        <div class="score-bar-wrap">
          <div class="score-bar" :style="{ width: (fusedScore * 100).toFixed(0) + '%', background: scoreColor }"></div>
        </div>
        <span class="score-num">{{ (fusedScore * 100).toFixed(0) }}</span>
      </div>
      <div class="card-models">
        <span v-for="m in models" :key="m" class="model-chip" :class="`chip-${m}`">{{ m }}</span>
      </div>
    </div>
    <div class="card-actions">
      <button class="act-btn act-fav"  :class="{ done: lastAction === 'fav'  }" @click="interact('fav')"  title="收藏">♥</button>
      <button class="act-btn act-cart" :class="{ done: lastAction === 'cart' }" @click="interact('cart')" title="加购">🛒</button>
      <button class="act-btn act-buy"  :class="{ done: lastAction === 'buy'  }" @click="interact('buy')"  title="购买">✓</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  itemId:         { type: Number, required: true },
  product:        { type: Object, default: null },
  fusedScore:     { type: Number, default: 0 },
  rank:           { type: Number, default: 0 },
  models:         { type: Array,  default: () => [] },
  explanation:    { type: Object, default: null },
  categoryLabels: { type: Object, default: () => ({}) },
});

const emit = defineEmits(['interact']);
const lastAction = ref(null);
const imgBroken = ref(false);

const scoreColor = computed(() => {
  const s = props.fusedScore;
  if (s >= 0.8) return 'linear-gradient(90deg,#10b981,#34d399)';
  if (s >= 0.5) return 'linear-gradient(90deg,#f59e0b,#fbbf24)';
  return 'linear-gradient(90deg,#ef4444,#f87171)';
});

const imgFallbackStyle = computed(() => {
  if (!props.product?.pictUrl || imgBroken.value) {
    return { background: props.product?.imgBg || 'linear-gradient(135deg, #667eea, #764ba2)' };
  }
  return {};
});

function onImgError(e) {
  imgBroken.value = true;
  e.target.style.display = 'none';
}

function interact(action) {
  lastAction.value = action;
  emit('interact', { itemId: props.itemId, action });
  setTimeout(() => { lastAction.value = null; }, 1200);
}
</script>

<style scoped>
.rec-card {
  position: relative;
  background: #fff;
  border-radius: 12px;
  border: 1.5px solid #e2e8f0;
  padding: 9px 8px 8px;
  display: flex;
  flex-direction: column;
  gap: 5px;
  transition: all 0.22s ease;
  cursor: default;
  overflow: hidden;
  min-height: 288px;
}
.rec-card:hover {
  border-color: #a5b4fc;
  box-shadow: 0 6px 20px rgba(79,70,229,0.12);
  transform: translateY(-2px);
}
.rec-card.interacted {
  border-color: #4f46e5;
  background: #fafafe;
}

.card-rank {
  position: absolute;
  top: 6px;
  right: 8px;
  font-size: 9px;
  font-weight: 800;
  color: #94a3b8;
  letter-spacing: 0.5px;
  z-index: 1;
}

.card-img {
  width: 100%;
  height: 176px;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: #f8fafc;
}
.product-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  transform: scale(1);
  transform-origin: center;
}
.img-placeholder {
  font-size: 20px;
  font-weight: 800;
  color: rgba(255,255,255,0.85);
  text-shadow: 0 1px 4px rgba(0,0,0,0.2);
}

.card-body { display: flex; flex-direction: column; gap: 3px; }

.card-name {
  font-size: 10px;
  font-weight: 700;
  color: #1e293b;
  line-height: 1.2;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.cat-tag {
  font-size: 9px;
  font-weight: 600;
  padding: 1px 6px;
  border-radius: 999px;
  background: #ede9fe;
  color: #6d28d9;
}

.card-price { display: flex; align-items: baseline; gap: 5px; }
.price-now  { font-size: 12px; font-weight: 800; color: #ef4444; }
.price-ori  { font-size: 10px; color: #94a3b8; text-decoration: line-through; }

.card-reason {
  font-size: 9px;
  color: #64748b;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  line-height: 1.25;
}

.card-score { display: flex; align-items: center; gap: 5px; }
.score-bar-wrap { flex:1; height: 4px; background: #f1f5f9; border-radius: 999px; overflow: hidden; }
.score-bar { height: 100%; border-radius: 999px; transition: width 0.5s ease; }
.score-num { font-size: 10px; font-weight: 700; color: #1e293b; min-width: 20px; text-align: right; }

.card-models { display: flex; flex-wrap: wrap; gap: 3px; }
.model-chip {
  font-size: 8px;
  font-weight: 700;
  padding: 1px 5px;
  border-radius: 999px;
  letter-spacing: 0.3px;
}
.chip-ccdrec        { background: #e0e7ff; color: #4f46e5; }
.chip-collaborative { background: #d1fae5; color: #059669; }
.chip-content       { background: #fff7ed; color: #d97706; }

.card-actions {
  display: flex;
  gap: 5px;
  justify-content: flex-end;
  padding-top: 6px;
  margin-top: auto;
  border-top: 1px solid #f1f5f9;
}
.act-btn {
  font-size: 11px;
  width: 24px;
  height: 24px;
  border-radius: 6px;
  border: 1.5px solid #e2e8f0;
  background: #f8fafc;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.18s ease;
}
.act-btn:hover  { transform: scale(1.15); }
.act-fav:hover  { border-color: #ef4444; background: #fee2e2; }
.act-cart:hover { border-color: #f59e0b; background: #fff7ed; }
.act-buy:hover  { border-color: #10b981; background: #d1fae5; }
.act-fav.done   { border-color: #ef4444; background: #fee2e2; }
.act-cart.done  { border-color: #f59e0b; background: #fff7ed; }
.act-buy.done   { border-color: #10b981; background: #d1fae5; }
</style>
