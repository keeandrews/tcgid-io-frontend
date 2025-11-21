import { inventoryRequest } from './inventoryApi'

const buildError = (message, status, payload) => {
  const error = new Error(message || 'Request failed')
  error.status = status
  error.payload = payload
  return error
}

export function fetchOffers({ limit = 50, offset = 0, includeInactive = false } = {}) {
  const searchParams = new URLSearchParams({
    limit: String(limit),
    offset: String(offset)
  })

  if (includeInactive) {
    searchParams.set('includeInactive', 'true')
  }

  return inventoryRequest(`/offers?${searchParams.toString()}`, {
    method: 'GET'
  })
}

export function getOffer(offerId) {
  if (!offerId) {
    return Promise.reject(buildError('Missing offer ID', 400))
  }

  return inventoryRequest(`/offers/${encodeURIComponent(offerId)}`, {
    method: 'GET'
  })
}

export function updateOffer(offerId, payload) {
  if (!offerId) {
    return Promise.reject(buildError('Missing offer ID', 400))
  }

  return inventoryRequest(`/offers/${encodeURIComponent(offerId)}`, {
    method: 'POST',
    body: JSON.stringify(payload)
  })
}

export function deleteOffer(offerId) {
  if (!offerId) {
    return Promise.reject(buildError('Missing offer ID', 400))
  }

  return inventoryRequest(`/offers/${encodeURIComponent(offerId)}`, {
    method: 'DELETE'
  })
}

export function createOffer(payload) {
  if (!payload || typeof payload !== 'object') {
    return Promise.reject(buildError('Offer payload is required', 400))
  }

  return inventoryRequest('/offers', {
    method: 'POST',
    body: JSON.stringify(payload)
  })
}

