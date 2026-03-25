import { defineRuntimeConfig } from "@kesplus/kesplus";

export function defineAccessConfig(memo) {
  memo.ignoreAccess ??= [];
  memo.ignoreAccess.push("/home");
  memo.ignoreAccess.push("/user-info");
  memo.ignoreAccess.push("/user-center");
  memo.ignoreAccess.push("/behavior-analysis");
  memo.ignoreAccess.push("/model-center");
  memo.ignoreAccess.push("/model-expo/overview");
  memo.ignoreAccess.push("/model-expo/diffusion");
  memo.ignoreAccess.push("/model-expo/sampling");
  memo.ignoreAccess.push("/model-expo/results");
  memo.ignoreAccess.push("/operations-decision");
  memo.ignoreAccess.push("/avatar");
  memo.ignoreAccess.push("/workbench/user-profile");
  memo.ignoreAccess.push("/behavior-top50");
  return memo;
}

export default defineRuntimeConfig({});

function setRoutePathAttr(path) {
  document?.body?.setAttribute("data-route-path", path || "");
}

function ensureAdminBootstrap() {
  const staticWorkbenchIds = new Set([
    "workbench-root",
    "workbench-expo",
    "workbench-expo-overview",
    "workbench-expo-diffusion",
    "workbench-expo-sampling",
    "workbench-expo-results",
    "workbench-overview",
    "workbench-behavior",
    "workbench-top50",
    "workbench-model",
    "workbench-ops",
  ]);
  const staticWorkbenchUrls = new Set([
    "/model-expo/overview",
    "/model-expo/diffusion",
    "/model-expo/sampling",
    "/model-expo/results",
    "/home",
    "/behavior-analysis",
    "/behavior-top50",
    "/model-center",
    "/operations-decision",
  ]);

  const sanitizeMenus = (menus) => {
    if (!Array.isArray(menus)) return [];
    return menus.filter((item) => !staticWorkbenchIds.has(item?.id) && !staticWorkbenchUrls.has(item?.url));
  };

  localStorage.setItem("loginRole", "admin");

  const demoToken =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlZmZlY3Rfc2Vjb25kIjo5OTk5OTk5OTk5LCJpZCI6ImRlbW8iLCJhcHBJZCI6MX0.demo";
  const defaultUser = {
    token: demoToken,
    refreshToken: demoToken,
    tokenCreateTime: Date.now(),
    realName: "admin",
    username: "admin",
    userName: "admin",
    nickName: "admin",
    roles: "admin",
    permission: ["*"],
    menus: [],
    userId: "demo-admin",
    userid: "demo-admin",
    id: "demo-admin",
  };

  let current = defaultUser;
  try {
    const raw = localStorage.getItem("userInfo");
    if (raw) {
      const parsed = JSON.parse(raw);
      current = { ...defaultUser, ...parsed };
    }
  } catch (_) {
    current = defaultUser;
  }

  if (!current.userId) current.userId = current.userid || current.id || "demo-admin";
  if (!current.userid) current.userid = current.userId;
  if (!current.id) current.id = current.userId;
  if (!current.token) current.token = demoToken;
  if (!current.refreshToken) current.refreshToken = current.token;
  current.menus = sanitizeMenus(current.menus);

  const payload = JSON.stringify(current);
  localStorage.setItem("token", current.token);
  localStorage.setItem("refreshToken", current.refreshToken);
  localStorage.setItem("userId", current.userId);
  localStorage.setItem("userInfo", payload);
  localStorage.setItem("user", payload);
  localStorage.setItem("loginUser", payload);
  sessionStorage.setItem("token", current.token);
  sessionStorage.setItem("refreshToken", current.refreshToken);
  sessionStorage.setItem("userId", current.userId);
  sessionStorage.setItem("userInfo", payload);
}

export function onAppCreated({ app }) {
  ensureAdminBootstrap();
  const router = app?.config?.globalProperties?.$router;

  const syncRouteAttr = (path) => {
    setRoutePathAttr(path || "/");
  };

  syncRouteAttr(window.location.hash.replace(/^#/, "") || "/");
  window.addEventListener("hashchange", () => {
    syncRouteAttr(window.location.hash.replace(/^#/, "") || "/");
  });

  router?.afterEach((to) => {
    syncRouteAttr(to?.path || "/");
  });
}


