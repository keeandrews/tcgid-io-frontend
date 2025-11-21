import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TableSortLabel from '@mui/material/TableSortLabel'
import Checkbox from '@mui/material/Checkbox'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import SearchIcon from '@mui/icons-material/Search'
import ClearIcon from '@mui/icons-material/Clear'
import CloseIcon from '@mui/icons-material/Close'
import EditIcon from '@mui/icons-material/Edit'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import Stack from '@mui/material/Stack'
import AddIcon from '@mui/icons-material/Add'
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera'
import UploadFileIcon from '@mui/icons-material/UploadFile'
import SyncIcon from '@mui/icons-material/Sync'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardActionArea from '@mui/material/CardActionArea'
import Grid from '@mui/material/Grid'
import Pagination from '@mui/material/Pagination'
import { fetchInventoryItems, deleteInventoryItem, syncInventory as syncInventoryJob } from '../utils/inventoryApi'
import PageContainer from '../components/PageContainer'

const PLACEHOLDER_IMAGE =
  'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60"><rect fill="%23ddd" width="60" height="60"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%23999" font-size="10">No Image</text></svg>'
const IMAGE_POLL_INTERVAL_MS = 4000

// Helper function to get the appropriate thumbnail size
const getThumbnailUrl = (imageUrl, size = '300') => {
  if (!imageUrl) return null

  if (/\/master\.[a-zA-Z0-9]+$/.test(imageUrl)) {
    return imageUrl.replace(/\/master(\.[a-zA-Z0-9]+)$/i, `/${size}$1`)
  }

  return imageUrl
}

const normalizeGameValue = (value) => {
  if (value == null) {
    return ''
  }

  if (typeof value === 'string') {
    return value.trim()
  }

  if (Array.isArray(value)) {
    for (const entry of value) {
      const normalized = normalizeGameValue(entry)
      if (normalized) {
        return normalized
      }
    }
    return ''
  }

  if (typeof value === 'object') {
    const candidate =
      value.localizedValue ??
      value.localized_value ??
      value.value ??
      value.name ??
      value.label ??
      value.text
    return candidate ? normalizeGameValue(candidate) : ''
  }

  return String(value).trim()
}

const parseAspectData = (source) => {
  if (!source) {
    return null
  }

  if (typeof source === 'string') {
    try {
      return JSON.parse(source)
    } catch {
      return null
    }
  }

  return source
}

const getGameFromRow = (row = {}) => {
  const directCandidates = [
    row.game,
    row.product_game,
    row.game_name,
    row.card_game,
    row.product?.game,
    row.product?.gameName,
    row.product_details?.game
  ]

  for (const candidate of directCandidates) {
    const normalized = normalizeGameValue(candidate)
    if (normalized) {
      return normalized
    }
  }

  const aspectSource = row.product?.aspects ?? row.product_aspects ?? row.product_aspects_json
  const parsedAspects = parseAspectData(aspectSource)

  if (!parsedAspects) {
    return ''
  }

  if (Array.isArray(parsedAspects)) {
    const match = parsedAspects.find((aspect) => {
      const name = aspect?.localizedAspectName || aspect?.name || aspect?.aspectName
      return typeof name === 'string' && name.toLowerCase() === 'game'
    })
    if (match) {
      return normalizeGameValue(match.values || match.value)
    }
  } else if (typeof parsedAspects === 'object') {
    for (const [key, value] of Object.entries(parsedAspects)) {
      if (typeof key === 'string' && key.toLowerCase() === 'game') {
        return normalizeGameValue(value)
      }
    }
  }

  return ''
}

