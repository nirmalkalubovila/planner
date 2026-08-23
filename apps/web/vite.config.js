import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path"
import fs from 'fs'
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function precacheManifestPlugin() {
  return {
    name: 'precache-manifest-generator',
    closeBundle() {
      const distDir = path.resolve(__dirname, 'dist');
      if (!fs.existsSync(distDir)) return;

      const files = ['/'];
      
      function traverse(dir) {
        const list = fs.readdirSync(dir);
        for (const file of list) {
          const fullPath = path.join(dir, file);
          const stat = fs.statSync(fullPath);
          if (stat.isDirectory()) {
            traverse(fullPath);
          } else {
            const relativePath = path.relative(distDir, fullPath).replace(/\\/g, '/');
            // Skip map files, sw.js itself, and the manifest output file
            if (!relativePath.endsWith('.map') && relativePath !== 'sw.js' && relativePath !== 'precache-manifest.json') {
              files.push('/' + relativePath);
            }
          }
        }
      }

      traverse(distDir);
      fs.writeFileSync(
        path.join(distDir, 'precache-manifest.json'),
        JSON.stringify(files, null, 2)
      );
      console.log(`[Precache Plugin] Successfully compiled ${files.length} assets into precache-manifest.json`);
    }
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), precacheManifestPlugin()],
  define: {
    __APP_VERSION__: JSON.stringify('0.0.0-build.' + new Date().toISOString().slice(0, 10).replace(/-/g, '.') + '.' + Date.now().toString().slice(-4)),
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ['react', 'react-dom', 'react-router', 'react-router-dom', '@tanstack/react-query'],
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
    ],
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-query': ['@tanstack/react-query'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-date': ['date-fns'],
          'vendor-ui': ['sonner', 'lucide-react'],
        },
      },
    },
  },
})
