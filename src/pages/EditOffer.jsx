import React, { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Stack from '@mui/material/Stack'
import Button from '@mui/material/Button'
import OfferForm from '../components/OfferForm'
import PageContainer from '../components/PageContainer'
import { deleteOffer, getOffer, updateOffer } from '../utils/offersApi'

export default function EditOffer() {
  const { offerId } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [offerRecord, setOfferRecord] = useState(null)
  const [loadError, setLoadError] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState(null)
  const [deleteInProgress, setDeleteInProgress] = useState(false)

  const fetchOffer = useCallback(async () => {
    if (!offerId) {
      setNotFound(true)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setLoadError(null)
      setServerError(null)
      const response = await getOffer(offerId)

      if (response?.data) {
        setOfferRecord(response.data)
        setNotFound(false)
      } else {
        setNotFound(true)
      }
    } catch (error) {
      if (error.status === 401) {
        navigate('/signin')
        return
      }
      if (error.status === 404) {
        setNotFound(true)
      } else {
        setLoadError(error.message || 'Failed to load offer.')
      }
    } finally {
      setLoading(false)
    }
  }, [offerId, navigate])

  useEffect(() => {
    fetchOffer()
  }, [fetchOffer])

  const handleSubmit = async (payload) => {
    if (!offerId) return
    setSubmitting(true)
    setServerError(null)
    try {
      await updateOffer(offerId, payload)
      navigate('/offers', {
        replace: true,
        state: {
          snackbar: {
            message: 'Offer updated successfully.',
            severity: 'success'
          }
        }
      })
    } catch (error) {
      setServerError(error.message || 'Failed to update offer.')
      throw error
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!offerId) return
    const confirmed = window.confirm(
      'Delete this offer? This will also remove it from eBay if it still exists.'
    )
    if (!confirmed) return

    try {
      setDeleteInProgress(true)
      await deleteOffer(offerId)
      navigate('/offers', {
        replace: true,
        state: {
          snackbar: {
            message: 'Offer deleted successfully.',
            severity: 'success'
          }
        }
      })
    } catch (error) {
      if (error.status === 401) {
        navigate('/signin')
        return
      }
      setServerError(error.message || 'Failed to delete offer.')
    } finally {
      setDeleteInProgress(false)
    }
  }

  if (loading) {
    return (
      <PageContainer
        maxWidth={900}
        contentSx={{
          minHeight: { xs: '40vh', sm: '60vh' },
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <CircularProgress />
      </PageContainer>
    )
  }

  if (notFound) {
    return (
      <PageContainer maxWidth={900} contentSx={{ gap: { xs: 2, md: 3 } }}>
        <Alert severity="warning" sx={{ mb: 2 }}>
          Offer {offerId ? `(${offerId}) ` : ''}was not found or is no longer available.
        </Alert>
        <Button variant="contained" onClick={() => navigate('/offers')}>
          Back to Offers
        </Button>
      </PageContainer>
    )
  }

  if (loadError) {
    return (
      <PageContainer maxWidth={900} contentSx={{ gap: { xs: 2, md: 3 } }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {loadError}
        </Alert>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <Button variant="contained" onClick={fetchOffer}>
            Try Again
          </Button>
          <Button variant="outlined" onClick={() => navigate('/offers')}>
            Back to Offers
          </Button>
        </Stack>
      </PageContainer>
    )
  }

  return (
    <PageContainer maxWidth={1100} contentSx={{ gap: { xs: 2.5, md: 3 } }}>
      <OfferForm
        offerRecord={offerRecord}
        submitting={submitting}
        serverError={serverError}
        deleteInProgress={deleteInProgress}
        onSubmit={handleSubmit}
        onCancel={() => navigate('/offers')}
        onDelete={handleDelete}
      />
    </PageContainer>
  )
}