const InventoryImageThumbnail = ({ imageUrls, title, fallbackImage, onHostedImageReady }) => {
  const normalizedImageUrls = React.useMemo(() => {
    if (!imageUrls) {
      return []
    }
    if (Array.isArray(imageUrls)) {
      return imageUrls
    }
    if (typeof imageUrls === 'string') {
      return [imageUrls]
    }
    return []
  }, [imageUrls])

  const baseUrl = React.useMemo(
    () => getThumbnailUrl(normalizedImageUrls[0], '300'),
    [normalizedImageUrls]
  )
  const [cacheKey, setCacheKey] = React.useState(Date.now())
  const [status, setStatus] = React.useState(baseUrl ? 'loading' : 'error')
  const retryRef = React.useRef(null)
  const [useFallback, setUseFallback] = React.useState(false)

  React.useEffect(() => {
    setCacheKey(Date.now())
    setStatus(baseUrl ? 'loading' : 'error')
    setUseFallback(false)
    return () => {
      if (retryRef.current) {
        clearTimeout(retryRef.current)
      }
    }
  }, [baseUrl])

  const scheduleRetry = React.useCallback(() => {
    if (retryRef.current) {
      clearTimeout(retryRef.current)
    }
    retryRef.current = setTimeout(() => {
      setCacheKey(Date.now())
      if (baseUrl) {
        setStatus('loading')
      }
    }, IMAGE_POLL_INTERVAL_MS)
  }, [baseUrl])

  const handleLoad = React.useCallback(() => {
    setStatus('loaded')
    setUseFallback(false)
    if (retryRef.current) {
      clearTimeout(retryRef.current)
    }
    if (baseUrl) {
      onHostedImageReady?.()
    }
  }, [baseUrl, onHostedImageReady])

  const handleError = React.useCallback(() => {
    if (!baseUrl) {
      setStatus('error')
      setUseFallback(Boolean(fallbackImage))
      return
    }
    setStatus('polling')
    setUseFallback(Boolean(fallbackImage))
    scheduleRetry()
  }, [baseUrl, fallbackImage, scheduleRetry])

  const withCacheBust = (url) => {
    if (!url) return null
    return `${url}${url.includes('?') ? '&' : '?'}cb=${cacheKey}`
  }

  const resolvedSrc = (() => {
    if (useFallback && fallbackImage) {
      return fallbackImage
    }
    if (baseUrl) {
      return withCacheBust(baseUrl)
    }
    if (fallbackImage) {
      return fallbackImage
    }
    return PLACEHOLDER_IMAGE
  })()

  return (
    <Box sx={{ position: 'relative', width: { xs: 50, sm: 60 }, height: { xs: 50, sm: 60 } }}>
      <Box
        component="img"
        src={resolvedSrc}
        alt={title}
        onLoad={handleLoad}
        onError={handleError}
        sx={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          borderRadius: 1,
          border: '1px solid',
          borderColor: 'divider'
        }}
      />
      {status !== 'loaded' && baseUrl && !useFallback && (
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'rgba(0,0,0,0.1)',
            borderRadius: 1
          }}
        >
          <CircularProgress size={20} />
        </Box>
      )}
    </Box>
  )
}

// Memoized table row component for performance
const InventoryRow = React.memo(({ row, selectionKey, selected, handleClick, handleEdit, fallbackImage, onHostedImageReady }) => {
  const title = row.product_title || '-'
  const gameLabel = getGameFromRow(row)
  
  const formatDate = (dateString) => {
    if (!dateString) return '-'
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch (error) {
      return '-'
    }
  }

  const normalizedRowImages = React.useMemo(() => {
    const source = row.product_image_urls
    if (!source) {
      return []
    }
    if (Array.isArray(source)) {
      return source
    }
    if (typeof source === 'string') {
      try {
        const parsed = JSON.parse(source)
        return Array.isArray(parsed) ? parsed : []
      } catch {
        return [source]
      }
    }
    return []
  }, [row.product_image_urls])

  React.useEffect(() => {
    const urls = normalizedRowImages
    urls.slice(1).forEach((url) => {
      const sized = getThumbnailUrl(url, '300')
      if (!sized) return
      const img = new Image()
      img.src = `${sized}?prefetch=${Date.now()}`
    })
  }, [normalizedRowImages])

  return (
    <TableRow
      hover
      role="checkbox"
      aria-checked={selected}
      selected={selected}
      sx={{ 
        cursor: 'pointer',
        '& .MuiTableCell-root': {
          py: { xs: 1, sm: 1.5 }
        }
      }}
    >
      <TableCell padding="checkbox" onClick={() => handleClick(selectionKey)}>
        <Checkbox checked={selected} />
      </TableCell>
      <TableCell padding="checkbox">
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation()
            handleEdit(selectionKey)
          }}
          color="primary"
          sx={{
            '&:hover': {
              backgroundColor: 'primary.light',
              color: 'primary.contrastText'
            }
          }}
        >
          <EditIcon fontSize="small" />
        </IconButton>
      </TableCell>
      <TableCell onClick={() => handleClick(selectionKey)}>
        <InventoryImageThumbnail
          imageUrls={normalizedRowImages}
          title={title}
          fallbackImage={fallbackImage}
          onHostedImageReady={onHostedImageReady}
        />
      </TableCell>
      <TableCell onClick={() => handleClick(selectionKey)}>
        <Typography 
          variant="body2" 
          noWrap 
          sx={{ 
            maxWidth: { xs: 150, sm: 250, md: 300 },
            fontSize: { xs: '0.8rem', sm: '0.875rem' }
          }}
        >
          {title}
        </Typography>
      </TableCell>
      <TableCell onClick={() => handleClick(selectionKey)}>
        <Typography 
          variant="body2" 
          noWrap 
          sx={{ 
            maxWidth: { xs: 140, sm: 180, md: 220 },
            fontSize: { xs: '0.8rem', sm: '0.875rem' },
            color: 'text.secondary'
          }}
        >
          {gameLabel || '-'}
        </Typography>
      </TableCell>
      <TableCell 
        onClick={() => handleClick(selectionKey)}
        sx={{ 
          display: { xs: 'none', md: 'table-cell' }
        }}
      >
        <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
          {formatDate(row.created_at)}
        </Typography>
      </TableCell>
      <TableCell onClick={() => handleClick(selectionKey)}>
        <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
          {formatDate(row.updated_at)}
        </Typography>
      </TableCell>
    </TableRow>
  )
})

