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
import LinearProgress from '@mui/material/LinearProgress'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import DeleteIcon from '@mui/icons-material/Delete'
import { styled } from '@mui/material/styles'

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

const UploadArea = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isDragOver',
})(({ theme, isDragOver }) => ({
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

export default function CreateBatch() {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  const [selectedFile, setSelectedFile] = useState(null)
  const [photosPerListing, setPhotosPerListing] = useState('1')
  const [isDragOver, setIsDragOver] = useState(false)
  const [snackbarOpen, setSnackbarOpen] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState('')
  const [snackbarSeverity, setSnackbarSeverity] = useState('success')
  const [isUploading, setIsUploading] = useState(false)
  const [progressModalOpen, setProgressModalOpen] = useState(false)
  const [progressMessage, setProgressMessage] = useState('')
  const [uploadProgress, setUploadProgress] = useState(0)

  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/signin')
    }
  }, [navigate])

  const validateZipFile = (file) => {
    if (!file) return false
    const fileName = file.name.toLowerCase()
    return fileName.endsWith('.zip')
  }

  const handleFileSelect = (file) => {
    if (!file) return

    if (!validateZipFile(file)) {
      showSnackbar('Please select a valid .zip file', 'error')
      return
    }

    setSelectedFile(file)
  }

  const handleFileInputChange = (event) => {
    const file = event.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDrop = (event) => {
    event.preventDefault()
    setIsDragOver(false)

    const file = event.dataTransfer.files[0]
    if (file) {
      handleFileSelect(file)
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

  const handleRemoveFile = () => {
    setSelectedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async () => {
    // Validate form
    if (!selectedFile) {
      showSnackbar('Please select a .zip file to upload', 'error')
      return
    }

    setIsUploading(false)
    showSnackbar('This functionality is not yet available', 'info')
  }

  const handleReset = () => {
    setSelectedFile(null)
    setPhotosPerListing('1')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

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
      <PageContainer maxWidth={960} contentSx={{ gap: { xs: 2.5, md: 3 } }}>
        <Typography 
          variant="h4" 
          gutterBottom
          sx={{ 
            mb: { xs: 2, sm: 3 },
            fontSize: { xs: '1.75rem', sm: '2rem', md: '2.125rem' }
          }}
        >
          Create Inventory Batch
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
            <strong>How to create a batch:</strong>
            <Box component="ol" sx={{ mt: 1, mb: 0, pl: 2 }}>
              <li>Upload a .zip file containing all photos for your listings</li>
              <li>Select how many photos should be grouped per listing</li>
              <li>Click "Create Batch" to process your upload</li>
            </Box>
            <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
              The system will automatically unzip your file, group photos according to your settings, 
              and initialize eBay listings for each group.
            </Typography>
            <Typography variant="body2" sx={{ mt: 1, fontWeight: 500 }}>
              <strong>Important:</strong> The uncompressed file size must be under 2GB to be processed.
            </Typography>
          </Typography>
        </Alert>

        <Stack spacing={3}>
          {/* File Upload Section */}
          <Box>
            <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
              Upload Zip File
            </Typography>
            {!selectedFile ? (
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
                  Drag and drop a .zip file here, or click to browse
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Only .zip files are accepted
                </Typography>
                <VisuallyHiddenInput
                  ref={fileInputRef}
                  type="file"
                  accept=".zip"
                  onChange={handleFileInputChange}
                />
              </UploadArea>
            ) : (
              <Paper 
                elevation={1} 
                sx={{ 
                  p: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 2
                }}
              >
                <Box sx={{ flex: 1, minWidth: { xs: '100%', sm: 'auto' } }}>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {selectedFile.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {formatFileSize(selectedFile.size)}
                  </Typography>
                </Box>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={handleRemoveFile}
                  size="small"
                >
                  Remove
                </Button>
              </Paper>
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
              Select how many photos should be grouped together for each listing
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
              sx={{ 
                minWidth: { sm: '120px' },
                width: { xs: '100%', sm: 'auto' }
              }}
            >
              Reset
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSubmit}
              sx={{ 
                minWidth: { sm: '150px' },
                width: { xs: '100%', sm: 'auto' }
              }}
              disabled={!selectedFile || isUploading}
            >
              {isUploading ? 'Uploading...' : 'Create Batch'}
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
                mb: 2,
                fontWeight: 500,
              }}
            >
              {progressMessage}
            </Typography>
            {progressMessage.includes('Uploading') && (
              <>
                <Box sx={{ width: '100%', mb: 2 }}>
                  <LinearProgress 
                    variant="determinate" 
                    value={uploadProgress} 
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ textAlign: 'center' }}
                >
                  {uploadProgress}% complete
                </Typography>
              </>
            )}
            {!progressMessage.includes('Uploading') && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ textAlign: 'center' }}
              >
                Please wait...
              </Typography>
            )}
          </Box>
        </DialogContent>
      </Dialog>
    </>
  )
}

