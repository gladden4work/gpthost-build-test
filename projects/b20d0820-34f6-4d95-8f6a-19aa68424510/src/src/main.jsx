import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'


// Enhanced React 18 entry point with optimizations (TASK-014)
const root = ReactDOM.createRoot(
  document.getElementById('root')!
)

root.render(
  <React.StrictMode>
    
    <App />
    
  </React.StrictMode>
)

// Enable React DevTools profiler in development
if (process.env.NODE_ENV === 'development') {
  // @ts-ignore
  window.React = React
}