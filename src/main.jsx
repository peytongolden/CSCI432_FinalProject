import React from 'react'
// Expose React as a global to handle any compiled modules that expect a global
// `React` variable (fixes "React is not defined" errors in some bundles).
try { window.React = React } catch (e) { /* ignore non-browser envs */ }
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

function renderApp() {
  try {
    ReactDOM.createRoot(document.getElementById('root')).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    )
  } catch (err) {
    console.error('App failed to render:', err)
    const root = document.getElementById('root')
    if (root) {
      root.innerHTML = ''
      const pre = document.createElement('pre')
      pre.style.whiteSpace = 'pre-wrap'
      pre.style.color = '#c00'
      pre.style.padding = '1rem'
      pre.style.background = '#fff'
      pre.style.border = '1px solid #c00'
      pre.textContent = 'Application failed to start. Check console for details:\n' + (err && err.stack ? err.stack : String(err))
      root.appendChild(pre)
    }
  }
}

// Global error handler to show visible feedback instead of a blank page
window.addEventListener('error', (event) => {
  console.error('Unhandled error:', event.error || event.message, event)
  const root = document.getElementById('root')
  if (root) {
    root.innerHTML = ''
    const div = document.createElement('div')
    div.style.padding = '1rem'
    div.style.background = '#fff'
    div.style.color = '#900'
    div.style.border = '1px solid #900'
    div.textContent = 'A fatal error occurred while loading the application. Open the browser console for details.'
    root.appendChild(div)
  }
})

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled rejection:', event.reason)
  const root = document.getElementById('root')
  if (root) {
    root.innerHTML = ''
    const div = document.createElement('div')
    div.style.padding = '1rem'
    div.style.background = '#fff'
    div.style.color = '#900'
    div.style.border = '1px solid #900'
    div.textContent = 'A fatal error occurred while loading the application (promise rejection). Open the browser console for details.'
    root.appendChild(div)
  }
})

renderApp()

