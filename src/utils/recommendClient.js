/**
 * 从 CCDRec FastAPI 服务获取推荐
 * @param {number} userId 用户 ID
 * @param {number} topK 推荐数量
 * @returns {Promise<Array<number>>} 推荐的项目 ID 列表
 */
async function fetchRecommendations(userId, topK = 5) {
  const url = 'http://127.0.0.1:8000/recommend';
  const payload = {
    user_id: userId,
    top_k: topK
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const data = await response.json();
    console.log(`为用户 ${userId} 的推荐结果:`, data.recommendations);
    return data.recommendations;
  } catch (error) {
    console.error('获取推荐失败:', error);
    return [];
  }
}

// 在 KES Plus 应用中调用的示例：
// fetchRecommendations(0, 10).then(ids => {
//   // 更新 UI 或业务逻辑
// });
