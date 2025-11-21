import React, { useState, useEffect } from 'react'
import Typography from '@mui/material/Typography'
import Paper from '@mui/material/Paper'
import Box from '@mui/material/Box'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'
import { DEMO_USER_TOAST_MESSAGE, isDemoUserRestrictionResponse } from '../utils/demoUserRestriction'
import PageContainer from '../components/PageContainer'

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [snackbarState, setSnackbarState] = useState({
    open: false,
    message: '',
    severity: 'info'
  })

  const showSnackbar = (message, severity = 'info') => {
    setSnackbarState({
      open: true,
      message,
      severity
    })
  }

  const handleCloseSnackbar = (_, reason) => {
    if (reason === 'clickaway') {
      return
    }
    setSnackbarState((prev) => ({ ...prev, open: false }))
  }

  const checkAuthentication = () => {
    const token = localStorage.getItem('token')
    const claimsStr = localStorage.getItem('userClaims')
    
    if (token && claimsStr) {
      try {
        const claims = JSON.parse(claimsStr)
        // Check if token is expired
        if (claims.exp && claims.exp * 1000 > Date.now()) {
          setIsAuthenticated(true)
        } else {
          // Token expired, clear storage
          localStorage.removeItem('token')
          localStorage.removeItem('userClaims')
          setIsAuthenticated(false)
        }
      } catch (error) {
        console.error('Error parsing user claims:', error)
        localStorage.removeItem('token')
        localStorage.removeItem('userClaims')
        setIsAuthenticated(false)
      }
    } else {
      setIsAuthenticated(false)
    }
  }

  useEffect(() => {
    // Check authentication on mount
    checkAuthentication()

    // Listen for storage changes (e.g., when user logs in/out in another tab)
    const handleStorageChange = (e) => {
      if (e.key === 'token' || e.key === 'userClaims') {
        checkAuthentication()
      }
    }

    window.addEventListener('storage', handleStorageChange)

    // Also listen for custom event for same-tab updates
    const handleAuthChange = () => {
      checkAuthentication()
    }

    window.addEventListener('authStateChange', handleAuthChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('authStateChange', handleAuthChange)
    }
  }, [])

  const handleLinkEbayClick = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        console.error('No auth token found')
        return
      }

      const res = await fetch('https://tcgid.io/api/integrations/ebay/start', {
        method: 'GET',
        headers: {
          'x-authorization-token': token,
          'Content-Type': 'application/json',
        },
      })

      let json = null
      try {
        json = await res.json()
      } catch {
        json = null
      }

      if (isDemoUserRestrictionResponse(res.status, json)) {
        showSnackbar(DEMO_USER_TOAST_MESSAGE, 'error')
        return
      }

      if (json?.success && json?.data?.authorizationUrl) {
        window.location.href = json.data.authorizationUrl
      } else {
        console.error('Unexpected response from start endpoint', json)
        showSnackbar('Unable to start eBay linking. Please try again.', 'error')
      }
    } catch (error) {
      console.error('Error connecting to eBay:', error)
      showSnackbar('Unable to start eBay linking. Please try again.', 'error')
    }
  }

  return (
    <>
      <PageContainer maxWidth={760} contentSx={{ gap: { xs: 2, md: 3 } }}>
        <Paper 
          elevation={0} 
          sx={{ 
            p: { xs: 2, sm: 3, md: 4 },
            borderRadius: 2,
            width: '100%'
          }}
        >
        <Typography 
          variant="h4" 
          gutterBottom
          sx={{
            fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2.125rem' }
          }}
        >
          Welcome to TCGID.IO
        </Typography>
        <Box>
          <Typography 
            variant="body1"
            sx={{
              fontSize: { xs: '0.9rem', sm: '1rem' },
              lineHeight: 1.6
            }}
          >
            Manage your trading card inventory with ease. Connect your eBay account, sync your listings, and create new inventory batches.
          </Typography>
          
        </Box>
        </Paper>
      </PageContainer>
      <Snackbar
        open={snackbarState.open}
        autoHideDuration={5000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbarState.severity} sx={{ width: '100%' }}>
          {snackbarState.message}
        </Alert>
      </Snackbar>
    </>
  )
}


