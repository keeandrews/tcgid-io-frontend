const DEMO_USER_API_MESSAGE = 'This API is not available to demo users'
const DEMO_USER_TOAST_MESSAGE = 'Feature unavailable to demo users.'

const extractMessage = (payload) => {
  if (!payload) {
    return ''
  }

  if (typeof payload === 'string') {
    return payload
  }

  if (typeof payload === 'object') {
    if (typeof payload.data === 'string') {
      return payload.data
    }

    if (typeof payload.message === 'string') {
      return payload.message
    }
  }

  return ''
}

export const isDemoUserRestrictionResponse = (status, payload) => {
  return status === 403 && extractMessage(payload) === DEMO_USER_API_MESSAGE
}

export { DEMO_USER_API_MESSAGE, DEMO_USER_TOAST_MESSAGE }

