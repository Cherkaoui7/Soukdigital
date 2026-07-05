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
        "**/node_modules/**",
        "**/.git/**",
        "**/.output/**",
        "**/dist/**",
        "**/build/**",

        "**/venv/**",
        "**/.venv/**",
        "**/__pycache__/**",

        "**/*.pyc",
        "**/*.pyo",

        "**/*.db",
        "**/*.sqlite",
        "**/*.sqlite3",

        "**/.pytest_cache/**",
        "**/.mypy_cache/**",
        "**/.ruff_cache/**"
      ]
    }
  },
  optimizeDeps: {
    noDiscovery: true,
    include: ["react", "react-dom", "react-dom/client", "react/jsx-runtime", "react/jsx-dev-runtime"],
  }
})
