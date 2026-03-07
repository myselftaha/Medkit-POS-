import './utils/fetchInterceptor'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

import { ToastProvider } from './context/ToastContext'

const appTree = (
  <ToastProvider>
    <App />
  </ToastProvider>
)

createRoot(document.getElementById('root')).render(
  import.meta.env.DEV ? appTree : <StrictMode>{appTree}</StrictMode>,
)
