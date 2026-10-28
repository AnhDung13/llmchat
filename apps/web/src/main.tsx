import { QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'streamdown/styles.css'
import './index.css'
import './lib/i18n'
import App from './App'
import { queryClient } from './lib/queryClient'
import { Toaster } from './ui/Toaster'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
    <Toaster />
  </StrictMode>,
)
