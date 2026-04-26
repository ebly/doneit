import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import fs from 'fs'
import path from 'path'

// Google Analytics 注入插件（只在生产构建时生效）
const injectAnalyticsPlugin = () => {
  return {
    name: 'inject-analytics',
    closeBundle() {
      const distPath = path.resolve(__dirname, 'dist', 'index.html')
      const gaScript = `<!-- Google tag (gtag.js) -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-YB1BMLJPC7"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag() { dataLayer.push(arguments); }
    gtag('js', new Date());

    gtag('config', 'G-YB1BMLJPC7');
  </script>
`
      if (fs.existsSync(distPath)) {
        let content = fs.readFileSync(distPath, 'utf-8')
        // 在 </head> 标签前插入 GA 代码
        content = content.replace('</head>', `${gaScript}</head>`)
        fs.writeFileSync(distPath, content, 'utf-8')
        console.log('[inject-analytics] Google Analytics injected to dist/index.html')
      }
    }
  }
}

// https://vitejs.dev/config/
export default defineConfig({
100:   base: '/',   // 根路径
101:   resolve: {
102:     alias: {
103:       '@': path.resolve(__dirname, 'src')
104:     }
105:   },
106:   plugins: [
107:     vue(),
108:     // 自动导入 Element Plus 组件
109:     Components({
110:       resolvers: [ElementPlusResolver()]
111:     }),
112:     // 自动导入 Element Plus 相关函数
113:     AutoImport({
114:       resolvers: [ElementPlusResolver()]
115:     }),
116:     // 生产环境注入 Google Analytics
117:     injectAnalyticsPlugin()
118:   ],
119:   css: {
120:     // 优化CSS
121:     devSourcemap: true, // 开发环境启用CSS sourcemap方便调试
122:     preprocessorOptions: {
123:       css: {
124:         charset: false // 禁用CSS字符集声明，减少文件大小
125:       }
126:     }
127:   },
128:   // 开发服务器配置
129:   server: {
130:     host: '0.0.0.0', // 允许外部访问
131:     // 启用Vue开发工具支持
132:     vueDevTools: true,
133:     // 启用HMR（热模块替换）
134:     hmr: true
135:   },
136:   // 构建配置
137:   build: {
138:     // 开发环境构建时也启用sourcemap
139:     sourcemap: true,
140:     cssCodeSplit: true, // 启用CSS代码分割
141:     minify: 'terser', // 使用terser进行代码压缩
142:     terserOptions: {
143:       compress: {
144:         drop_console: true, // 生产环境移除console
145:         drop_debugger: true // 生产环境移除debugger
146:       }
147:     },
148:     // 优化Tree Shaking配置
149:     rollupOptions: {
150:       // 明确启用Tree Shaking
151:       treeshake: {
152:         moduleSideEffects: false, // 禁用模块副作用检测
153:         annotations: true, // 启用Tree Shaking注释
154:         propertyReadSideEffects: false // 禁用属性读取副作用
155:       },
156:       output: {
157:         // 配置文件指纹，确保静态资源更新时浏览器能正确缓存
158:         chunkFileNames: 'assets/[name]-[hash].js',
159:         entryFileNames: 'assets/[name]-[hash].js',
160:         assetFileNames: 'assets/[name]-[hash].[ext]'
161:       }
162:     }
163:   }
164: })