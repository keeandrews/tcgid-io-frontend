import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import FormControl from '@mui/material/FormControl'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import InputLabel from '@mui/material/InputLabel'
import Stack from '@mui/material/Stack'
import Alert from '@mui/material/Alert'
import Snackbar from '@mui/material/Snackbar'
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import CircularProgress from '@mui/material/CircularProgress'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import DeleteIcon from '@mui/icons-material/Delete'
import DragIndicatorIcon from '@mui/icons-material/DragIndicator'
import { styled } from '@mui/material/styles'
import IconButton from '@mui/material/IconButton'
import Grid from '@mui/material/Grid'
import PageContainer from '../components/PageContainer'

const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
})

const UploadArea = styled(Box)(({ theme, isDragOver }) => ({
  border: `2px dashed ${isDragOver ? theme.palette.primary.main : theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(4),
  textAlign: 'center',
  cursor: 'pointer',
  backgroundColor: isDragOver ? theme.palette.action.hover : 'transparent',
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    borderColor: theme.palette.primary.main,
    backgroundColor: theme.palette.action.hover,
  },
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(2),
  },
}))

const ImageItem = styled(Paper)(({ theme, isDragging, isDragOver }) => ({
  position: 'relative',
  padding: theme.spacing(1),
  cursor: isDragging ? 'grabbing' : 'grab',
  opacity: isDragging ? 0.5 : 1,
  transition: 'all 0.2s ease-in-out',
  border: isDragOver ? `2px solid ${theme.palette.primary.main}` : 'none',
  boxShadow: isDragOver ? theme.shadows[6] : theme.shadows[2],
  '&:hover': {
    boxShadow: theme.shadows[4],
  },
}))

const ImagePreview = styled('img')({
  width: '100%',
  height: '150px',
  objectFit: 'cover',
  borderRadius: 4,
  display: 'block',
})

export default function CreateInventory() {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  const [selectedFiles, setSelectedFiles] = useState([])
  const [photosPerListing, setPhotosPerListing] = useState('1')
  const [isDragOver, setIsDragOver] = useState(false)
  const [draggedIndex, setDraggedIndex] = useState(null)
  const [dragOverIndex, setDragOverIndex] = useState(null)
  const [snackbarOpen, setSnackbarOpen] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState('')
  const [snackbarSeverity, setSnackbarSeverity] = useState('success')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [progressModalOpen, setProgressModalOpen] = useState(false)
  const [progressMessage, setProgressMessage] = useState('')
  const [uploadedCount, setUploadedCount] = useState(0)
  const [totalImages, setTotalImages] = useState(0)

  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/signin')
    }
  }, [navigate])

  const validateImageFile = (file) => {
    if (!file) return false
    return file.type.startsWith('image/')
  }

  const handleFileSelect = (files) => {
    if (!files || files.length === 0) return

    const imageFiles = Array.from(files).filter(validateImageFile)
    
    if (imageFiles.length !== files.length) {
      showSnackbar('Some files were not image files and were skipped', 'warning')
    }

    if (imageFiles.length === 0) {
      showSnackbar('Please select valid image files', 'error')
      return
    }

    // Create file objects with preview URLs
    const newFiles = imageFiles.map((file) => ({
      file,
      id: `${file.name}-${Date.now()}-${Math.random()}`,
      preview: URL.createObjectURL(file),
    }))

    setSelectedFiles((prev) => [...prev, ...newFiles])
  }

  const handleFileInputChange = (event) => {
    const files = event.target.files
    if (files && files.length > 0) {
      handleFileSelect(files)
    }
    // Reset input to allow selecting the same files again
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDrop = (event) => {
    event.preventDefault()
    setIsDragOver(false)

    const files = event.dataTransfer.files
    if (files && files.length > 0) {
      handleFileSelect(files)
    }
  }

  const handleDragOver = (event) => {
    event.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (event) => {
    event.preventDefault()
    setIsDragOver(false)
  }

  const handleRemoveFile = (id) => {
    setSelectedFiles((prev) => {
      const fileToRemove = prev.find((f) => f.id === id)
      if (fileToRemove) {
        URL.revokeObjectURL(fileToRemove.preview)
      }
      return prev.filter((f) => f.id !== id)
    })
  }

  const handleRemoveAll = () => {
    selectedFiles.forEach((fileObj) => {
      URL.revokeObjectURL(fileObj.preview)
    })
    setSelectedFiles([])
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Drag and drop for reordering
  const handleDragStart = (index) => {
    setDraggedIndex(index)
    setDragOverIndex(null)
  }

  const handleDragOverItem = (event, index) => {
    event.preventDefault()
    if (draggedIndex === null || draggedIndex === index) {
      setDragOverIndex(null)
      return
    }
    setDragOverIndex(index)
  }

  const handleDragLeaveItem = () => {
    setDragOverIndex(null)
  }

  const handleDropItem = (event, dropIndex) => {
    event.preventDefault()
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null)
      setDragOverIndex(null)
      return
    }

    setSelectedFiles((prev) => {
      const newFiles = [...prev]
      const draggedItem = newFiles[draggedIndex]
      newFiles.splice(draggedIndex, 1)
      newFiles.splice(dropIndex, 0, draggedItem)
      return newFiles
    })
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const handleSubmit = async () => {
    // Validate form
    if (selectedFiles.length === 0) {
      showSnackbar('Please select at least one image file to upload', 'error')
      return
    }

    // Validate that the number of photos is evenly divisible by photos per listing
    const photosPerListingNum = parseInt(photosPerListing, 10)
    if (selectedFiles.length % photosPerListingNum !== 0) {
      showSnackbar(
        `The number of photos (${selectedFiles.length}) must be evenly divisible by the photos per listing (${photosPerListingNum}). Please adjust your selection.`,
        'error'
      )
      return
    }

    setIsSubmitting(false)
    showSnackbar('This functionality is not yet available', 'info')
  }

  const handleReset = () => {
    selectedFiles.forEach((fileObj) => {
      URL.revokeObjectURL(fileObj.preview)
    })
    setSelectedFiles([])
    setPhotosPerListing('1')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      selectedFiles.forEach((fileObj) => {
        URL.revokeObjectURL(fileObj.preview)
      })
    }
  }, [])

  const showSnackbar = (message, severity = 'success') => {
    setSnackbarMessage(message)
    setSnackbarSeverity(severity)
    setSnackbarOpen(true)
  }

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') return
    setSnackbarOpen(false)
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  return (
    <>
      <PageContainer maxWidth={1100} contentSx={{ gap: { xs: 2.5, md: 3 } }}>
        <Typography 
          variant="h4" 
          gutterBottom
          sx={{ 
            mb: { xs: 2, sm: 3 },
            fontSize: { xs: '1.75rem', sm: '2rem', md: '2.125rem' }
          }}
        >
          Create Inventory
        </Typography>

        <Paper 
          elevation={2} 
          sx={{ 
            p: { xs: 2, sm: 3, md: 4 },
            width: '100%'
          }}
        >
          {/* Instructions */}
          <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2" component="div">
            <strong>How to create inventory:</strong>
            <Box component="ol" sx={{ mt: 1, mb: 0, pl: 2 }}>
              <li>Select or drag and drop image files from your device</li>
              <li>Reorder images by dragging them to change the order (optional)</li>
              <li>Select how many photos should be grouped per listing</li>
              <li>Click "Create Inventory" to process your upload</li>
            </Box>
            <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
              The system will automatically group photos according to your settings 
              and initialize eBay listings for each group.
            </Typography>
            <Typography variant="body2" sx={{ mt: 1, fontWeight: 500 }}>
              <strong>Important:</strong> The total uncompressed file size must be under 2GB to be processed.
            </Typography>
          </Typography>
        </Alert>

        <Stack spacing={3}>
          {/* File Upload Section */}
          <Box>
            <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
              Upload Image Files
            </Typography>
            {selectedFiles.length === 0 ? (
              <UploadArea
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                isDragOver={isDragOver}
              >
                <CloudUploadIcon 
                  sx={{ 
                    fontSize: { xs: 48, sm: 64, md: 80 },
                    color: 'text.secondary',
                    mb: 2
                  }} 
                />
                <Typography variant="body1" gutterBottom>
                  Drag and drop image files here, or click to browse
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Only image files are accepted (JPG, PNG, GIF, etc.)
                </Typography>
                <VisuallyHiddenInput
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileInputChange}
                />
              </UploadArea>
            ) : (
              <Box>
                <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                  <Button
                    variant="outlined"
                    startIcon={<CloudUploadIcon />}
                    onClick={() => fileInputRef.current?.click()}
                    size="small"
                  >
                    Add More Images
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={handleRemoveAll}
                    size="small"
                  >
                    Remove All
                  </Button>
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto' }}>
                    {selectedFiles.length} image{selectedFiles.length !== 1 ? 's' : ''} selected
                  </Typography>
                </Stack>
                <VisuallyHiddenInput
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileInputChange}
                />
                <Box
                  sx={{
                    maxHeight: { xs: '400px', sm: '500px', md: '600px' },
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    pr: 1,
                    '&::-webkit-scrollbar': {
                      width: '8px',
                    },
                    '&::-webkit-scrollbar-track': {
                      backgroundColor: 'rgba(0, 0, 0, 0.05)',
                      borderRadius: '4px',
                    },
                    '&::-webkit-scrollbar-thumb': {
                      backgroundColor: 'rgba(0, 0, 0, 0.2)',
                      borderRadius: '4px',
                      '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.3)',
                      },
                    },
                  }}
                >
                  <Grid container spacing={2}>
                    {selectedFiles.map((fileObj, index) => (
                      <Grid item xs={6} sm={4} md={3} key={fileObj.id}>
                        <ImageItem
                          draggable
                          onDragStart={() => handleDragStart(index)}
                          onDragOver={(e) => handleDragOverItem(e, index)}
                          onDragLeave={handleDragLeaveItem}
                          onDrop={(e) => handleDropItem(e, index)}
                          onDragEnd={handleDragEnd}
                          isDragging={draggedIndex === index}
                          isDragOver={dragOverIndex === index}
                        >
                          <Box sx={{ position: 'relative' }}>
                            <ImagePreview
                              src={fileObj.preview}
                              alt={fileObj.file.name}
                              onError={(e) => {
                                e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="150" height="150"><rect fill="%23ddd" width="150" height="150"/></svg>'
                              }}
                            />
                            <Box
                              sx={{
                                position: 'absolute',
                                top: 4,
                                left: 4,
                                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                                color: 'white',
                                borderRadius: '50%',
                                width: 24,
                                height: 24,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.75rem',
                                fontWeight: 'bold',
                              }}
                            >
                              {index + 1}
                            </Box>
                            <IconButton
                              size="small"
                              sx={{
                                position: 'absolute',
                                top: 4,
                                right: 4,
                                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                                color: 'white',
                                '&:hover': {
                                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                },
                              }}
                              onClick={() => handleRemoveFile(fileObj.id)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="caption" noWrap sx={{ display: 'block' }}>
                              {fileObj.file.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {formatFileSize(fileObj.file.size)}
                            </Typography>
                          </Box>
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              mt: 0.5,
                              color: 'text.secondary',
                            }}
                          >
                            <DragIndicatorIcon fontSize="small" />
                            <Typography variant="caption" sx={{ ml: 0.5 }}>
                              Drag to reorder
                            </Typography>
                          </Box>
                        </ImageItem>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              </Box>
            )}
          </Box>

          {/* Photos Per Listing Dropdown */}
          <FormControl fullWidth>
            <InputLabel>Photos Per Listing</InputLabel>
            <Select
              value={photosPerListing}
              label="Photos Per Listing"
              onChange={(e) => setPhotosPerListing(e.target.value)}
            >
              <MenuItem value="1">1 photo</MenuItem>
              <MenuItem value="2">2 photos</MenuItem>
              <MenuItem value="3">3 photos</MenuItem>
              <MenuItem value="4">4 photos</MenuItem>
              <MenuItem value="5">5 photos</MenuItem>
              <MenuItem value="6">6 photos</MenuItem>
              <MenuItem value="7">7 photos</MenuItem>
              <MenuItem value="8">8 photos</MenuItem>
              <MenuItem value="9">9 photos</MenuItem>
              <MenuItem value="10">10 photos</MenuItem>
              <MenuItem value="12">12 photos</MenuItem>
            </Select>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
              Select how many photos should be grouped together for each listing. 
              The total number of photos must be evenly divisible by this number.
            </Typography>
          </FormControl>

          {/* Action Buttons */}
          <Stack 
            direction={{ xs: 'column', sm: 'row' }} 
            spacing={2}
            sx={{ 
              pt: 2,
              justifyContent: 'flex-end'
            }}
          >
            <Button
              variant="outlined"
              onClick={handleReset}
              fullWidth={{ xs: true, sm: false }}
              sx={{ minWidth: { sm: '120px' } }}
            >
              Reset
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSubmit}
              fullWidth={{ xs: true, sm: false }}
              sx={{ minWidth: { sm: '150px' } }}
              disabled={selectedFiles.length === 0 || isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create Inventory'}
            </Button>
          </Stack>
        </Stack>
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

      {/* Progress Modal */}
      <Dialog
        open={progressModalOpen}
        aria-labelledby="progress-dialog-title"
        aria-describedby="progress-dialog-description"
        disableEscapeKeyDown
        onClose={(event, reason) => {
          // Prevent closing during processing
          if (reason === 'backdropClick' || reason === 'escapeKeyDown') {
            return
          }
        }}
        PaperProps={{
          sx: {
            minWidth: { xs: '280px', sm: '400px' },
            borderRadius: 2,
          }
        }}
      >
        <DialogContent>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              py: 3,
            }}
          >
            <CircularProgress size={48} sx={{ mb: 3 }} />
            <Typography
              id="progress-dialog-title"
              variant="h6"
              component="div"
              sx={{
                textAlign: 'center',
                mb: 1,
                fontWeight: 500,
              }}
            >
              {progressMessage}
            </Typography>
            {progressMessage.includes('Uploading') && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ textAlign: 'center' }}
              >
                Please wait while your images are being uploaded...
              </Typography>
            )}
          </Box>
        </DialogContent>
      </Dialog>
    </>
  )
}

