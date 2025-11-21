import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState
} from 'react'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Grid from '@mui/material/Grid'
import Stack from '@mui/material/Stack'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import Chip from '@mui/material/Chip'
import Snackbar from '@mui/material/Snackbar'
import CircularProgress from '@mui/material/CircularProgress'
import Autocomplete from '@mui/material/Autocomplete'
import IconButton from '@mui/material/IconButton'
import Accordion from '@mui/material/Accordion'
import AccordionSummary from '@mui/material/AccordionSummary'
import AccordionDetails from '@mui/material/AccordionDetails'
import { styled } from '@mui/material/styles'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import DeleteIcon from '@mui/icons-material/Delete'
import DragIndicatorIcon from '@mui/icons-material/DragIndicator'
import CloseIcon from '@mui/icons-material/Close'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import useEbayAspects from '../hooks/useEbayAspects'
import {
  getInventoryUploadUrls,
  uploadFileToPresignedUrl
} from '../utils/inventoryApi'
import {
  mapEbayAspectsToFields,
  getVisibleOptions,
  validateAspectValues,
  groupFieldsByCategory
} from '../utils/mapEbayAspectsToFields'

const CATEGORY_ID = 183454

const DEFAULT_VALUES = {
  locale: 'en_US',
  condition: '',
  conditionDescription: '',
  quantity: 1,
  productTitle: '',
  productDescription: '',
  productBrand: '',
  packageLength: '',
  packageWidth: '',
  packageHeight: '',
  packageDimensionUnit: 'INCH',
  packageWeightValue: '',
  packageWeightUnit: 'POUND'
}

const LOCALE_OPTIONS = [
  { label: 'English (United States)', value: 'en_US' },
  { label: 'English (United Kingdom)', value: 'en_GB' },
  { label: 'German', value: 'de_DE' },
  { label: 'French', value: 'fr_FR' }
]

const CONDITION_OPTIONS = [
  'NEW',
  'LIKE_NEW',
  'USED_EXCELLENT',
  'USED_VERY_GOOD',
  'USED_GOOD',
  'USED_ACCEPTABLE'
]

const WEIGHT_UNITS = ['POUND', 'OUNCE', 'KILOGRAM', 'GRAM']
const DIMENSION_UNITS = ['INCH', 'FOOT', 'CENTIMETER', 'METER']

const MAX_IMAGE_COUNT = 24
const SUPPORTED_IMAGE_EXTENSIONS = new Set([
  'jpg',
  'jpeg',
  'png',
  'gif',
  'webp',
  'bmp',
  'tiff',
  'tif',
  'svg',
  'ico'
])

const IMAGE_STATUS_META = {
  pending: { label: 'Waiting to upload', color: 'warning' },
  uploading: { label: 'Uploading…', color: 'info' },
  uploaded: { label: 'Ready', color: 'success' },
  error: { label: 'Upload failed', color: 'error' }
}

const getFileExtension = (filename = '') => {
  const parts = filename.split('.')
  if (parts.length < 2) return ''
  return parts.pop().toLowerCase()
}

const slugify = (value = '') =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

const isSupportedImageExtension = (filename = '') =>
  SUPPORTED_IMAGE_EXTENSIONS.has(getFileExtension(filename))

const buildUploadFilename = (file) => {
  const ext = isSupportedImageExtension(file.name)
    ? getFileExtension(file.name)
    : getFileExtension(file.type?.split('/').pop() || '') || 'png'
  const baseName = slugify(file.name.replace(/\.[^/.]+$/, '')) || 'inventory-image'
  const timestamp = Date.now()
  const random = Math.random().toString(36).slice(2, 8)
  return `${baseName}-${timestamp}-${random}.${ext}`
}

const buildSizedImageUrl = (url, size = '300') => {
  if (!url || typeof url !== 'string') return null
  if (url.includes('/master.')) {
    return url.replace(/\/master(\.[a-zA-Z0-9]+)$/i, `/${size}$1`)
  }
  return url
}

const normalizeSingleAspectValue = (input) => {
  if (input == null) {
    return ''
  }
  if (typeof input === 'string') {
    return input
  }
  if (typeof input === 'number' || typeof input === 'boolean') {
    return String(input)
  }
  if (typeof input === 'object') {
    return (
      input.localizedValue ||
      input.localized_value ||
      input.value ||
      input.name ||
      ''
    )
  }
  return ''
}

const normalizeMultiAspectValue = (input) => {
  const values = Array.isArray(input) ? input : input ? [input] : []
  const normalized = values
    .map(normalizeSingleAspectValue)
    .filter(Boolean)
  return Array.from(new Set(normalized))
}

const arraysEqual = (a = [], b = []) => {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) {
      return false
    }
  }
  return true
}

const sanitizeAspectValuesForSchema = (values = {}, fieldMap = {}) => {
  if (!values || typeof values !== 'object' || !Object.keys(values).length) {
    return {}
  }

  return Object.entries(values).reduce((acc, [key, value]) => {
    const field = fieldMap[key]
    if (!field) {
      return acc
    }

    if (field.cardinality === 'MULTI') {
      const cleaned = normalizeMultiAspectValue(value)
      if (cleaned.length) {
        acc[key] = cleaned
      }
    } else {
      const normalized = normalizeSingleAspectValue(Array.isArray(value) ? value[0] : value)
      if (normalized) {
        acc[key] = normalized
      }
    }

    return acc
  }, {})
}

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

const ImageItem = styled(Paper)(({ theme }) => ({
  position: 'relative',
  padding: theme.spacing(1),
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[2],
  transition: 'box-shadow 0.2s ease',
  '&:hover': {
    boxShadow: theme.shadows[4],
  },
}))

const ImagePreview = styled('img')({
  width: '100%',
  height: 140,
  objectFit: 'cover',
  borderRadius: 4,
  display: 'block'
})

const convertObjectUrlToDataUrl = async (url) => {
  if (!url) {
    return null
  }

  if (url.startsWith('data:')) {
    return url
  }

  try {
    const response = await fetch(url)
    const blob = await response.blob()
    return await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  } catch (error) {
    console.error('Failed to convert preview to data URL', error)
    return null
  }
}

