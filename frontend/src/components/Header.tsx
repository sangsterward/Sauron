import React, { useState } from 'react'
import { Monitor, Bell, Settings, User, LogOut, LogIn } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import LoginModal from './LoginModal'

const Header: React.FC = () => {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const { user, isAuthenticated, logout } = useAuth()

  const handleLogout = () => {
    logout()
    setShowUserMenu(false)
  }

  return (
    <>
      <header className="bg-gray-800 shadow-lg border-b border-gray-700">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Monitor className="h-8 w-8 text-blue-400" />
              <h1 className="text-2xl font-bold text-white">
                Home Hub Monitor
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-400 hover:text-white transition-colors">
                <Bell className="h-5 w-5" />
              </button>
              <button className="p-2 text-gray-400 hover:text-white transition-colors">
                <Settings className="h-5 w-5" />
              </button>

              {isAuthenticated ? (
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-2 p-2 text-gray-400 hover:text-white transition-colors"
                    data-testid="user-menu-button"
                  >
                    <User className="h-5 w-5" />
                    <span className="text-sm font-medium">
                      {user?.username}
                    </span>
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-gray-700 rounded-lg shadow-xl border border-gray-600 py-1 z-50" data-testid="user-dropdown">
                      <div className="px-4 py-2 border-b border-gray-600">
                        <p className="text-sm font-medium text-white">
                          {user?.username}
                        </p>
                        {user?.email && (
                          <p className="text-xs text-gray-400">{user.email}</p>
                        )}
                      </div>
                      <button
                        onClick={handleLogout}
                        className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-600 hover:text-white flex items-center space-x-2 transition-colors"
                        data-testid="logout-button"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Logout</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setIsLoginModalOpen(true)}
                  className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                  data-testid="login-button"
                >
                  <LogIn className="h-4 w-4" />
                  <span>Login</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
    </>
  )
}

export default Header
