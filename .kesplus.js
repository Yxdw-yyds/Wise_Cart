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
        ],
      },
    ],
  },
};

export default defineBuildConfig(buildConfig);
