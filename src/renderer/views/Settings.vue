<template>
  <div>
    <Navbar />
    <div class="container">
      <h1>⚙️ 设置</h1>

      <!-- 备份设置 -->
      <div class="settings-card">
        <h2>数据备份</h2>
        <div class="setting-item">
          <div class="setting-info">
            <label>自动备份</label>
            <p>每次数据变更时自动创建备份</p>
          </div>
          <label class="switch">
            <input type="checkbox" v-model="backupConfig.enabled" @change="saveBackupConfig" />
            <span class="slider"></span>
          </label>
        </div>
        <div class="setting-item">
          <div class="setting-info">
            <label>保留备份数量</label>
            <p>超出数量的旧备份将被自动删除</p>
          </div>
          <select v-model="backupConfig.maxBackups" @change="saveBackupConfig" class="form-select">
            <option :value="5">5 份</option>
            <option :value="10">10 份</option>
            <option :value="20">20 份</option>
            <option :value="50">50 份</option>
          </select>
        </div>
        <div class="setting-item">
          <div class="setting-info">
            <label>备份位置</label>
            <p class="path">{{ backupDir }}</p>
          </div>
        </div>
        <div class="setting-actions">
          <button @click="createManualBackup" class="btn btn-primary" :disabled="backingUp">
            {{ backingUp ? '备份中...' : '立即备份' }}
          </button>
        </div>
      </div>

      <!-- 备份列表 -->
      <div class="settings-card">
        <h2>备份历史</h2>
        <div v-if="backups.length > 0" class="backup-list">
          <div v-for="backup in backups" :key="backup" class="backup-item">
            <span class="backup-name">{{ formatBackupName(backup) }}</span>
            <button @click="restoreFromBackup(backup)" class="btn btn-sm btn-secondary">恢复</button>
          </div>
        </div>
        <div v-else class="empty-backups">暂无备份</div>
      </div>

      <!-- 修改密码 -->
      <div class="settings-card">
        <h2>修改密码</h2>
        <form @submit.prevent="handleChangePassword">
          <div class="form-group">
            <label class="form-label">当前密码</label>
            <input v-model="passwordForm.oldPassword" type="password" class="form-input" required />
          </div>
          <div class="form-group">
            <label class="form-label">新密码</label>
            <input v-model="passwordForm.newPassword" type="password" class="form-input" required />
          </div>
          <div class="form-group">
            <label class="form-label">确认新密码</label>
            <input v-model="passwordForm.confirmPassword" type="password" class="form-input" required />
          </div>
          <button type="submit" class="btn btn-primary" :disabled="changingPassword">
            {{ changingPassword ? '修改中...' : '修改密码' }}
          </button>
        </form>
      </div>
    </div>

    <div v-if="toast.show" class="toast" :class="toast.type">{{ toast.message }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import Navbar from '../components/Navbar.vue'
import { useDataStore } from '../stores/data'
import { BackupConfig } from '@shared/types'

const dataStore = useDataStore()

const backupConfig = reactive<BackupConfig>({ enabled: true, maxBackups: 10 })
const backupDir = ref('')
const backups = ref<string[]>([])
const backingUp = ref(false)
const changingPassword = ref(false)

const passwordForm = reactive({ oldPassword: '', newPassword: '', confirmPassword: '' })
const toast = reactive({ show: false, message: '', type: 'success' })

const showToast = (message: string, type = 'success') => {
  toast.message = message; toast.type = type; toast.show = true
  setTimeout(() => { toast.show = false }, 2000)
}

const loadSettings = async () => {
  const config = await dataStore.getBackupConfig()
  backupConfig.enabled = config.enabled
  backupConfig.maxBackups = config.maxBackups
  backupDir.value = await dataStore.getBackupDir()
  backups.value = await dataStore.listBackups()
}

const saveBackupConfig = async () => {
  await dataStore.setBackupConfig({ ...backupConfig })
  showToast('设置已保存')
}

const createManualBackup = async () => {
  backingUp.value = true
  try {
    const path = await dataStore.manualBackup()
    if (path) {
      showToast('备份成功')
      backups.value = await dataStore.listBackups()
    } else {
      showToast('备份失败', 'error')
    }
  } finally {
    backingUp.value = false
  }
}

const restoreFromBackup = async (file: string) => {
  if (!confirm(`确定要从备份 "${formatBackupName(file)}" 恢复数据吗？当前数据将被覆盖。`)) return
  const success = await dataStore.restoreBackup(file)
  if (success) showToast('恢复成功')
  else showToast('恢复失败', 'error')
}

const formatBackupName = (filename: string) => {
  // 文件名格式: backup-2025-01-01T12-30-45.json 或 manual-2025-01-01T12-30-45.json
  const match = filename.match(/(\d{4})-(\d{2})-(\d{2})T(\d{2})-(\d{2})-(\d{2})/)
  if (match) {
    const [, year, month, day, hour, minute, second] = match
    const dateStr = `${year}-${month}-${day} ${hour}:${minute}:${second}`
    return filename.startsWith('manual') ? `手动备份 ${dateStr}` : `自动备份 ${dateStr}`
  }
  return filename
}

const handleChangePassword = async () => {
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    showToast('两次输入的密码不一致', 'error')
    return
  }
  if (passwordForm.newPassword.length < 6) {
    showToast('密码长度至少6位', 'error')
    return
  }
  changingPassword.value = true
  try {
    const success = await window.electronAPI.changePassword({
      oldPassword: passwordForm.oldPassword,
      newPassword: passwordForm.newPassword
    })
    if (success) {
      showToast('密码修改成功')
      passwordForm.oldPassword = ''
      passwordForm.newPassword = ''
      passwordForm.confirmPassword = ''
    } else {
      showToast('当前密码错误', 'error')
    }
  } finally {
    changingPassword.value = false
  }
}

