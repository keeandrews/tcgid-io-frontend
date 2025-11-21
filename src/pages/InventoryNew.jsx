import React, { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Alert from '@mui/material/Alert'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import LinearProgress from '@mui/material/LinearProgress'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import InventoryForm from '../components/InventoryForm'
import { createInventoryItem } from '../utils/inventoryApi'

const InventoryNew = () => {
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState(null)
  const [pendingSku, setPendingSku] = useState(null)
  const [progressState, setProgressState] = useState({
    open: false,
    stage: 'idle',
    uploaded: 0,
    total: 0,
    message: ''
  })
  const formRef = useRef(null)

  const handleSubmit = async (payload) => {
    setSubmitting(true)
    setServerError(null)
    setProgressState({
      open: true,
      stage: 'creating',
      uploaded: 0,
      total: 0,
      message: ''
    })
    let activeSku = pendingSku
    try {
      if (!activeSku) {
        const response = await createInventoryItem(payload)
        activeSku = response?.data?.sku

        if (!activeSku) {
          throw new Error('Inventory item created but no SKU was returned.')
        }

        setPendingSku(activeSku)
      }

      let fallbackPreviewData = []

      if (formRef.current?.uploadPendingImages) {
        await formRef.current.uploadPendingImages(activeSku, {
          onStart: (total) => {
            setProgressState(prev => ({
              ...prev,
              stage: total > 0 ? 'uploading' : 'redirecting',
              uploaded: 0,
              total
            }))
          },
          onProgress: (uploaded, total) => {
            setProgressState(prev => ({
              ...prev,
              stage: total > 0 ? 'uploading' : prev.stage,
              uploaded,
              total
            }))
          },
          onError: (error) => {
            setProgressState(prev => ({
              ...prev,
              stage: 'error',
              message: error.message || 'Failed to upload inventory photos.'
            }))
          },
          onComplete: () => {
            setProgressState(prev => ({
              ...prev,
              stage: 'redirecting',
              uploaded: prev.total || prev.uploaded,
              message: ''
            }))
          }
        })

        if (formRef.current?.getLocalPreviewData) {
          fallbackPreviewData = await formRef.current.getLocalPreviewData()
        }
      } else {
        setProgressState(prev => ({
          ...prev,
          stage: 'redirecting'
        }))
      }

      setPendingSku(null)

      navigate('/inventory', {
        replace: true,
        state: {
          snackbar: {
            message: activeSku
              ? `Inventory item ${activeSku} created successfully.`
              : 'Inventory item created successfully.',
            severity: 'success'
          },
          fallbackImages:
            activeSku && fallbackPreviewData.length
              ? { [activeSku]: fallbackPreviewData }
              : undefined
        }
      })
    } catch (error) {
      const message = activeSku
        ? `${error.message || 'Failed to upload inventory photos.'} Inventory item ${activeSku} was created successfully. Submit again to retry the uploads, or edit the item later from the inventory page.`
        : error.message || 'Failed to create inventory item.'
      setServerError(message)
      setProgressState(prev => ({
        ...prev,
        stage: 'error',
        message
      }))
      throw error
    } finally {
      setSubmitting(false)
    }
  }

  const handleCloseProgress = (_, reason) => {
    if (progressState.stage !== 'error' && progressState.stage !== 'idle') {
      return
    }
    if (reason === 'backdropClick') {
      return
    }
    setProgressState(prev => ({ ...prev, open: false }))
  }

  const renderProgressMessage = () => {
    switch (progressState.stage) {
      case 'creating':
        return 'Creating inventory item...'
      case 'uploading':
        return progressState.total > 0
          ? `Uploading images (${progressState.uploaded}/${progressState.total})`
          : 'Uploading images...'
      case 'redirecting':
        return 'Finishing up...'
      case 'error':
        return 'Something went wrong.'
      default:
        return ''
    }
  }

  return (
    <>
      <PageContainer maxWidth={1100} contentSx={{ gap: { xs: 2.5, md: 3 } }}>
        {pendingSku && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Inventory item {pendingSku} has been created. Uploading your photos now — you can safely retry if something fails without creating a duplicate item.
          </Alert>
        )}
        <InventoryForm
          ref={formRef}
          mode="create"
          submitting={submitting}
          serverError={serverError}
          onSubmit={handleSubmit}
          onCancel={() => navigate('/inventory')}
        />
      </PageContainer>

      <Dialog
        open={progressState.open}
        onClose={handleCloseProgress}
        disableEscapeKeyDown={progressState.stage !== 'error'}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Inventory Progress</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ py: 1 }}>
            <Typography variant="body1" align="center">
              {renderProgressMessage()}
            </Typography>
            {progressState.stage === 'uploading' && (
              <>
                <LinearProgress
                  variant={
                    progressState.total > 0 ? 'determinate' : 'indeterminate'
                  }
                  value={
                    progressState.total > 0
                      ? (progressState.uploaded / progressState.total) * 100
                      : undefined
                  }
                />
                {progressState.total > 0 && (
                  <Typography variant="caption" align="center">
                    {progressState.uploaded}/{progressState.total} images uploaded
                  </Typography>
                )}
              </>
            )}
            {progressState.stage === 'creating' && <LinearProgress />}
            {progressState.stage === 'redirecting' && <LinearProgress />}
            {progressState.stage === 'error' && (
              <Alert severity="error">
                {progressState.message ||
                  'Failed to create inventory item. Please try again.'}
              </Alert>
            )}
          </Stack>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default InventoryNew

