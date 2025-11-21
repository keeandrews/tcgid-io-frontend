import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Paper from '@mui/material/Paper'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import Link from '@mui/material/Link'
import { Link as RouterLink } from 'react-router-dom'

import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'
import { DEMO_USER_TOAST_MESSAGE, isDemoUserRestrictionResponse } from '../utils/demoUserRestriction'
import PageContainer from '../components/PageContainer'

export default function SignIn() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const navigate = useNavigate()

  const location = useLocation()
  const [snackbarOpen, setSnackbarOpen] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState('')
  const [snackbarSeverity, setSnackbarSeverity] = useState('success')

  useEffect(() => {
    const state = location.state
    const message = state?.toastMessage || state?.toast?.message
    const severity = state?.toastSeverity || state?.toast?.severity || 'success'
    if (message) {
      setSnackbarMessage(message)
      setSnackbarSeverity(severity)
      setSnackbarOpen(true)
      // Clear the state so the toast doesn't reappear on back/forward
      window.history.replaceState({}, document.title, location.pathname)
    }
  }, [location])

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') return
    setSnackbarOpen(false)
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const decodeJWT = (token) => {
    try {
      const base64Url = token.split('.')[1]
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      )
      return JSON.parse(jsonPayload)
    } catch (error) {
      console.error('Error decoding JWT:', error)
      return null
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const response = await fetch('https://tcgid.io/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      })

      const responseData = await response.json()

      if (response.ok && responseData.success && responseData.data?.id_token) {
        // Save id_token as the auth token
        localStorage.setItem('token', responseData.data.id_token)

        // Decode id_token to get claims
        const claims = decodeJWT(responseData.data.id_token)
        if (claims) {
          // Save claims to browser storage
          localStorage.setItem('userClaims', JSON.stringify(claims))

          // Dispatch event to update Navigation component
          window.dispatchEvent(new Event('authStateChange'))

          // Check email_verified status
          if (claims.email_verified === false) {
            // Redirect to verify page with email in URL
            const encodedEmail = encodeURIComponent(claims.email)
            navigate(`/verify?email=${encodedEmail}`)
          } else {
            // Redirect through the root route to inventory
            navigate('/')
          }
        } else {
          setSnackbarMessage('Error processing authentication data')
          setSnackbarSeverity('error')
          setSnackbarOpen(true)
        }
      } else if (isDemoUserRestrictionResponse(response.status, responseData)) {
        setSnackbarMessage(DEMO_USER_TOAST_MESSAGE)
        setSnackbarSeverity('error')
        setSnackbarOpen(true)
      } else if (response.status === 403) {
        // User not confirmed
        setSnackbarMessage(responseData.data || 'User is not confirmed. Please verify your email before logging in.')
        setSnackbarSeverity('error')
        setSnackbarOpen(true)
      } else if (response.status === 401) {
        // Invalid credentials
        setSnackbarMessage(responseData.data || 'Incorrect email or password')
        setSnackbarSeverity('error')
        setSnackbarOpen(true)
      } else {
        // Handle other error responses
        const errorMessage = responseData.data || responseData.message || 'Login failed. Please try again.'
        setSnackbarMessage(errorMessage)
        setSnackbarSeverity('error')
        setSnackbarOpen(true)
      }
    } catch (error) {
      console.error('Login error:', error)
      setSnackbarMessage('Network error. Please try again later.')
      setSnackbarSeverity('error')
      setSnackbarOpen(true)
    }
  }

  const isFormValid = () => {
    return formData.email && formData.password
  }

  return (
    <>
      <PageContainer
        maxWidth={560}
        contentSx={{
          minHeight: { xs: '50vh', sm: '60vh' },
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Paper 
          elevation={3} 
          sx={{ 
            p: { xs: 2, sm: 3, md: 4 }, 
            width: '100%',
            borderRadius: 2
          }}
        >
        <Typography 
          variant="h4" 
          gutterBottom 
          align="center"
          sx={{
            fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2.125rem' }
          }}
        >
          Sign In
        </Typography>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: { xs: 2, sm: 3 } }}>
          <Stack spacing={{ xs: 2, sm: 3 }}>
            <TextField
              required
              fullWidth
              id="email"
              name="email"
              label="Email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              autoComplete="email"
              size="medium"
              sx={{
                '& .MuiInputBase-root': {
                  fontSize: { xs: '0.9rem', sm: '1rem' }
                }
              }}
            />
            <TextField
              required
              fullWidth
              id="password"
              name="password"
              label="Password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              autoComplete="current-password"
              size="medium"
              sx={{
                '& .MuiInputBase-root': {
                  fontSize: { xs: '0.9rem', sm: '1rem' }
                }
              }}
            />
            <Box sx={{ textAlign: 'right', mt: -1 }}>
              <Link 
                component={RouterLink} 
                to="/forgot-password" 
                underline="hover" 
                variant="body2"
                sx={{
                  fontSize: { xs: '0.8rem', sm: '0.875rem' }
                }}
              >
                Forgot password?
              </Link>
            </Box>
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              size="large"
              sx={{ 
                mt: 2,
                fontSize: { xs: '0.9rem', sm: '1rem' },
                py: { xs: 1, sm: 1.5 }
              }}
              disabled={!isFormValid()}
            >
              Sign In
            </Button>
            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Typography 
                variant="body2"
                sx={{
                  fontSize: { xs: '0.8rem', sm: '0.875rem' }
                }}
              >
                Don't have an account?{' '}
                <Link component={RouterLink} to="/signup" underline="hover">
                  Sign up
                </Link>
              </Typography>
            </Box>
          </Stack>
        </Box>
        </Paper>
      </PageContainer>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  )
}

