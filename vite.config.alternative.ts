import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Alternative configuration with different port to avoid conflicts
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Allow network access
    port: 5175,      // Changed from 5173 to avoid conflicts
    strictPort: false, // Allow fallback to next available port
    open: false      // Don't auto-open browser
  }
})