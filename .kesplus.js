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
        url: "/model-expo/overview",
        children: [
          {
            id: "workbench-expo",
            name: "推荐算法展厅",
            icon: "Monitor",
            url: "/model-expo/overview",
            children: [
              {
                id: "workbench-expo-overview",
                name: "算法总览",
                icon: "DataBoard",
                url: "/model-expo/overview",
              },
              {
                id: "workbench-expo-diffusion",
                name: "扩散对齐机制",
                icon: "Connection",
                url: "/model-expo/diffusion",
              },
              {
                id: "workbench-expo-sampling",
                name: "课程负采样与排序",
                icon: "Histogram",
                url: "/model-expo/sampling",
              },
              {
                id: "workbench-expo-results",
                name: "结果与案例",
                icon: "Trophy",
                url: "/model-expo/results",
              },
            ],
          },
          {
            id: "workbench-overview",
            name: "首页总览驾驶舱",
            icon: "DataBoard",
            url: "/home",
          },
          {
            id: "workbench-behavior",
            name: "用户行为分析",
            icon: "DataLine",
            url: "/behavior-analysis",
          },
          {
            id: "workbench-top50",
            name: "推荐前50查询",
            icon: "Search",
            url: "/behavior-top50",
          },
          {
            id: "workbench-model",
            name: "推荐与模型分析",
            icon: "TrendCharts",
            url: "/model-center",
          },
          {
            id: "workbench-ops",
            name: "运营决策",
            icon: "Operation",
            url: "/operations-decision",
          },
          {
            id: "workbench-recommendation",
            name: "推荐系统",
            icon: "Promotion",
            url: "/workbench/recommendation",
          },
        ],
      },
    ],
  },
};

export default defineBuildConfig(buildConfig);
