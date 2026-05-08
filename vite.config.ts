import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    proxy: {
      '/s3-proxy': {
        target: 'https://newnonmun-archive.s3.ap-northeast-2.amazonaws.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/s3-proxy/, ''),
        secure: true,
      },
      '/api/ai': {
        target: 'http://192.168.20.231:8000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    // 청크 사이즈 경고 기준 올리기
    chunkSizeWarningLimit: 1000,
  },
});
