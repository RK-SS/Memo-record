<template>
  <nav class="navbar">
    <div class="navbar-content">
      <div class="navbar-brand">📝 备忘记事录</div>
      
      <!-- 搜索框 -->
      <div class="search-box" v-if="$route.path === '/notes'">
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="搜索笔记..." 
          @input="emitSearch"
          @keydown.esc="clearSearch"
        />
        <button v-if="searchQuery" @click="clearSearch" class="clear-btn">×</button>
      </div>

      <div class="navbar-right">
        <ul class="navbar-nav">
          <li><router-link to="/dashboard" :class="{ active: $route.path === '/dashboard' }">首页</router-link></li>
          <li><router-link to="/notes" :class="{ active: $route.path === '/notes' }">笔记</router-link></li>
          <li><router-link to="/settings" :class="{ active: $route.path === '/settings' }">设置</router-link></li>
        </ul>
        
        <!-- 主题切换 -->
        <button @click="toggleTheme" class="icon-btn" :title="themeTitle">
          {{ themeStore.isDark ? '🌙' : '☀️' }}
        </button>
        
        <!-- 关于 -->
        <button @click="showAbout = true" class="icon-btn" title="关于">ℹ️</button>
        
        <!-- 退出 -->
        <button @click="handleLogout" class="icon-btn" title="退出登录">🚪</button>
      </div>
    </div>
  </nav>

  <AboutModal :visible="showAbout" @close="showAbout = false" />
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useThemeStore } from '../stores/theme'
import AboutModal from './AboutModal.vue'

const router = useRouter()
const authStore = useAuthStore()
const themeStore = useThemeStore()

const searchQuery = ref('')
const showAbout = ref(false)

const emit = defineEmits<{ search: [query: string] }>()

const themeTitle = computed(() => {
  const modes = { light: '浅色模式', dark: '深色模式', system: '跟随系统' }
  return modes[themeStore.mode]
})

const toggleTheme = () => {
  const modes = ['light', 'dark', 'system'] as const
  const currentIndex = modes.indexOf(themeStore.mode)
  const nextMode = modes[(currentIndex + 1) % modes.length]
  themeStore.setMode(nextMode)
}

const emitSearch = () => {
  emit('search', searchQuery.value)
}

const clearSearch = () => {
  searchQuery.value = ''
  emit('search', '')
}

const handleLogout = () => {
  authStore.logout()
  router.push('/login')
}

// 暴露方法给父组件
defineExpose({ clearSearch })
</script>

<style scoped>
.navbar {
  background-color: var(--navbar-bg);
  color: var(--navbar-text);
  padding: 12px 0;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.navbar-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  gap: 20px;
}

.navbar-brand {
  font-size: 18px;
  font-weight: bold;
  white-space: nowrap;
}

.search-box {
  flex: 1;
  max-width: 300px;
  position: relative;
}

.search-box input {
  width: 100%;
  padding: 8px 32px 8px 12px;
  border: none;
  border-radius: 20px;
  font-size: 14px;
  background: var(--search-bg);
  color: var(--text-primary);
}

.search-box input::placeholder {
  color: var(--text-tertiary);
}

.search-box input:focus {
  outline: none;
  box-shadow: 0 0 0 2px var(--primary-color);
}

.clear-btn {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  font-size: 16px;
  cursor: pointer;
  color: var(--text-tertiary);
  padding: 2px 6px;
}

.navbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.navbar-nav {
  display: flex;
  list-style: none;
  gap: 4px;
}

.navbar-nav a {
  color: var(--navbar-text);
  text-decoration: none;
  padding: 8px 14px;
  border-radius: 6px;
  transition: background-color 0.2s;
  font-size: 14px;
}

.navbar-nav a:hover,
.navbar-nav a.active {
  background-color: var(--navbar-hover);
}

.icon-btn {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  padding: 6px 8px;
  border-radius: 6px;
  transition: background-color 0.2s;
}

.icon-btn:hover {
  background-color: var(--navbar-hover);
}
</style>
