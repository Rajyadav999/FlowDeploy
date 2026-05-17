import { useState, useEffect, useRef } from 'react'

export default function useLiveLogs(jobId) {
  const [logs, setLogs] = useState([])
  const [connected, setConnected] = useState(false)
  const esRef = useRef(null)

  useEffect(() => {
    if (!jobId) return

    setLogs([])

    // use relative URL — goes through Nginx in Docker, direct in dev
    const sseUrl = import.meta.env.VITE_API_URL
      ? `${import.meta.env.VITE_API_URL}/logs/${jobId}`
      : `/api/logs/${jobId}`

    const es = new EventSource(sseUrl)
    esRef.current = es

    es.onopen = () => setConnected(true)

    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data)
        setLogs((prev) => [...prev, data])
      } catch {
        setLogs((prev) => [...prev, { line: e.data, step: 'system' }])
      }
    }

    es.onerror = () => {
      setConnected(false)
      es.close()
    }

    return () => {
      es.close()
      setConnected(false)
    }
  }, [jobId])

  return { logs, connected }
}