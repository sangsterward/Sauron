import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useServices, useServiceStats } from '../useServices'
import { apiClient } from '@/lib/api'

// Mock the API client
vi.mock('@/lib/api', () => ({
  apiClient: {
    get: vi.fn(),
  },
}))

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('useServices', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches services successfully', async () => {
    const mockServices = [
      { id: 1, name: 'Test Service', status: 'healthy' },
      { id: 2, name: 'Another Service', status: 'unhealthy' },
    ]

    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: { results: mockServices },
    })

    const { result } = renderHook(() => useServices(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toEqual(mockServices)
    expect(apiClient.get).toHaveBeenCalledWith('/services/')
  })

  it('handles API errors', async () => {
    vi.mocked(apiClient.get).mockRejectedValueOnce(new Error('API Error'))

    const { result } = renderHook(() => useServices(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error).toBeDefined()
  })
})

describe('useServiceStats', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches service stats successfully', async () => {
    const mockStats = {
      total_services: 10,
      healthy_services: 8,
      unhealthy_services: 2,
      service_types: { docker: 5, http: 3, tcp: 2 },
    }

    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: mockStats,
    })

    const { result } = renderHook(() => useServiceStats(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toEqual(mockStats)
    expect(apiClient.get).toHaveBeenCalledWith('/services/stats/')
  })
})
