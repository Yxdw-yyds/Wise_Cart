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

const USER_ROUTES = ["/user-home", "/user-mall"];

function setRoutePathAttr(path) {
  document?.body?.setAttribute("data-route-path", path || "");
}

export function onAppCreated({ app }) {
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
      next("/user-home");
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
