import { ErrorPanel } from './error-panel'

export function RouteNotFound() {
  return (
    <div className="min-h-screen bg-[#f5f7fb]">
      <ErrorPanel
        title="This page is not here"
        message="The page may have moved, or the link may be incorrect."
        showHomeLink
      />
    </div>
  )
}
