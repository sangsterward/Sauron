import { useAuthStore } from '@/store/auth'
import { apiClient } from '@/lib/api'

export const useAuth = () => {
  const {
    user,
    token,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    setUser,
    setToken,
    setError,
    setLoading,
  } = useAuthStore()

  const checkAuth = async () => {
    const storedToken = localStorage.getItem('auth_token')
    if (storedToken && !isAuthenticated) {
      try {
        setLoading(true)
        // Verify token with backend
        const response = await apiClient.get('/auth/user/')
        setUser(response.data)
        setToken(storedToken)
      } catch (error: any) {
        // Token is invalid, remove it
        console.log('Token validation failed:', error.response?.data || error.message)
        localStorage.removeItem('auth_token')
        logout()
      } finally {
        setLoading(false)
      }
    }
  }

  const handleLogout = () => {
    logout()
    // Optionally call logout endpoint to invalidate token on server
    // apiClient.post('/auth/logout/')
  }

  return {
    user,
    token,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout: handleLogout,
    checkAuth,
    setError,
  }
}
