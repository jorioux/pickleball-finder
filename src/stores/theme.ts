import { ref } from 'vue'
import { defineStore } from 'pinia'
import { useTheme } from 'vuetify'

export const useThemeStore = defineStore('theme', () => {
  const theme = useTheme()
  const isDark = ref(false)

  // Initialize theme from localStorage if available
  const savedTheme = localStorage.getItem('theme')
  if (savedTheme) {
    isDark.value = savedTheme === 'dark'
    theme.global.name.value = savedTheme
  }

  function toggleTheme() {
    isDark.value = !isDark.value
    theme.global.name.value = isDark.value ? 'dark' : 'light'
    localStorage.setItem('theme', theme.global.name.value)
  }

  return {
    isDark,
    toggleTheme
  }
}) 