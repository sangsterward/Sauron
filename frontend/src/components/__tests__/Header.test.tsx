import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import Header from '../Header'
import { useAuth } from '@/hooks/useAuth'

// Mock the auth hook
vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}))

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Monitor: () => <div data-testid="monitor-icon" />,
  Bell: () => <div data-testid="bell-icon" />,
  Settings: () => <div data-testid="settings-icon" />,
  User: () => <div data-testid="user-icon" />,
  LogOut: () => <div data-testid="logout-icon" />,
  LogIn: () => <div data-testid="login-icon" />,
  X: () => <div data-testid="x-icon" />,
  Eye: () => <div data-testid="eye-icon" />,
  EyeOff: () => <div data-testid="eye-off-icon" />,
  AlertCircle: () => <div data-testid="alert-circle-icon" />,
}))

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>)
}

describe('Header', () => {
  const mockLogout = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    ;(useAuth as any).mockReturnValue({
      user: null,
      isAuthenticated: false,
      logout: mockLogout,
    })
  })

  it('renders header with login button when not authenticated', () => {
    renderWithRouter(<Header />)
    
    expect(screen.getByText('Home Hub Monitor')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument()
    expect(screen.queryByText(/admin/)).not.toBeInTheDocument()
  })

  it('renders user menu when authenticated', () => {
    ;(useAuth as any).mockReturnValue({
      user: { username: 'admin', email: 'admin@example.com' },
      isAuthenticated: true,
      logout: mockLogout,
    })
    
    renderWithRouter(<Header />)
    
    expect(screen.getByText('admin')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /login/i })).not.toBeInTheDocument()
  })

  it('opens login modal when login button is clicked', async () => {
    const user = userEvent.setup()
    renderWithRouter(<Header />)
    
    const loginButton = screen.getByRole('button', { name: /login/i })
    await user.click(loginButton)
    
    expect(screen.getByRole('heading', { name: 'Login' })).toBeInTheDocument()
    expect(screen.getByLabelText('Username')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
  })

  it('shows user dropdown menu when user icon is clicked', async () => {
    const user = userEvent.setup()
    ;(useAuth as any).mockReturnValue({
      user: { username: 'admin', email: 'admin@example.com' },
      isAuthenticated: true,
      logout: mockLogout,
    })
    
    renderWithRouter(<Header />)
    
    const userButton = screen.getByText('admin')
    await user.click(userButton)
    
    expect(screen.getByText('Logout')).toBeInTheDocument()
  })

  it('calls logout when logout button is clicked', async () => {
    const user = userEvent.setup()
    ;(useAuth as any).mockReturnValue({
      user: { username: 'admin', email: 'admin@example.com' },
      isAuthenticated: true,
      logout: mockLogout,
    })
    
    renderWithRouter(<Header />)
    
    const userButton = screen.getByText('admin')
    await user.click(userButton)
    
    const logoutButton = screen.getByText('Logout')
    await user.click(logoutButton)
    
    expect(mockLogout).toHaveBeenCalled()
  })

  it('closes user menu when clicking user button again', async () => {
    const user = userEvent.setup()
    ;(useAuth as any).mockReturnValue({
      user: { username: 'admin', email: 'admin@example.com' },
      isAuthenticated: true,
      logout: mockLogout,
    })
    
    renderWithRouter(<Header />)
    
    const userButton = screen.getByText('admin')
    
    // First click - open menu
    await user.click(userButton)
    expect(screen.getByTestId('user-dropdown')).toBeInTheDocument()
    
    // Second click - close menu
    await user.click(userButton)
    await waitFor(() => {
      expect(screen.queryByTestId('user-dropdown')).not.toBeInTheDocument()
    })
  })

  it('displays user email when available', () => {
    ;(useAuth as any).mockReturnValue({
      user: { username: 'admin', email: 'admin@example.com' },
      isAuthenticated: true,
      logout: mockLogout,
    })
    
    renderWithRouter(<Header />)
    
    const userButton = screen.getByText('admin')
    fireEvent.click(userButton)
    
    expect(screen.getByText('admin@example.com')).toBeInTheDocument()
  })

  it('handles user without email', () => {
    ;(useAuth as any).mockReturnValue({
      user: { username: 'admin' },
      isAuthenticated: true,
      logout: mockLogout,
    })
    
    renderWithRouter(<Header />)
    
    const userButton = screen.getByText('admin')
    fireEvent.click(userButton)
    
    expect(screen.queryByText('admin@example.com')).not.toBeInTheDocument()
  })

  it('toggles user menu on multiple clicks', async () => {
    const user = userEvent.setup()
    ;(useAuth as any).mockReturnValue({
      user: { username: 'admin', email: 'admin@example.com' },
      isAuthenticated: true,
      logout: mockLogout,
    })
    
    renderWithRouter(<Header />)
    
    const userButton = screen.getByText('admin')
    
    // First click - open menu
    await user.click(userButton)
    expect(screen.getByText('Logout')).toBeInTheDocument()
    
    // Second click - close menu
    await user.click(userButton)
    await waitFor(() => {
      expect(screen.queryByText('Logout')).not.toBeInTheDocument()
    })
    
    // Third click - open menu again
    await user.click(userButton)
    expect(screen.getByText('Logout')).toBeInTheDocument()
  })
})