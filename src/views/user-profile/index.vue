<template>
  <div class="profile-page route-scroll-page route-fade-in">
    <header class="profile-header">
      <div class="header-inner">
        <div class="brand" @click="router.push('/user-mall')">WiseCart</div>
        <div class="header-copy">
          <h1 class="header-title">用户画像</h1>
          <p class="header-subtitle">兴趣分布、用户标签与最近行为轨迹</p>
        </div>
        <el-button round @click="router.push('/user-mall')">返回商城</el-button>
      </div>
    </header>

    <div class="profile-body">
      <div class="summary-grid">
        <el-card shadow="never" class="hero-card">
          <div class="hero-kicker">User Persona Snapshot</div>
          <div class="hero-main">
            <div>
              <div class="hero-title">当前偏好聚焦 {{ percentItems[0]?.label || "-" }}</div>
              <p class="hero-text">{{ userProfile.summary }}</p>
            </div>
            <div class="hero-tags">
              <span v-for="tag in userProfile.tags" :key="tag" class="user-tag">{{ tag }}</span>
            </div>
          </div>
        </el-card>

        <el-card shadow="never" class="metric-mini-card">
          <div class="mini-label">主偏好类目</div>
          <div class="mini-value">{{ percentItems[0]?.label || "-" }}</div>
          <div class="mini-sub">{{ percentItems[0]?.percent || 0 }}%</div>
        </el-card>

        <el-card shadow="never" class="metric-mini-card">
          <div class="mini-label">次偏好类目</div>
          <div class="mini-value">{{ percentItems[1]?.label || "-" }}</div>
          <div class="mini-sub">{{ percentItems[1]?.percent || 0 }}%</div>
        </el-card>
      </div>

      <div class="content-grid">
        <el-card shadow="never" class="panel-card radar-card">
          <template #header>
            <div class="panel-head">
              <span>兴趣雷达图</span>
              <span class="panel-note">ECharts 动态展示</span>
            </div>
          </template>
          <div ref="radarRef" class="radar-chart"></div>
        </el-card>

        <el-card shadow="never" class="panel-card">
          <template #header>
            <div class="panel-head">
              <span>兴趣分布</span>
              <span class="panel-note">按类目排序</span>
            </div>
          </template>
          <div class="progress-list">
            <div v-for="item in percentItems" :key="item.key" class="progress-item">
              <div class="row-head">
                <div class="row-left">
                  <span class="cat-dot" :style="{ background: catColors[item.key] }"></span>
                  <span class="cat-name">{{ item.label }}</span>
                </div>
                <b class="cat-pct">{{ item.percent }}%</b>
              </div>
              <div class="bar-track">
                <div class="bar-fill" :style="{ width: item.percent + '%', background: catColors[item.key] }"></div>
              </div>
            </div>
          </div>
        </el-card>

        <el-card shadow="never" class="panel-card timeline-card">
          <template #header>
            <div class="panel-head">
              <span>行为时间线</span>
              <span class="panel-note">最近浏览 / 收藏 / 加购 / 购买</span>
            </div>
          </template>
          <el-timeline>
            <el-timeline-item
              v-for="item in timelineItems"
              :key="`${item.productId}-${item.ts}`"
              :timestamp="item.timeText"
              :type="item.timelineType"
              placement="top"
            >
              <div class="timeline-content">
                <div class="timeline-title">{{ item.actionText }} {{ item.productName }}</div>
                <div class="timeline-meta">{{ item.categoryName }} · {{ item.detail }}</div>
              </div>
            </el-timeline-item>
          </el-timeline>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import dayjs from "dayjs";
import * as echarts from "echarts";
import { defineRouteMeta } from "@kesplus/kesplus";
import { useUserMallData } from "@/composables/useUserMallData";

defineOptions({ name: "UserProfilePage" });

defineRouteMeta({
  name: "userProfile",
  title: "用户画像",
  icon: "PieChart",
  isKeepAlive: true,
  anonymous: true,
  layout: { navigation: null },
});

const router = useRouter();
const radarRef = ref(null);
let radarChart;

const { userProfile, categoryLabels, behaviorLog, products } = useUserMallData();

const catColors = {
  digital: "#4f46e5",
  beauty: "#ec4899",
  drink: "#0ea5e9",
  snack: "#f59e0b",
  daily: "#10b981",
  food: "#f97316",
};

const percentItems = computed(() =>
  Object.entries(userProfile.value.categoryPercents)
    .map(([key, percent]) => ({ key, label: categoryLabels[key] || key, percent }))
    .sort((a, b) => b.percent - a.percent)
);

const productMap = computed(() => Object.fromEntries(products.value.map((item) => [item.id, item])));

const actionLabelMap = {
  view: "浏览了",
  fav: "收藏了",
  cart: "加入购物车",
  buy: "购买了",
};

const actionTypeMap = {
  view: "info",
  fav: "warning",
  cart: "primary",
  buy: "success",
};

const timelineItems = computed(() =>
  [...behaviorLog.value]
    .sort((a, b) => b.ts - a.ts)
    .slice(0, 8)
    .map((event) => {
      const product = productMap.value[event.productId];
      return {
        ...event,
        productName: product?.name || `商品 ${event.productId}`,
        categoryName: categoryLabels[event.category] || event.category,
        actionText: actionLabelMap[event.action] || "触发了",
        timelineType: actionTypeMap[event.action] || "info",
        detail: `${product?.shop || "推荐场景"} · ${dayjs(event.ts).format("MM-DD HH:mm")}`,
        timeText: dayjs(event.ts).format("YYYY-MM-DD HH:mm"),
      };
    })
);

