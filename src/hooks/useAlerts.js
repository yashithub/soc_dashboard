import { useCallback, useEffect, useRef, useState } from 'react'
import { getAlerts, subscribeToAlerts } from '../services/alertService.js'

/**
 * Loads the alert feed through the service layer and exposes it to the page.
 *
 * The hook is written for the eventual live feed, not just the current dataset:
 * it already handles loading and error states and already opens/closes a
 * subscription. In version 1 `subscribeToAlerts` is an intentional no-op — no
 * fabricated events are pushed — so wiring a WebSocket later touches only the
 * service.
 *
 * @returns {{alerts: Array<object>, loading: boolean, error: Error|null, refresh: () => void}}
 */
export function useAlerts() {
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const mounted = useRef(true)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getAlerts()
      if (mounted.current) setAlerts(data)
    } catch (cause) {
      if (mounted.current) setError(cause)
    } finally {
      if (mounted.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    mounted.current = true
    load()
    return () => {
      mounted.current = false
    }
  }, [load])

  useEffect(() => {
    // Prepends live alerts once a real feed exists; no-op today.
    const unsubscribe = subscribeToAlerts((alert) => {
      setAlerts((current) => [alert, ...current])
    })
    return unsubscribe
  }, [])

  return { alerts, loading, error, refresh: load }
}
