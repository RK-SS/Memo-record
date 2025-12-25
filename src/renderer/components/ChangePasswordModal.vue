<template>
  <div v-if="showModal" class="modal-overlay" @click="closeModal">
    <div class="modal" @click.stop>
      <div class="modal-header">
        <h2>🔒 修改登录密码</h2>
      </div>
      
      <form @submit.prevent="changePassword" class="modal-content">
        <div class="form-group">
          <label class="form-label">当前密码 *</label>
          <input
            v-model="passwordForm.oldPassword"
            :type="showOldPassword ? 'text' : 'password'"
            class="form-input"
            required
          />
          <button
            type="button"
            @click="showOldPassword = !showOldPassword"
            class="password-toggle"
          >
            {{ showOldPassword ? '🙈' : '👁️' }}
          </button>
        </div>

        <div class="form-group">
          <label class="form-label">新密码 *</label>
          <input
            v-model="passwordForm.newPassword"
            :type="showNewPassword ? 'text' : 'password'"
            class="form-input"
            required
            minlength="6"
          />
          <button
            type="button"
            @click="showNewPassword = !showNewPassword"
            class="password-toggle"
          >
            {{ showNewPassword ? '🙈' : '👁️' }}
          </button>
        </div>

        <div class="form-group">
          <label class="form-label">确认新密码 *</label>
          <input
            v-model="passwordForm.confirmPassword"
            :type="showConfirmPassword ? 'text' : 'password'"
            class="form-input"
            required
          />
          <button
            type="button"
            @click="showConfirmPassword = !showConfirmPassword"
            class="password-toggle"
          >
            {{ showConfirmPassword ? '🙈' : '👁️' }}
          </button>
        </div>

        <div v-if="error" class="error-message">
          {{ error }}
        </div>

        <div v-if="success" class="success-message">
          密码修改成功！新密码已自动备份。
        </div>

        <div class="modal-actions">
          <button type="button" @click="closeModal" class="btn btn-secondary">取消</button>
          <button type="submit" class="btn btn-primary" :disabled="loading">
            {{ loading ? '修改中...' : '确认修改' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'

const showModal = ref(false)
const loading = ref(false)
const error = ref('')
const success = ref(false)

const showOldPassword = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)

const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const emit = defineEmits(['close', 'success'])

const openModal = () => {
  showModal.value = true
  resetForm()
}

const closeModal = () => {
  showModal.value = false
  resetForm()
  emit('close')
}

const resetForm = () => {
  passwordForm.oldPassword = ''
  passwordForm.newPassword = ''
  passwordForm.confirmPassword = ''
  error.value = ''
  success.value = false
  loading.value = false
  showOldPassword.value = false
  showNewPassword.value = false
  showConfirmPassword.value = false
}

const changePassword = async () => {
  error.value = ''
  
  // 验证新密码
  if (passwordForm.newPassword.length < 6) {
    error.value = '新密码长度至少6位'
    return
  }
  
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    error.value = '两次输入的新密码不一致'
    return
  }
  
  if (passwordForm.oldPassword === passwordForm.newPassword) {
    error.value = '新密码不能与当前密码相同'
    return
  }

  loading.value = true
  
  try {
    console.log('前端: 开始修改密码')
    console.log('前端: 旧密码长度:', passwordForm.oldPassword.length)
    console.log('前端: 新密码长度:', passwordForm.newPassword.length)
    
    const result = await window.electronAPI.changePassword({
      oldPassword: passwordForm.oldPassword,
      newPassword: passwordForm.newPassword
    })
    
    console.log('前端: 密码修改结果:', result)
    
    if (result) {
      success.value = true
      setTimeout(() => {
        closeModal()
        emit('success')
      }, 2000)
    } else {
      error.value = '当前密码错误或修改失败'
    }
  } catch (err) {
    console.error('前端: 修改密码异常:', err)
    error.value = '修改密码失败，请重试'
  } finally {
    loading.value = false
  }
}

// 暴露方法给父组件
defineExpose({
  openModal
})
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 400px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  background: #007bff;
  color: white;
  padding: 16px 20px;
  border-radius: 8px 8px 0 0;
}

.modal-header h2 {
  margin: 0;
  font-size: 18px;
}

.modal-content {
  padding: 20px;
}

.form-group {
  margin-bottom: 16px;
  position: relative;
}

.form-label {
  display: block;
  margin-bottom: 4px;
  font-weight: 500;
  color: #333;
}

.form-input {
  width: 100%;
  padding: 8px 40px 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.form-input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.password-toggle {
  position: absolute;
  right: 8px;
  top: 28px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  font-size: 16px;
}

.error-message {
  color: #dc3545;
  font-size: 14px;
  margin-bottom: 16px;
  padding: 8px;
  background-color: #f8d7da;
  border-radius: 4px;
}

.success-message {
  color: #155724;
  font-size: 14px;
  margin-bottom: 16px;
  padding: 8px;
  background-color: #d4edda;
  border-radius: 4px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #eee;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background-color: #545b62;
}

.btn-primary {
  background-color: #007bff;
  color: white;
}

.btn-primary:hover {
  background-color: #0056b3;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>