<template>
  <div class="workspace-page route-fade-in profile-page">
    <el-row :gutter="16" class="profile-row">
      <el-col :xs="24" :lg="8">
        <el-card shadow="never" class="panel-card">
          <template #header>
            <div class="panel-title">个人信息</div>
          </template>
          <div class="info-list">
            <div class="info-item"><span>用户姓名：</span><b>{{ form.name }}</b></div>
            <div class="info-item"><span>手机号码：</span><b>{{ form.phone || "-" }}</b></div>
            <div class="info-item"><span>用户邮箱：</span><b>{{ form.email || "-" }}</b></div>
            <div class="info-item"><span>所属部门：</span><b>默认根组织</b></div>
          </div>
          <div class="left-actions">
            <el-button round @click="onChangePassword">修改密码</el-button>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :lg="16">
        <el-card shadow="never" class="panel-card basic-card">
          <template #header>
            <div class="panel-title">基本资料</div>
          </template>

          <el-form label-width="82px" class="profile-form">
            <div class="form-grid">
              <el-form-item label="账号" required>
                <el-input v-model="form.username" />
              </el-form-item>
              <el-form-item label="姓名" required>
                <el-input v-model="form.name" />
              </el-form-item>
              <el-form-item label="工号">
                <el-input v-model="form.jobNo" />
              </el-form-item>
              <el-form-item label="手机号">
                <el-input v-model="form.phone" placeholder="请输入手机号" />
              </el-form-item>
              <el-form-item label="邮箱" required>
                <el-input v-model="form.email" placeholder="请输入邮箱" />
              </el-form-item>
            </div>

            <div class="avatar-row">
              <div class="avatar-label">头像</div>
              <el-upload class="avatar-upload" action="#" :auto-upload="false" :show-file-list="false">
                <div class="avatar-box">+</div>
              </el-upload>
              <div class="avatar-actions">
                <el-button @click="onReset">重置</el-button>
                <el-button type="primary" @click="onSave">保存</el-button>
              </div>
            </div>
          </el-form>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { reactive } from "vue";
import { ElMessage } from "element-plus";
import { defineRouteMeta } from "@kesplus/kesplus";

defineOptions({
  name: "AvatarProfilePage",
});

defineRouteMeta({
  name: "avatarProfile",
  title: "个人中心",
  icon: "UserFilled",
  isKeepAlive: true,
});

const form = reactive({
  username: "admin_zzy",
  name: "应用管理员",
  jobNo: "admin",
  phone: "",
  email: "",
});

const onReset = () => {
  form.phone = "";
  form.email = "";
};

const onSave = () => {
  ElMessage.success("保存成功");
};

const onChangePassword = () => {
  ElMessage.info("请在安全中心修改密码");
};
</script>

<style scoped>
.profile-page {
  display: grid;
  gap: 14px;
}

.profile-row {
  align-items: stretch;
}

.panel-card {
  border-radius: 18px;
}

.panel-title {
  font-size: 24px;
  font-weight: 800;
  color: var(--text-primary);
}

.info-list {
  display: grid;
  gap: 26px;
  min-height: 320px;
}

.info-item {
  font-size: 18px;
  color: var(--text-secondary);
}

.info-item span {
  margin-right: 10px;
  color: var(--text-primary);
}

.left-actions {
  display: flex;
  justify-content: flex-end;
}

.profile-form {
  padding-top: 6px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px 16px;
}

.avatar-row {
  display: grid;
  grid-template-columns: 82px 180px 1fr;
  align-items: end;
  margin-top: 10px;
}

.avatar-label {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-secondary);
  line-height: 1;
  padding-bottom: 72px;
}

.avatar-upload {
  width: 180px;
}

.avatar-box {
  width: 180px;
  height: 180px;
  border: 1px dashed var(--border-strong);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 60px;
  color: var(--text-tertiary);
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.08), rgba(255, 255, 255, 0.9));
}

.avatar-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding-bottom: 6px;
}

@media (max-width: 1200px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .avatar-row {
    grid-template-columns: 1fr;
    gap: 10px;
    align-items: start;
  }

  .avatar-label {
    padding-bottom: 0;
  }

  .avatar-actions {
    justify-content: flex-start;
    padding-bottom: 0;
  }
}
</style>
