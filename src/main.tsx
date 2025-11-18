import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Root element not found')
}

ReactDOM.createRoot(rootElement).render(
  // StrictMode disabled to prevent double renders that cause terrain to "jump"
  // Re-enable in production if needed, but it causes issues with Three.js geometry creation
  <App />
)