const InventoryForm = forwardRef(({
  mode = 'create',
  sku = null,
  initialValues,
  initialAspectValues,
  initialImageUrls,
  onSubmit,
  onCancel,
  submitting = false,
  loading = false,
  serverError = null
}, ref) => {
  const [formValues, setFormValues] = useState(DEFAULT_VALUES)
  const [aspectValues, setAspectValues] = useState({})
  const [images, setImages] = useState([])
  const [imageUploadState, setImageUploadState] = useState('idle')
  const [snackbarState, setSnackbarState] = useState({
    open: false,
    message: '',
    severity: 'info'
  })
  const [expandedSections, setExpandedSections] = useState({
    basicInfo: true,
    packageDetails: false,
    productAspects: false
  })
  const fileInputRef = useRef(null)
  const imagesRef = useRef([])
  const uploadInFlightRef = useRef(false)
  const initialHostedImagesRef = useRef([])
  const initialAspectValuesRef = useRef(null)

  const { aspects, loading: aspectsLoading, error: aspectsError } = useEbayAspects(CATEGORY_ID)

  const normalizedInitialImageUrls = useMemo(() => {
    if (!initialImageUrls) return []
    return Array.isArray(initialImageUrls) ? initialImageUrls : []
  }, [initialImageUrls])

  useEffect(() => {
    const source = normalizedInitialImageUrls
    if (imagesRef.current.length > 0) {
      return
    }
    if (!source.length) {
      if (imagesRef.current.length === 0) {
        setImages([])
        initialHostedImagesRef.current = []
      }
      return
    }
    const hydrated = source.slice(0, MAX_IMAGE_COUNT).map((url, index) => {
      const sizedUrls = {
        master: url,
        '1600': buildSizedImageUrl(url, '1600'),
        '600': buildSizedImageUrl(url, '600'),
        '300': buildSizedImageUrl(url, '300'),
        '120': buildSizedImageUrl(url, '120')
      }
      const previewSrc =
        sizedUrls['300'] ||
        sizedUrls['600'] ||
        url
      return {
        id: `hosted-${index}-${url}`,
        type: 'hosted',
        status: 'uploaded',
        url,
        destinationUrls: sizedUrls,
        preview: previewSrc,
        localPreview: null,
        filename: url?.split('/').pop() || `image-${index}.png`,
        error: null
      }
    })
    initialHostedImagesRef.current = hydrated
    setImages(hydrated)
  }, [normalizedInitialImageUrls])

  const aspectFields = useMemo(
    () => (aspects ? mapEbayAspectsToFields(aspects.aspects) : []),
    [aspects]
  )

  const groupedAspectFields = useMemo(
    () => groupFieldsByCategory(aspectFields),
    [aspectFields]
  )

  const aspectFieldMap = useMemo(() => {
    const map = {}
    aspectFields.forEach(field => {
      map[field.aspectName] = field
    })
    return map
  }, [aspectFields])

  useEffect(() => {
    if (initialValues) {
      setFormValues({ ...DEFAULT_VALUES, ...initialValues })
    }
  }, [initialValues])

  const [hasSanitizedInitialAspects, setHasSanitizedInitialAspects] = useState(false)

  useEffect(() => {
    if (!initialAspectValues) {
      return
    }
    initialAspectValuesRef.current = initialAspectValues
    setHasSanitizedInitialAspects(false)
    if (!Object.keys(aspectFieldMap).length) {
      setAspectValues(initialAspectValues)
    }
  }, [initialAspectValues, aspectFieldMap])

  useEffect(() => {
    if (hasSanitizedInitialAspects) return
    if (!initialAspectValuesRef.current) return
    if (!Object.keys(aspectFieldMap).length) return

    setAspectValues(prev => {
      const sanitized = sanitizeAspectValuesForSchema(initialAspectValuesRef.current, aspectFieldMap)
      if (!Object.keys(sanitized).length) {
        return prev
      }
      return sanitized
    })
    setHasSanitizedInitialAspects(true)
  }, [aspectFieldMap, hasSanitizedInitialAspects])

  useEffect(() => {
    if (!aspectFields.length) return
    setAspectValues(prev => {
      if (!prev || typeof prev !== 'object') {
        return prev
      }

      let hasChanges = false
      const next = { ...prev }

      aspectFields.forEach(field => {
        const currentValue = next[field.aspectName]
        if (field.cardinality === 'MULTI') {
          const normalized = normalizeMultiAspectValue(currentValue)
          if (!arraysEqual(
            Array.isArray(currentValue) ? currentValue : currentValue ? [currentValue] : [],
            normalized
          )) {
            next[field.aspectName] = normalized
            hasChanges = true
          }
        } else {
          const normalized = normalizeSingleAspectValue(
            Array.isArray(currentValue) ? currentValue[0] : currentValue
          )
          if (normalized !== (typeof currentValue === 'string' ? currentValue : '')) {
            next[field.aspectName] = normalized || ''
            hasChanges = true
          } else if (typeof currentValue !== 'string') {
            next[field.aspectName] = normalized || ''
            hasChanges = true
          }
        }
      })

      return hasChanges ? next : prev
    })
  }, [aspectFields])

  useEffect(() => {
    if (!aspectFields.length) return
    setAspectValues(prev => {
      if (!prev || typeof prev !== 'object') {
        return prev
      }
      const filteredEntries = Object.entries(prev).filter(([key]) => aspectFieldMap[key])
      if (filteredEntries.length === Object.keys(prev).length) {
        return prev
      }
      return filteredEntries.reduce((acc, [key, value]) => {
        acc[key] = value
        return acc
      }, {})
    })
  }, [aspectFieldMap, aspectFields.length])

  useEffect(() => {
    imagesRef.current = images
  }, [images])

  useEffect(() => {
    if (imageUploadState === 'error') {
      const hasErrors = images.some((image) => image.status === 'error')
      if (!hasErrors) {
        setImageUploadState('idle')
      }
    }
  }, [imageUploadState, images])

  useEffect(() => {
    return () => {
      imagesRef.current.forEach((image) => {
        if (image.localPreview && image.localPreview.startsWith && image.localPreview.startsWith('blob:')) {
          try {
            URL.revokeObjectURL(image.localPreview)
          } catch (_) {
            // ignore
          }
        }
      })
    }
  }, [])

  const showSnackbar = (message, severity = 'info') => {
    setSnackbarState({
      open: true,
      message,
      severity
    })
  }

  const handleCloseSnackbar = (_, reason) => {
    if (reason === 'clickaway') return
    setSnackbarState(prev => ({ ...prev, open: false }))
  }

  const handleSectionToggle = useCallback(
    (section) => (_, nextExpanded) => {
      setExpandedSections(prev => ({
        ...prev,
        [section]: nextExpanded
      }))
    },
    []
  )

  const handleFileInputChange = (event) => {
    const files = event.target.files
    if (!files || !files.length) return

    const remainingSlots = MAX_IMAGE_COUNT - imagesRef.current.length
    if (remainingSlots <= 0) {
      showSnackbar(`You can upload up to ${MAX_IMAGE_COUNT} photos per item.`, 'warning')
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      return
    }

    const accepted = []
    const skipped = []

    Array.from(files).forEach((file) => {
      if (!file.type?.startsWith('image/')) {
        skipped.push(`${file.name} is not an image`)
        return
      }
      if (!isSupportedImageExtension(file.name)) {
        skipped.push(`${file.name} uses an unsupported file type`)
        return
      }
      accepted.push(file)
    })

    if (accepted.length > remainingSlots) {
      showSnackbar(`Only ${remainingSlots} more image${remainingSlots === 1 ? '' : 's'} can be added.`, 'warning')
      accepted.length = remainingSlots
    }

    if (skipped.length) {
      showSnackbar(`${skipped.length} file${skipped.length === 1 ? '' : 's'} skipped due to type limitations.`, 'warning')
    }

    if (!accepted.length) {
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      return
    }

    const mapped = accepted.map(file => {
      const localPreview = URL.createObjectURL(file)
      return {
        id: `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        type: 'local',
        file,
        preview: localPreview,
        localPreview,
        status: 'pending',
        filename: buildUploadFilename(file),
        error: null,
        url: null,
        destinationUrls: null
      }
    })

    setImages(prev => [...prev, ...mapped])

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleRemoveImage = (id) => {
    setImages(prev => {
      const target = prev.find(img => img.id === id)
      if (target?.localPreview && target.localPreview.startsWith && target.localPreview.startsWith('blob:')) {
        try {
          URL.revokeObjectURL(target.localPreview)
        } catch (_) {
          // ignore revoke failures
        }
      }
      return prev.filter(img => img.id !== id)
    })
  }

  const handleReorderImages = (result) => {
    if (!result.destination) return
    setImages(prev => {
      const updated = Array.from(prev)
      const [moved] = updated.splice(result.source.index, 1)
      updated.splice(result.destination.index, 0, moved)
      return updated
    })
  }

  const handleFormChange = (field, value) => {
    setFormValues(prev => ({ ...prev, [field]: value }))
  }

  const handleAspectChange = (aspectName, value) => {
    setAspectValues(prev => {
      const field = aspectFieldMap[aspectName]
      const isMulti = field?.cardinality === 'MULTI'
      const nextValue = isMulti
        ? normalizeMultiAspectValue(value)
        : normalizeSingleAspectValue(Array.isArray(value) ? value[0] : value)
      return {
        ...prev,
        [aspectName]: isMulti ? nextValue : (nextValue || '')
      }
    })
  }

  const getLocalPreviewData = useCallback(async () => {
    const previews = await Promise.all(
      imagesRef.current.map(async (image) => {
        const source = image.localPreview
        if (!source) {
          return null
        }
        const dataUrl = await convertObjectUrlToDataUrl(source)
        return dataUrl
      })
    )
    return previews.filter(Boolean)
  }, [])

  const uploadPendingImages = useCallback(
    async (overrideSku, options = {}) => {
      const { onStart, onProgress, onError, onComplete } = options || {}
      const targetSku = overrideSku || sku
      const currentImages = imagesRef.current
      const pendingEntries = currentImages.filter(
        (image) =>
          image.type === 'local' &&
          (image.status === 'pending' || image.status === 'error')
      )

      const totalUploads = pendingEntries.length
      onStart?.(totalUploads)

      if (!pendingEntries.length) {
        onProgress?.(0, 0)
        return []
      }

      if (!targetSku) {
        throw new Error('Missing inventory SKU. Save the item before uploading images.')
      }

      setImageUploadState('uploading')
      uploadInFlightRef.current = true

      const pendingIds = new Set(pendingEntries.map((image) => image.id))
      setImages(prev =>
        prev.map(image =>
          pendingIds.has(image.id)
            ? { ...image, status: 'uploading', error: null }
            : image
        )
      )

      let completed = 0

      try {
        for (const image of pendingEntries) {
          let uploadInfo = null

          try {
            const response = await getInventoryUploadUrls(targetSku, [image.filename])
            const payload = response?.data || {}
            const key = payload[targetSku]
              ? targetSku
              : Object.keys(payload)[0]
            const uploadDefinitions = key && Array.isArray(payload[key]) ? payload[key] : []
            uploadInfo = uploadDefinitions[0]
          } catch (requestError) {
            throw new Error(requestError.message || 'Failed to request upload URLs.')
          }

          if (!uploadInfo) {
            throw new Error(`Upload information missing for ${image.filename}`)
          }

          await uploadFileToPresignedUrl(uploadInfo.presigned_url, image.file)

          setImages(prev =>
            prev.map(item => {
              if (item.id !== image.id) {
                return item
              }

              const destinationUrls = uploadInfo.destination_urls || {}
              const masterUrl =
                destinationUrls.master ||
                destinationUrls.Master ||
                destinationUrls.MASTER ||
                null

              const hostedPreview =
                destinationUrls['300'] ||
                destinationUrls['600'] ||
                buildSizedImageUrl(masterUrl, '300') ||
                masterUrl

              return {
                ...item,
                type: 'hosted',
                status: 'uploaded',
                url: masterUrl,
                destinationUrls,
                preview: item.localPreview || item.preview || hostedPreview,
                localPreview: item.localPreview,
                file: undefined
              }
            })
          )

          completed += 1
          onProgress?.(completed, totalUploads)
        }

        setImageUploadState('idle')
        uploadInFlightRef.current = false
        onComplete?.()
        return pendingEntries.map(entry => entry.filename)
      } catch (error) {
        setImages(prev =>
          prev.map(image =>
            pendingIds.has(image.id)
              ? { ...image, status: 'error', error: error.message || 'Image upload failed.' }
              : image
          )
        )
        setImageUploadState('error')
        uploadInFlightRef.current = false
        onError?.(error)
        throw error
      }
    },
    [sku]
  )

  useImperativeHandle(ref, () => ({
    uploadPendingImages,
    getLocalPreviewData
  }))

  useEffect(() => {
    if (mode !== 'edit' || !sku) {
      return
    }
    if (uploadInFlightRef.current) {
      return
    }
    const hasPending = imagesRef.current.some(
      (image) => image.type === 'local' && image.status === 'pending'
    )
    if (!hasPending) {
      return
    }
    uploadPendingImages(sku).catch((error) => {
      showSnackbar(error.message || 'Failed to upload images.', 'error')
    })
  }, [images, mode, sku, uploadPendingImages, showSnackbar])

  const validateForm = () => {
    const errors = []

    if (!formValues.productTitle.trim()) {
      errors.push('Title is required.')
    }

    if (!formValues.locale) {
      errors.push('Locale is required.')
    }

    const quantity = Number(formValues.quantity)
    if (Number.isNaN(quantity) || quantity < 1) {
      errors.push('Quantity must be at least 1.')
    }

    if (formValues.conditionDescription.length > 1000) {
      errors.push('Condition description must be 1000 characters or fewer.')
    }

    if (aspectFields.length) {
      const aspectErrors = validateAspectValues(aspectFields, aspectValues)
      errors.push(...aspectErrors)
    }

    return errors
  }

  const buildPayload = () => {
    const payload = {
      locale: formValues.locale,
    }

    if (formValues.condition) {
      payload.condition = formValues.condition
    }

    if (formValues.conditionDescription) {
      payload.conditionDescription = formValues.conditionDescription
    }

    if (formValues.quantity) {
      payload.availability = {
        shipToLocationAvailability: {
          quantity: Number(formValues.quantity)
        }
      }
    }

    const product = {}

    if (formValues.productTitle) {
      product.title = formValues.productTitle
    }

    if (formValues.productDescription) {
      product.description = formValues.productDescription
    }

    if (formValues.productBrand) {
      product.brand = formValues.productBrand
    }

    const aspectPayload = {}
    Object.entries(aspectValues).forEach(([key, value]) => {
      const field = aspectFieldMap[key]
      if (!field) {
        return
      }
      const isMulti = field.cardinality === 'MULTI'
      if (isMulti) {
        const cleaned = normalizeMultiAspectValue(value)
        if (cleaned.length) {
          aspectPayload[key] = cleaned
        }
      } else {
        const normalized = normalizeSingleAspectValue(
          Array.isArray(value) ? value[0] : value
        )
        if (normalized) {
          aspectPayload[key] = [normalized]
        }
      }
    })

    if (Object.keys(aspectPayload).length) {
      product.aspects = aspectPayload
    }

    if (Object.keys(product).length) {
      payload.product = product
    }

    const hostedImageUrls = images
      .filter(image => image.type === 'hosted' && image.url)
      .map(image => image.url)

    if (hostedImageUrls.length) {
      if (!payload.product) {
        payload.product = {}
      }
      payload.product.imageUrls = hostedImageUrls
    }

    const hasDimensions =
      formValues.packageLength ||
      formValues.packageWidth ||
      formValues.packageHeight

    const hasWeight = formValues.packageWeightValue

    if (hasDimensions || hasWeight) {
      payload.packageWeightAndSize = {}
      if (hasDimensions) {
        payload.packageWeightAndSize.dimensions = {
          length: formValues.packageLength ? Number(formValues.packageLength) : undefined,
          width: formValues.packageWidth ? Number(formValues.packageWidth) : undefined,
          height: formValues.packageHeight ? Number(formValues.packageHeight) : undefined,
          unit: formValues.packageDimensionUnit
        }
      }

      if (hasWeight) {
        payload.packageWeightAndSize.weight = {
          value: Number(formValues.packageWeightValue),
          unit: formValues.packageWeightUnit
        }
      }
    }

    return payload
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const errors = validateForm()

    if (errors.length) {
      showSnackbar(errors[0], 'error')
      return
    }

    if (!onSubmit) return

    try {
      if (mode === 'edit') {
        const hasIncompleteUploads = images.some(
          (image) => image.type === 'local' && image.status !== 'uploaded'
        )
        if (hasIncompleteUploads) {
          showSnackbar('Please wait for image uploads to finish before saving.', 'warning')
          return
        }
      }

      const payload = buildPayload()
      await onSubmit(payload)
    } catch (error) {
      showSnackbar(error.message || 'Failed to save inventory item.', 'error')
    }
  }

  const handleReset = () => {
    if (initialValues) {
      setFormValues({ ...DEFAULT_VALUES, ...initialValues })
    } else {
      setFormValues(DEFAULT_VALUES)
    }
    if (initialAspectValues) {
      setAspectValues(initialAspectValues)
    } else {
      setAspectValues({})
    }
    setImageUploadState('idle')
    setImages(prev => {
      prev.forEach(image => {
        if (image.localPreview && image.localPreview.startsWith && image.localPreview.startsWith('blob:')) {
          try {
            URL.revokeObjectURL(image.localPreview)
          } catch (_) {
            // ignore
          }
        }
      })
      return initialHostedImagesRef.current || []
    })
  }

  const renderAspectField = (field) => {
    const rawValue = aspectValues[field.aspectName]
    const value =
      field.cardinality === 'MULTI'
        ? (Array.isArray(rawValue) ? rawValue : normalizeMultiAspectValue(rawValue))
        : (typeof rawValue === 'string'
            ? rawValue
            : normalizeSingleAspectValue(Array.isArray(rawValue) ? rawValue[0] : rawValue))
    const visibleOptions = getVisibleOptions(field, aspectValues)

    switch (field.ui.fieldType) {
      case 'select':
        return (
          <FormControl
            fullWidth
            size="small"
            key={field.aspectName}
            required={field.required}
          >
            <InputLabel>{field.aspectName}</InputLabel>
            <Select
              size="small"
              label={field.aspectName}
              value={value}
              onChange={(e) => handleAspectChange(field.aspectName, e.target.value)}
              inputProps={{
                'aria-required': field.required || undefined
              }}
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              {visibleOptions.map(option => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )
      case 'multi-select':
        return (
          <Autocomplete
            key={field.aspectName}
            multiple
            freeSolo={field.mode === 'FREE_TEXT'}
            size="small"
            options={visibleOptions}
            value={Array.isArray(value) ? value : []}
            onChange={(_, newValue) => handleAspectChange(field.aspectName, newValue)}
            renderTags={(selectedOptions, getTagProps) =>
              selectedOptions.map((option, index) => (
                <Chip
                  variant="outlined"
                  label={option}
                  {...getTagProps({ index })}
                  key={option}
                />
              ))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label={field.aspectName}
                size="small"
                InputLabelProps={{
                  ...params.InputLabelProps,
                  required: field.required || undefined
                }}
                inputProps={{
                  ...params.inputProps,
                  'aria-required': field.required || undefined
                }}
              />
            )}
          />
        )
      case 'number':
        return (
          <TextField
            key={field.aspectName}
            fullWidth
            type="number"
            size="small"
            label={field.aspectName}
            required={field.required}
            value={value}
            onChange={(e) => handleAspectChange(field.aspectName, e.target.value)}
          />
        )
      default:
        if (field.mode === 'FREE_TEXT' && visibleOptions.length > 0) {
          return (
            <Autocomplete
              key={field.aspectName}
              freeSolo
              size="small"
              options={visibleOptions}
              value={value}
              onChange={(_, newValue) => handleAspectChange(field.aspectName, newValue || '')}
              onInputChange={(_, newValue) => handleAspectChange(field.aspectName, newValue || '')}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={field.aspectName}
                  size="small"
                  InputLabelProps={{
                    ...params.InputLabelProps,
                    required: field.required || undefined
                  }}
                  inputProps={{
                    ...params.inputProps,
                    'aria-required': field.required || undefined
                  }}
                />
              )}
            />
          )
        }

        return (
          <TextField
            key={field.aspectName}
            fullWidth
            size="small"
            label={field.aspectName}
            required={field.required}
            value={value}
            onChange={(e) => handleAspectChange(field.aspectName, e.target.value)}
          />
        )
    }
  }

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
    <Box sx={{ py: { xs: 2, sm: 3, md: 4 } }}>
      <Typography
        variant="h4"
        gutterBottom
        sx={{
          mb: { xs: 2, sm: 3 },
          fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2.125rem' }
        }}
      >
        {mode === 'create' ? 'Create Inventory Item' : 'Edit Inventory Item'}
      </Typography>

      <Paper
        elevation={3}
        sx={{
          p: { xs: 2.5, sm: 3.5, md: 4 },
          borderRadius: 3,
          background: 'linear-gradient(180deg, rgba(15,23,42,0.95), rgba(5,10,25,0.98))',
          border: '1px solid',
          borderColor: 'rgba(148, 163, 184, 0.15)'
        }}
        component="form"
        onSubmit={handleSubmit}
      >
        <Stack spacing={4}>
          {serverError && (
            <Alert severity="error" variant="outlined">
              {serverError}
            </Alert>
          )}

          {/* Photo Uploader */}
          <Box
            sx={{
              borderRadius: 3,
              border: '1px dashed',
              borderColor: 'rgba(148,163,184,0.35)',
              backgroundColor: 'rgba(255,255,255,0.02)',
              p: { xs: 2, sm: 3 }
            }}
          >
            <Stack spacing={2.5}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Photos
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Lead with imagery just like an eBay listing. Upload, reorder, and manage here.
                </Typography>
              </Box>
              <Alert severity="info" variant="outlined">
                {mode === 'create'
                  ? 'Photos upload automatically after the item is created. They will not be sent until the inventory record exists.'
                  : 'Adding photos uploads them immediately. Remove or reorder them here before saving your changes.'}
              </Alert>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'stretch', sm: 'center' }}>
                <Button
                  variant="contained"
                  startIcon={<CloudUploadIcon />}
                  component="label"
                  color="primary"
                >
                  Add Photos
                  <VisuallyHiddenInput
                    type="file"
                    accept="image/*"
                    multiple
                    ref={fileInputRef}
                    onChange={handleFileInputChange}
                  />
                </Button>
                <Button
                  color="secondary"
                  variant="outlined"
                  onClick={handleReset}
                >
                  Reset Form
                </Button>
                <Typography variant="body2" color="text.secondary">
                  {images.length}/{MAX_IMAGE_COUNT} photo{images.length === 1 ? '' : 's'} selected
                </Typography>
              </Stack>
              {images.length > 0 && (
                <DragDropContext onDragEnd={handleReorderImages}>
                  <Droppable droppableId="photos" direction="horizontal">
                    {(provided) => (
                      <Box
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        sx={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: 2
                        }}
                      >
                        {images.map((image, index) => {
                          const statusMeta = IMAGE_STATUS_META[image.status] || IMAGE_STATUS_META.pending
                          const displaySrc =
                            image.preview ||
                            image.localPreview ||
                            buildSizedImageUrl(image.url, '300') ||
                            'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="140"><rect width="200" height="140" fill="%23eee"/></svg>'

                          return (
                            <Draggable key={image.id} draggableId={image.id} index={index}>
                              {(dragProvided, snapshot) => (
                                <ImageItem
                                  ref={dragProvided.innerRef}
                                  {...dragProvided.draggableProps}
                                  {...dragProvided.dragHandleProps}
                                  sx={{
                                    width: 200,
                                    opacity: snapshot.isDragging ? 0.6 : 1
                                  }}
                                >
                                  <Box sx={{ position: 'relative' }}>
                                    <ImagePreview
                                      src={displaySrc}
                                      alt={`Upload ${index + 1}`}
                                      onError={(e) => {
                                        e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="140"><rect width="200" height="140" fill="%23eee"/></svg>'
                                      }}
                                    />
                                    {image.status === 'uploading' && (
                                      <Box
                                        sx={{
                                          position: 'absolute',
                                          inset: 0,
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          bgcolor: 'rgba(0,0,0,0.35)',
                                          borderRadius: 1
                                        }}
                                      >
                                        <CircularProgress size={32} sx={{ color: '#fff' }} />
                                      </Box>
                                    )}
                                    {image.status === 'error' && (
                                      <Box
                                        sx={{
                                          position: 'absolute',
                                          inset: 0,
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          bgcolor: 'rgba(211,47,47,0.25)',
                                          borderRadius: 1,
                                          color: 'error.main',
                                          fontWeight: 600
                                        }}
                                      >
                                        Upload failed
                                      </Box>
                                    )}
                                  </Box>
                                  <Stack
                                    direction="row"
                                    spacing={1}
                                    alignItems="center"
                                    sx={{
                                      mt: 1,
                                      width: '100%',
                                      minWidth: 0
                                    }}
                                  >
                                    <DragIndicatorIcon fontSize="small" color="action" />
                                    <Typography
                                      variant="caption"
                                      sx={{
                                        flexGrow: 1,
                                        minWidth: 0,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap'
                                      }}
                                    >
                                      {image.file?.name || image.filename || `Image ${index + 1}`}
                                    </Typography>
                                    <Chip
                                      label={statusMeta.label}
                                      color={statusMeta.color}
                                      size="small"
                                      variant={image.status === 'uploaded' ? 'outlined' : 'filled'}
                                      sx={{ flexShrink: 0 }}
                                    />
                                    <IconButton
                                      size="small"
                                      onClick={() => handleRemoveImage(image.id)}
                                    >
                                      <DeleteIcon fontSize="small" />
                                    </IconButton>
                                  </Stack>
                                  {image.error && (
                                    <Typography variant="caption" color="error.main">
                                      {image.error}
                                    </Typography>
                                  )}
                                </ImageItem>
                              )}
                            </Draggable>
                          )
                        })}
                        {provided.placeholder}
                      </Box>
                    )}
                  </Droppable>
                </DragDropContext>
              )}
              {imageUploadState === 'error' && (
                <Alert severity="error" variant="outlined">
                  Some images failed to upload. Remove any failed photos or retry the upload before continuing.
                </Alert>
              )}
            </Stack>
          </Box>

          {/* Basic Info */}
          <Accordion
            disableGutters
            expanded={expandedSections.basicInfo}
            onChange={handleSectionToggle('basicInfo')}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  Basic Information
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Titles, locale, condition, and descriptions
                </Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} md={8}>
                  <TextField
                    label="Title"
                    fullWidth
                    required
                    value={formValues.productTitle}
                    onChange={(e) => handleFormChange('productTitle', e.target.value)}
                    inputProps={{ maxLength: 80 }}
                    helperText={`${formValues.productTitle.length}/80 characters`}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>Locale</InputLabel>
                    <Select
                      label="Locale"
                      value={formValues.locale}
                      onChange={(e) => handleFormChange('locale', e.target.value)}
                      required
                    >
                      {LOCALE_OPTIONS.map(option => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Brand"
                    fullWidth
                    value={formValues.productBrand}
                    onChange={(e) => handleFormChange('productBrand', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Condition</InputLabel>
                    <Select
                      label="Condition"
                      value={formValues.condition}
                      onChange={(e) => handleFormChange('condition', e.target.value)}
                    >
                      <MenuItem value="">
                        <em>Not specified</em>
                      </MenuItem>
                      {CONDITION_OPTIONS.map(option => (
                        <MenuItem key={option} value={option}>
                          {option.replace(/_/g, ' ')}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    label="Quantity Available"
                    fullWidth
                    required
                    type="number"
                    inputProps={{ min: 1 }}
                    value={formValues.quantity}
                    onChange={(e) => handleFormChange('quantity', e.target.value)}
                    helperText="Minimum 1"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Condition Description"
                    fullWidth
                    multiline
                    minRows={2}
                    value={formValues.conditionDescription}
                    onChange={(e) => handleFormChange('conditionDescription', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Description"
                    fullWidth
                    multiline
                    minRows={4}
                    value={formValues.productDescription}
                    onChange={(e) => handleFormChange('productDescription', e.target.value)}
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* Package Details */}
          <Accordion
            disableGutters
            expanded={expandedSections.packageDetails}
            onChange={handleSectionToggle('packageDetails')}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  Package Details
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Dimensions and weight override eBay defaults.
                </Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={3}>
                  <TextField
                    label="Length"
                    type="number"
                    fullWidth
                    value={formValues.packageLength}
                    onChange={(e) => handleFormChange('packageLength', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField
                    label="Width"
                    type="number"
                    fullWidth
                    value={formValues.packageWidth}
                    onChange={(e) => handleFormChange('packageWidth', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField
                    label="Height"
                    type="number"
                    fullWidth
                    value={formValues.packageHeight}
                    onChange={(e) => handleFormChange('packageHeight', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <FormControl fullWidth>
                    <InputLabel>Dimension Unit</InputLabel>
                    <Select
                      label="Dimension Unit"
                      value={formValues.packageDimensionUnit}
                      onChange={(e) => handleFormChange('packageDimensionUnit', e.target.value)}
                    >
                      {DIMENSION_UNITS.map(unit => (
                        <MenuItem key={unit} value={unit}>{unit}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Weight"
                    type="number"
                    fullWidth
                    value={formValues.packageWeightValue}
                    onChange={(e) => handleFormChange('packageWeightValue', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Weight Unit</InputLabel>
                    <Select
                      label="Weight Unit"
                      value={formValues.packageWeightUnit}
                      onChange={(e) => handleFormChange('packageWeightUnit', e.target.value)}
                    >
                      {WEIGHT_UNITS.map(unit => (
                        <MenuItem key={unit} value={unit}>{unit}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* Aspects */}
          <Accordion
            disableGutters
            expanded={expandedSections.productAspects}
            onChange={handleSectionToggle('productAspects')}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  Product Aspects
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Surface additional seller insights and buyer filters.
                </Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              {aspectsLoading && (
                <Box sx={{ py: 2, textAlign: 'center' }}>
                  <CircularProgress size={32} />
                </Box>
              )}
              {!aspectsLoading && aspectsError && (
                <Alert severity="warning" variant="outlined">
                  Failed to load eBay aspects: {aspectsError}. You can still submit without them.
                </Alert>
              )}
              {!aspectsLoading && !aspectsError && aspectFields.length === 0 && (
                <Alert severity="info" variant="outlined">
                  No aspects available for this category.
                </Alert>
              )}
              {!aspectsLoading && !aspectsError && aspectFields.length > 0 && (
                <Stack spacing={2}>
                  {Object.keys(groupedAspectFields).map(group => (
                    <Box key={group}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                        {group}
                      </Typography>
                      <Grid container spacing={2}>
                        {groupedAspectFields[group].map(field => (
                          <Grid item xs={12} sm={6} key={field.aspectName}>
                            {renderAspectField(field)}
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  ))}
                </Stack>
              )}
            </AccordionDetails>
          </Accordion>

          {/* Actions */}
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            justifyContent="flex-end"
          >
            <Button
              variant="outlined"
              color="secondary"
              onClick={onCancel}
              disabled={submitting}
              startIcon={<CloseIcon />}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color="primary"
              type="submit"
              disabled={submitting}
            >
              {submitting ? (
                <Stack direction="row" spacing={1} alignItems="center">
                  <CircularProgress color="inherit" size={18} />
                  <span>{mode === 'create' ? 'Creating...' : 'Saving...'}</span>
                </Stack>
              ) : (
                mode === 'create' ? 'Create Item' : 'Save Changes'
              )}
            </Button>
          </Stack>
        </Stack>
      </Paper>

      <Snackbar
        open={snackbarState.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbarState.severity}
          sx={{ width: '100%' }}
        >
          {snackbarState.message}
        </Alert>
      </Snackbar>
    </Box>
  )
})

export default InventoryForm

