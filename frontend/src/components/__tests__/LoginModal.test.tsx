import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import LoginModal from '../LoginModal'
import { useAuthStore } from '@/store/auth'

// Mock the auth store
vi.mock('@/store/auth', () => ({
  useAuthStore: vi.fn(),
}))

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  X: () => <div data-testid="x-icon" />,
  Eye: () => <div data-testid="eye-icon" />,
  EyeOff: () => <div data-testid="eye-off-icon" />,
  LogIn: () => <div data-testid="login-icon" />,
  AlertCircle: () => <div data-testid="alert-circle-icon" />,
}))

describe('LoginModal', () => {
  const mockLogin = vi.fn()
  const mockSetError = vi.fn()
  const mockOnClose = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    ;(useAuthStore as any).mockReturnValue({
      login: mockLogin,
      error: null,
      setError: mockSetError,
    })
  })

  it('renders login modal when open', () => {
    render(<LoginModal isOpen={true} onClose={mockOnClose} />)
    
    expect(screen.getByRole('heading', { name: 'Login' })).toBeInTheDocument()
    expect(screen.getByLabelText('Username')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
  })

  it('does not render when closed', () => {
    render(<LoginModal isOpen={false} onClose={mockOnClose} />)
    
    expect(screen.queryByRole('heading', { name: 'Login' })).not.toBeInTheDocument()
  })

  it('closes modal when clicking outside', async () => {
    const user = userEvent.setup()
    render(<LoginModal isOpen={true} onClose={mockOnClose} />)
    
    const backdrop = screen.getByTestId('login-backdrop')
    await user.click(backdrop)
    
    expect(mockOnClose).toHaveBeenCalled()
  })

  it('closes modal when clicking X button', async () => {
    const user = userEvent.setup()
    render(<LoginModal isOpen={true} onClose={mockOnClose} />)
    
    const closeButton = screen.getByTestId('login-close-button')
    await user.click(closeButton)
    
    expect(mockOnClose).toHaveBeenCalled()
  })

  it('closes modal when clicking Cancel button', async () => {
    const user = userEvent.setup()
    render(<LoginModal isOpen={true} onClose={mockOnClose} />)
    
    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    await user.click(cancelButton)
    
    expect(mockOnClose).toHaveBeenCalled()
  })

  it('handles form submission with valid credentials', async () => {
    const user = userEvent.setup()
    mockLogin.mockResolvedValue(undefined)
    
    render(<LoginModal isOpen={true} onClose={mockOnClose} />)
    
    const usernameInput = screen.getByLabelText('Username')
    const passwordInput = screen.getByLabelText('Password')
    const submitButton = screen.getByRole('button', { name: /login/i })
    
    await user.type(usernameInput, 'testuser')
    await user.type(passwordInput, 'testpass')
    await user.click(submitButton)
    
    expect(mockLogin).toHaveBeenCalledWith('testuser', 'testpass')
    expect(mockOnClose).toHaveBeenCalled()
  })

  it('disables submit button when fields are empty', () => {
    render(<LoginModal isOpen={true} onClose={mockOnClose} />)
    
    const submitButton = screen.getByRole('button', { name: /login/i })
    expect(submitButton).toBeDisabled()
  })

  it('enables submit button when fields are filled', async () => {
    const user = userEvent.setup()
    render(<LoginModal isOpen={true} onClose={mockOnClose} />)
    
    const usernameInput = screen.getByLabelText('Username')
    const passwordInput = screen.getByLabelText('Password')
    const submitButton = screen.getByRole('button', { name: /login/i })
    
    await user.type(usernameInput, 'testuser')
    await user.type(passwordInput, 'testpass')
    
    expect(submitButton).not.toBeDisabled()
  })

  it('shows loading state during submission', async () => {
    const user = userEvent.setup()
    mockLogin.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))
    
    render(<LoginModal isOpen={true} onClose={mockOnClose} />)
    
    const usernameInput = screen.getByLabelText('Username')
    const passwordInput = screen.getByLabelText('Password')
    const submitButton = screen.getByRole('button', { name: /login/i })
    
    await user.type(usernameInput, 'testuser')
    await user.type(passwordInput, 'testpass')
    await user.click(submitButton)
    
    expect(screen.getByText('Logging in...')).toBeInTheDocument()
    expect(submitButton).toBeDisabled()
  })

  it('displays error message when login fails', () => {
    ;(useAuthStore as any).mockReturnValue({
      login: mockLogin,
      error: 'Invalid credentials',
      setError: mockSetError,
    })
    
    render(<LoginModal isOpen={true} onClose={mockOnClose} />)
    
    expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
  })

  it('clears error when modal is closed', async () => {
    const user = userEvent.setup()
    ;(useAuthStore as any).mockReturnValue({
      login: mockLogin,
      error: 'Invalid credentials',
      setError: mockSetError,
    })
    
    render(<LoginModal isOpen={true} onClose={mockOnClose} />)
    
    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    await user.click(cancelButton)
    
    expect(mockSetError).toHaveBeenCalledWith(null)
  })

  it('toggles password visibility', async () => {
    const user = userEvent.setup()
    render(<LoginModal isOpen={true} onClose={mockOnClose} />)
    
    const passwordInput = screen.getByLabelText('Password')
    const toggleButton = screen.getByTestId('password-toggle-button')
    
    expect(passwordInput).toHaveAttribute('type', 'password')
    
    await user.click(toggleButton)
    expect(passwordInput).toHaveAttribute('type', 'text')
    
    await user.click(toggleButton)
    expect(passwordInput).toHaveAttribute('type', 'password')
  })

  it('clears form fields when modal is closed', async () => {
    const user = userEvent.setup()
    render(<LoginModal isOpen={true} onClose={mockOnClose} />)
    
    const usernameInput = screen.getByLabelText('Username')
    const passwordInput = screen.getByLabelText('Password')
    
    await user.type(usernameInput, 'testuser')
    await user.type(passwordInput, 'testpass')
    
    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    await user.click(cancelButton)
    
    // Re-render to simulate reopening
    render(<LoginModal isOpen={true} onClose={mockOnClose} />)
    
    expect(screen.getByLabelText('Username')).toHaveValue('')
    expect(screen.getByLabelText('Password')).toHaveValue('')
  })

  it('handles login error gracefully', async () => {
    const user = userEvent.setup()
    const loginError = new Error('Network error')
    mockLogin.mockRejectedValue(loginError)
    
    render(<LoginModal isOpen={true} onClose={mockOnClose} />)
    
    const usernameInput = screen.getByLabelText('Username')
    const passwordInput = screen.getByLabelText('Password')
    const submitButton = screen.getByRole('button', { name: /login/i })
    
    await user.type(usernameInput, 'testuser')
    await user.type(passwordInput, 'testpass')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('testuser', 'testpass')
    })
    
    // Modal should not close on error
    expect(mockOnClose).not.toHaveBeenCalled()
  })
})
