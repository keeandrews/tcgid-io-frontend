import React, { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
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

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    code: '',
    password: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState({
    code: '',
    password: '',
    confirmPassword: '',
  })
  const [snackbarOpen, setSnackbarOpen] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState('')
  const [snackbarSeverity, setSnackbarSeverity] = useState('success')
  const [email, setEmail] = useState('')

  useEffect(() => {
    const emailParam = searchParams.get('email')
    if (emailParam) {
      setEmail(decodeURIComponent(emailParam))
    } else {
      // If no email param, redirect to forgot password page
      navigate('/forgot-password')
    }
  }, [searchParams, navigate])

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') return
    setSnackbarOpen(false)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    
    // For code field, only allow digits and limit to 6 characters
    if (name === 'code') {
      const digitsOnly = value.replace(/\D/g, '').slice(0, 6)
      setFormData({
        ...formData,
        [name]: digitsOnly,
      })
    } else {
      setFormData({
        ...formData,
        [name]: value,
      })
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: '',
      })
    }

    // Validate password matching in real-time
    if (name === 'confirmPassword' && value) {
      if (value !== formData.password) {
        setErrors({
          ...errors,
          confirmPassword: 'Passwords do not match',
        })
      } else {
        setErrors({
          ...errors,
          confirmPassword: '',
        })
      }
    }

    // Also check password match when password field changes
    if (name === 'password' && formData.confirmPassword) {
      if (value !== formData.confirmPassword) {
        setErrors({
          ...errors,
          confirmPassword: 'Passwords do not match',
        })
      } else {
        setErrors({
          ...errors,
          confirmPassword: '',
        })
      }
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.code) {
      newErrors.code = 'Verification code is required'
    } else if (formData.code.length !== 6) {
      newErrors.code = 'Code must be 6 digits'
    }

    if (!formData.password) {
      newErrors.password = 'Password is required'
    }

    if (formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) {
      return
    }

    try {
      const response = await fetch('https://tcgid.io/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          code: formData.code,
          password: formData.password,
        }),
      })

      let responseData = null
      try {
        responseData = await response.json()
      } catch (e) {
        responseData = null
      }

      if (response.status === 200 && responseData?.success === true) {
        // 200 response with success: true - redirect to signin with green toast
        navigate('/signin', {
          state: {
            toastMessage: 'Password has been reset successfully. Please login with your new password.',
            toastSeverity: 'success',
          },
        })
      } else if (isDemoUserRestrictionResponse(response.status, responseData)) {
        setSnackbarMessage(DEMO_USER_TOAST_MESSAGE)
        setSnackbarSeverity('error')
        setSnackbarOpen(true)
      } else if (response.status === 400) {
        // 400 response - show specific error message
        const errorMessage = responseData?.data || 'Invalid request. Please check your details and try again.'
        if (errorMessage.includes('Invalid reset code')) {
          setSnackbarMessage('Invalid reset code. Please check the code and try again.')
        } else if (errorMessage.includes('expired')) {
          setSnackbarMessage('Reset code has expired. Please request a new one.')
        } else if (errorMessage.includes('password')) {
          setSnackbarMessage(errorMessage)
        } else {
          setSnackbarMessage(errorMessage)
        }
        setSnackbarSeverity('error')
        setSnackbarOpen(true)
      } else {
        // Any other error response - show red toast about trying again later
        setSnackbarMessage('There was an error. Please try again later.')
        setSnackbarSeverity('error')
        setSnackbarOpen(true)
      }
    } catch (error) {
      console.error('Reset password error:', error)
      // Network or other errors
      setSnackbarMessage('There was an error. Please try again later.')
      setSnackbarSeverity('error')
      setSnackbarOpen(true)
    }
  }

  const isFormValid = () => {
    return (
      formData.code &&
      formData.code.length === 6 &&
      formData.password &&
      formData.confirmPassword &&
      formData.password === formData.confirmPassword &&
      !errors.code &&
      !errors.password &&
      !errors.confirmPassword
    )
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
          Reset Password
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
              Please enter the 6-digit code sent to <strong>{email}</strong> and your new password.
            </Typography>

            <TextField
              required
              fullWidth
              id="code"
              name="code"
              label="Verification Code"
              value={formData.code}
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
              error={!!errors.code}
              helperText={errors.code}
            />

            <TextField
              required
              fullWidth
              id="password"
              name="password"
              label="New Password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              autoComplete="new-password"
              error={!!errors.password}
              helperText={errors.password}
            />

            <TextField
              required
              fullWidth
              id="confirmPassword"
              name="confirmPassword"
              label="Confirm New Password"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              autoComplete="new-password"
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword}
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
              disabled={!isFormValid()}
            >
              Reset Password
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

