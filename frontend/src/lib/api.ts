import type { ApiError, PaginatedResponse } from '@/types'

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

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

  // Convenience: paginated GET
  paginated<T>(
    path: string,
    params?: Record<string, string | number | boolean>,
  ): Promise<PaginatedResponse<T>> {
    const qs = params
      ? '?' + new URLSearchParams(
          Object.entries(params).map(([k, v]) => [k, String(v)]),
        ).toString()
      : ''
    return this.get<PaginatedResponse<T>>(`${path}${qs}`)
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
