import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import './style.css'
import App from './App.vue'
import { initReminderScheduler } from './services/reminderScheduler'

const app = createApp(App)

// 使用 Element Plus
app.use(ElementPlus)

// 初始化提醒调度器
initReminderScheduler()

app.mount('#app')
