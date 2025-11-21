import { useState, useEffect } from 'react'

// Module-level cache to avoid re-fetching during session
const ASPECTS_CACHE = {}

// Cache expiration time (24 hours in milliseconds)
const CACHE_TTL = 24 * 60 * 60 * 1000

/**
 * Custom hook to fetch and cache eBay aspects JSON from CDN
 * @param {number|string} categoryId - eBay category ID
 * @returns {{ aspects: object|null, loading: boolean, error: string|null }}
 */
export default function useEbayAspects(categoryId) {
  const [aspects, setAspects] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!categoryId) {
      setAspects(null)
      setLoading(false)
      setError(null)
      return
    }

    const fetchAspects = async () => {
      const cacheKey = `ebay_aspects_${categoryId}`

      // Check module-level cache first
      if (ASPECTS_CACHE[cacheKey]) {
        setAspects(ASPECTS_CACHE[cacheKey])
        setLoading(false)
        return
      }

      // Check localStorage cache
      try {
        const cachedData = localStorage.getItem(cacheKey)
        if (cachedData) {
          const parsed = JSON.parse(cachedData)
          const now = Date.now()
          
          // Check if cache is still valid
          if (parsed.timestamp && (now - parsed.timestamp) < CACHE_TTL) {
            ASPECTS_CACHE[cacheKey] = parsed.data
            setAspects(parsed.data)
            setLoading(false)
            return
          } else {
            // Cache expired, remove it
            localStorage.removeItem(cacheKey)
          }
        }
      } catch (err) {
        console.warn('Error reading from localStorage cache:', err)
      }

      // Fetch from CDN
      setLoading(true)
      setError(null)

      try {
        const response = await fetch(`https://cdn.tcgid.io/aspects/${categoryId}.json`)
        
        if (!response.ok) {
          throw new Error(`Failed to fetch aspects: ${response.statusText}`)
        }

        const data = await response.json()

        // Validate that we got aspects array
        if (!data || !Array.isArray(data.aspects)) {
          throw new Error('Invalid aspects data format')
        }

        // Store in both caches
        ASPECTS_CACHE[cacheKey] = data
        
        try {
          localStorage.setItem(cacheKey, JSON.stringify({
            data,
            timestamp: Date.now()
          }))
        } catch (err) {
          console.warn('Error saving to localStorage:', err)
        }

        setAspects(data)
        setLoading(false)
      } catch (err) {
        console.error('Error fetching eBay aspects:', err)
        setError(err.message || 'Failed to load aspects')
        setLoading(false)
      }
    }

    fetchAspects()
  }, [categoryId])

  return { aspects, loading, error }
}