onMounted(loadSettings)
</script>

<style scoped>
.container { max-width: 800px; }
h1 { margin-bottom: 24px; color: var(--text-primary); }

.settings-card {
  background: var(--bg-primary); border-radius: 12px; padding: 24px;
  margin-bottom: 20px; box-shadow: var(--card-shadow);
}
.settings-card h2 { margin: 0 0 20px; font-size: 18px; color: var(--text-primary); }

.setting-item {
  display: flex; justify-content: space-between; align-items: center;
  padding: 16px 0; border-bottom: 1px solid var(--border-color);
}
.setting-item:last-of-type { border-bottom: none; }
.setting-info label { font-weight: 500; color: var(--text-primary); display: block; }
.setting-info p { margin: 4px 0 0; font-size: 13px; color: var(--text-secondary); }
.setting-info .path { font-family: monospace; font-size: 12px; word-break: break-all; }

.setting-actions { margin-top: 16px; }

.switch { position: relative; display: inline-block; width: 48px; height: 26px; }
.switch input { opacity: 0; width: 0; height: 0; }
.slider {
  position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0;
  background-color: var(--text-tertiary); transition: 0.3s; border-radius: 26px;
}
.slider:before {
  position: absolute; content: ""; height: 20px; width: 20px; left: 3px; bottom: 3px;
  background-color: white; transition: 0.3s; border-radius: 50%;
}
input:checked + .slider { background-color: var(--primary-color); }
input:checked + .slider:before { transform: translateX(22px); }

.form-select {
  padding: 8px 12px; border: 1px solid var(--border-color); border-radius: 6px;
  font-size: 14px; background: var(--bg-primary); color: var(--text-primary); cursor: pointer;
}

.backup-list { max-height: 300px; overflow-y: auto; }
.backup-item {
  display: flex; justify-content: space-between; align-items: center;
  padding: 12px; border-bottom: 1px solid var(--border-color);
}
.backup-item:last-child { border-bottom: none; }
.backup-name { font-size: 14px; color: var(--text-primary); }
.empty-backups { text-align: center; padding: 24px; color: var(--text-secondary); }

.btn-sm { padding: 6px 12px; font-size: 13px; }

.toast { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); padding: 12px 24px; border-radius: 8px; color: white; font-weight: 500; z-index: 2000; }
.toast.success { background: var(--success-color); }
.toast.error { background: var(--danger-color); }
</style>
