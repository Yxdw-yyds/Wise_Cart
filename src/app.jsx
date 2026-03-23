import { defineRuntimeConfig } from "@kesplus/kesplus";

export function defineAccessConfig(memo) {
  memo.ignoreAccess ??= [];
  memo.ignoreAccess.push("/home");
  memo.ignoreAccess.push("/user-info");
  memo.ignoreAccess.push("/user-center");
  memo.ignoreAccess.push("/behavior-analysis");
  memo.ignoreAccess.push("/model-center");
  memo.ignoreAccess.push("/operations-decision");
  memo.ignoreAccess.push("/avatar");
  memo.ignoreAccess.push("/user-home");
  memo.ignoreAccess.push("/user-mall");
  memo.ignoreAccess.push("/user-profile");
  return memo;
}

export default defineRuntimeConfig({});

const ADMIN_ROUTES = [
  "/home",
  "/behavior-analysis",
  "/model-center",
  "/operations-decision",
  "/avatar",
  "/user-info",
  "/user-center",
];

const USER_ROUTES = ["/user-home", "/user-mall", "/user-profile"];

function setRoutePathAttr(path) {
  document?.body?.setAttribute("data-route-path", path || "");
}

function ensureAdminBootstrap() {
  const role = localStorage.getItem("loginRole");
  if (role !== "admin") return;

  const demoToken =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlZmZlY3Rfc2Vjb25kIjo5OTk5OTk5OTk5LCJpZCI6ImRlbW8iLCJhcHBJZCI6MX0.demo";
  const defaultUser = {
    token: demoToken,
    refreshToken: demoToken,
    tokenCreateTime: Date.now(),
    realName: "应用管理员",
    username: "admin",
    userName: "admin",
    nickName: "应用管理员",
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
  const getRole = () => localStorage.getItem("loginRole") || "admin";

  const syncRouteAttr = (path) => {
    setRoutePathAttr(path || "/");
  };

  syncRouteAttr(window.location.hash.replace(/^#/, "") || "/");
  window.addEventListener("hashchange", () => {
    syncRouteAttr(window.location.hash.replace(/^#/, "") || "/");
  });

  router?.beforeEach((to, from, next) => {
    const role = getRole();
    if (role === "user" && ADMIN_ROUTES.some((route) => to?.path?.startsWith(route))) {
      next("/user-mall");
      return;
    }
    if (role === "admin" && USER_ROUTES.some((route) => to?.path?.startsWith(route))) {
      next("/home");
      return;
    }
    next();
  });

  router?.afterEach((to) => {
    syncRouteAttr(to?.path || "/");
  });
}
