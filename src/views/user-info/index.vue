<template>
  <div class="workspace-page route-fade-in user-info-page">
    <el-card shadow="never" class="workspace-hero">
      <template #header>
        <div class="workspace-head">
          <div>
            <h2>{{ $t("userInfo.title") }}</h2>
            <p>用户基础信息总览与快速筛选。</p>
          </div>
        </div>
      </template>

      <el-form :inline="true" :model="queryForm" class="workspace-toolbar search-form">
        <el-form-item :label="$t('userInfo.username')">
          <el-input
            v-model="queryForm.username"
            :placeholder="$t('userInfo.usernamePlaceholder')"
            clearable
          />
        </el-form-item>
        <el-form-item :label="$t('userInfo.phone')">
          <el-input
            v-model="queryForm.phone"
            :placeholder="$t('userInfo.phonePlaceholder')"
            clearable
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="onSearch">
            {{ $t("userInfo.search") }}
          </el-button>
          <el-button @click="onReset">{{ $t("userInfo.reset") }}</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="filteredUsers" border>
        <el-table-column align="center" type="selection" width="66" :selectable="() => true"></el-table-column>

        <el-table-column prop="username" :label="$t('userInfo.username')" />
        <el-table-column prop="name" :label="$t('userInfo.name')" />
        <el-table-column prop="phone" :label="$t('userInfo.phone')" />
        <el-table-column prop="email" :label="$t('userInfo.email')" />
        <el-table-column prop="role" :label="$t('userInfo.role')" />
      
<el-table-column prop="remark" :label="$t('userInfo.remark')" />
</el-table>

    
    </el-card>
  </div>
</template>

<script setup>
import { computed, ref } from "vue";
import { defineRouteMeta } from "@kesplus/kesplus";

defineOptions({
  name: "UserInfoPage",
});

defineRouteMeta({
  name: "userInfo",
  title: "用户信息",
  icon: "UserFilled",
  isKeepAlive: true,
});

const users = ref([
  {
    username: "zhangsan",
    name: "张三",
    phone: "13800000001",
    email: "zhangsan@example.com",
    role: "管理员",
    remark: "",
  },
  {
    username: "lisi",
    name: "李四",
    phone: "13800000002",
    email: "lisi@example.com",
    role: "业务员",
    remark: "",
  },
  {
    username: "wangwu",
    name: "王五",
    phone: "13800000003",
    email: "wangwu@example.com",
    role: "仓库员",
    remark: "",
  },
]);

const queryForm = ref({
  username: "",
  phone: "",
});
const keyword = ref({
  username: "",
  phone: "",
});

const filteredUsers = computed(() => {
  return users.value.filter((item) => {
    const usernameMatched =
      !keyword.value.username || item.username.includes(keyword.value.username);
    const phoneMatched =
      !keyword.value.phone || item.phone.includes(keyword.value.phone);
    return usernameMatched && phoneMatched;
  });
});

const onSearch = () => {
  keyword.value = { ...queryForm.value };
};

const onReset = () => {
  queryForm.value = {
    username: "",
    phone: "",
  };
  keyword.value = {
    username: "",
    phone: "",
  };
};
</script>

<style scoped>
.user-info-page {
  display: grid;
  gap: 14px;
}

.workspace-hero {
  border-radius: 18px;
}

.search-form {
  margin-bottom: 12px;
  padding: 12px;
  border-radius: 14px;
  background: linear-gradient(128deg, rgba(59, 130, 246, 0.08), rgba(255, 255, 255, 0.9));
}

@media (max-width: 768px) {
  .search-form {
    display: grid;
    gap: 8px;
  }
}
</style>
