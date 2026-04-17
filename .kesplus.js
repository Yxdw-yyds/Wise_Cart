import { defineBuildConfig } from "@kesplus/kesplus";

const buildConfig = {
  locale: {
    default: "zh-CN",
  },
  define: {
    __DEV__: true,
    __APP_PLACEHOLDER__: "--",
  },
  request: { timeout: 1e10 },
  title: "kesplus",
  router: {
    mode: "hash",
  },
  access: {
    roles: {
      admin: ["*"],
    },
  },
  layout: {
    isTagsview: false,
    menuProps: {
      expandedKeys: ["workbench-root"],
      defaultExpandAll: false,
      accordion: false,
    },
    menus: [
      {
        id: "workbench-root",
        name: "工作台",
        icon: "HomeFilled",
        url: "/home",
        children: [
          {
            id: "workbench-overview",
            name: "首页总览驾驶舱",
            icon: "Odometer",
            url: "/home",
          },
          {
            id: "workbench-recommendation",
            name: "推荐系统",
            icon: "Promotion",
            url: "/workbench/recommendation",
          },
          {
            id: "workbench-expo",
            name: "推荐算法展厅",
            icon: "DataAnalysis",
            url: "/model-expo",
          },
          {
            id: "workbench-top50",
            name: "个性化推荐 Top 50",
            icon: "Search",
            url: "/behavior-top50",
          },
          {
            id: "workbench-behavior",
            name: "用户行为分析",
            icon: "TrendCharts",
            url: "/behavior-analysis",
          },
          {
            id: "workbench-ops",
            name: "运营决策",
            icon: "Operation",
            url: "/operations-decision",
          },
        ],
      },
    ],
  },
};

export default defineBuildConfig(buildConfig);
