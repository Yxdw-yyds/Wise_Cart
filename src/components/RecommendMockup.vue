<script setup>
import { ref, onMounted } from 'vue';
import { getRecommendations } from '@/api/recommendation';

const recommendations = ref([]);
const loading = ref(false);
const userId = ref(0); // 示例用户 ID

const loadRecommendations = async () => {
  loading.value = true;
  try {
    const res = await getRecommendations({ user_id: userId.value, top_k: 6 });
    recommendations.value = res.recommendations;
    console.log('推荐结果:', res.recommendations);
  } catch (error) {
    console.error('加载推荐失败:', error);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadRecommendations();
});
</script>

<template>
  <div class="recommendation-container p-4">
    <h3 class="text-lg font-bold mb-4">为您推荐</h3>
    
    <div v-if="loading" class="text-gray-500">正在计算推荐内容...</div>
    
    <div v-else class="grid grid-cols-2 gap-4">
      <div 
        v-for="id in recommendations" 
        :key="id"
        class="p-4 border rounded shadow-sm hover:shadow-md transition"
      >
        <div class="text-sm font-semibold">项目 ID: {{ id }}</div>
        <div class="text-xs text-gray-500">基于您的历史喜好精准推荐</div>
      </div>
    </div>

    <button 
      @click="loadRecommendations"
      class="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
    >
      刷新推荐
    </button>
  </div>
</template>

<style scoped>
.recommendation-container {
  max-width: 600px;
  background: #f9fafb;
  border-radius: 8px;
}
</style>
