<template>
  <div class="profile-page">
    <header class="profile-header">
      <div class="header-inner">
        <div class="brand" @click="router.push('/user-mall')">WiseCart</div>
        <h1 class="header-title">用户画像</h1>
        <el-button round @click="router.push('/user-mall')">返回商城</el-button>
      </div>
    </header>

    <div class="profile-body">
      <!-- 左侧：连体人像彩色分区 -->
      <div class="persona-col">
        <el-card shadow="never" class="persona-card">
          <div class="persona-card-title">兴趣画像</div>
          <div class="persona-wrapper">
            <!-- 连体人像 SVG：各部位直接相连，无间隙 -->
            <svg class="body-svg" viewBox="0 0 260 520" xmlns="http://www.w3.org/2000/svg">
              <!-- 头部 - 数码电器 -->
              <ellipse cx="130" cy="52" rx="38" ry="42" :fill="catColors.digital" opacity="0.88" />

              <!-- 躯干（含肩膀，与头/臂/腿衔接） - 个护美妆 -->
              <path d="
                M92,88
                Q80,90 60,100 L40,108
                L40,115 Q42,118 50,118
                L68,112 L68,240
                L90,250 L130,256 L170,250 L192,240
                L192,112 L210,118
                Q218,118 220,115 L220,108
                L200,100 Q180,90 168,88
                Z
              " :fill="catColors.beauty" opacity="0.88" />

              <!-- 左臂 - 饮料酒水 -->
              <path d="
                M40,115
                Q32,120 24,150
                L16,200 Q12,218 18,224
                Q26,232 32,222
                L42,180 L54,140
                L68,118 L68,112
                L50,118 Q42,118 40,115
                Z
              " :fill="catColors.drink" opacity="0.88" />

              <!-- 右臂 - 休闲零食 -->
              <path d="
                M220,115
                Q228,120 236,150
                L244,200 Q248,218 242,224
                Q234,232 228,222
                L218,180 L206,140
                L192,118 L192,112
                L210,118 Q218,118 220,115
                Z
              " :fill="catColors.snack" opacity="0.88" />

              <!-- 左腿 - 日化家清 -->
              <path d="
                M90,250 L130,256
                L128,260 L118,380
                Q116,420 112,460
                Q110,485 100,490
                Q88,494 86,484
                L80,400 Q76,340 74,280
                L68,240 Z
              " :fill="catColors.daily" opacity="0.88" />

              <!-- 右腿 - 粮油速食 -->
              <path d="
                M170,250 L130,256
                L132,260 L142,380
                Q144,420 148,460
                Q150,485 160,490
                Q172,494 174,484
                L180,400 Q184,340 186,280
                L192,240 Z
              " :fill="catColors.food" opacity="0.88" />
            </svg>

            <!-- 百分比标注（直接在人像对应部位上） -->
            <div class="pct-label pct-head">
              <span class="pct-num">{{ pct('digital') }}%</span>
              <span class="pct-name">数码电器</span>
            </div>
            <div class="pct-label pct-torso">
              <span class="pct-num">{{ pct('beauty') }}%</span>
              <span class="pct-name">个护美妆</span>
            </div>
            <div class="pct-label pct-larm">
              <span class="pct-num">{{ pct('drink') }}%</span>
              <span class="pct-name">饮料酒水</span>
            </div>
            <div class="pct-label pct-rarm">
              <span class="pct-num">{{ pct('snack') }}%</span>
              <span class="pct-name">休闲零食</span>
            </div>
            <div class="pct-label pct-lleg">
              <span class="pct-num">{{ pct('daily') }}%</span>
              <span class="pct-name">日化家清</span>
            </div>
            <div class="pct-label pct-rleg">
              <span class="pct-num">{{ pct('food') }}%</span>
              <span class="pct-name">粮油速食</span>
            </div>
          </div>

          <!-- 图例 -->
          <div class="legend">
            <div v-for="item in percentItems" :key="item.key" class="legend-item">
              <span class="legend-dot" :style="{ background: catColors[item.key] }"></span>
              <span class="legend-name">{{ item.label }}</span>
              <b class="legend-pct">{{ item.percent }}%</b>
            </div>
          </div>
        </el-card>
      </div>

      <!-- 右侧：进度条 + 标签 + 总结 -->
      <div class="detail-col">
        <el-card shadow="never" class="detail-card">
          <div class="detail-card-title">类目兴趣分布</div>
          <div class="progress-list">
            <div v-for="item in percentItems" :key="item.key" class="progress-item">
              <div class="row-head">
                <span class="cat-dot" :style="{ background: catColors[item.key] }"></span>
                <span class="cat-name">{{ item.label }}</span>
                <b class="cat-pct">{{ item.percent }}%</b>
              </div>
              <div class="bar-track">
                <div class="bar-fill" :style="{ width: item.percent + '%', background: catColors[item.key] }"></div>
              </div>
            </div>
          </div>
        </el-card>

        <el-card shadow="never" class="detail-card">
          <div class="detail-card-title">用户标签</div>
          <div class="tags-wrap">
            <span v-for="tag in userProfile.tags" :key="tag" class="user-tag">{{ tag }}</span>
          </div>
        </el-card>

        <el-card shadow="never" class="detail-card summary-card">
          <div class="detail-card-title">画像总结</div>
          <p class="summary-text">{{ userProfile.summary }}</p>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useRouter } from "vue-router";
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
const { userProfile, categoryLabels } = useUserMallData();

