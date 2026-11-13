const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8010/api'

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export async function request<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, init)

  if (!response.ok) {
    let message = 'The request could not be completed.'

    try {
      const data = await response.json()
      if (typeof data.detail === 'string') {
        message = data.detail
      }
    } catch {
      // Keep the default error message.
    }

    throw new ApiError(response.status, message)
  }

  return response.json() as Promise<T>
}