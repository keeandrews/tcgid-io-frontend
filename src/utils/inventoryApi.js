import { isDemoUserRestrictionResponse, DEMO_USER_TOAST_MESSAGE } from './demoUserRestriction'

const API_BASE_URL = 'https://tcgid.io/api'

const DEFAULT_HEADERS = {
  'Content-Type': 'application/json'
}

const buildError = (message, status, payload) => {
  const error = new Error(message || 'Request failed')
  error.status = status
  error.payload = payload
  return error
}

const getToken = () => localStorage.getItem('token')

async function parseResponse(response) {
  const text = await response.text()

  if (!text) {
    return null
  }

  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

async function inventoryRequest(path, options = {}) {
  const token = getToken()

  if (!token) {
    throw buildError('You must be signed in to continue.', 401)
  }

  const headers = {
    'x-authorization-token': token,
    ...(options.body ? DEFAULT_HEADERS : {}),
    ...(options.headers || {})
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers
  })

  const payload = await parseResponse(response)

  if (!response.ok || (payload && payload.success === false)) {
    const isDemoRestriction = isDemoUserRestrictionResponse(response.status, payload)
    const defaultMessage =
      (payload && payload.data) ||
      (payload && payload.message) ||
      `Request failed with status ${response.status}`
    const message = isDemoRestriction ? DEMO_USER_TOAST_MESSAGE : defaultMessage
    const error = buildError(message, response.status, payload)

    if (isDemoRestriction) {
      error.isDemoUserRestriction = true
    }

    throw error
  }

  return payload
}

export async function fetchInventoryItems({ limit = 50, offset = 0 } = {}) {
  const searchParams = new URLSearchParams({
    limit: String(limit),
    offset: String(offset)
  })

  return inventoryRequest(`/inventory?${searchParams.toString()}`, {
    method: 'GET'
  })
}

export function syncInventory() {
  return inventoryRequest('/inventory/sync', {
    method: 'GET'
  })
}

export function deleteInventoryItem(sku) {
  if (!sku) {
    return Promise.reject(buildError('Missing SKU', 400))
  }

  return inventoryRequest(`/inventory/${encodeURIComponent(sku)}`, {
    method: 'DELETE'
  })
}

export function getInventoryItem(sku) {
  if (!sku) {
    return Promise.reject(buildError('Missing SKU', 400))
  }

  return inventoryRequest(`/inventory/${encodeURIComponent(sku)}`, {
    method: 'GET'
  })
}

export function createInventoryItem(payload) {
  return inventoryRequest('/inventory', {
    method: 'POST',
    body: JSON.stringify(payload)
  })
}

export function updateInventoryItem(sku, payload) {
  if (!sku) {
    return Promise.reject(buildError('Missing SKU', 400))
  }

  return inventoryRequest(`/inventory/${encodeURIComponent(sku)}`, {
    method: 'POST',
    body: JSON.stringify(payload)
  })
}

export function getInventoryUploadUrls(sku, filenames = []) {
  if (!sku) {
    return Promise.reject(buildError('Missing SKU', 400))
  }

  if (!Array.isArray(filenames) || filenames.length === 0) {
    return Promise.reject(buildError('At least one filename is required.', 400))
  }

  const params = new URLSearchParams()
  filenames.forEach((name) => params.append('filename', name))

  const search = params.toString()
  const path = `/inventory/${encodeURIComponent(sku)}/upload${search ? `?${search}` : ''}`

  return inventoryRequest(path, {
    method: 'PUT'
  })
}

export async function uploadFileToPresignedUrl(presignedUrl, file) {
  if (!presignedUrl || !file) {
    throw buildError('Missing upload parameters.', 400)
  }

  const response = await fetch(presignedUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': file.type || 'application/octet-stream'
    },
    body: file
  })

  if (!response.ok) {
    const error = await parseResponse(response)
    throw buildError(
      (error && error.data) || `Upload failed with status ${response.status}`,
      response.status,
      error
    )
  }

  return true
}

export { inventoryRequest }