const catColors = {
  digital: "#6366f1",
  beauty: "#ec4899",
  drink: "#0ea5e9",
  snack: "#f59e0b",
  daily: "#10b981",
  food: "#f97316",
};

const pct = (key) => userProfile.value.categoryPercents[key] ?? 0;

const percentItems = computed(() =>
  Object.entries(userProfile.value.categoryPercents)
    .map(([key, percent]) => ({ key, label: categoryLabels[key] || key, percent }))
    .sort((a, b) => b.percent - a.percent)
);
</script>

<style scoped>
.profile-page {
  height: 100vh;
  overflow-y: auto;
  overflow-x: hidden;
  background: linear-gradient(135deg, #f0f4ff 0%, #fdf2f8 50%, #f0fdf4 100%);
}

.profile-header {
  background: #fff;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.06);
}

.header-inner {
  max-width: 1100px;
  margin: 0 auto;
  padding: 12px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.brand {
  font-size: 22px;
  font-weight: 800;
  color: #ff6700;
  cursor: pointer;
}

.header-title {
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.profile-body {
  max-width: 1100px;
  margin: 24px auto;
  padding: 0 20px 40px;
  display: grid;
  grid-template-columns: 440px 1fr;
  gap: 20px;
  align-items: start;
}

@media (max-width: 900px) {
  .profile-body {
    grid-template-columns: 1fr;
  }
}

.persona-card {
  border-radius: 16px;
}

.persona-card-title,
.detail-card-title {
  font-size: 17px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 16px;
}

.persona-wrapper {
  position: relative;
  width: 300px;
  margin: 0 auto;
  aspect-ratio: 260 / 520;
}

.body-svg {
  width: 100%;
  height: 100%;
  filter: drop-shadow(0 8px 20px rgba(0, 0, 0, 0.12));
}

/* 百分比标注 - 直接覆盖在人像上 */
.pct-label {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  pointer-events: none;
  z-index: 2;
}

.pct-num {
  font-size: 15px;
  font-weight: 800;
  color: #fff;
  text-shadow:
    0 1px 3px rgba(0, 0, 0, 0.5),
    0 0 6px rgba(0, 0, 0, 0.2);
}

.pct-name {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.95);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  font-weight: 600;
  margin-top: 1px;
}

.pct-head  { top: 6%;  left: 50%; transform: translateX(-50%); }
.pct-torso { top: 32%; left: 50%; transform: translateX(-50%); }
.pct-larm  { top: 30%; left: 6%; }
.pct-rarm  { top: 30%; right: 6%; align-items: flex-end; }
.pct-lleg  { top: 64%; left: 24%; }
.pct-rleg  { top: 64%; right: 24%; align-items: flex-end; }

/* 图例 */
.legend {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 18px;
  margin-top: 20px;
  justify-content: center;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.legend-name { color: #475569; }
.legend-pct  { color: #1e293b; }

/* 右侧 */
.detail-col {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.detail-card { border-radius: 16px; }

.progress-list { display: grid; gap: 14px; }

.row-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.cat-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.cat-name { flex: 1; font-size: 14px; color: #334155; }
.cat-pct  { font-size: 15px; color: #1e293b; }

.bar-track {
  height: 12px;
  border-radius: 6px;
  background: #f1f5f9;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: 6px;
  transition: width 0.6s ease;
}

.tags-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.user-tag {
  display: inline-block;
  padding: 5px 14px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
  color: #6366f1;
  background: #eef2ff;
  border: 1px solid #c7d2fe;
}

.summary-card .summary-text {
  margin: 0;
  padding: 14px;
  border-radius: 12px;
  background: linear-gradient(135deg, #f0f4ff, #fdf2f8);
  line-height: 1.7;
  color: #334155;
  font-size: 14px;
}
</style>
