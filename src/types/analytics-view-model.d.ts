export interface KpiCardVM {
  key: string;
  label: string;
  value: string | number;
  trend?: string;
  trendDirection?: "up" | "down";
}

export interface InsightPanelVM {
  id: string;
  title: string;
  description?: string;
  status?: "normal" | "warning" | "danger";
}

export interface ChartPanelVM {
  id: string;
  title: string;
  subtitle?: string;
  loading?: boolean;
  emptyState?: string;
}

export interface AlertItemVM {
  id: string;
  title: string;
  level: "high" | "medium" | "low";
  status: "new" | "processing" | "resolved";
  time: string;
}

export interface ModelVersionVM {
  version: string;
  trainTime: string;
  featureVersion: string;
  metrics: string;
  online: boolean;
}

export interface AbResultVM {
  metric: string;
  control: string;
  experiment: string;
  uplift: string;
  pValue: string;
}

export interface ThemeTokens {
  bgPage: string;
  bgElevated: string;
  bgGlass: string;
  textPrimary: string;
  textSecondary: string;
  borderSoft: string;
  accentBlue: string;
  accentCyan: string;
  accentViolet: string;
  accentSuccess: string;
  accentWarning: string;
  accentDanger: string;
  radiusMain: string;
  radiusSub: string;
}
export interface ModelManifest {
  model: string;
  dataset: string;
  generatedAt: string;
  artifacts: Record<string, string>;
  checksums: Record<string, string>;
  weights: {
    path: string;
    includedInFrontend: boolean;
  };
}

export interface DatasetSummary {
  dataset: string;
  users: number;
  items: number;
  interactions: number;
  avgActionsPerUser: number;
  split: Record<string, { users?: number; items?: number; inters?: number; sparsity?: number }>;
}

export interface OfflineMetrics {
  dataset: string;
  bestEpoch: number | null;
  bestValid: Record<string, number>;
  bestTest: Record<string, number>;
  sourceFiles: Record<string, string>;
}

export interface UserTopK {
  dataset: string;
  users: Record<string, string[]>;
}

export interface OpsSegmentEffect {
  dataset: string;
  audienceBuckets: { high: number; mid: number; low: number; total: number };
  groupEffects: Array<{ group: string; reach: number; click: number; convert: number; ctrRate?: number; convertRate?: number }>;
  recommendCoverage: number;
  recommendationStats?: {
    coveredUsers: number;
    uncoveredUsers: number;
    exposureCount: number;
    avgItemsPerUser: number;
    uniqueRecommendedItems: number;
    avgCtr: number;
    expectedClicks: number;
    expectedConversions: number;
    top1Concentration: number;
    categoryExposure: Array<{ name: string; count: number }>;
    priceBandExposure: Array<{ name: string; count: number }>;
  };
}
