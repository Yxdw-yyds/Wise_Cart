<template>
  <div class="workspace-page route-fade-in profile-page">
    <el-card shadow="never" class="summary-card">
      <template #header>
        <div class="card-head">
          <h3>用户画像</h3>
          <span>管理员工作台</span>
        </div>
      </template>

      <div class="summary-grid">
        <div class="summary-item">
          <span>第一偏好分类</span>
          <b>{{ percentItems[0]?.label || "-" }}</b>
        </div>
        <div class="summary-item">
          <span>第二偏好分类</span>
          <b>{{ percentItems[1]?.label || "-" }}</b>
        </div>
        <div class="summary-item">
          <span>行为事件数</span>
          <b>{{ behaviorLog.length }}</b>
        </div>
      </div>

      <div class="tag-row">
        <span v-for="tag in userProfile.tags" :key="tag" class="tag">{{ tag }}</span>
      </div>

      <div ref="radarRef" class="radar-chart"></div>
    </el-card>

    <el-card shadow="never" class="timeline-card">
      <template #header>
        <h4>近期行为时间线</h4>
      </template>
      <el-timeline>
        <el-timeline-item
          v-for="item in timelineItems"
          :key="`${item.productId}-${item.ts}`"
          :timestamp="item.timeText"
          :type="item.timelineType"
          placement="top"
        >
          <div class="timeline-title">{{ item.actionText }} {{ item.productName }}</div>
          <div class="timeline-meta">{{ item.categoryName }} / {{ item.detail }}</div>
        </el-timeline-item>
      </el-timeline>
    </el-card>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import dayjs from "dayjs";
import * as echarts from "echarts";
import { defineRouteMeta } from "@kesplus/kesplus";
import { useUserMallData } from "@/composables/useUserMallData";

defineOptions({ name: "用户画像页面" });

defineRouteMeta({
  name: "workbenchUserProfile",
  title: "用户画像",
  icon: "PieChart",
  isKeepAlive: true,
});

const radarRef = ref(null);
let radarChart;

const { userProfile, categoryLabels, behaviorLog, products } = useUserMallData();

const percentItems = computed(() =>
  Object.entries(userProfile.value.categoryPercents)
    .map(([key, percent]) => ({ key, label: categoryLabels[key] || key, percent }))
    .sort((a, b) => b.percent - a.percent)
);

const productMap = computed(() => Object.fromEntries(products.value.map((item) => [item.id, item])));

const actionLabelMap = {
  view: "浏览",
  fav: "收藏",
  cart: "加购",
  buy: "购买",
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
        actionText: actionLabelMap[event.action] || "行为",
        timelineType: actionTypeMap[event.action] || "info",
        detail: `${product?.shop || "未知店铺"} / ${dayjs(event.ts).format("MM-DD HH:mm")}`,
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
      indicator: percentItems.value.map((item) => ({
        name: item.label,
        max: 40,
      })),
    },
    series: [
      {
        type: "radar",
        areaStyle: { color: "rgba(41, 91, 255, 0.18)" },
        lineStyle: { width: 3 },
        data: [
          {
            value: percentItems.value.map((item) => item.percent),
            name: "分类占比",
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
  display: grid;
  gap: 14px;
}

.summary-card,
.timeline-card {
  border-radius: 16px;
}

.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-head h3 {
  margin: 0;
}

.card-head span {
  font-size: 12px;
  color: var(--text-tertiary);
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.summary-item {
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid var(--border-soft);
  background: #fff;
}

.summary-item span {
  font-size: 12px;
  color: var(--text-tertiary);
}

.summary-item b {
  display: block;
  margin-top: 6px;
  font-size: 18px;
  color: var(--text-primary);
}

.tag-row {
  margin-top: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag {
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(41, 91, 255, 0.1);
  color: #295bff;
  font-size: 12px;
}

.radar-chart {
  margin-top: 14px;
  height: 360px;
}

.timeline-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-primary);
}

.timeline-meta {
  margin-top: 4px;
  font-size: 13px;
  color: var(--text-tertiary);
}

@media (max-width: 1024px) {
  .summary-grid {
    grid-template-columns: 1fr;
  }
}
</style>
