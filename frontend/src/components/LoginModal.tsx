import React, { useState } from 'react'
import { X, Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react'
import { useAuthStore } from '@/store/auth'

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { login, error, setError } = useAuthStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      await login(username, password)
      onClose()
      setUsername('')
      setPassword('')
    } catch (error) {
      // Error is handled by the store
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setError(null)
    setUsername('')
    setPassword('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div
          className="fixed inset-0 bg-black bg-opacity-50"
          onClick={handleClose}
          data-testid="login-backdrop"
        />

        <div className="relative w-full max-w-md bg-gray-800 rounded-lg shadow-xl border border-gray-700" data-testid="login-modal">
          <div className="flex items-center justify-between p-6 border-b border-gray-700">
            <div className="flex items-center space-x-2">
              <LogIn className="h-5 w-5 text-blue-400" />
              <h2 className="text-lg font-semibold text-white">Login</h2>
            </div>
            <button
              onClick={handleClose}
              className="p-1 text-gray-400 hover:text-white transition-colors"
              data-testid="login-close-button"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            {error && (
              <div className="mb-4 p-3 bg-red-900 border border-red-700 rounded-lg flex items-center space-x-2" data-testid="login-error">
                <AlertCircle className="h-4 w-4 text-red-400" />
                <span className="text-sm text-red-300">{error}</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="username"
                  className="block text-sm font-medium text-white mb-1"
                >
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your username"
                  required
                  disabled={isSubmitting}
                  data-testid="username-input"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-white mb-1"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 pr-10 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your password"
                    required
                    disabled={isSubmitting}
                    data-testid="password-input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                    disabled={isSubmitting}
                    data-testid="password-toggle-button"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6 flex space-x-3">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-4 py-2 text-gray-300 bg-gray-600 hover:bg-gray-500 rounded-lg transition-colors"
                disabled={isSubmitting}
                data-testid="login-cancel-button"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors flex items-center justify-center space-x-2"
                disabled={isSubmitting || !username || !password}
                data-testid="login-submit-button"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Logging in...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="h-4 w-4" />
                    <span>Login</span>
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="px-6 py-4 bg-gray-50 border-t rounded-b-lg">
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Don't have an account? Contact your administrator.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginModal
