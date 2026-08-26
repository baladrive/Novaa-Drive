import { StrictMode, lazy, Suspense, startTransition } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

// Lazy load the App component for faster initial render
const App = lazy(() => import('./App.tsx'))

// Performance mark for initial load
if (performance.mark) {
  performance.mark('app-init-start')
}

const root = document.getElementById('root')!

// Use startTransition for non-urgent initial render
startTransition(() => {
  createRoot(root).render(
    <StrictMode>
      <Suspense fallback={
        <div className="flex h-screen w-screen items-center justify-center bg-[#0B1020]">
          <div className="flex flex-col items-center gap-4">
            <div className="relative flex h-16 w-16 items-center justify-center">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500 to-cyan-500 opacity-60 blur-xl" />
              <div className="relative flex h-full w-full items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-cyan-500">
                <svg className="h-8 w-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17.5 19a3.5 3.5 0 1 0 0-7h-11a3.5 3.5 0 1 0 0 7h11z" />
                  <path d="M12 12V4" />
                  <path d="M9 7l3-3 3 3" />
                </svg>
              </div>
            </div>
            <p className="text-sm font-black tracking-tight text-white">Novaa Drive</p>
          </div>
        </div>
      }>
        <App />
      </Suspense>
    </StrictMode>,
  )
})

// Mark initial render complete
if (performance.mark) {
  performance.mark('app-init-end')
  performance.measure('app-initial-render', 'app-init-start', 'app-init-end')
}