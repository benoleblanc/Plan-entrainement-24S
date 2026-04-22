import { defineConfig } from 'vite'

// Trigger redeploy
export default defineConfig({
  base: '/Plan-entrainement-24S/',
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        cardio: 'cardio.html'
      }
    }
  }
})
