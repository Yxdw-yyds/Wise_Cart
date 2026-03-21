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
