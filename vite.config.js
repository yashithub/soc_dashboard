import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
  },
  build: {
    rollupOptions: {
      output: {
        // Recharts is the bulk of the bundle and changes rarely; a separate
        // vendor chunk keeps it cached across app deploys.
        manualChunks: { charts: ['recharts'] },
      },
    },
  },
})
