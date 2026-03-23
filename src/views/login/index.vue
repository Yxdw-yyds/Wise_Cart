<template>
  <div class="login-shell">
    <Top />
    <div class="login-layout">
      <section class="brand-panel">
        <div class="brand-logo" aria-label="WiseCart">
          <span class="logo-main">WiseCart</span>
          <span class="logo-cn">慧购车</span>
        </div>
        <p class="brand-kicker">WISE CART PLATFORM</p>
        <h1>
          <span>让数据驱动更好的</span>
          <span>运营决策</span>
        </h1>
        <p class="brand-desc">
          <span>一体化零售智能工作台，覆盖推荐分析、用户行为洞察与</span>
          <span>运营策略决策。</span>
        </p>
        <div class="brand-stats">
          <div class="stat-card">
            <span>个性化推荐</span>
            <strong>Top50 + 猜你喜欢</strong>
          </div>
          <div class="stat-card">
            <span>运营洞察</span>
            <strong>实时策略触达分析</strong>
          </div>
        </div>
      </section>

        <el-card class="login-card" shadow="never">
          <h3>{{ $t("login.login") }}</h3>
        <p class="login-sub">登录后继续访问你的工作台</p>

        <el-form
          ref="formRef"
          :model="baseForm"
          :show-message="false"
          :rules="formRules"
          class="login-form"
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
              <el-radio-button label="user">用户</el-radio-button>
              <el-radio-button label="admin">管理员</el-radio-button>
            </el-radio-group>
          </el-form-item>

          <div v-if="validErrmsg" class="el-alert el-alert--error is-light justify-center !mb-16px">
            {{ validErrmsg }}
          </div>

          <el-form-item>
            <el-button class="w-full login-button" type="primary" :loading="loading" @click="handleLogin(false)">
              {{ $t("login.login") }}
            </el-button>
          </el-form-item>

          <el-form-item v-if="loginRole === 'user'">
            <el-button class="w-full" plain native-type="button" @click="forceEnterUserMall">
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
    </div>
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
const loginRole = ref(localStorage.getItem("loginRole") || "user");
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
  window.location.assign(`${window.location.origin}${window.location.pathname}#/user-mall?ts=${Date.now()}`);
};
</script>

<style lang="scss" scoped>
.login-shell {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  background:
    radial-gradient(820px 540px at -12% 4%, rgba(255, 122, 24, 0.24), transparent 58%),
    radial-gradient(980px 620px at 108% -5%, rgba(34, 199, 214, 0.26), transparent 60%),
    linear-gradient(155deg, #f8fbff 0%, #eef7ff 54%, #f4faff 100%);
}

.login-layout {
  position: relative;
  z-index: 2;
  min-height: 100vh;
  max-width: 1180px;
  margin: 0 auto;
  padding: 72px 20px 42px;
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(360px, 440px);
  gap: 42px;
  align-items: center;
}

.brand-panel {
  padding-right: 12px;
}

.brand-logo {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 14px;
  padding-top: 8px;
  line-height: 1.12;
  overflow: visible;
}

.logo-main,
.logo-cn {
  font-weight: 900;
  letter-spacing: 0.01em;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 10px 22px rgba(15, 23, 42, 0.12);
}

.logo-main {
  font-size: 84px;
  font-family: "Trebuchet MS", "Segoe UI", "Helvetica Neue", Arial, sans-serif;
  font-style: italic;
  font-weight: 900;
  letter-spacing: 0.02em;
  background-image: linear-gradient(125deg, #ff5a00 0%, #ff8a00 28%, #2f5bff 62%, #00bcd4 100%);
}

.logo-cn {
  font-size: 42px;
  font-family: "Microsoft YaHei", "PingFang SC", "Segoe UI", sans-serif;
  letter-spacing: 0.02em;
  background-image: linear-gradient(130deg, #00a77c 2%, #0aa3d8 98%);
}

.brand-kicker {
  margin: 0;
  font-size: 12px;
  letter-spacing: 0.14em;
  color: #5b708f;
  text-transform: uppercase;
}

.brand-panel h1 {
  margin: 14px 0 0;
  font-size: 56px;
  line-height: 1.08;
  letter-spacing: -0.02em;
  color: #0f172a;
  display: grid;
  gap: 2px;
  max-width: 760px;
}

.brand-desc {
  margin: 18px 0 0;
  max-width: 780px;
  font-size: 18px;
  line-height: 1.75;
  color: #334155;
  display: grid;
  gap: 2px;
}

.brand-stats {
  margin-top: 28px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.stat-card {
  padding: 16px 18px;
  border-radius: 14px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  background: rgba(255, 255, 255, 0.62);
  backdrop-filter: blur(10px);
}

.stat-card span {
  display: block;
  font-size: 12px;
  color: #64748b;
}

.stat-card strong {
  display: block;
  margin-top: 7px;
  font-size: 15px;
  color: #0f172a;
}

.login-card {
  border-radius: 20px;
  border: 1px solid rgba(148, 163, 184, 0.24);
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 30px 70px rgba(15, 23, 42, 0.18);
  backdrop-filter: blur(16px);
}

.login-card h3 {
  margin: 8px 0 0;
  font-size: 28px;
  color: #0f172a;
}

.login-sub {
  margin: 8px 0 0;
  color: #64748b;
}

.login-form {
  margin-top: 24px;
}

.login-button {
  border: 0;
  background: linear-gradient(135deg, #1a49e8 0%, #0f8dcf 100%);
  box-shadow: 0 12px 24px rgba(31, 95, 255, 0.3);
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

@media (max-width: 1024px) {
  .login-layout {
    grid-template-columns: 1fr;
    gap: 22px;
    padding-top: 44px;
  }

  .logo-main {
    font-size: 62px;
  }

  .logo-cn {
    font-size: 32px;
  }

  .brand-panel h1 {
    font-size: 42px;
  }

  .brand-desc {
    font-size: 16px;
  }
}

@media (max-width: 768px) {
  .brand-stats {
    grid-template-columns: 1fr;
  }

  .logo-main {
    font-size: 50px;
  }

  .logo-cn {
    font-size: 26px;
  }

  .brand-panel h1 {
    font-size: 34px;
  }
}
</style>
