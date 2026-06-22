import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

import App from './App.vue'
import router from './router'
import './styles/index.scss'

// 开发环境下启动 MSW 模拟接口
if (import.meta.env.DEV) {
  const { worker } = await import('./mock/browser')
  await worker.start({ onUnhandledRequest: 'bypass' })
}

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(ElementPlus)

app.mount('#app')
