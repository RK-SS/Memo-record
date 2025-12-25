<template>
  <div class="login-container">
    <InitialPasswordModal @close="handleInitialPasswordClose" />

    <div class="login-card">
      <h1 class="login-title">📝 备忘记事录</h1>
      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label class="form-label">用户名</label>
          <input v-model="credentials.username" type="text" class="form-input" placeholder="请输入用户名" required />
        </div>
        <div class="form-group">
          <label class="form-label">密码</label>
          <input v-model="credentials.password" type="password" class="form-input" placeholder="请输入密码" required />
        </div>
        <button type="submit" class="btn btn-primary login-btn" :disabled="loading">
          {{ loading ? "登录中..." : "登录" }}
        </button>
        <div v-if="error" class="error-message">{{ error }}</div>
      </form>
      <div class="login-info">
        <p>默认用户名: admin</p>
        <p v-if="isElectron">首次启动会显示随机生成的密码</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth";
import InitialPasswordModal from "../components/InitialPasswordModal.vue";

const router = useRouter();
const authStore = useAuthStore();

const credentials = ref({
  username: "admin",
  password: "",
});

const loading = ref(false);
const error = ref("");
const showInitialPassword = ref(false);
const isElectron = ref(!!window.electronAPI);

const handleLogin = async () => {
  loading.value = true;
  error.value = "";

  try {
    const success = await authStore.login(credentials.value);
    if (success) {
      router.push("/dashboard");
    } else {
      error.value = "用户名或密码错误";
    }
  } catch (err) {
    error.value = "登录失败，请重试";
  } finally {
    loading.value = false;
  }
};

const handleInitialPasswordClose = () => {
  showInitialPassword.value = false;
};
</script>

<style scoped>
.login-container {
  display: flex; justify-content: center; align-items: center;
  height: 100vh; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-card {
  background: var(--bg-primary); padding: 40px; border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3); width: 100%; max-width: 400px;
}

.login-title {
  text-align: center; margin-bottom: 30px; color: var(--text-primary); font-size: 26px;
}

.login-form { margin-bottom: 20px; }

.login-btn { width: 100%; padding: 12px; font-size: 16px; margin-top: 10px; }

.error-message {
  color: var(--danger-color); text-align: center; margin-top: 10px; font-size: 14px;
}

.login-info {
  text-align: center; color: var(--text-secondary); font-size: 13px;
  border-top: 1px solid var(--border-color); padding-top: 20px;
}

.login-info p { margin: 4px 0; }
</style>
