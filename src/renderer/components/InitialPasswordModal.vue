<template>
  <div v-if="showModal" class="modal-overlay">
    <div class="modal initial-password-modal">
      <div class="modal-header">
        <h2>🔐 {{ isReturningUser ? '提醒：您仍在使用默认密码' : '重要：请记住您的登录密码' }}</h2>
      </div>
      
      <div class="modal-content">
        <div class="password-info">
          <p class="info-text">
            {{ isReturningUser ? '检测到您仍在使用系统生成的默认密码：' : '系统已为您生成初始登录密码：' }}
          </p>
          <div class="password-display">
            <span class="password">{{ initialPassword }}</span>
            <button @click="copyPassword" class="copy-btn" title="复制密码">📋</button>
          </div>
        </div>

        <div class="warning-box" :class="{ 'urgent': isReturningUser }">
          <h3>{{ isReturningUser ? '🚨 强烈建议' : '⚠️ 重要提醒' }}</h3>
          <ul>
            <li v-if="isReturningUser">为了安全，请立即修改为您熟悉的密码</li>
            <li v-else>请立即记住或保存此密码</li>
            <li v-if="!isReturningUser">建议登录后立即修改为您熟悉的密码</li>
            <li>如果忘记密码，请联系开发者并提供备份文件路径</li>
          </ul>
        </div>

        <div class="backup-info">
          <p class="backup-text">
            密码备份已保存至：<br>
            <code class="backup-path">{{ backupPath }}</code>
          </p>
        </div>
      </div>

      <div class="modal-actions">
        <button @click="confirmAndClose" class="btn btn-primary">
          {{ isReturningUser ? '我知道了，去修改密码' : '我已记住密码，继续登录' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const showModal = ref(false)
const initialPassword = ref('')
const backupPath = ref('')
const isReturningUser = ref(false)

const emit = defineEmits(['close'])

const checkInitialPassword = async () => {
  try {
    if (!window.electronAPI) {
      console.log('不在Electron环境中，跳过初始密码检查')
      return
    }

    // 检查是否使用默认密码
    const usingDefault = await window.electronAPI.isUsingDefaultPassword()
    const password = await window.electronAPI.getInitialPassword()
    
    console.log('使用默认密码:', usingDefault, '初始密码:', password)
    
    if (password && usingDefault) {
      initialPassword.value = password
      const path = await window.electronAPI.getBackupPath()
      backupPath.value = path
      
      // 检查是否是首次运行
      const isFirst = await window.electronAPI.isFirstRun()
      isReturningUser.value = !isFirst
      
      showModal.value = true
    }
  } catch (error) {
    console.error('检查初始密码失败:', error)
  }
}

const copyPassword = async () => {
  try {
    await navigator.clipboard.writeText(initialPassword.value)
    // 可以添加复制成功提示
  } catch (error) {
    console.error('复制失败:', error)
  }
}

const confirmAndClose = () => {
  showModal.value = false
  emit('close')
}

onMounted(() => {
  checkInitialPassword()
})
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
}

.initial-password-modal {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
}

.modal-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px;
  border-radius: 12px 12px 0 0;
  text-align: center;
}

.modal-header h2 {
  margin: 0;
  font-size: 20px;
}

.modal-content {
  padding: 24px;
}

.password-info {
  margin-bottom: 24px;
  text-align: center;
}

.info-text {
  margin-bottom: 12px;
  font-size: 16px;
  color: #333;
}

.password-display {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 16px;
  background: #f8f9fa;
  border: 2px solid #007bff;
  border-radius: 8px;
  margin: 12px 0;
}

.password {
  font-family: 'Courier New', monospace;
  font-size: 24px;
  font-weight: bold;
  color: #007bff;
  letter-spacing: 2px;
}

.copy-btn {
  background: #007bff;
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
}

.copy-btn:hover {
  background: #0056b3;
}

.warning-box {
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
}

.warning-box h3 {
  margin: 0 0 12px 0;
  color: #856404;
  font-size: 16px;
}

.warning-box ul {
  margin: 0;
  padding-left: 20px;
  color: #856404;
}

.warning-box li {
  margin-bottom: 8px;
}

.backup-info {
  background: #d1ecf1;
  border: 1px solid #bee5eb;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
}

.backup-text {
  margin: 0;
  color: #0c5460;
  font-size: 14px;
}

.backup-path {
  background: #e2e3e5;
  padding: 4px 8px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  word-break: break-all;
  display: inline-block;
  margin-top: 8px;
}

.modal-actions {
  padding: 20px 24px;
  border-top: 1px solid #eee;
  text-align: center;
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 500;
}

.btn-primary {
  background-color: #007bff;
  color: white;
}

.btn-primary:hover {
  background-color: #0056b3;
}

.warning-box.urgent {
  background: #f8d7da;
  border: 2px solid #dc3545;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { border-color: #dc3545; }
  50% { border-color: #ff6b6b; }
  100% { border-color: #dc3545; }
}

.warning-box.urgent h3 {
  color: #721c24;
}
</style>