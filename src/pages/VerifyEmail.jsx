import React, { useState, useEffect } from 'react'
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom'
import Paper from '@mui/material/Paper'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import Alert from '@mui/material/Alert'
import Snackbar from '@mui/material/Snackbar'
import { DEMO_USER_TOAST_MESSAGE, isDemoUserRestrictionResponse } from '../utils/demoUserRestriction'
import PageContainer from '../components/PageContainer'

export default function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [code, setCode] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [snackbarOpen, setSnackbarOpen] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState('')
  const [snackbarSeverity, setSnackbarSeverity] = useState('success')

  useEffect(() => {
    const emailParam = searchParams.get('email')
    if (emailParam) {
      setEmail(decodeURIComponent(emailParam))
    } else {
      // If no email param, redirect to signup
      navigate('/signup')
    }
  }, [searchParams, navigate])

  useEffect(() => {
    const state = location.state
    const message = state?.toastMessage || state?.toast?.message
    const severity = state?.toastSeverity || state?.toast?.severity || 'success'
    if (message) {
      setSnackbarMessage(message)
      setSnackbarSeverity(severity)
      setSnackbarOpen(true)
      // Clear the state so the toast doesn't reappear on back/forward
      window.history.replaceState({}, document.title, location.pathname + location.search)
    }
  }, [location])

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') return
    setSnackbarOpen(false)
  }

  const handleChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6) // Only allow digits, max 6
    setCode(value)
    if (error) setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (code.length !== 6) {
      setError('Please enter a 6-digit verification code')
      return
    }
    try {
      const response = await fetch('https://tcgid.io/api/auth/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          code: code,
        }),
      })

      const responseData = await response.json()

      if (response.ok && responseData.success) {
        // 200 response with success - redirect to login with success toast
        navigate('/signin', {
          state: {
            toastMessage: 'Your email has been verified successfully. Please login.',
            toastSeverity: 'success',
          },
        })
      } else if (isDemoUserRestrictionResponse(response.status, responseData)) {
        setSnackbarMessage(DEMO_USER_TOAST_MESSAGE)
        setSnackbarSeverity('error')
        setSnackbarOpen(true)
      } else if (response.status === 400) {
        // 400 response - handle different error messages
        const errorMessage = responseData.data || 'An error occurred'
        
        if (errorMessage === 'Invalid verification code or email') {
          setSnackbarMessage('Invalid verification code or email')
          setSnackbarSeverity('error')
          setSnackbarOpen(true)
        } else if (errorMessage === 'Missing required fields: email, code') {
          setSnackbarMessage('Please complete the form')
          setSnackbarSeverity('error')
          setSnackbarOpen(true)
        } else {
          // Other 400 errors
          setSnackbarMessage(errorMessage)
          setSnackbarSeverity('error')
          setSnackbarOpen(true)
        }
      } else {
        // Any other error response
        setSnackbarMessage('There was an error. Please try again later.')
        setSnackbarSeverity('error')
        setSnackbarOpen(true)
      }
    } catch (error) {
      console.error('Verify email error:', error)
      // Network or other errors
      setSnackbarMessage('There was an error. Please try again later.')
      setSnackbarSeverity('error')
      setSnackbarOpen(true)
    }
  }

  if (!email) {
    return null // Will redirect if no email
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
          Verify Your Email
        </Typography>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: { xs: 2, sm: 3 } }}>
          <Stack spacing={{ xs: 2, sm: 3 }}>
            <Typography 
              variant="body1" 
              align="center" 
              sx={{ 
                mb: 2,
                fontSize: { xs: '0.9rem', sm: '1rem' }
              }}
            >
              Please verify your email by entering the 6-digit code sent to{' '}
              <strong>{email}</strong>
            </Typography>
            
            {error && (
              <Alert severity="error" onClose={() => setError('')}>
                {error}
              </Alert>
            )}

            <TextField
              required
              fullWidth
              id="verificationCode"
              name="verificationCode"
              label="Verification Code"
              value={code}
              onChange={handleChange}
              placeholder="000000"
              inputProps={{
                maxLength: 6,
                style: {
                  textAlign: 'center',
                  fontSize: '24px',
                  letterSpacing: '8px',
                  fontFamily: 'monospace',
                },
              }}
              error={!!error}
            />

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
              disabled={code.length !== 6}
            >
              Verify Email
            </Button>
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

