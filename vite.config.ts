// vite.config.ts
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// Generate build timestamp and hash for cache busting
const buildTimestamp = Date.now();
const buildHash = Math.random().toString(36).substr(2, 9);

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory
  // Load VITE_ prefixed variables from .env files
  const env = loadEnv(mode, process.cwd(), "VITE_");
  
  // Also check process.env for variables set by CI/CD (GitHub Actions)
  const finalEnv = {
    VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL || env.VITE_SUPABASE_URL,
    VITE_SUPABASE_PUBLISHABLE_KEY: process.env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_PUBLISHABLE_KEY,
    VITE_SUPABASE_FUNCTIONS_URL: process.env.VITE_SUPABASE_FUNCTIONS_URL || env.VITE_SUPABASE_FUNCTIONS_URL,
    VITE_STRIPE_PUBLISHABLE_KEY: process.env.VITE_STRIPE_PUBLISHABLE_KEY || env.VITE_STRIPE_PUBLISHABLE_KEY,
    VITE_GOOGLE_MAPS_API_KEY: process.env.VITE_GOOGLE_MAPS_API_KEY || env.VITE_GOOGLE_MAPS_API_KEY,
    VITE_RESEND_API_KEY: process.env.VITE_RESEND_API_KEY || env.VITE_RESEND_API_KEY,
    VITE_SITE_URL: process.env.VITE_SITE_URL || env.VITE_SITE_URL,
    VITE_ADMIN_EMAIL: process.env.VITE_ADMIN_EMAIL || env.VITE_ADMIN_EMAIL,
    VITE_APP_ENV: process.env.VITE_APP_ENV || env.VITE_APP_ENV || mode,
  };
  
  // Log environment variable status during build
  console.log("\n🔧 Vite Build Configuration");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📦 Build Mode:", mode);
  console.log("🌍 NODE_ENV:", process.env.NODE_ENV);
  console.log("\n📋 Environment Variables (Injected at Build Time):");
  console.log("  VITE_SUPABASE_URL:", finalEnv.VITE_SUPABASE_URL ? "✅ SET" : "❌ UNDEFINED");
  console.log(
    "  VITE_SUPABASE_PUBLISHABLE_KEY:",
    finalEnv.VITE_SUPABASE_PUBLISHABLE_KEY
      ? `✅ SET (${finalEnv.VITE_SUPABASE_PUBLISHABLE_KEY.substring(0, 20)}...)`
      : "❌ UNDEFINED"
  );

  console.log(
    "  VITE_STRIPE_PUBLISHABLE_KEY:",
    finalEnv.VITE_STRIPE_PUBLISHABLE_KEY
      ? `✅ SET (${finalEnv.VITE_STRIPE_PUBLISHABLE_KEY.substring(0, 25)}...)`
      : "❌ UNDEFINED"
  );
  console.log(
    "  VITE_GOOGLE_MAPS_API_KEY:",
    finalEnv.VITE_GOOGLE_MAPS_API_KEY ? "✅ SET" : "❌ UNDEFINED"
  );
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  // Validate critical environment variables
  if (!finalEnv.VITE_STRIPE_PUBLISHABLE_KEY) {
    console.error("⚠️  WARNING: VITE_STRIPE_PUBLISHABLE_KEY is not set!");
    console.error("   This will cause Stripe integration to fail in production.");
  }
  if (!finalEnv.VITE_GOOGLE_MAPS_API_KEY) {
    console.error("⚠️  WARNING: VITE_GOOGLE_MAPS_API_KEY is not set!");
    console.error("   This will cause Google Maps integration to fail in production.");
  }

  return {
    base: "/", // CRITICAL: Use absolute paths to fix white screen on SPA route refresh

    server: {
      host: "::",
      port: 8080,
    },
    define: {
      __BUILD_TIME__: buildTimestamp,
      __BUILD_HASH__: JSON.stringify(buildHash),
      // Explicitly inject all VITE_ environment variables
      "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(finalEnv.VITE_SUPABASE_URL || ""),
      "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(finalEnv.VITE_SUPABASE_PUBLISHABLE_KEY || ""),
      "import.meta.env.VITE_SUPABASE_FUNCTIONS_URL": JSON.stringify(finalEnv.VITE_SUPABASE_FUNCTIONS_URL || ""),
      "import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY": JSON.stringify(finalEnv.VITE_STRIPE_PUBLISHABLE_KEY || ""),
      "import.meta.env.VITE_GOOGLE_MAPS_API_KEY": JSON.stringify(finalEnv.VITE_GOOGLE_MAPS_API_KEY || ""),
      "import.meta.env.VITE_RESEND_API_KEY": JSON.stringify(finalEnv.VITE_RESEND_API_KEY || ""),
      "import.meta.env.VITE_SITE_URL": JSON.stringify(finalEnv.VITE_SITE_URL || ""),
      "import.meta.env.VITE_ADMIN_EMAIL": JSON.stringify(finalEnv.VITE_ADMIN_EMAIL || ""),
      "import.meta.env.VITE_APP_ENV": JSON.stringify(finalEnv.VITE_APP_ENV || "production"),
    },


    plugins: [
      react(),
      {
        name: "version-generator",
        generateBundle() {
          this.emitFile({
            type: "asset",
            fileName: "version.json",
            source: JSON.stringify(
              {
                version: process.env.npm_package_version || "1.0.0",
                buildTime: buildTimestamp,
                hash: buildHash,
                timestamp: new Date().toISOString(),
              },
              null,
              2
            ),
          });
        },
      },
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      outDir: "dist",
      assetsDir: "assets",
      sourcemap: false,
      emptyOutDir: true,
      rollupOptions: {
        output: {
          manualChunks: undefined,
          entryFileNames: `assets/[name].${buildHash}.[hash].js`,
          chunkFileNames: `assets/[name].${buildHash}.[hash].js`,
          assetFileNames: `assets/[name].${buildHash}.[hash].[ext]`,
        },
      },
    },
    preview: {
      port: 8080,
      host: "::",
    },
  };
});