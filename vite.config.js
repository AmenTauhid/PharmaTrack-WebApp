import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
    host: true, // Listen on all local IPs
  },
  build: {
    outDir: 'dist',
    sourcemap: true, // For easier debugging of production issues
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor code into separate chunks to improve caching
          'vendor': ['react', 'react-dom', 'react-router-dom'],
          'firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage', 'firebase/analytics'],
        }
      }
    }
  },
});