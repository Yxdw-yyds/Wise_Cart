<template>
  <div class="rec-card" :class="{ interacted: lastAction }">
    <div class="card-rank">#{{ rank }}</div>
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

const scoreColor = computed(() => {
  const s = props.fusedScore;
  if (s >= 0.8) return 'linear-gradient(90deg,#10b981,#34d399)';
  if (s >= 0.5) return 'linear-gradient(90deg,#f59e0b,#fbbf24)';
  return 'linear-gradient(90deg,#ef4444,#f87171)';
});

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
  padding: 12px 10px 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  transition: all 0.22s ease;
  cursor: default;
  overflow: hidden;
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
  top: 8px;
  right: 10px;
  font-size: 10px;
  font-weight: 800;
  color: #94a3b8;
  letter-spacing: 0.5px;
}

.card-body { display: flex; flex-direction: column; gap: 5px; }

.card-name {
  font-size: 12px;
  font-weight: 700;
  color: #1e293b;
  line-height: 1.3;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.cat-tag {
  font-size: 10px;
  font-weight: 600;
  padding: 2px 7px;
  border-radius: 999px;
  background: #ede9fe;
  color: #6d28d9;
}

.card-price { display: flex; align-items: baseline; gap: 6px; }
.price-now  { font-size: 14px; font-weight: 800; color: #ef4444; }
.price-ori  { font-size: 11px; color: #94a3b8; text-decoration: line-through; }

.card-reason {
  font-size: 10px;
  color: #64748b;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-height: 1.4;
}

.card-score { display: flex; align-items: center; gap: 6px; }
.score-bar-wrap { flex:1; height: 5px; background: #f1f5f9; border-radius: 999px; overflow: hidden; }
.score-bar { height: 100%; border-radius: 999px; transition: width 0.5s ease; }
.score-num { font-size: 11px; font-weight: 700; color: #1e293b; min-width: 22px; text-align: right; }

.card-models { display: flex; flex-wrap: wrap; gap: 4px; }
.model-chip {
  font-size: 9px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 999px;
  letter-spacing: 0.3px;
}
.chip-ccdrec        { background: #e0e7ff; color: #4f46e5; }
.chip-collaborative { background: #d1fae5; color: #059669; }
.chip-content       { background: #fff7ed; color: #d97706; }

.card-actions {
  display: flex;
  gap: 6px;
  justify-content: flex-end;
  padding-top: 6px;
  border-top: 1px solid #f1f5f9;
}
.act-btn {
  font-size: 13px;
  width: 28px;
  height: 28px;
  border-radius: 8px;
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
