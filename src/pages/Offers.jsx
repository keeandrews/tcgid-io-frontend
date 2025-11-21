import React, { useCallback, useEffect, useMemo, useState } from 'react'
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
import MoreVertIcon from '@mui/icons-material/MoreVert'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import Pagination from '@mui/material/Pagination'
import Switch from '@mui/material/Switch'
import FormControlLabel from '@mui/material/FormControlLabel'
import Tooltip from '@mui/material/Tooltip'
import RefreshIcon from '@mui/icons-material/Refresh'
import SyncIcon from '@mui/icons-material/Sync'
import { fetchOffers, deleteOffer } from '../utils/offersApi'
import PageContainer from '../components/PageContainer'

const PLACEHOLDER_IMAGE =
  'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60"><rect fill="%23ddd" width="60" height="60"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%23999" font-size="10">No Image</text></svg>'

const formatDisplayFormat = (value) => {
  if (!value) return '—'
  if (value === 'FIXED_PRICE') return 'Fixed Price'
  if (value === 'AUCTION') return 'Auction'
  return value
}

const parseMaybeJson = (value) => {
  if (!value) return null
  if (typeof value === 'object') return value
  if (typeof value === 'string') {
    try {
      return JSON.parse(value)
    } catch {
      return null
    }
  }
  return null
}

const normalizeImageUrls = (source) => {
  if (!source) return []
  if (Array.isArray(source)) return source
  if (typeof source === 'string') {
    try {
      const parsed = JSON.parse(source)
      if (Array.isArray(parsed)) {
        return parsed
      }
      return [source]
    } catch {
      return [source]
    }
  }
  return []
}

const getPricingSummary = (offer) => {
  const parsed = parseMaybeJson(offer?.pricing_summary)
  if (parsed) {
    return parsed
  }
  if (offer?.pricing_summary && typeof offer.pricing_summary === 'object') {
    return offer.pricing_summary || {}
  }
  return {}
}

const formatPrice = (offer) => {
  const pricingSummary = getPricingSummary(offer)
  const price =
    pricingSummary.price ||
    pricingSummary.auctionStartPrice ||
    pricingSummary.minimumAdvertisedPrice

  if (!price || !price.value) {
    return '—'
  }

  return `${price.currency || ''} ${price.value}`
}

const formatDate = (value) => {
  if (!value) return '—'
  try {
    return new Date(value).toLocaleString()
  } catch {
    return value
  }
}

const OfferImageThumbnail = ({ imageUrls, title }) => {
  const normalized = normalizeImageUrls(imageUrls)
  const src = normalized[0] || PLACEHOLDER_IMAGE
  return (
    <Box
      component="img"
      src={src}
      alt={title || 'Offer image'}
      sx={{
        width: 56,
        height: 56,
        borderRadius: 1,
        objectFit: 'cover',
        border: '1px solid',
        borderColor: 'divider',
        backgroundColor: 'background.paper'
      }}
    />
  )
}

const OfferRow = React.memo(({ offer, selected, onSelect, onNavigate }) => {
  const regulatoryInfo = useMemo(
    () => parseMaybeJson(offer?.regulatory_info) || offer?.regulatory_info || {},
    [offer]
  )

  const handleSelect = (event) => {
    event.stopPropagation()
    onSelect(offer.id)
  }

  const statusChip = offer.active ? (
    <Chip label="Active" color="success" size="small" />
  ) : (
    <Chip label="Inactive" size="small" />
  )

  return (
    <TableRow
      hover
      onClick={() => onNavigate(offer.id)}
      sx={{
        cursor: 'pointer',
        '& .MuiTableCell-root': {
          py: 1.5
        }
      }}
    >
      <TableCell padding="checkbox">
        <Checkbox checked={selected} onClick={handleSelect} />
      </TableCell>
      <TableCell padding="checkbox">
        <OfferImageThumbnail imageUrls={offer.product_image_urls} title={offer.product_title} />
      </TableCell>
      <TableCell>
        <Typography variant="body2">
          {regulatoryInfo?.ebay_offer_id || '—'}
        </Typography>
      </TableCell>
      <TableCell>
        <Typography variant="body2" noWrap sx={{ maxWidth: 240 }}>
          {offer.product_title || 'Untitled Offer'}
        </Typography>
      </TableCell>
      <TableCell>{formatDisplayFormat(offer.format)}</TableCell>
      <TableCell>{formatPrice(offer)}</TableCell>
      <TableCell>{offer.available_quantity ?? '—'}</TableCell>
      <TableCell>{statusChip}</TableCell>
      <TableCell>{formatDate(offer.updated_at)}</TableCell>
    </TableRow>
  )
})