InventoryRow.displayName = 'InventoryRow'

export default function Inventory() {
  const navigate = useNavigate()
  const location = useLocation()
  const [inventoryData, setInventoryData] = useState([])
  const [filteredData, setFilteredData] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [orderBy, setOrderBy] = useState('created_at')
  const [order, setOrder] = useState('desc')
  const [selectedSkus, setSelectedSkus] = useState([])
  const [snackbarOpen, setSnackbarOpen] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState('')
  const [snackbarSeverity, setSnackbarSeverity] = useState('success')
  const [loading, setLoading] = useState(true)
  const [anchorEl, setAnchorEl] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [fallbackImages, setFallbackImages] = useState({})
  const [pagination, setPagination] = useState({
    limit: 50,
    offset: 0,
    total: 0,
    previous: null,
    next: null
  })
  const [currentPage, setCurrentPage] = useState(1)

  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/signin')
    }
  }, [navigate])

  const showSnackbar = useCallback((message, severity = 'success') => {
    setSnackbarMessage(message)
    setSnackbarSeverity(severity)
    setSnackbarOpen(true)
  }, [])

  useEffect(() => {
    if (location.state?.snackbar) {
      const { message, severity } = location.state.snackbar
      showSnackbar(message, severity)
      navigate(location.pathname, { replace: true, state: { ...location.state, snackbar: undefined } })
    }
    if (location.state?.fallbackImages) {
      setFallbackImages(location.state.fallbackImages)
      navigate(location.pathname, { replace: true, state: { ...location.state, fallbackImages: undefined } })
    }
  }, [location, navigate, showSnackbar])

  // Fetch inventory from API
  const fetchInventory = useCallback(async (limit = 50, offset = 0) => {
    try {
      setLoading(true)
      const response = await fetchInventoryItems({ limit, offset })

      if (response?.data) {
        setInventoryData(response.data.records || [])
        setFilteredData(response.data.records || [])

        if (response.data.metadata) {
          setPagination({
            limit,
            offset,
            total: response.data.metadata.total || 0,
            previous: response.data.metadata.previous || null,
            next: response.data.metadata.next || null
          })
          setCurrentPage(Math.floor(offset / limit) + 1)
        }
      } else {
        setInventoryData([])
        setFilteredData([])
      }
    } catch (error) {
      if (error.status === 401) {
        navigate('/signin')
        return
      }
      console.error('Error fetching inventory:', error)
      showSnackbar(error.message || 'Failed to load inventory items. Please try again.', 'error')
      setInventoryData([])
      setFilteredData([])
    } finally {
      setLoading(false)
    }
  }, [navigate, showSnackbar])

  // Fetch inventory on page load and when pagination changes
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      fetchInventory(pagination.limit, pagination.offset)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.limit, pagination.offset])

  // Filter and search
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (!searchQuery.trim()) {
        setFilteredData(inventoryData)
        return
      }

      const query = searchQuery.toLowerCase()
      const filtered = inventoryData.filter((item) => {
        const title = item.product_title || ''
        const sku = item.sku || ''
        const game = getGameFromRow(item) || ''
        return (
          title.toLowerCase().includes(query) ||
          sku.toLowerCase().includes(query) ||
          game.toLowerCase().includes(query)
        )
      })
      setFilteredData(filtered)
    }, 300)

    return () => clearTimeout(debounceTimer)
  }, [searchQuery, inventoryData])

  // Sorting
  const sortedData = useMemo(() => {
    const comparator = (a, b) => {
      let aValue, bValue

      if (orderBy === 'title') {
        aValue = a.product_title || ''
        bValue = b.product_title || ''
      } else if (orderBy === 'game') {
        aValue = getGameFromRow(a) || ''
        bValue = getGameFromRow(b) || ''
      } else if (orderBy === 'sku') {
        aValue = a.sku || ''
        bValue = b.sku || ''
      } else if (orderBy === 'created_at' || orderBy === 'updated_at') {
        aValue = new Date(a[orderBy]).getTime()
        bValue = new Date(b[orderBy]).getTime()
      } else {
        aValue = a[orderBy]
        bValue = b[orderBy]
      }

      // Handle string values
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase()
      }
      if (typeof bValue === 'string') {
        bValue = bValue.toLowerCase()
      }

      if (bValue < aValue) {
        return order === 'asc' ? 1 : -1
      }
      if (bValue > aValue) {
        return order === 'asc' ? -1 : 1
      }
      return 0
    }

    return [...filteredData].sort(comparator)
  }, [filteredData, order, orderBy])

  const handleRequestSort = useCallback((property) => {
    setOrder((prevOrder) => {
      const isAsc = orderBy === property && prevOrder === 'asc'
      return isAsc ? 'desc' : 'asc'
    })
    setOrderBy(property)
  }, [orderBy])

  const handleSelectAllClick = useCallback((event) => {
    if (event.target.checked) {
      const newSelected = sortedData
        .map((item) => item.sku || item.id)
        .filter(Boolean)
      setSelectedSkus(newSelected)
      return
    }
    setSelectedSkus([])
  }, [sortedData])

  const handleClick = useCallback((sku) => {
    if (!sku) return
    setSelectedSkus((prevSelected) => {
      if (prevSelected.includes(sku)) {
        return prevSelected.filter((item) => item !== sku)
      }
      return [...prevSelected, sku]
    })
  }, [])

  const handleEdit = (sku) => {
    if (!sku) {
      showSnackbar('This item is missing a SKU and cannot be edited.', 'warning')
      return
    }
    navigate(`/inventory/${sku}`)
  }

  const handleCreateNewItem = async () => {
    navigate('/inventory/new')
  }

  const isSelected = useCallback(
    (sku) => (sku ? selectedSkus.includes(sku) : false),
    [selectedSkus]
  )

  const handleActionsClick = (event) => {
    if (selectedSkus.length === 0) {
      showSnackbar('Please select at least one item', 'warning')
      return
    }
    setAnchorEl(event.currentTarget)
  }

  const handleActionsClose = () => {
    setAnchorEl(null)
  }

  const handleMatchItems = () => {
    handleActionsClose()
    showSnackbar('This feature is not currently enabled', 'info')
  }

  const handleAssessConditions = () => {
    handleActionsClose()
    showSnackbar('This feature is not currently enabled', 'info')
  }

  const handleDeleteItems = async () => {
    handleActionsClose()
    if (selectedSkus.length === 0) {
      showSnackbar('Select at least one item to delete.', 'warning')
      return
    }

    const confirmed = window.confirm(
      `Delete ${selectedSkus.length} item${selectedSkus.length > 1 ? 's' : ''}? This cannot be undone.`
    )

    if (!confirmed) {
      return
    }

    try {
      setDeleting(true)
      const results = await Promise.allSettled(
        selectedSkus.map((sku) => deleteInventoryItem(sku))
      )

      const failed = results.filter((result) => result.status === 'rejected')
      const succeeded = selectedSkus.length - failed.length

      if (failed.length === 0) {
        showSnackbar(`Deleted ${succeeded} item${succeeded > 1 ? 's' : ''}.`, 'success')
      } else {
        showSnackbar(
          `Deleted ${succeeded} item${succeeded === 1 ? '' : 's'}. ${failed.length} failed.`,
          'warning'
        )
      }

      setSelectedSkus([])
      await fetchInventory(pagination.limit, pagination.offset)
    } catch (error) {
      if (error.status === 401) {
        navigate('/signin')
        return
      }
      showSnackbar(error.message || 'Failed to delete inventory items.', 'error')
    } finally {
      setDeleting(false)
    }
  }

  const handleSyncInventory = async () => {
    try {
      setSyncing(true)
      const response = await syncInventoryJob()
      const { sync_id: syncId, status } = response?.data || {}
      if (syncId) {
        showSnackbar(`Sync started successfully! Job ID: ${syncId}`, 'success')
      } else {
        showSnackbar('Sync started successfully.', 'success')
      }
      if (status) {
        console.info('Sync status:', status)
      }
      setTimeout(() => {
        fetchInventory(pagination.limit, pagination.offset)
      }, 5000)
    } catch (error) {
      if (error.status === 401) {
        navigate('/signin')
        return
      }
      if (error.status === 429) {
        showSnackbar(
          'A sync job was recently created. Please wait 15 minutes before starting a new sync.',
          'warning'
        )
      } else {
        console.error('Error triggering sync:', error)
        showSnackbar(error.message || 'Failed to start sync job. Please try again later.', 'error')
      }
    } finally {
      setSyncing(false)
    }
  }

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') return
    setSnackbarOpen(false)
  }

  const handlePageChange = (event, page) => {
    const newOffset = (page - 1) * pagination.limit
    setCurrentPage(page)
    setPagination(prev => ({ ...prev, offset: newOffset }))
    setSelectedSkus([]) // Clear selection when changing pages
  }

  const columns = [
    { id: 'checkbox', label: '', sortable: false, width: 48 },
    { id: 'edit', label: '', sortable: false, width: 48 },
    { id: 'image', label: 'Image', sortable: false, width: 80 },
    { id: 'title', label: 'Title', sortable: true, width: 260 },
    { id: 'game', label: 'Game', sortable: true, width: 160 },
    { id: 'created_at', label: 'Created', sortable: true, width: 150, hideOnMobile: true },
    { id: 'updated_at', label: 'Updated', sortable: true, width: 150 }
  ]

  const handleHostedImageReady = useCallback((sku) => {
    if (!sku) return
    setFallbackImages((prev) => {
      if (!prev[sku]) {
        return prev
      }
      const next = { ...prev }
      delete next[sku]
      return next
    })
  }, [])

  // Calculate total pages for pagination
  const totalPages = Math.ceil(pagination.total / pagination.limit)

  if (loading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: { xs: '40vh', sm: '60vh' },
          py: { xs: 2, sm: 3, md: 4 }
        }}
      >
        <CircularProgress />
      </Box>
    )
  }

  return (
    <>
      <PageContainer maxWidth={1400} contentSx={{ gap: { xs: 2.5, md: 3.5 } }}>
        <Typography 
        variant="h4" 
        gutterBottom
        sx={{
          fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2.125rem' },
          mb: { xs: 2, sm: 3 }
        }}
        >
          Inventory Management
        </Typography>

        {/* Action Cards */}
        <Grid container spacing={{ xs: 2, sm: 2, md: 3 }} sx={{ mb: { xs: 2, sm: 3 } }}>
        <Grid item xs={12} sm={6} md={4}>
          <Card 
            elevation={2}
            sx={{ 
              height: '100%',
              transition: 'all 0.2s',
              '&:hover': {
                elevation: 4,
                transform: 'translateY(-2px)',
              }
            }}
          >
            <CardActionArea
              onClick={handleCreateNewItem}
              sx={{ 
                height: '100%',
                p: { xs: 2, sm: 2.5, md: 3 }
              }}
            >
              <CardContent sx={{ textAlign: 'center', p: 0 }}>
                <Box
                  sx={{
                    width: { xs: 50, sm: 60 },
                    height: { xs: 50, sm: 60 },
                    borderRadius: '50%',
                    bgcolor: 'primary.light',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto',
                    mb: 2
                  }}
                >
                  <AddIcon sx={{ fontSize: { xs: 28, sm: 32 }, color: 'primary.main' }} />
                </Box>
                <Typography 
                  variant="h6" 
                  gutterBottom
                  sx={{
                    fontSize: { xs: '1rem', sm: '1.1rem' },
                    fontWeight: 600
                  }}
                >
                  Create New Item
                </Typography>
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{
                    fontSize: { xs: '0.8rem', sm: '0.875rem' }
                  }}
                >
                  Manually create a single inventory item
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card 
            elevation={2}
            sx={{ 
              height: '100%',
              transition: 'all 0.2s',
              '&:hover': {
                elevation: 4,
                transform: 'translateY(-2px)',
              }
            }}
          >
            <CardActionArea
              onClick={() => navigate('/create-inventory')}
              sx={{ 
                height: '100%',
                p: { xs: 2, sm: 2.5, md: 3 }
              }}
            >
              <CardContent sx={{ textAlign: 'center', p: 0 }}>
                <Box
                  sx={{
                    width: { xs: 50, sm: 60 },
                    height: { xs: 50, sm: 60 },
                    borderRadius: '50%',
                    bgcolor: 'secondary.light',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto',
                    mb: 2
                  }}
                >
                  <PhotoCameraIcon sx={{ fontSize: { xs: 28, sm: 32 }, color: 'secondary.main' }} />
                </Box>
                <Typography 
                  variant="h6" 
                  gutterBottom
                  sx={{
                    fontSize: { xs: '1rem', sm: '1.1rem' },
                    fontWeight: 600
                  }}
                >
                  Create from Photos
                </Typography>
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{
                    fontSize: { xs: '0.8rem', sm: '0.875rem' }
                  }}
                >
                  Upload photos to automatically create items
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card 
            elevation={2}
            sx={{ 
              height: '100%',
              transition: 'all 0.2s',
              '&:hover': {
                elevation: 4,
                transform: 'translateY(-2px)',
              }
            }}
          >
            <CardActionArea
              onClick={() => navigate('/create-batch')}
              sx={{ 
                height: '100%',
                p: { xs: 2, sm: 2.5, md: 3 }
              }}
            >
              <CardContent sx={{ textAlign: 'center', p: 0 }}>
                <Box
                  sx={{
                    width: { xs: 50, sm: 60 },
                    height: { xs: 50, sm: 60 },
                    borderRadius: '50%',
                    bgcolor: 'success.light',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto',
                    mb: 2
                  }}
                >
                  <UploadFileIcon sx={{ fontSize: { xs: 28, sm: 32 }, color: 'success.main' }} />
                </Box>
                <Typography 
                  variant="h6" 
                  gutterBottom
                  sx={{
                    fontSize: { xs: '1rem', sm: '1.1rem' },
                    fontWeight: 600
                  }}
                >
                  Import Batch
                </Typography>
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{
                    fontSize: { xs: '0.8rem', sm: '0.875rem' }
                  }}
                >
                  Upload a file to create multiple items
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid>
      </Grid>

      {/* Toolbar */}
      <Paper 
        elevation={2} 
        sx={{ 
          p: { xs: 1.5, sm: 2, md: 2.5 }, 
          mb: { xs: 2, sm: 3 },
          borderRadius: 2
        }}
      >
        <Stack 
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          alignItems={{ xs: 'stretch', sm: 'center' }}
        >
          <TextField
            placeholder="Search by title, SKU, or game..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            size="small"
            sx={{ 
              flexGrow: 1,
              '& .MuiInputBase-root': {
                fontSize: { xs: '0.9rem', sm: '1rem' }
              }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
              endAdornment: searchQuery && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearchQuery('')}>
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <Button
            variant="contained"
            color="primary"
            startIcon={<MoreVertIcon />}
            onClick={handleActionsClick}
            disabled={selectedSkus.length === 0 || deleting}
            size="small"
            sx={{
              fontSize: { xs: '0.85rem', sm: '0.875rem' },
              minWidth: { xs: '100%', sm: '120px' }
            }}
          >
            Actions
          </Button>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<SyncIcon />}
            onClick={handleSyncInventory}
            disabled={syncing}
            size="small"
            sx={{
              fontSize: { xs: '0.85rem', sm: '0.875rem' },
              minWidth: { xs: '100%', sm: '140px' }
            }}
          >
            {syncing ? 'Syncing...' : 'Sync eBay Inventory'}
          </Button>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleActionsClose}
          >
            <MenuItem onClick={handleMatchItems}>Match Items</MenuItem>
            <MenuItem onClick={handleAssessConditions}>Assess Conditions</MenuItem>
            <MenuItem
              onClick={handleDeleteItems}
              sx={{ color: 'error.main' }}
              disabled={deleting}
            >
              Delete Items
            </MenuItem>
          </Menu>
        </Stack>
        {selectedSkus.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Chip 
              label={`${selectedSkus.length} item${selectedSkus.length > 1 ? 's' : ''} selected`} 
              color="primary"
              onDelete={() => setSelectedSkus([])}
              deleteIcon={<CloseIcon />}
              size="small"
              sx={{
                fontSize: { xs: '0.75rem', sm: '0.8125rem' }
              }}
            />
          </Box>
        )}
      </Paper>

      {/* Table */}
      {sortedData.length === 0 ? (
        <Paper 
          elevation={3} 
          sx={{ 
            p: { xs: 3, sm: 4, md: 5 }, 
            textAlign: 'center',
            borderRadius: 2
          }}
        >
          <Typography 
            variant="h6" 
            gutterBottom
            sx={{
              fontSize: { xs: '1.1rem', sm: '1.25rem' }
            }}
          >
            {searchQuery ? 'No items match your search' : 'No inventory items found'}
          </Typography>
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{
              fontSize: { xs: '0.85rem', sm: '0.875rem' }
            }}
          >
            {searchQuery ? 'Try adjusting your search terms' : 'Create your first inventory item to get started'}
          </Typography>
        </Paper>
      ) : (
        <TableContainer 
          component={Paper} 
          elevation={3}
          sx={{ 
            borderRadius: 2,
            overflowX: 'auto'
          }}
        >
          <Table 
            size="small"
            sx={{
              minWidth: { xs: 500, sm: 650 },
            }}
          >
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={selectedSkus.length > 0 && selectedSkus.length < sortedData.length}
                    checked={sortedData.length > 0 && selectedSkus.length === sortedData.length}
                    onChange={handleSelectAllClick}
                  />
                </TableCell>
                {columns.slice(1).map((column) => (
                  <TableCell
                    key={column.id}
                    sx={{ 
                      fontWeight: 'bold', 
                      minWidth: column.width,
                      display: column.hideOnMobile ? { xs: 'none', md: 'table-cell' } : 'table-cell',
                      fontSize: { xs: '0.8rem', sm: '0.875rem' }
                    }}
                  >
                    {column.sortable ? (
                      <TableSortLabel
                        active={orderBy === column.id}
                        direction={orderBy === column.id ? order : 'asc'}
                        onClick={() => handleRequestSort(column.id)}
                      >
                        {column.label}
                      </TableSortLabel>
                    ) : (
                      column.label
                    )}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
                {sortedData.map((row) => {
                  const rowSelectionKey = row.sku || row.id
                  return (
                    <InventoryRow
                      key={rowSelectionKey}
                      row={row}
                      selectionKey={rowSelectionKey}
                      selected={isSelected(rowSelectionKey)}
                      handleClick={handleClick}
                      handleEdit={handleEdit}
                      fallbackImage={fallbackImages[rowSelectionKey]?.[0]}
                      onHostedImageReady={() => handleHostedImageReady(rowSelectionKey)}
                    />
                  )
                })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Pagination */}
        {sortedData.length > 0 && pagination.total > pagination.limit && (
          <Box 
            sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center',
              mt: { xs: 2, sm: 3 },
              gap: 2,
              flexWrap: 'wrap'
            }}
          >
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
            >
              Showing {pagination.offset + 1} - {Math.min(pagination.offset + pagination.limit, pagination.total)} of {pagination.total}
            </Typography>
            <Pagination
              count={totalPages}
              page={currentPage}
              onChange={handlePageChange}
              color="primary"
              size="small"
              showFirstButton
              showLastButton
              sx={{
                '& .MuiPaginationItem-root': {
                  fontSize: { xs: '0.75rem', sm: '0.875rem' }
                }
              }}
            />
          </Box>
        )}
      </PageContainer>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbarSeverity} 
          sx={{ 
            width: '100%',
            fontSize: { xs: '0.85rem', sm: '0.875rem' }
          }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  )
}
