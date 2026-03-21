<template>
  <div
    class="login-container relative h-full w-full flex flex-justify-center flex-items-center bg-center-top bg-no-repeat dark:bg-#101628"
  >
    <Top />
    <el-card class="relative z-10 w-100 <sm:w-83 !rounded-4% !border-none !bg-transparent">
      <h3 class="mt-6 flex-x-center text-24px text-primary font-500">
        {{ $t("login.login") }}
      </h3>
      <el-form
        ref="formRef"
        :model="baseForm"
        :show-message="false"
        :rules="formRules"
        class="mt-6"
        autocomplete="off"
        size="large"
        @validate="validate"
        @keyup.enter="handleLogin(false)"
      >
        <el-form-item prop="username">
          <el-input v-model="baseForm.username" :placeholder="$t('login.usernamePlaceholder')" />
        </el-form-item>
        <el-form-item prop="password">
          <el-input
            v-model="baseForm.password"
            show-password
            autocomplete="new-password"
            :placeholder="$t('login.passwordPlaceholder')"
          />
        </el-form-item>
        <el-form-item prop="captchaValue">
          <el-input v-model="baseForm.captchaValue" class="captcha" :placeholder="$t('login.verifyCode')">
            <template #append>
              <Captcha ref="codeRef" v-model="baseForm.uuid" class="h-full w-full" />
            </template>
          </el-input>
        </el-form-item>

        <el-form-item>
          <el-radio-group v-model="loginRole" class="role-switch">
            <el-radio-button label="admin">Admin</el-radio-button>
            <el-radio-button label="user">User</el-radio-button>
          </el-radio-group>
        </el-form-item>

        <div v-if="validErrmsg" class="el-alert el-alert--error is-light justify-center !mb-16px">
          {{ validErrmsg }}
        </div>

        <el-form-item>
          <el-button class="w-full" type="primary" :loading="loading" @click="handleLogin(false)">
            {{ $t("login.login") }}
          </el-button>
        </el-form-item>
        <el-form-item v-if="loginRole === 'admin'">
          <el-button class="w-full" plain type="button" @click.prevent="forceEnterAdmin">
            强制进入管理员后台
          </el-button>
        </el-form-item>
        <el-form-item v-if="loginRole === 'user'">
          <el-button class="w-full" plain @click="forceEnterUserMall">
            强制进入用户商城
          </el-button>
        </el-form-item>

        <el-form-item v-if="ldap">
          <el-button :loading="loading" class="w-full" @click="handleLogin(true)">
            {{ $t("login.ldap") }}
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
    <Bottom />
  </div>
</template>

<script setup>
import { ref, computed, unref } from "vue";
import { useRouter } from "vue-router";
import { defineRouteMeta, useLogin, Captcha } from "@kesplus/kesplus";
import Top from "./components/top.vue";
import Bottom from "./components/bottom.vue";

const formRef = ref();
const errs = ref({});
const codeRef = ref();
const router = useRouter();
const loginRole = ref(localStorage.getItem("loginRole") || "admin");
const localLoginError = ref("");

const DEMO_USER = {
  username: "mall_user",
  password: "mall123456",
};

defineRouteMeta({
  layout: {
    navigation: null,
  },
});

defineOptions({
  name: "CustomerLoginPage",
});

const { baseForm, formRules, loading, doLogin, ldap, error } = useLogin(formRef, codeRef);

const validate = (prop, isValid, message) => {
  if (!isValid) errs.value[prop] = message;
  else delete errs.value[prop];
};

const validErrmsg = computed(() => {
  if (localLoginError.value) return localLoginError.value;
  const keys = Object.keys(errs.value);
  if (keys.length) return errs.value[keys.at(keys.length - 1)];
  if (unref(error)) return unref(error);
  return false;
});

const handleLogin = async (isLdap = false) => {
  try {
    localStorage.setItem("loginRole", loginRole.value);

    if (loginRole.value === "user") {
      const username = String(baseForm.username || "").trim();
      const password = String(baseForm.password || "").trim();
      if (username === DEMO_USER.username && password === DEMO_USER.password) {
        localLoginError.value = "";
        forceEnterUserMall();
      } else {
        localLoginError.value = "用户账号或密码错误（Demo: mall_user / mall123456）";
      }
      return;
    }

    localLoginError.value = "";
    await doLogin(isLdap);
    router.replace("/home");
  } catch (e) {
    localLoginError.value = e?.message || "Login failed";
  }
};

const forceEnterUserMall = () => {
  localStorage.setItem("loginRole", "user");
  window.location.assign(
    `${window.location.origin}${window.location.pathname}#/user-mall?ts=${Date.now()}`
  );
};

const forceEnterAdmin = () => {
  localStorage.setItem("loginRole", "admin");
  const demoToken =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlZmZlY3Rfc2Vjb25kIjo5OTk5OTk5OTk5LCJpZCI6ImRlbW8iLCJhcHBJZCI6MX0.demo";
  const demoUserInfo = {
    token: demoToken,
    refreshToken: demoToken,
    tokenCreateTime: Math.floor(Date.now()),
    realName: "应用管理员",
    roles: "admin",
    permission: ["*"],
    menus: [],
    userId: "demo-admin",
    id: "demo-admin",
  };
  localStorage.setItem("userInfo", JSON.stringify(demoUserInfo));
  window.location.assign(
    `${window.location.origin}${window.location.pathname}#/home?ts=${Date.now()}`
  );
};
</script>

<style lang="scss" scoped>
.login-container {
  background-image: url("/src/images/background.svg");
}

.captcha :deep(.el-input-group__append) {
  padding: 0;
}

.role-switch {
  width: 100%;
}

.role-switch :deep(.el-radio-button) {
  flex: 1;
}

.role-switch :deep(.el-radio-button__inner) {
  width: 100%;
}
</style>
