import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
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

export default function SignUp() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  })

  const [errors, setErrors] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  })

  const [snackbarOpen, setSnackbarOpen] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState('')
  const [snackbarSeverity, setSnackbarSeverity] = useState('success')

  const showToast = (message, severity = 'success') => {
    setSnackbarMessage(message)
    setSnackbarSeverity(severity)
    setSnackbarOpen(true)
  }

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') return
    setSnackbarOpen(false)
  }

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: '',
      })
    }

    // Validate email in real-time
    if (name === 'email' && value) {
      if (!validateEmail(value)) {
        setErrors({
          ...errors,
          email: 'Please enter a valid email address',
        })
      } else {
        setErrors({
          ...errors,
          email: '',
        })
      }
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

    if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (validateForm()) {
      try {
        const response = await fetch('https://tcgid.io/api/auth/signup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            first_name: formData.firstName,
            last_name: formData.lastName,
            email: formData.email,
            password: formData.password,
          }),
        })
        let responseData = null
        try {
          responseData = await response.json()
        } catch (e) {
          responseData = null
        }

        if (response.status === 201 && responseData?.success) {
          // Redirect to verify email page with email parameter and show success toast
          navigate(`/verify?email=${encodeURIComponent(formData.email)}`, {
            state: {
              toastMessage: 'Account created successfully. Please check your email for a verification code.',
              toastSeverity: 'success',
            },
          })
        } else if (isDemoUserRestrictionResponse(response.status, responseData)) {
          showToast(DEMO_USER_TOAST_MESSAGE, 'error')
        } else if (response.status === 400) {
          const errorMessage = responseData?.data || 'Invalid request. Please check your details and try again.'
          
          // Check for specific error messages
          if (errorMessage.includes('User already exists')) {
            showToast('An account with this email already exists.', 'error')
          } else if (errorMessage.includes('password')) {
            showToast(errorMessage, 'error')
          } else {
            showToast(errorMessage, 'error')
          }
        } else if (response.status === 500) {
          showToast('Internal server error. Please try again later.', 'error')
        } else {
          const message =
            (responseData && typeof responseData.data === 'string' && responseData.data) ||
            'Unexpected error occurred'
          showToast(message, 'error')
        }
      } catch (error) {
        showToast('Network error. Please try again.', 'error')
      }
    }
  }

  const isFormValid = () => {
    return (
      formData.firstName &&
      formData.lastName &&
      formData.email &&
      formData.password &&
      formData.confirmPassword &&
      validateEmail(formData.email) &&
      formData.password === formData.confirmPassword &&
      !errors.email &&
      !errors.password &&
      !errors.confirmPassword
    )
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
          Sign Up
        </Typography>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: { xs: 2, sm: 3 } }}>
          <Stack spacing={{ xs: 2, sm: 3 }}>
            <TextField
              required
              fullWidth
              id="firstName"
              name="firstName"
              label="First Name"
              value={formData.firstName}
              onChange={handleChange}
              autoComplete="given-name"
            />
            <TextField
              required
              fullWidth
              id="lastName"
              name="lastName"
              label="Last Name"
              value={formData.lastName}
              onChange={handleChange}
              autoComplete="family-name"
            />
            <TextField
              required
              fullWidth
              id="email"
              name="email"
              label="Email Address"
              type="email"
              value={formData.email}
              onChange={handleChange}
              autoComplete="email"
              error={!!errors.email}
              helperText={errors.email}
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
              autoComplete="new-password"
            />
            <TextField
              required
              fullWidth
              id="confirmPassword"
              name="confirmPassword"
              label="Confirm Password"
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
              Complete Sign Up
            </Button>
            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Typography 
                variant="body2"
                sx={{
                  fontSize: { xs: '0.8rem', sm: '0.875rem' }
                }}
              >
                Already have an account?{' '}
                <Link component={RouterLink} to="/signin" underline="hover">
                  Sign in
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

