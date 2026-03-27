import { ErrorPanel } from './error-panel'
import { getDisplayErrorMessage, getErrorRequestId } from '../../shared/errors'

export function RouteErrorFallback({ error, reset }: { error: Error; reset: () => void }) {
  const requestId = getErrorRequestId(error)

  return (
    <div className="min-h-screen bg-[#f5f7fb]">
      <ErrorPanel
        title="We could not load this page"
        message={getDisplayErrorMessage(error, 'This page ran into a problem. Please try again.')}
        requestId={requestId}
        onRetry={reset}
      />
    </div>
  )
}
