// src/hooks/useGymRoutesConfig.js
import { useEffect, useMemo, useState } from 'react'
import { fetchRoutesConfig } from '../services/api'

const DEFAULTS = {
  overview: true,
  profile:  true,
  plans:    true,
  slots:    true,
  payouts:  true,
  checkins: true,
  access:   true,
  courses:  true
}

function normalize(raw) {
  const merged = { ...DEFAULTS }
  if (raw && typeof raw === 'object') {
    Object.keys(raw).forEach(k => {
      const v = raw[k]
      merged[k] = (v === true || v === 1 || v === '1')
    })
  }
  return merged
}

export function useGymRoutesConfig(gymId) {
  const [cfg, setCfg] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const ctrl = new AbortController()
    setLoading(true)

    // 1) cache locale (best-effort)
    const cached = localStorage.getItem(`routes:${gymId}`)
    if (cached) {
      try { setCfg(JSON.parse(cached)) } catch {}
    }

    // 2) fetch da API centralizzata
    fetchRoutesConfig(gymId, ctrl.signal)
      .then(data => {
        const normalized = normalize(data)
        setCfg(normalized)
        localStorage.setItem(`routes:${gymId}`, JSON.stringify(normalized))
      })
      .catch(err => {
        console.warn('routes fetch failed', err)
        if (!cfg) setCfg(DEFAULTS)
        setError(err)
      })
      .finally(() => setLoading(false))

    return () => ctrl.abort()
  }, [gymId])

  const config = useMemo(() => cfg ?? DEFAULTS, [cfg])
  return { config, loading, error }
}
