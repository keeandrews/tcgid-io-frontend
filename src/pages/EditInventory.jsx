import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import Snackbar from '@mui/material/Snackbar'
import CircularProgress from '@mui/material/CircularProgress'
import InventoryForm from '../components/InventoryForm'
import PageContainer from '../components/PageContainer'
import { deleteInventoryItem, getInventoryItem, updateInventoryItem } from '../utils/inventoryApi'
import { createOffer } from '../utils/offersApi'

const FEATURE_BUTTON_BASE_SX = {
  borderRadius: '999px',
  textTransform: 'none',
  fontWeight: 600,
  fontSize: { xs: '0.95rem', sm: '1rem' },
  px: { xs: 3, sm: 4 },
  py: 1.25,
  letterSpacing: 0.2,
  boxShadow: '0 10px 20px rgba(15, 23, 42, 0.2)',
  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  '&:hover': {
    transform: 'translateY(-1px)',
    boxShadow: '0 15px 30px rgba(15, 23, 42, 0.25)'
  }
}

const parseAspectSource = (source) => {
  if (!source) {
    return {}
  }

  let workingSource = source

  if (typeof workingSource === 'string') {
    try {
      workingSource = JSON.parse(workingSource)
    } catch {
      return {}
    }
  }

  if (Array.isArray(workingSource)) {
    return workingSource.reduce((acc, item) => {
      if (item && item.localizedAspectName && item.values) {
        acc[item.localizedAspectName] = item.values
      }
      return acc
    }, {})
  }

  if (typeof workingSource === 'object') {
    return workingSource
  }

  return {}
}

const mapRecordToFormValues = (record = {}) => {
  const availabilityQuantity =
    record.availability?.shipToLocationAvailability?.quantity ??
    record.quantity ??
    record.available_quantity

  const packageData = record.packageWeightAndSize || record.package_weight_and_size || {}
  const dimensions = packageData.dimensions || record.dimensions || {}
  const weight = packageData.weight || record.weight || {}

  return {
    locale: record.locale || 'en_US',
    condition: record.condition || '',
    conditionDescription: record.conditionDescription || record.condition_description || '',
    quantity: availabilityQuantity ?? 1,
    productTitle: record.product_title || record.title || '',
    productDescription: record.product_description || record.description || '',
    productBrand: record.product_brand || record.brand || '',
    packageLength: dimensions.length ?? record.package_length ?? '',
    packageWidth: dimensions.width ?? record.package_width ?? '',
    packageHeight: dimensions.height ?? record.package_height ?? '',
    packageDimensionUnit: dimensions.unit || record.package_dimension_unit || 'INCH',
    packageWeightValue: weight.value ?? record.package_weight_value ?? '',
    packageWeightUnit: weight.unit || record.package_weight_unit || 'POUND'
  }
}

const normalizeAspectValue = (entry) => {
  if (entry == null) {
    return ''
  }
  if (typeof entry === 'string') {
    return entry
  }
  if (typeof entry === 'number' || typeof entry === 'boolean') {
    return String(entry)
  }
  if (typeof entry === 'object') {
    return (
      entry.localizedValue ||
      entry.localized_value ||
      entry.value ||
      entry.name ||
      ''
    )
  }
  return ''
}

const mapRecordToAspectValues = (record = {}) => {
  const aspectSource =
    record.product?.aspects ||
    record.product_aspects ||
    record.product_aspects_json

  const parsed = parseAspectSource(aspectSource)
  const aspectEntries = {}

  Object.entries(parsed).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      const cleaned = value
        .map(normalizeAspectValue)
        .filter(Boolean)
      if (cleaned.length) {
        aspectEntries[key] = cleaned
      }
    } else {
      const normalized = normalizeAspectValue(value)
      if (normalized) {
        aspectEntries[key] = normalized
      }
    }
  })

  return aspectEntries
}

const extractImageUrls = (record = {}) => {
  if (!record) {
    return []
  }

  if (Array.isArray(record.product_image_urls)) {
    return record.product_image_urls
  }

  if (typeof record.product_image_urls === 'string') {
    try {
      const parsed = JSON.parse(record.product_image_urls)
      if (Array.isArray(parsed)) {
        return parsed
      }
    } catch {
      // ignore malformed JSON
    }
  }

  if (Array.isArray(record.product?.imageUrls)) {
    return record.product.imageUrls
  }

  if (Array.isArray(record.product_image_urls_json)) {
    return record.product_image_urls_json
  }

  return []
}

