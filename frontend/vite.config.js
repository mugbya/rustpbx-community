import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            // 路径别名：@ 指向 src 目录
            '@': path.resolve(__dirname, 'src'),
        },
    },
    server: {
        port: 5173,
        host: true,
        proxy: {
            // 将 /api 请求代理到后端服务（默认 8000 端口）
            '/api': {
                target: 'http://localhost:8001',
                changeOrigin: true,
            },
        },
    },
    build: {
        rollupOptions: {
            output: {
                // vendor 分包：稳定的大依赖单独成 chunk
                // 业务代码改动时，vendor chunk 缓存不失效，跨境用户只需重新下载小的业务 chunk
                manualChunks: {
                    // React 核心：react + react-dom + react-router
                    'react-vendor': ['react', 'react-dom', 'react-router-dom'],
                },
            },
        },
    },
});
