<template>
  <div class="expo-carousel-container">
    <el-carousel 
      ref="carouselRef" 
      trigger="click" 
      height="calc(100vh - 120px)" 
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
  icon: "DataBoard",
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
.expo-carousel-container {
  width: 100%;
  height: calc(100vh - 80px); /* 留点空间给外层 padding 和 indicator */
  display: flex;
  flex-direction: column;
}
.expo-carousel {
  flex: 1;
  border-radius: 12px;
  overflow: hidden;
  background: var(--bg-elevated);
}

.custom-indicators {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  margin-top: 16px;
  padding-bottom: 8px;
}

.indicator-tab {
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
  background: var(--bg-muted);
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid var(--border-soft);
}

.indicator-tab:hover {
  color: var(--text-primary);
  background: var(--bg-subtle);
}

.indicator-tab.active {
  color: #fff;
  background: var(--accent-primary, #3b82f6);
  border-color: var(--accent-primary, #3b82f6);
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.25);
}
</style>
