import { computed, ref } from "vue";

const cache = {
  manifest: null,
  summary: null,
  metrics: null,
  topk: null,
  ops: null,
};

async function loadJson(name) {
  if (cache[name]) return cache[name];
  let mod;
  if (name === "manifest") mod = await import("@/models/ccdrec/manifest.json");
  if (name === "summary") mod = await import("@/models/ccdrec/dataset-baby-summary.json");
  if (name === "metrics") mod = await import("@/models/ccdrec/metrics-baby.json");
  if (name === "topk") mod = await import("@/models/ccdrec/topk-baby.json");
  if (name === "ops") mod = await import("@/models/ccdrec/ops-baby.json");
  cache[name] = mod.default || mod;
  return cache[name];
}

export async function loadCcdrecManifest() {
  return loadJson("manifest");
}

export async function loadDatasetSummary(dataset = "baby") {
  if (dataset !== "baby") throw new Error("Only baby dataset is supported in v1");
  return loadJson("summary");
}

export async function loadOfflineMetrics(dataset = "baby") {
  if (dataset !== "baby") throw new Error("Only baby dataset is supported in v1");
  return loadJson("metrics");
}

export async function loadUserTopK(dataset = "baby", userId) {
  if (dataset !== "baby") throw new Error("Only baby dataset is supported in v1");
  const data = await loadJson("topk");
  if (!userId) return data.users;
  return data.users[String(userId)] || [];
}

export async function loadOpsAnalytics(dataset = "baby", filters = {}) {
  if (dataset !== "baby") throw new Error("Only baby dataset is supported in v1");
  const ops = await loadJson("ops");

  if (!filters || !filters.activeLevel) return ops;

  const total = ops.audienceBuckets.total || 0;
  const ratioMap = { high: 0.18, mid: 0.37, low: 0.45 };
  const level = filters.activeLevel;
  const count = Math.floor(total * (ratioMap[level] ?? 1));

  return {
    ...ops,
    filteredAudienceCount: count,
  };
}

export function useCcdrecData() {
  const loading = ref(false);
  const error = ref("");
  const dataset = ref("baby");

  const ready = computed(() => !loading.value && !error.value);

  const wrap = async (fn) => {
    loading.value = true;
    error.value = "";
    try {
      return await fn();
    } catch (e) {
      error.value = e instanceof Error ? e.message : String(e);
      throw e;
    } finally {
      loading.value = false;
    }
  };

  return {
    dataset,
    loading,
    error,
    ready,
    wrap,
  };
}
