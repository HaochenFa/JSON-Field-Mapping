import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

// 获取 __dirname 的等效值
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// https://vitejs.dev/config/
export default defineConfig({
  base: "/",
  plugins: [react()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 3000,
    open: true,
    cors: true,
    strictPort: false,
    proxy: {
      // 配置API代理，如果需要的话
      // '/api': {
      //   target: 'http://localhost:8080',
      //   changeOrigin: true,
      //   rewrite: (path) => path.replace(/^\/api/, '')
      // }
    },
  },
  build: {
    outDir: "dist",
    sourcemap: true,
    // 优化构建配置
    minify: "esbuild",
    // 移除 console 和 debugger
    target: "es2015",

    // 分块策略
    rollupOptions: {
      output: {
        chunkFileNames: "assets/js/[name]-[hash].js",
        entryFileNames: "assets/js/[name]-[hash].js",
        assetFileNames: "assets/[ext]/[name]-[hash].[ext]",
        manualChunks: {
          "react-vendor": ["react", "react-dom"],
          "antd-vendor": ["antd", "@ant-design/icons"],
          "redux-vendor": ["@reduxjs/toolkit", "react-redux"],
        },
      },
    },
  },
  // CSS 配置
  css: {
    // 开启 CSS 模块化
    modules: {
      // 生成的类名格式
      generateScopedName: "[name]__[local]___[hash:base64:5]",
    },
    // 开启 CSS 源码映射
    devSourcemap: true,
  },
  // 环境变量前缀
  envPrefix: "APP_",
});
