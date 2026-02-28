import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ConvexProvider, ConvexReactClient } from 'convex/react'
import { ErrorBoundary } from 'react-error-boundary'
import './index.css'
import App from './App.tsx'

const convex = new ConvexReactClient(
  import.meta.env.VITE_CONVEX_URL || 'http://localhost:8400'
)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConvexProvider client={convex}>
      <ErrorBoundary
        fallbackRender={() => (
          <div className="min-h-screen bg-bg flex items-center justify-center p-6">
            <div className="w-full max-w-sm bg-surface border border-[var(--border)] rounded-2xl p-5 text-center shadow-sm">
              <h1 className="text-lg font-semibold text-app-text mb-2">Something went wrong</h1>
              <p className="text-sm text-muted mb-4">
                Please refresh. If it keeps happening, contact support.
              </p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="w-full py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold active:scale-95 transition-transform"
              >
                Refresh
              </button>
            </div>
          </div>
        )}
      >
        <App />
      </ErrorBoundary>
    </ConvexProvider>
  </StrictMode>,
)
