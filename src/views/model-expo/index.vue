<template>
  <div class="workspace-page route-fade-in expo-outer">
    <!-- ====== Hero ====== -->
    <div class="expo-hero">
      <div class="hero-shapes"><div class="hs hs1"></div><div class="hs hs2"></div></div>
      <div class="hero-inner">
        <div>
          <h2 class="hero-title">🧠 推荐算法展厅</h2>
          <p class="hero-desc">CCDRec 扩散对齐 · 课程负采样 · 模型架构与实验结果展示</p>
        </div>
      </div>
    </div>

    <div class="expo-carousel-container">
      <el-carousel 
        ref="carouselRef" 
        trigger="click" 
        height="calc(100vh - 240px)" 
        :autoplay="false" 
        arrow="always" 
        indicator-position="none" 
        class="expo-carousel"
        @change="handleCarouselChange"
      >
        <el-carousel-item>
          <ModelExpoOverview />
        </el-carousel-item>
        <el-carousel-item>
          <ModelExpoDiffusion />
        </el-carousel-item>
        <el-carousel-item>
          <ModelExpoSampling />
        </el-carousel-item>
        <el-carousel-item>
          <ModelExpoResults />
        </el-carousel-item>
      </el-carousel>
      
      <div class="custom-indicators">
        <div 
          v-for="(label, index) in tabLabels" 
          :key="index"
          class="indicator-tab"
          :class="{ active: activeIndex === index }"
          @click="goToSlide(index)"
        >
          {{ label }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { defineRouteMeta } from "@kesplus/kesplus";
import ModelExpoOverview from "@/components/model-expo/overview.vue";
import ModelExpoDiffusion from "@/components/model-expo/diffusion.vue";
import ModelExpoSampling from "@/components/model-expo/sampling.vue";
import ModelExpoResults from "@/components/model-expo/results.vue";

defineOptions({ name: "ModelExpoPage" });

defineRouteMeta({
  name: "modelExpo",
  title: "推荐算法展厅",
  icon: "DataAnalysis",
  isKeepAlive: true,
});

const carouselRef = ref(null);
const activeIndex = ref(0);
const tabLabels = ["算法总览", "扩散对齐机制", "课程负采样与排序", "结果与案例"];

function handleCarouselChange(newIndex) {
  activeIndex.value = newIndex;
}

function goToSlide(index) {
  if (carouselRef.value) {
    carouselRef.value.setActiveItem(index);
  }
}
</script>

<style scoped>
.expo-outer {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* ====== Hero ====== */
.expo-hero {
  position: relative; border-radius: 16px; padding: 20px 28px; overflow: hidden; flex-shrink: 0;
  background: linear-gradient(135deg, #581c87 0%, #7e22ce 35%, #a855f7 65%, #c084fc 100%);
  color: #fff;
}
.hero-shapes { position: absolute; inset: 0; pointer-events: none; overflow: hidden; border-radius: 16px; }
.hs { position: absolute; border-radius: 50%; opacity: .08; background: #fff; }
.hs1 { width: 200px; height: 200px; top: -60px; right: -40px; }
.hs2 { width: 100px; height: 100px; bottom: -30px; left: 10%; }
.hero-inner { position: relative; z-index: 1; display: flex; justify-content: space-between; align-items: center; gap: 16px; }
.hero-title { margin: 0; font-size: 22px; font-weight: 800; }
.hero-desc { margin: 4px 0 0; font-size: 13px; opacity: .7; }

.expo-carousel-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}
.expo-carousel {
  flex: 1;
  border-radius: 14px;
  overflow: hidden;
  background: var(--bg-elevated);
  border: 1px solid var(--border-soft);
  box-shadow: var(--shadow-soft);
}

.custom-indicators {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  margin-top: 14px;
  padding-bottom: 4px;
}

.indicator-tab {
  padding: 8px 18px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  background: rgba(255,255,255,.82);
  backdrop-filter: blur(10px);
  cursor: pointer;
  transition: all 0.25s ease;
  border: 1px solid var(--border-soft);
  box-shadow: var(--shadow-soft);
}

.indicator-tab:hover {
  color: var(--accent-primary);
  border-color: var(--accent-primary);
  transform: translateY(-1px);
}

.indicator-tab.active {
  color: #fff;
  background: linear-gradient(135deg, #7c3aed, #a855f7);
  border-color: transparent;
  box-shadow: 0 4px 12px rgba(124, 58, 237, 0.3);
}
</style>
