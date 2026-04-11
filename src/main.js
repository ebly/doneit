import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import './style.css'
import App from './App.vue'
import { initReminderScheduler } from './services/reminderScheduler'
import { migrateCompletionRecords } from './services/storage'

const app = createApp(App)

// 使用 Element Plus
app.use(ElementPlus)

// 初始化提醒调度器
initReminderScheduler()

// 迁移打卡记录到新格式（带时间戳）
migrateCompletionRecords().then(migrated => {
  if (migrated) {
    console.log('[App] Completion records migrated to new format')
  }
})

app.mount('#app')