OfferRow.displayName = 'OfferRow'

export default function Offers() {
  const navigate = useNavigate()
  const location = useLocation()
  const [offers, setOffers] = useState([])
  const [filteredOffers, setFilteredOffers] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [orderBy, setOrderBy] = useState('updated_at')
  const [order, setOrder] = useState('desc')
  const [selectedOfferIds, setSelectedOfferIds] = useState([])
  const [loading, setLoading] = useState(true)
  const [snackbarState, setSnackbarState] = useState({
    open: false,
    message: '',
    severity: 'success'
  })
  const [anchorEl, setAnchorEl] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [includeInactive, setIncludeInactive] = useState(false)
  const [pagination, setPagination] = useState({
    limit: 50,
    offset: 0,
    total: 0,
    previous: null,
    next: null
  })
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/signin')
    }
  }, [navigate])

  const showSnackbar = useCallback((message, severity = 'success') => {
    setSnackbarState({
      open: true,
      message,
      severity
    })
  }, [])

  useEffect(() => {
    if (location.state?.snackbar) {
      const { message, severity } = location.state.snackbar
      showSnackbar(message, severity)
      navigate(location.pathname, {
        replace: true,
        state: { ...location.state, snackbar: undefined }
      })
    }
  }, [location, navigate, showSnackbar])

  const fetchOffersData = useCallback(
    async (limit = pagination.limit, offset = pagination.offset, includeInactiveFlag = includeInactive) => {
      try {
        setLoading(true)
        const response = await fetchOffers({ limit, offset, includeInactive: includeInactiveFlag })
        const records = response?.data?.records || []
        setOffers(records)
        setFilteredOffers(records)
        if (response?.data?.metadata) {
          const meta = response.data.metadata
          setPagination((prev) => ({
            ...prev,
            limit,
            offset,
            total: meta.total || records.length,
            previous: meta.previous,
            next: meta.next
          }))
          setCurrentPage(Math.floor(offset / limit) + 1)
        } else {
          setPagination((prev) => ({
            ...prev,
            limit,
            offset,
            total: records.length,
            previous: null,
            next: null
          }))
          setCurrentPage(1)
        }
        setSelectedOfferIds([])
      } catch (error) {
        if (error.status === 401) {
          navigate('/signin')
          return
        }
        console.error('Error fetching offers:', error)
        showSnackbar(error.message || 'Failed to load offers.', 'error')
        setOffers([])
        setFilteredOffers([])
      } finally {
        setLoading(false)
      }
    },
    [includeInactive, navigate, pagination.limit, pagination.offset, showSnackbar]
  )

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      fetchOffersData(pagination.limit, pagination.offset, includeInactive)
    }
  }, [fetchOffersData, includeInactive, pagination.limit, pagination.offset])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!searchQuery.trim()) {
        setFilteredOffers(offers)
        return
      }

      const query = searchQuery.toLowerCase()
      const filtered = offers.filter((offer) => {
        const title = offer.product_title || ''
        const sku = offer.sku || ''
        const ebayId =
          (parseMaybeJson(offer.regulatory_info) || offer.regulatory_info || {}).ebay_offer_id || ''
        return (
          title.toLowerCase().includes(query) ||
          sku.toLowerCase().includes(query) ||
          String(ebayId).toLowerCase().includes(query)
        )
      })
      setFilteredOffers(filtered)
    }, 250)

    return () => clearTimeout(timer)
  }, [offers, searchQuery])

  const sortedOffers = useMemo(() => {
    const comparator = (a, b) => {
      const getValue = (offer, key) => {
        switch (key) {
          case 'price':
            return Number(
              getPricingSummary(offer)?.price?.value ||
                getPricingSummary(offer)?.auctionStartPrice?.value ||
                0
            )
          case 'ebay_offer_id':
            return (
              (parseMaybeJson(offer.regulatory_info) || offer.regulatory_info || {})
                .ebay_offer_id || ''
            )
              .toString()
              .toLowerCase()
          case 'available_quantity':
            return Number(offer.available_quantity ?? 0)
          case 'product_title':
            return (offer.product_title || '').toLowerCase()
          case 'format':
            return (offer.format || '').toLowerCase()
          case 'active':
            return offer.active ? 1 : 0
          case 'updated_at':
          default:
            return new Date(offer.updated_at || offer.created_at || 0).getTime()
        }
      }

      const aValue = getValue(a, orderBy)
      const bValue = getValue(b, orderBy)

      if (aValue < bValue) return order === 'asc' ? -1 : 1
      if (aValue > bValue) return order === 'asc' ? 1 : -1
      return 0
    }

    return [...filteredOffers].sort(comparator)
  }, [filteredOffers, order, orderBy])

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc'
    setOrder(isAsc ? 'desc' : 'asc')
    setOrderBy(property)
  }

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      const ids = sortedOffers.map((offer) => offer.id).filter(Boolean)
      setSelectedOfferIds(ids)
    } else {
      setSelectedOfferIds([])
    }
  }

  const handleSelect = (offerId) => {
    setSelectedOfferIds((prev) => {
      if (prev.includes(offerId)) {
        return prev.filter((id) => id !== offerId)
      }
      return [...prev, offerId]
    })
  }

  const handleActionsClick = (event) => {
    if (selectedOfferIds.length === 0) {
      showSnackbar('Select at least one offer to continue.', 'warning')
      return
    }
    setAnchorEl(event.currentTarget)
  }

  const handleActionsClose = () => setAnchorEl(null)

  const handlePublishSelected = () => {
    handleActionsClose()
    showSnackbar('Publish Offers is not yet enabled.', 'info')
  }

  const handleDeleteSelected = async () => {
    handleActionsClose()
    if (!selectedOfferIds.length) {
      showSnackbar('Select at least one offer to delete.', 'warning')
      return
    }

    const confirmed = window.confirm(
      `Delete ${selectedOfferIds.length} offer${selectedOfferIds.length > 1 ? 's' : ''}? This cannot be undone.`
    )
    if (!confirmed) return

    try {
      setDeleting(true)
      const results = await Promise.allSettled(selectedOfferIds.map((id) => deleteOffer(id)))
      const failed = results.filter((result) => result.status === 'rejected')
      const succeeded = selectedOfferIds.length - failed.length

      if (failed.length === 0) {
        showSnackbar(
          `Deleted ${succeeded} offer${succeeded === 1 ? '' : 's'}.`,
          'success'
        )
      } else {
        showSnackbar(
          `Deleted ${succeeded} offer${succeeded === 1 ? '' : 's'}. ${failed.length} failed.`,
          'warning'
        )
      }

      setSelectedOfferIds([])
      fetchOffersData(pagination.limit, pagination.offset, includeInactive)
    } catch (error) {
      if (error.status === 401) {
        navigate('/signin')
        return
      }
      showSnackbar(error.message || 'Failed to delete offers.', 'error')
    } finally {
      setDeleting(false)
    }
  }

  const handleRefresh = () => {
    fetchOffersData(pagination.limit, pagination.offset, includeInactive)
  }

  const handleIncludeInactiveChange = (_, checked) => {
    setIncludeInactive(checked)
    setPagination((prev) => ({ ...prev, offset: 0 }))
  }

  const handlePageChange = (_, page) => {
    const newOffset = (page - 1) * pagination.limit
    setCurrentPage(page)
    setPagination((prev) => ({ ...prev, offset: newOffset }))
    setSelectedOfferIds([])
  }

  const handleCloseSnackbar = (_, reason) => {
    if (reason === 'clickaway') return
    setSnackbarState((prev) => ({ ...prev, open: false }))
  }

  const handleNavigateToOffer = (offerId) => {
    if (!offerId) return
    navigate(`/offers/${offerId}`)
  }

  const columns = [
    { id: 'select', label: '', sortable: false },
    { id: 'image', label: '', sortable: false },
    { id: 'ebay_offer_id', label: 'eBay Offer ID', sortable: true },
    { id: 'product_title', label: 'Title', sortable: true },
    { id: 'format', label: 'Format', sortable: true },
    { id: 'price', label: 'Price', sortable: true },
    { id: 'available_quantity', label: 'Available', sortable: true },
    { id: 'active', label: 'Status', sortable: true },
    { id: 'updated_at', label: 'Updated', sortable: true }
  ]

  const totalPages = Math.ceil((pagination.total || 0) / pagination.limit) || 1

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: { xs: '40vh', sm: '60vh' }
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
          Offer Management
        </Typography>

        <Paper
        elevation={2}
        sx={{
          p: { xs: 1.5, sm: 2, md: 2.5 },
          mb: { xs: 2, sm: 3 },
          borderRadius: 2
        }}
      >
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          alignItems={{ xs: 'stretch', md: 'center' }}
        >
          <TextField
            placeholder="Search by title, SKU, or eBay offer ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            size="small"
            sx={{ flexGrow: 1 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
              endAdornment: searchQuery ? (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearchQuery('')}>
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ) : null
            }}
          />
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1}
            flexWrap="wrap"
            justifyContent={{ xs: 'stretch', sm: 'flex-start' }}
            sx={{ width: { xs: '100%', md: 'auto' } }}
          >
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={handleRefresh}
              sx={{ width: { xs: '100%', sm: 'auto' } }}
            >
              Refresh
            </Button>
            <Tooltip title="Syncing offers from eBay is not yet enabled." sx={{ width: { xs: '100%', sm: 'auto' } }}>
              <Box component="span" sx={{ width: '100%' }}>
                <Button
                  variant="outlined"
                  color="secondary"
                  startIcon={<SyncIcon />}
                  disabled
                  sx={{ width: { xs: '100%', sm: 'auto' } }}
                >
                  Sync eBay Offers
                </Button>
              </Box>
            </Tooltip>
            <Button
              variant="contained"
              color="primary"
              startIcon={<MoreVertIcon />}
              onClick={handleActionsClick}
              disabled={selectedOfferIds.length === 0 || deleting}
              sx={{ width: { xs: '100%', sm: 'auto' } }}
            >
              Actions
            </Button>
            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleActionsClose}>
              <MenuItem onClick={handlePublishSelected}>Publish Offers</MenuItem>
              <MenuItem
                onClick={handleDeleteSelected}
                sx={{ color: 'error.main' }}
                disabled={deleting}
              >
                Delete Offers
              </MenuItem>
            </Menu>
          </Stack>
        </Stack>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          justifyContent="space-between"
          sx={{ mt: 2 }}
        >
          <FormControlLabel
            control={
              <Switch checked={includeInactive} onChange={handleIncludeInactiveChange} />
            }
            label="Include inactive offers"
          />
          {selectedOfferIds.length > 0 && (
            <Chip
              label={`${selectedOfferIds.length} selected`}
              color="primary"
              onDelete={() => setSelectedOfferIds([])}
              size="small"
            />
          )}
        </Stack>
      </Paper>

        {sortedOffers.length === 0 ? (
          <Paper
            elevation={3}
            sx={{
              p: { xs: 3, sm: 4 },
              textAlign: 'center',
              borderRadius: 2
            }}
          >
            <Typography variant="h6" gutterBottom>
              {searchQuery ? 'No offers match your search' : 'No offers found'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {searchQuery
                ? 'Try adjusting your search terms.'
                : 'Create offers from eligible inventory items to see them here.'}
            </Typography>
          </Paper>
        ) : (
          <TableContainer
            component={Paper}
            elevation={3}
            sx={{
              borderRadius: 2
            }}
          >
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      indeterminate={
                        selectedOfferIds.length > 0 &&
                        selectedOfferIds.length < sortedOffers.length
                      }
                      checked={
                        sortedOffers.length > 0 &&
                        selectedOfferIds.length === sortedOffers.length
                      }
                      onChange={handleSelectAll}
                    />
                  </TableCell>
                  {columns.slice(1).map((column) => (
                    <TableCell
                      key={column.id}
                      sx={{
                        fontWeight: 600,
                        minWidth: column.id === 'product_title' ? 200 : 110
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
                {sortedOffers.map((offer) => (
                  <OfferRow
                    key={offer.id}
                    offer={offer}
                    selected={selectedOfferIds.includes(offer.id)}
                    onSelect={handleSelect}
                    onNavigate={handleNavigateToOffer}
                  />
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {sortedOffers.length > 0 && pagination.total > pagination.limit && (
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
            <Typography variant="body2" color="text.secondary">
              Showing {pagination.offset + 1} -{' '}
              {Math.min(pagination.offset + pagination.limit, pagination.total)} of {pagination.total}
            </Typography>
            <Pagination
              count={totalPages}
              page={currentPage}
              onChange={handlePageChange}
              color="primary"
              size="small"
              showFirstButton
              showLastButton
            />
          </Box>
        )}
      </PageContainer>

      <Snackbar
        open={snackbarState.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity={snackbarState.severity} onClose={handleCloseSnackbar} sx={{ width: '100%' }}>
          {snackbarState.message}
        </Alert>
      </Snackbar>
    </>
  )
}

