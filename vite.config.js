import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import svgr from 'vite-plugin-svgr'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    svgr()
  ],
  // 🔑 Add the server configuration here
  server: {
    // 📢 Add the specific ngrok host to the allowedHosts array
    allowedHosts: [
      'unweaponed-overnervously-thea.ngrok-free.dev',
    ],
  }
})