import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
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

export default function ForgotPassword() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [snackbarOpen, setSnackbarOpen] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState('')
  const [snackbarSeverity, setSnackbarSeverity] = useState('success')

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') return
    setSnackbarOpen(false)
  }

  const handleChange = (e) => {
    setEmail(e.target.value)
    if (error) setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email) {
      setError('Please enter your email address')
      return
    }
    if (!validateEmail(email)) {
      setError('Please enter a valid email address')
      return
    }
    try {
      const response = await fetch('https://tcgid.io/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
        }),
      })

      let responseData = null
      try {
        responseData = await response.json()
      } catch (e) {
        responseData = null
      }

      if (response.status === 200 && responseData?.success === true) {
        // 200 response with success: true - show green toast
        const message = responseData.data?.message || 'If an account with that email exists, a reset code has been sent.'
        setSnackbarMessage(message)
        setSnackbarSeverity('success')
        setSnackbarOpen(true)
        setEmail('') // Clear the email field after successful submission
        
        // Navigate to reset password page with email
        setTimeout(() => {
          navigate(`/reset?email=${encodeURIComponent(email)}`)
        }, 2000)
      } else if (isDemoUserRestrictionResponse(response.status, responseData)) {
        setSnackbarMessage(DEMO_USER_TOAST_MESSAGE)
        setSnackbarSeverity('error')
        setSnackbarOpen(true)
      } else if (response.status === 403) {
        // User not confirmed
        const errorMessage = responseData?.data || 'User is not confirmed. Please verify your email before resetting the password.'
        setSnackbarMessage(errorMessage)
        setSnackbarSeverity('error')
        setSnackbarOpen(true)
      } else if (response.status === 429) {
        // Too many requests
        const errorMessage = responseData?.data || 'Too many password reset attempts. Please try again later.'
        setSnackbarMessage(errorMessage)
        setSnackbarSeverity('error')
        setSnackbarOpen(true)
      } else if (response.status === 400) {
        // 400 response - show red toast with error message
        const errorMessage = responseData?.data || 'An error occurred'
        setSnackbarMessage(errorMessage)
        setSnackbarSeverity('error')
        setSnackbarOpen(true)
      } else {
        // Any other error response - show red toast with generic message
        setSnackbarMessage('There was an error. Please try again later.')
        setSnackbarSeverity('error')
        setSnackbarOpen(true)
      }
    } catch (error) {
      console.error('Forgot password error:', error)
      // Network or other errors
      setSnackbarMessage('There was an error. Please try again later.')
      setSnackbarSeverity('error')
      setSnackbarOpen(true)
    }
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
          Forgot Password
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
              Enter your email address and we'll send you a link to reset your password.
            </Typography>

            {error && (
              <Alert severity="error" onClose={() => setError('')}>
                {error}
              </Alert>
            )}

            <TextField
              required
              fullWidth
              id="email"
              name="email"
              label="Email Address"
              type="email"
              value={email}
              onChange={handleChange}
              autoComplete="email"
              error={!!error}
              helperText={error}
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
              disabled={!email}
            >
              Send Reset Link
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

