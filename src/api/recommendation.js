// src/api/recommendation.js

/**
 * 获取推荐商品列表
 * @param {Object} params - 请求参数
 * @param {number} params.user_id - 用户唯一标识
 * @param {number} [params.top_k=5] - 推荐商品数量
 * @returns {Promise} 包含推荐结果的 Promise
 */
export async function getRecommendations({ user_id, top_k = 5 }) {
  const response = await fetch("http://127.0.0.1:8000/recommend", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id, top_k }),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}
