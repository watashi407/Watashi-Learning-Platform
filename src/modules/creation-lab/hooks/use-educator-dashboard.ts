import { useCallback, useEffect, useRef, useState } from 'react'
import type { EducatorDashboardSnapshot } from '../../../shared/contracts/educator'
import { getEducatorDashboardSnapshotClient } from '../../../features/educator/client'
import { getDisplayErrorMessage } from '../../../shared/errors'

const POLL_INTERVAL_MS = 30_000

export function useEducatorDashboard() {
  const [snapshot, setSnapshot] = useState<EducatorDashboardSnapshot | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const refresh = useCallback(async () => {
    try {
      const data = await getEducatorDashboardSnapshotClient()
      setSnapshot(data)
      setError(null)
    } catch (err) {
      setError(getDisplayErrorMessage(err, 'Could not load dashboard data. Please try again.'))
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function bootstrap() {
      setIsLoading(true)
      try {
        const data = await getEducatorDashboardSnapshotClient()
        if (!cancelled) {
          setSnapshot(data)
          setError(null)
        }
      } catch (err) {
        if (!cancelled) {
          setError(getDisplayErrorMessage(err, 'Could not load dashboard data. Please try again.'))
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void bootstrap()

    pollRef.current = setInterval(() => {
      if (!cancelled) {
        void refresh()
      }
    }, POLL_INTERVAL_MS)

    return () => {
      cancelled = true
      if (pollRef.current) {
        clearInterval(pollRef.current)
      }
    }
  }, [refresh])

  return { snapshot, isLoading, error, refresh }
}
