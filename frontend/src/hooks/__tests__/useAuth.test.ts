import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAuth } from '../useAuth'
import { useAuthStore } from '@/store/auth'
import { apiClient } from '@/lib/api'

// Mock the auth store
vi.mock('@/store/auth', () => ({
  useAuthStore: vi.fn(),
}))

// Mock the API client
vi.mock('@/lib/api', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

describe('useAuth', () => {
  const mockLogin = vi.fn()
  const mockLogout = vi.fn()
  const mockSetUser = vi.fn()
  const mockSetToken = vi.fn()
  const mockSetError = vi.fn()
  const mockSetLoading = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
    ;(useAuthStore as any).mockReturnValue({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      login: mockLogin,
      logout: mockLogout,
      setUser: mockSetUser,
      setToken: mockSetToken,
      setError: mockSetError,
      setLoading: mockSetLoading,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns auth state from store', () => {
    const mockUser = { id: 1, username: 'admin' }
    ;(useAuthStore as any).mockReturnValue({
      user: mockUser,
      token: 'test-token',
      isAuthenticated: true,
      isLoading: false,
      error: null,
      login: mockLogin,
      logout: mockLogout,
      setUser: mockSetUser,
      setToken: mockSetToken,
      setError: mockSetError,
      setLoading: mockSetLoading,
    })

    const { result } = renderHook(() => useAuth())

    expect(result.current.user).toEqual(mockUser)
    expect(result.current.token).toBe('test-token')
    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('calls checkAuth when token exists in localStorage', async () => {
    const mockToken = 'test-token'
    const mockUser = { id: 1, username: 'admin' }
    
    localStorageMock.getItem.mockReturnValue(mockToken)
    ;(apiClient.get as any).mockResolvedValue({ data: mockUser })
    ;(useAuthStore as any).mockReturnValue({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      login: mockLogin,
      logout: mockLogout,
      setUser: mockSetUser,
      setToken: mockSetToken,
      setError: mockSetError,
      setLoading: mockSetLoading,
    })

    const { result } = renderHook(() => useAuth())

    await act(async () => {
      await result.current.checkAuth()
    })

    expect(mockSetLoading).toHaveBeenCalledWith(true)
    expect(apiClient.get).toHaveBeenCalledWith('/auth/user/')
    expect(mockSetUser).toHaveBeenCalledWith(mockUser)
    expect(mockSetToken).toHaveBeenCalledWith(mockToken)
    expect(mockSetLoading).toHaveBeenCalledWith(false)
  })

  it('handles invalid token in localStorage', async () => {
    const mockToken = 'invalid-token'
    
    localStorageMock.getItem.mockReturnValue(mockToken)
    ;(apiClient.get as any).mockRejectedValue(new Error('Unauthorized'))
    ;(useAuthStore as any).mockReturnValue({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      login: mockLogin,
      logout: mockLogout,
      setUser: mockSetUser,
      setToken: mockSetToken,
      setError: mockSetError,
      setLoading: mockSetLoading,
    })

    const { result } = renderHook(() => useAuth())

    await act(async () => {
      await result.current.checkAuth()
    })

    expect(mockSetLoading).toHaveBeenCalledWith(true)
    expect(apiClient.get).toHaveBeenCalledWith('/auth/user/')
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth_token')
    expect(mockLogout).toHaveBeenCalled()
    expect(mockSetLoading).toHaveBeenCalledWith(false)
  })

  it('does not call checkAuth when no token in localStorage', async () => {
    localStorageMock.getItem.mockReturnValue(null)
    ;(useAuthStore as any).mockReturnValue({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      login: mockLogin,
      logout: mockLogout,
      setUser: mockSetUser,
      setToken: mockSetToken,
      setError: mockSetError,
      setLoading: mockSetLoading,
    })

    const { result } = renderHook(() => useAuth())

    await act(async () => {
      await result.current.checkAuth()
    })

    expect(apiClient.get).not.toHaveBeenCalled()
    expect(mockSetLoading).not.toHaveBeenCalled()
  })

  it('does not call checkAuth when already authenticated', async () => {
    const mockToken = 'test-token'
    
    localStorageMock.getItem.mockReturnValue(mockToken)
    ;(useAuthStore as any).mockReturnValue({
      user: { id: 1, username: 'admin' },
      token: mockToken,
      isAuthenticated: true,
      isLoading: false,
      error: null,
      login: mockLogin,
      logout: mockLogout,
      setUser: mockSetUser,
      setToken: mockSetToken,
      setError: mockSetError,
      setLoading: mockSetLoading,
    })

    const { result } = renderHook(() => useAuth())

    await act(async () => {
      await result.current.checkAuth()
    })

    expect(apiClient.get).not.toHaveBeenCalled()
    expect(mockSetLoading).not.toHaveBeenCalled()
  })

  it('calls logout from store', () => {
    const { result } = renderHook(() => useAuth())

    act(() => {
      result.current.logout()
    })

    expect(mockLogout).toHaveBeenCalled()
  })

  it('calls login from store', async () => {
    const { result } = renderHook(() => useAuth())

    await act(async () => {
      await result.current.login('admin', 'password')
    })

    expect(mockLogin).toHaveBeenCalledWith('admin', 'password')
  })

  it('calls setError from store', () => {
    const { result } = renderHook(() => useAuth())

    act(() => {
      result.current.setError('Test error')
    })

    expect(mockSetError).toHaveBeenCalledWith('Test error')
  })
})
