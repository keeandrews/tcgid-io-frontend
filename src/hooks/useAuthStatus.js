import { useCallback, useEffect, useState } from 'react'

const defaultState = { isAuthenticated: false, userClaims: null }

const readAuthState = () => {
  if (typeof window === 'undefined') {
    return defaultState
  }

  const token = localStorage.getItem('token')
  const claimsStr = localStorage.getItem('userClaims')

  if (!token || !claimsStr) {
    return defaultState
  }

  try {
    const claims = JSON.parse(claimsStr)
    if (claims?.exp && claims.exp * 1000 > Date.now()) {
      return { isAuthenticated: true, userClaims: claims }
    }

    localStorage.removeItem('token')
    localStorage.removeItem('userClaims')
  } catch (error) {
    console.error('Error parsing user claims:', error)
    localStorage.removeItem('token')
    localStorage.removeItem('userClaims')
  }

  return defaultState
}

export default function useAuthStatus() {
  const [authState, setAuthState] = useState(() => readAuthState())

  const refreshAuth = useCallback(() => {
    setAuthState(readAuthState())
  }, [])

  useEffect(() => {
    refreshAuth()

    const handleStorageChange = (event) => {
      if (event.key === 'token' || event.key === 'userClaims') {
        refreshAuth()
      }
    }

    const handleAuthChange = () => {
      refreshAuth()
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('authStateChange', handleAuthChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('authStateChange', handleAuthChange)
    }
  }, [refreshAuth])

  return { ...authState, refreshAuth }
}