const EditInventory = () => {
  const { sku } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState(null)
  const [loadError, setLoadError] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [initialValues, setInitialValues] = useState(null)
  const [initialAspectValues, setInitialAspectValues] = useState({})
  const [initialImageUrls, setInitialImageUrls] = useState([])
  const [inventoryRecord, setInventoryRecord] = useState(null)
  const [creatingOffer, setCreatingOffer] = useState(false)
  const [deletingItem, setDeletingItem] = useState(false)
  const [featureToast, setFeatureToast] = useState({
    open: false,
    message: ''
  })

  const fetchItem = useCallback(async () => {
    if (!sku) {
      setNotFound(true)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setServerError(null)
      setLoadError(null)
      const response = await getInventoryItem(sku)

      if (response?.data) {
        setInventoryRecord(response.data)
        setInitialValues(mapRecordToFormValues(response.data))
        setInitialAspectValues(mapRecordToAspectValues(response.data))
        setInitialImageUrls(extractImageUrls(response.data))
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
        setLoadError(error.message || 'Failed to load inventory item.')
      }
    } finally {
      setLoading(false)
    }
  }, [navigate, sku])

  useEffect(() => {
    fetchItem()
  }, [fetchItem])

  const handleFeatureClick = (label) => {
    setFeatureToast({
      open: true,
      message: `${label} is not yet enabled.`
    })
  }

  const handleCloseFeatureToast = () => {
    setFeatureToast({
      open: false,
      message: ''
    })
  }

  const handleSubmit = async (payload) => {
    setSubmitting(true)
    setServerError(null)
    try {
      await updateInventoryItem(sku, payload)
      navigate('/inventory', {
        replace: true,
        state: {
          snackbar: {
            message: 'Inventory item updated successfully.',
            severity: 'success'
          }
        }
      })
    } catch (error) {
      setServerError(error.message || 'Failed to update inventory item.')
      throw error
    } finally {
      setSubmitting(false)
    }
  }

  const normalizeContentLanguage = useCallback((value) => {
    if (!value || typeof value !== 'string') {
      return 'en-US'
    }
    return value.replace('_', '-')
  }, [])

  const derivedOfferPayload = useMemo(() => {
    if (!inventoryRecord?.sku) {
      return null
    }

    const quantity =
      inventoryRecord.quantity ??
      inventoryRecord.available_quantity ??
      inventoryRecord.availability?.shipToLocationAvailability?.quantity ??
      inventoryRecord.availability?.ship_to_location_availability?.quantity

    const payload = {
      sku: inventoryRecord.sku,
      marketplaceId: inventoryRecord.marketplace_id || 'EBAY_US',
      format: 'FIXED_PRICE',
      includeCatalogProductDetails: true,
      listingDescription:
        inventoryRecord.product_description || inventoryRecord.productDescription || undefined,
      categoryId: inventoryRecord.category_id || undefined,
      merchantLocationKey: inventoryRecord.merchant_location_key || undefined,
      availableQuantity: typeof quantity === 'number' ? quantity : undefined,
      contentLanguage: normalizeContentLanguage(
        inventoryRecord.content_language ||
          inventoryRecord.contentLanguage ||
          inventoryRecord.locale ||
          inventoryRecord.locale_id
      )
    }

    if (!payload.listingDescription) {
      delete payload.listingDescription
    }
    if (!payload.categoryId) {
      delete payload.categoryId
    }
    if (!payload.merchantLocationKey) {
      delete payload.merchantLocationKey
    }
    if (payload.availableQuantity == null) {
      delete payload.availableQuantity
    }

    return payload
  }, [inventoryRecord, normalizeContentLanguage])

  const handleCreateOffer = async () => {
    if (!derivedOfferPayload) {
      setServerError('Unable to create an offer because this inventory item is missing a SKU.')
      return
    }

    const confirmed = window.confirm(
      'Create a new eBay offer for this inventory item? You can complete the details on the offers page.'
    )
    if (!confirmed) return

    try {
      setCreatingOffer(true)
      const response = await createOffer(derivedOfferPayload)
      const offerRecord = response?.data?.record
      const offerId =
        offerRecord?.id ||
        offerRecord?.regulatory_info?.ebay_offer_id ||
        response?.data?.ebay?.offerId

      navigate('/offers', {
        replace: false,
        state: {
          snackbar: {
            message: offerId
              ? `Offer ${offerId} created for SKU ${derivedOfferPayload.sku}.`
              : `Offer created for SKU ${derivedOfferPayload.sku}.`,
            severity: 'success'
          }
        }
      })
    } catch (error) {
      if (error.status === 401) {
        navigate('/signin')
        return
      }
      setServerError(
        (error.payload && (error.payload.data || error.payload.message)) ||
          error.message ||
          'Failed to create offer.'
      )
    } finally {
      setCreatingOffer(false)
    }
  }

  const handleDeleteInventory = async () => {
    if (!sku) return
    const confirmed = window.confirm(
      'Delete this inventory item? This cannot be undone and will remove it from future offer creation.'
    )
    if (!confirmed) return

    try {
      setDeletingItem(true)
      await deleteInventoryItem(sku)
      navigate('/inventory', {
        replace: true,
        state: {
          snackbar: {
            message: `Inventory item ${sku} deleted.`,
            severity: 'success'
          }
        }
      })
    } catch (error) {
      setServerError(error.message || 'Failed to delete inventory item.')
    } finally {
      setDeletingItem(false)
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
          Inventory item{sku ? ` (${sku})` : ''} was not found or is no longer active.
        </Alert>
        <Button variant="contained" onClick={() => navigate('/inventory')}>
          Back to Inventory
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
          <Button variant="contained" onClick={fetchItem}>
            Try Again
          </Button>
          <Button variant="outlined" onClick={() => navigate('/inventory')}>
            Go Back
          </Button>
        </Stack>
      </PageContainer>
    )
  }

  return (
    <>
      <PageContainer maxWidth={1100} contentSx={{ gap: { xs: 2.5, md: 3 } }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          sx={{ mb: { xs: 2, sm: 3 } }}
        >
          <Button
            variant="contained"
            disableElevation
            sx={{
              ...FEATURE_BUTTON_BASE_SX,
              background: 'linear-gradient(135deg, #2af598 0%, #009efd 100%)',
              color: '#031b2e',
              '&:hover': {
                background: 'linear-gradient(135deg, #20d8d8 0%, #0080d6 100%)'
              }
            }}
            onClick={() => handleFeatureClick('Assess Condition')}
          >
            Assess Condition ✨
          </Button>
          <Button
            variant="contained"
            disableElevation
            sx={{
              ...FEATURE_BUTTON_BASE_SX,
              background: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
              color: '#210041',
              '&:hover': {
                background: 'linear-gradient(135deg, #8a75c4 0%, #f7a5e6 100%)'
              }
            }}
            onClick={() => handleFeatureClick('Match Card')}
          >
            Match Card ✨
          </Button>
        </Stack>

        <InventoryForm
          mode="edit"
          sku={sku}
          loading={false}
          submitting={submitting}
          initialValues={initialValues}
          initialAspectValues={initialAspectValues}
          initialImageUrls={initialImageUrls}
          serverError={serverError}
          onSubmit={handleSubmit}
          onCancel={() => navigate('/inventory')}
        />

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          sx={{ mt: { xs: 2, sm: 3 } }}
        >
          <Button
            variant="contained"
            color="primary"
            onClick={handleCreateOffer}
            disabled={creatingOffer || deletingItem || !derivedOfferPayload}
          >
            {creatingOffer ? 'Creating Offer...' : 'Create Offer'}
          </Button>
          <Button
            variant="outlined"
            color="error"
            onClick={handleDeleteInventory}
            disabled={deletingItem || creatingOffer || submitting}
          >
            {deletingItem ? 'Deleting Item...' : 'Delete Item'}
          </Button>
        </Stack>
      </PageContainer>

      <Snackbar
        open={featureToast.open}
        autoHideDuration={4000}
        onClose={handleCloseFeatureToast}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseFeatureToast} severity="info" sx={{ width: '100%' }}>
          {featureToast.message || 'This feature is not yet enabled.'}
        </Alert>
      </Snackbar>
    </>
  )
}

export default EditInventory

