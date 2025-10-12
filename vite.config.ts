import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// Generate build timestamp and hash for cache busting
const buildTimestamp = Date.now();
const buildHash = Math.random().toString(36).substr(2, 9);

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: '/',
  server: {
    host: "::",
    port: 8080,
  },
  define: {
    __BUILD_TIME__: buildTimestamp,
    __BUILD_HASH__: JSON.stringify(buildHash),
  },
  plugins: [
    react(),
    // Custom plugin to generate version.json
    {
      name: 'version-generator',
      generateBundle() {
        this.emitFile({
          type: 'asset',
          fileName: 'version.json',
          source: JSON.stringify({
            version: process.env.npm_package_version || '1.0.0',
            buildTime: buildTimestamp,
            hash: buildHash,
            timestamp: new Date().toISOString()
          }, null, 2)
        });
      }
    }
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: undefined,
        entryFileNames: `assets/[name].${buildHash}.[hash].js`,
        chunkFileNames: `assets/[name].${buildHash}.[hash].js`,
        assetFileNames: `assets/[name].${buildHash}.[hash].[ext]`
      },
    },
  },
  preview: {
    port: 8080,
    host: "::",
  },
}))