import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@use "@/styles/variables" as *;\n`
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        // Vite 8 (Rolldown) 要求 manualChunks 为函数
        manualChunks(id) {
          // Vue 核心库
          if (id.includes('/node_modules/vue/') ||
              id.includes('/node_modules/vue-router/') ||
              id.includes('/node_modules/pinia/') ||
              id.includes('/node_modules/@vue/')) {
            return 'vendor-vue'
          }
          // Element Plus
          if (id.includes('/node_modules/element-plus/') ||
              id.includes('/node_modules/@element-plus/')) {
            return 'vendor-element'
          }
          // ECharts 图表库
          if (id.includes('/node_modules/echarts/')) {
            return 'vendor-echarts'
          }
          // Axios, Faker, MSW
          if (id.includes('/node_modules/axios/') ||
              id.includes('/node_modules/@faker-js/') ||
              id.includes('/node_modules/msw/')) {
            return 'vendor-utils'
          }
          return null
        }
      }
    },
    // 提高警告阈值
    chunkSizeWarningLimit: 600
  }
})
