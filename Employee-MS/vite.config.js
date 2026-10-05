import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react()
  ],
  resolve: {
    alias: [
      {
        find: /^\.\.\/\.\.\/api\/axios$/,
        replacement: path.resolve(__dirname, 'src/api/axios')
      },
      {
        find: /^\.\.\/\.\.\/context\/AuthContext$/,
        replacement: path.resolve(__dirname, 'src/context/AuthContext')
      },
      {
        find: /^\.\.\/\.\.\/Components\/admin\/users\/(.*)$/,
        replacement: path.resolve(__dirname, 'src/Components/admin/users/$1')
      },
      {
        find: '@',
        replacement: path.resolve(__dirname, 'src')
      }
    ]
  },
  server: {
    port: 5173
  }
})
