$env:DEBUG = "vite:*"
npm run dev 2>&1 | Tee-Object -FilePath vite-debug.log
