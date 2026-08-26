import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { PrivacyPolicy } from './components/privacy-policy.tsx'

const isPrivacyPolicy = window.location.pathname.replace(/\/+$/, '') === '/politica-de-privacidad'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isPrivacyPolicy ? <PrivacyPolicy /> : <App />}
  </StrictMode>,
)
