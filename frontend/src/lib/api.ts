import type { ApiError } from '@/types'

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

// Backend pagination shape: { items: T[], meta: { page, per_page, total, total_pages } }
export interface BackendPaginated<T> {
  items: T[]
  meta: { page: number; per_page: number; total: number; total_pages: number }
}

class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  private async request<T>(
    path: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`

    const res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    })

    if (!res.ok) {
      let error: ApiError
      try {
        error = await res.json()
      } catch {
        error = { detail: `HTTP ${res.status}: ${res.statusText}` }
      }
      throw new ApiClientError(error.detail, res.status, error.code)
    }

    // 204 No Content
    if (res.status === 204) {
      return undefined as unknown as T
    }

    return res.json() as Promise<T>
  }

  get<T>(path: string, init?: RequestInit): Promise<T> {
    return this.request<T>(path, { method: 'GET', ...init })
  }

  post<T>(path: string, body?: unknown, init?: RequestInit): Promise<T> {
    return this.request<T>(path, {
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
      ...init,
    })
  }

  patch<T>(path: string, body?: unknown, init?: RequestInit): Promise<T> {
    return this.request<T>(path, {
      method: 'PATCH',
      body: body !== undefined ? JSON.stringify(body) : undefined,
      ...init,
    })
  }

  delete<T = void>(path: string, init?: RequestInit): Promise<T> {
    return this.request<T>(path, { method: 'DELETE', ...init })
  }

  /** Upload a file via multipart/form-data (no JSON Content-Type). */
  async upload<T>(path: string, formData: FormData): Promise<T> {
    const url = `${this.baseUrl}${path}`
    const res = await fetch(url, { method: 'POST', body: formData })
    if (!res.ok) {
      let error: ApiError
      try { error = await res.json() } catch { error = { detail: `HTTP ${res.status}` } }
      throw new ApiClientError(error.detail, res.status, error.code)
    }
    return res.json() as Promise<T>
  }

  /** Paginated GET matching backend shape. */
  list<T>(
    path: string,
    params?: Record<string, string | number | boolean>,
  ): Promise<BackendPaginated<T>> {
    const qs = params
      ? '?' + new URLSearchParams(
          Object.entries(params).map(([k, v]) => [k, String(v)]),
        ).toString()
      : ''
    return this.get<BackendPaginated<T>>(`${path}${qs}`)
  }
}

export class ApiClientError extends Error {
  status: number
  code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'ApiClientError'
    this.status = status
    this.code = code
  }
}

export const api = new ApiClient(BASE_URL)
