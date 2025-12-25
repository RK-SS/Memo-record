import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export type ThemeMode = 'light' | 'dark' | 'system'

export const useThemeStore = defineStore('theme', () => {
  const mode = ref<ThemeMode>((localStorage.getItem('theme') as ThemeMode) || 'system')
  const isDark = ref(false)

  const updateTheme = () => {
    let dark = false
    if (mode.value === 'dark') {
      dark = true
    } else if (mode.value === 'system') {
      dark = window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    isDark.value = dark
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
  }

  const setMode = (newMode: ThemeMode) => {
    mode.value = newMode
    localStorage.setItem('theme', newMode)
    updateTheme()
  }

  // 监听系统主题变化
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  mediaQuery.addEventListener('change', () => {
    if (mode.value === 'system') updateTheme()
  })

  // 初始化
  updateTheme()

  return { mode, isDark, setMode, updateTheme }
})
