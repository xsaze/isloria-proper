import { useState, useEffect } from 'react'

export function usePresaleStatus() {
  const [isActive, setIsActive] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    checkPresaleStatus()

    // Check every 30 seconds
    const interval = setInterval(checkPresaleStatus, 30000)

    return () => clearInterval(interval)
  }, [])

  const checkPresaleStatus = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
      const response = await fetch(`${apiUrl}/api/presale/active`)

      if (!response.ok) {
        throw new Error('Failed to check presale status')
      }

      const data = await response.json()
      setIsActive(data.active)
      setError(null)
    } catch (err) {
      console.error('Error checking presale status:', err)
      setError(err.message)
      // Default to inactive if there's an error
      setIsActive(false)
    } finally {
      setIsLoading(false)
    }
  }

  return { isActive, isLoading, error }
}
