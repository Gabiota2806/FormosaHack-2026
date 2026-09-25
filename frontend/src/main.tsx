import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ElderlyModeProvider } from './components/elderly/ElderlyModeContext'
import { registerServiceWorker } from './pwa/registerServiceWorker'

registerServiceWorker()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ElderlyModeProvider>
      <App />
    </ElderlyModeProvider>
  </StrictMode>,
)
