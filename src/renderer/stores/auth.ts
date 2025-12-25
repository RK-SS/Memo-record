import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const isAuthenticated = ref(false)
  const username = ref('')

  const login = async (credentials: { username: string; password: string }) => {
    try {
      // 检查是否在Electron环境中
      if (!window.electronAPI) {
        console.warn('不在Electron环境中，使用模拟登录')
        // 网页端模拟登录（仅用于开发测试）
        if (credentials.username === 'admin' && credentials.password === 'admin123') {
          isAuthenticated.value = true
          username.value = credentials.username
          return true
        }
        return false
      }

      // 创建一个普通对象，避免传递Vue响应式对象
      const plainCredentials = {
        username: credentials.username,
        password: credentials.password
      }

      const result = await window.electronAPI.login(plainCredentials)
      if (result) {
        isAuthenticated.value = true
        username.value = credentials.username
        return true
      }
      return false
    } catch (error) {
      console.error('登录失败:', error)
      return false
    }
  }

  const logout = () => {
    isAuthenticated.value = false
    username.value = ''
  }

  const checkAuth = async () => {
    try {
      if (!window.electronAPI) {
        console.warn('不在Electron环境中')
        return isAuthenticated.value
      }

      const result = await window.electronAPI.checkAuth()
      isAuthenticated.value = result
      return result
    } catch (error) {
      console.error('检查认证状态失败:', error)
      return false
    }
  }

  return {
    isAuthenticated,
    username,
    login,
    logout,
    checkAuth
  }
})