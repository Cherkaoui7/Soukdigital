import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    tsconfigPaths(),
    tailwindcss(),
    tanstackStart({
      spa: {
        enabled: true,
      },
      prerender: {
        filter: () => false,
      }
    }),
    react()
  ],
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  server: {
    port: 8080,
    host: '::',
    watch: {
      ignored: [
        "**/venv/**",
        "**/.venv/**",
        "**/backend/**",
        "**/.git/**",
        "**/.output/**",
        "**/dist/**",
        "**/build/**",
        "**/node_modules/**",
        "**/souk_ai.db"
      ]
    }
  },
  optimizeDeps: {
    noDiscovery: true,
    include: ["react", "react-dom", "react-dom/client", "react/jsx-runtime", "react/jsx-dev-runtime"],
  }
})
