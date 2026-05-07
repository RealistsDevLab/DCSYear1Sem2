import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Change 'DCSYear1Sem2' to whatever your GitHub repo name is
  base: '/DCSYear1Sem2/',
})
