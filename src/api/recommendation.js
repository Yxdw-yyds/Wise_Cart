const endpoint =
  import.meta.env.VITE_CCDREC_ENDPOINT || "http://127.0.0.1:8000/recommend";

export async function getRecommendations({ user_id, top_k = 5, filter_history = true }) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id, top_k, filter_history }),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}
