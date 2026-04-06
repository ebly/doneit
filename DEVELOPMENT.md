# DoneIt 开发文档

## 项目概述

DoneIt 是一个现代化的习惯跟踪应用，帮助用户建立和维持良好的生活习惯。

## 技术栈

### 前端框架
- **Vue.js 3** - 渐进式 JavaScript 框架
- **Composition API** - Vue 3 的新特性，提供更灵活的组件逻辑组织

### UI 组件库
- **Element Plus** - 基于 Vue 3 的桌面端 UI 组件库

### 构建工具
- **Vite** - 下一代前端构建工具

### 开发语言
- **JavaScript** - 主要开发语言

### 样式系统
- **CSS3** - 层叠样式表
- **CSS 变量** - 实现主题切换和样式复用

### 部署平台
- **GitHub Pages** - 静态网站托管

## 项目结构

```
doneit/
├── dist/                # 构建产物目录
├── public/              # 静态资源目录
│   ├── favicon.svg      # 网站图标
│   ├── icons.svg        # 图标文件
│   └── .nojekyll        # 防止 GitHub Pages 使用 Jekyll
├── src/                 # 源代码目录
│   ├── assets/          # 图片资源
│   ├── components/      # Vue 组件
│   │   ├── Dashboard.vue    # 仪表盘组件
│   │   ├── HabitForm.vue    # 习惯表单组件
│   │   └── HabitList.vue    # 习惯列表组件
│   ├── styles/          # 样式文件
│   │   └── colors.css      # 颜色变量定义
│   ├── App.vue          # 根组件
│   ├── main.js          # 应用入口
│   └── style.css        # 全局样式
├── .gitignore           # Git 忽略文件配置
├── package.json         # 项目依赖和脚本
├── README.md            # 项目说明文档
└── vite.config.js       # Vite 配置文件
```

## 安装和运行

### 环境要求
- **Node.js** >= 16.0.0
- **npm** >= 7.0.0

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

访问地址：http://localhost:5173/doneit/

### 构建生产版本

```bash
npm run build
```

### 预览生产版本

```bash
npm run preview
```

### 部署到 GitHub Pages

```bash
npm run deploy
```

## 核心功能

### 仪表盘（Dashboard）
- 显示所有习惯的每周完成情况
- 当前日期高亮显示
- 支持点击标记习惯完成状态
- 显示习惯连续完成天数（Streak）

### 习惯列表（Habit List）
- 展示所有已创建的习惯
- 支持搜索和筛选习惯
- 习惯状态切换（完成/未完成）
- 习惯编辑和删除功能

### 习惯表单（Habit Form）
- 创建新习惯
- 设置习惯名称、每周目标次数
- 添加提醒时间

### 主题切换
- 支持亮色/暗色主题
- 自动根据系统偏好切换
- 手动切换主题选项

## 组件说明

### Dashboard 组件

**功能**：展示习惯的周视图，支持完成状态标记

**主要属性**：
- `currentDayIndex` - 当前星期几索引（0=周日，1=周一，...，6=周六）
- `habits` - 习惯数据数组

**主要方法**：
- `getHabitIcon(habit)` - 获取习惯对应的图标
- `toggleDay(habitId, dayIndex)` - 切换习惯在某天的完成状态

### HabitList 组件

**功能**：展示和管理习惯列表

**主要属性**：
- `habits` - 习惯数据数组
- `search-value` - 搜索关键词

**主要方法**：
- `edit(habit)` - 编辑习惯
- `delete(habitId)` - 删除习惯
- `toggleHabit(habitId)` - 切换习惯完成状态

### HabitForm 组件

**功能**：创建和编辑习惯

**主要事件**：
- `add(habit)` - 添加新习惯
- `edit(habit)` - 编辑现有习惯
- `cancel` - 取消操作

## 样式系统

### 颜色主题

项目使用 CSS 变量定义颜色主题，位于 `src/styles/colors.css`：

- **主色调**：蓝色系 (`--primary-color`)
- **成功色**：绿色系 (`--success-color`)
- **警告色**：黄色系 (`--warning-color`)
- **危险色**：红色系 (`--danger-color`)

### 响应式设计

- 支持 PC 端和移动端布局
- 使用 CSS Grid 和 Flexbox 实现灵活的布局结构

## 数据结构

### 习惯数据

```javascript
const habit = {
  id: 1,                      // 习惯 ID
  name: 'Morning Exercise',   // 习惯名称
  daysPerWeek: 5,             // 每周目标次数
  completed: [true, true, true, true, true, false, false],  // 每周完成情况
  streak: 5,                  // 连续完成天数
  lastChecked: '2024-03-28',  // 最后一次完成日期
  reminders: [                // 提醒时间
    { id: 1, time: '07:00' }
  ]
}
```

## 部署说明

### GitHub Pages 配置

1. **仓库设置**：
   - 打开仓库设置页面
   - 选择 "Pages" 选项
   - 选择部署源为 "main" 分支

2. **构建配置**：
   - `vite.config.js` 中设置 `base: '/doneit/'`
   - 确保 `dist` 目录下包含 `.nojekyll` 文件

3. **部署命令**：
   ```bash
   npm run deploy
   ```

## 开发规范

### 代码风格
- 使用 2 个空格缩进
- 变量命名使用驼峰命名法
- 组件命名使用 PascalCase

### 组件开发
- 使用 Composition API 编写组件
- 保持组件职责单一
- 合理使用 props 和 emit 进行组件通信

### CSS 规范
- 使用 CSS 变量定义可复用样式
- 优先使用类选择器
- 组件样式使用 `scoped` 属性避免样式冲突

## 常见问题

### Q: 为什么 GitHub Pages 上 Dashboard 页面显示为空？
A: 可能是因为缺少 `.nojekyll` 文件，导致 GitHub Pages 忽略了以下划线开头的文件。确保 `dist` 目录下包含 `.nojekyll` 文件。

### Q: 如何在本地直接打开构建后的 HTML 文件？
A: 由于现代浏览器的安全限制，直接使用 `file://` 协议打开 HTML 文件可能会遇到 CORS 错误。建议使用本地服务器预览：
```bash
npm run preview
```

### Q: 如何切换主题？
A: 应用支持亮色/暗色主题切换，可以通过页面右上角的开关进行切换，也会自动根据系统偏好设置。

## 更新日志

### v1.0.0
- 初始版本发布
- 实现习惯跟踪基本功能
- 支持仪表盘视图
- 实现习惯管理功能
- 支持主题切换
- 部署到 GitHub Pages

## 贡献

如果您想为这个项目做出贡献，请按照以下步骤：

1. Fork 仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 许可证

MIT License

## 联系方式

如有问题或建议，请通过 GitHub Issues 提交。