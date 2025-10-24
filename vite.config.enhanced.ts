import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// Generate build timestamp and hash for cache busting
const buildTimestamp = Date.now();
const buildHash = Math.random().toString(36).substr(2, 9);

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');
  
  // Validate critical environment variables at build time
  const requiredEnvVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
    'VITE_STRIPE_PUBLISHABLE_KEY'
  ];
  
  const missingVars = requiredEnvVars.filter(key => !env[key]);
  
  if (missingVars.length > 0 && mode === 'production') {
    console.warn('⚠️ WARNING: Missing environment variables:', missingVars);
    console.warn('App will use fallback configuration');
    console.warn('To fix: Add these variables to Vercel Dashboard → Settings → Environment Variables');
  }
  
  return {
    base: '', // Empty string for GitHub Pages with custom domain
    server: {
      host: "::",
      port: 8080,
    },
    define: {
      __BUILD_TIME__: buildTimestamp,
      __BUILD_HASH__: JSON.stringify(buildHash),
      // Explicitly define env vars (Vite does this automatically, but being explicit helps debugging)
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY),
      'import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY': JSON.stringify(env.VITE_STRIPE_PUBLISHABLE_KEY),
      'import.meta.env.VITE_GOOGLE_MAPS_API_KEY': JSON.stringify(env.VITE_GOOGLE_MAPS_API_KEY),
    },
    plugins: [
      react(),
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
  };
});
