import { useState, useEffect } from 'react'
import client from '../api/client'

export default function usePipeline(id) {
  const [pipeline, setPipeline] = useState(null)
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    Promise.all([
      client.get(`/pipelines/${id}`),
      client.get(`/jobs/pipeline/${id}`)
    ])
      .then(([p, j]) => {
        setPipeline(p.data)
        setJobs(j.data)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [id])

  const refresh = () => {
    client.get(`/jobs/pipeline/${id}`)
      .then((j) => setJobs(j.data))
  }

  return { pipeline, jobs, loading, error, refresh }
}