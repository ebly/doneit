import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/doneit/',   // GitHub Pages 路径
  plugins: [
    vue(),
    // 自动导入Element Plus组件
    Components({
      resolvers: [ElementPlusResolver()]
    }),
    // 自动导入Element Plus相关函数
    AutoImport({
      resolvers: [ElementPlusResolver()]
    })
  ],
  css: {
    // 优化CSS
    devSourcemap: true, // 开发环境启用CSS sourcemap方便调试
    preprocessorOptions: {
      css: {
        charset: false // 禁用CSS字符集声明，减少文件大小
      }
    }
  },
  // 开发服务器配置
  server: {
    // 启用Vue开发工具支持
    vueDevTools: true,
    // 启用HMR（热模块替换）
    hmr: true
  },
  // 构建配置
  build: {
    // 开发环境构建时也启用sourcemap
    sourcemap: true,
    cssCodeSplit: true, // 启用CSS代码分割
    minify: 'terser', // 使用terser进行代码压缩
    terserOptions: {
      compress: {
        drop_console: true, // 生产环境移除console
        drop_debugger: true // 生产环境移除debugger
      }
    },
    // 优化Tree Shaking配置
    rollupOptions: {
      // 明确启用Tree Shaking
      treeshake: {
        moduleSideEffects: false, // 禁用模块副作用检测
        annotations: true, // 启用Tree Shaking注释
        propertyReadSideEffects: false // 禁用属性读取副作用
      },
      output: {
        // 配置文件指纹，确保静态资源更新时浏览器能正确缓存
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    }
  }
})