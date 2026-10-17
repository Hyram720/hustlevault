import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { captureUtm, trackVisitOnce } from './apps/utm'

captureUtm()
if (!/^\/(admin|my)(\/|$)/.test(window.location.pathname)) trackVisitOnce()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
