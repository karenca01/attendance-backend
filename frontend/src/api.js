const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '')

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: options.body instanceof FormData
      ? options.headers
      : {
          'Content-Type': 'application/json',
          ...(options.headers || {}),
        },
  })

  const contentType = response.headers.get('content-type') || ''
  const payload = contentType.includes('application/json')
    ? await response.json()
    : await response.text()

  if (!response.ok) {
    const message =
      payload && typeof payload === 'object'
        ? payload.message || payload.error || 'No se pudo completar la solicitud'
        : 'No se pudo completar la solicitud'

    throw new Error(message)
  }

  return payload
}

export const getHealth = () => request('/health')

export const getUsers = () => request('/users')

export const createUser = (data) =>
  request('/users', {
    method: 'POST',
    body: JSON.stringify(data),
  })

export const uploadUserFace = (userId, image) => {
  const formData = new FormData()
  formData.append('image', image)

  return request(`/users/${userId}/upload-face`, {
    method: 'POST',
    body: formData,
  })
}

export const registerAttendance = (userId) =>
  request('/attendance', {
    method: 'POST',
    body: JSON.stringify({ userId }),
  })

export const recognizeAttendance = (image) => {
  const formData = new FormData()
  formData.append('image', image)

  return request('/attendance/recognize', {
    method: 'POST',
    body: formData,
  })
}

export const getAttendanceHistory = (userId) => request(`/attendance/${userId}`)