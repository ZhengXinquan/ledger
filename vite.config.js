import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 8080,
    // 本地联调：先运行 `npm run pages:dev`（wrangler pages dev，默认端口 8788），
    // 再 `npm run dev`；前端 /api 请求代理到 Pages Functions 本地服务
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8788',
        changeOrigin: true,
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks: {
          vant: ['vant'],
          echarts: ['echarts'],
        },
      },
    },
  },
});