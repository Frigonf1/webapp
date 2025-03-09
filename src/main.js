import { createApp } from 'vue'
import App from './components/App.vue'
import './assets/main.css' // If you have a global CSS file

// Create and mount the Vue application
const app = createApp(App)

// You can add plugins here if needed
// app.use(router)
// app.use(store)

// Mount the app
app.mount('#app')

// Log environment check for API keys
if (import.meta.env.MODE === 'development') {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY
    if (!apiKey) {
        console.warn('WARNING: Gemini API key not found in environment variables. The symptom checker will not function properly.')
        console.info('Please add VITE_GEMINI_API_KEY to your .env file')
    }
}