const renderRadar = () => {
  if (!radarChart || !percentItems.value.length) return;
  radarChart.setOption({
    color: ["#295bff"],
    tooltip: { trigger: "item" },
    radar: {
      radius: "62%",
      axisName: { color: "#334155" },
      splitArea: {
        areaStyle: {
          color: ["rgba(79, 124, 255, 0.02)", "rgba(79, 124, 255, 0.05)"],
        },
      },
      splitLine: {
        lineStyle: { color: "rgba(148, 163, 184, 0.28)" },
      },
      indicator: percentItems.value.map((item) => ({
        name: item.label,
        max: 40,
      })),
    },
    series: [
      {
        type: "radar",
        symbol: "circle",
        symbolSize: 8,
        areaStyle: { color: "rgba(41, 91, 255, 0.18)" },
        lineStyle: { width: 3 },
        data: [
          {
            value: percentItems.value.map((item) => item.percent),
            name: "兴趣分布",
          },
        ],
      },
    ],
  });
};

const resize = () => {
  radarChart?.resize();
};

onMounted(async () => {
  await nextTick();
  radarChart = radarRef.value ? echarts.init(radarRef.value) : null;
  renderRadar();
  window.addEventListener("resize", resize);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", resize);
  radarChart?.dispose();
});
</script>

<style scoped>
.profile-page {
  height: 100vh;
  overflow-y: auto;
  overflow-x: hidden;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  background:
    radial-gradient(circle at top left, rgba(255, 196, 141, 0.25), transparent 28%),
    radial-gradient(circle at top right, rgba(79, 124, 255, 0.16), transparent 26%),
    linear-gradient(135deg, #f7faff 0%, #fff7fb 55%, #f4fff8 100%);
}

.profile-header {
  position: sticky;
  top: 0;
  z-index: 10;
  backdrop-filter: blur(12px);
  background: rgba(255, 255, 255, 0.78);
  border-bottom: 1px solid rgba(148, 163, 184, 0.14);
}

.header-inner {
  max-width: 1180px;
  margin: 0 auto;
  padding: 14px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.header-copy {
  flex: 1;
}

.brand {
  font-size: 22px;
  font-weight: 900;
  color: #ff6700;
  cursor: pointer;
}

.header-title {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: #1e293b;
}

.header-subtitle {
  margin: 4px 0 0;
  color: #64748b;
  font-size: 13px;
}

.profile-body {
  max-width: 1180px;
  margin: 0 auto;
  padding: 20px 20px 40px;
}

.summary-grid {
  display: grid;
  grid-template-columns: minmax(0, 2fr) repeat(2, minmax(220px, 1fr));
  gap: 16px;
}

.hero-card {
  overflow: hidden;
  background: linear-gradient(120deg, rgba(255, 122, 24, 0.12), rgba(255, 255, 255, 0.9), rgba(41, 91, 255, 0.08));
}

.hero-kicker {
  font-size: 12px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #64748b;
}

.hero-main {
  margin-top: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}

.hero-title {
  font-size: 28px;
  font-weight: 900;
  color: #0f172a;
}

.hero-text {
  margin: 10px 0 0;
  max-width: 560px;
  line-height: 1.7;
  color: #475569;
}

.hero-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
}

.metric-mini-card {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 148px;
}

.mini-label {
  color: #64748b;
  font-size: 13px;
}

.mini-value {
  margin-top: 10px;
  font-size: 22px;
  font-weight: 800;
  color: #0f172a;
}

.mini-sub {
  margin-top: 8px;
  color: #295bff;
  font-size: 14px;
  font-weight: 700;
}

.content-grid {
  margin-top: 16px;
  display: grid;
  grid-template-columns: minmax(320px, 460px) minmax(0, 1fr);
  gap: 16px;
  align-items: start;
}

.panel-card {
  border-radius: 20px;
}

.radar-card {
  grid-row: span 2;
}

.timeline-card {
  grid-column: 1 / -1;
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-weight: 700;
}

.panel-note {
  color: #64748b;
  font-size: 12px;
  font-weight: 500;
}

.radar-chart {
  height: 420px;
}

.progress-list {
  display: grid;
  gap: 14px;
}

.progress-item {
  padding: 12px 14px;
  border-radius: 16px;
  background: rgba(248, 250, 255, 0.8);
  border: 1px solid rgba(148, 163, 184, 0.16);
}

.row-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 8px;
}

.row-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.cat-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.cat-name {
  font-size: 14px;
  color: #334155;
}

.cat-pct {
  font-size: 15px;
  color: #0f172a;
}

.bar-track {
  height: 12px;
  border-radius: 999px;
  background: #eef2f7;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: 999px;
  transition: width 0.6s ease;
}

.user-tag {
  display: inline-block;
  padding: 6px 14px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 600;
  color: #295bff;
  background: rgba(41, 91, 255, 0.1);
  border: 1px solid rgba(41, 91, 255, 0.16);
}

.timeline-content {
  padding: 4px 0 10px;
}

.timeline-title {
  font-size: 14px;
  font-weight: 700;
  color: #0f172a;
}

.timeline-meta {
  margin-top: 6px;
  font-size: 13px;
  color: #64748b;
}

@media (max-width: 1200px) {
  .summary-grid,
  .content-grid {
    grid-template-columns: 1fr;
  }

  .radar-card,
  .timeline-card {
    grid-row: auto;
    grid-column: auto;
  }
}

@media (max-width: 768px) {
  .header-inner,
  .hero-main {
    flex-direction: column;
    align-items: flex-start;
  }

  .hero-title {
    font-size: 24px;
  }

  .hero-tags {
    justify-content: flex-start;
  }

  .profile-body {
    padding: 16px 14px 28px;
  }
}
</style>
