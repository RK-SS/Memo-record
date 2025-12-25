<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useThemeStore } from './stores/theme'

const themeStore = useThemeStore()

onMounted(() => {
  themeStore.updateTheme()
})
</script>

<style>
/* CSS 变量 - 浅色主题 */
:root, [data-theme="light"] {
  --bg-primary: #ffffff;
  --bg-secondary: #f8fafc;
  --bg-tertiary: #f1f5f9;
  --text-primary: #1e293b;
  --text-secondary: #64748b;
  --text-tertiary: #94a3b8;
  --border-color: #e2e8f0;
  --primary-color: #3b82f6;
  --primary-hover: #2563eb;
  --danger-color: #ef4444;
  --success-color: #10b981;
  --navbar-bg: #1e293b;
  --navbar-text: #ffffff;
  --navbar-hover: rgba(255,255,255,0.1);
  --search-bg: rgba(255,255,255,0.15);
  --card-shadow: 0 1px 3px rgba(0,0,0,0.1);
  --modal-overlay: rgba(0,0,0,0.5);
}

/* 深色主题 */
[data-theme="dark"] {
  --bg-primary: #1e293b;
  --bg-secondary: #334155;
  --bg-tertiary: #475569;
  --text-primary: #f1f5f9;
  --text-secondary: #94a3b8;
  --text-tertiary: #64748b;
  --border-color: #475569;
  --primary-color: #60a5fa;
  --primary-hover: #3b82f6;
  --danger-color: #f87171;
  --success-color: #34d399;
  --navbar-bg: #0f172a;
  --navbar-text: #f1f5f9;
  --navbar-hover: rgba(255,255,255,0.1);
  --search-bg: rgba(255,255,255,0.1);
  --card-shadow: 0 1px 3px rgba(0,0,0,0.3);
  --modal-overlay: rgba(0,0,0,0.7);
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background-color: var(--bg-secondary);
  color: var(--text-primary);
  transition: background-color 0.3s, color 0.3s;
}

#app {
  min-height: 100vh;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

/* 通用按钮样式 */
.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-primary {
  background-color: var(--primary-color);
  color: white;
}

.btn-primary:hover {
  background-color: var(--primary-hover);
}

.btn-secondary {
  background-color: var(--bg-tertiary);
  color: var(--text-primary);
}

.btn-secondary:hover {
  background-color: var(--border-color);
}

.btn-danger {
  background-color: #fee2e2;
  color: var(--danger-color);
}

.btn-danger:hover {
  background-color: #fecaca;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 表单样式 */
.form-group {
  margin-bottom: 16px;
}

.form-label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
  color: var(--text-primary);
}

.form-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 14px;
  background: var(--bg-primary);
  color: var(--text-primary);
  transition: border-color 0.2s, box-shadow 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
}

.form-input::placeholder {
  color: var(--text-tertiary);
}

/* 卡片样式 */
.card {
  background: var(--bg-primary);
  border-radius: 12px;
  box-shadow: var(--card-shadow);
  padding: 24px;
  margin-bottom: 20px;
}

/* 导航栏基础样式 */
.navbar {
  background-color: var(--navbar-bg);
  color: var(--navbar-text);
  padding: 12px 0;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

/* 滚动条样式 */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: var(--bg-secondary);
}

::-webkit-scrollbar-thumb {
  background: var(--text-tertiary);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--text-secondary);
}
</style>
