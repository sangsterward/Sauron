import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import Sidebar from '../Sidebar'

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>)
}

describe('Sidebar', () => {
  it('renders all navigation items', () => {
    renderWithRouter(<Sidebar />)

    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Services')).toBeInTheDocument()
    expect(screen.getByText('Monitoring')).toBeInTheDocument()
    expect(screen.getByText('Alerts')).toBeInTheDocument()
    expect(screen.getByText('Docker')).toBeInTheDocument()
    expect(screen.getByText('Settings')).toBeInTheDocument()
  })

  it('renders navigation links', () => {
    renderWithRouter(<Sidebar />)

    const links = screen.getAllByRole('link')
    expect(links).toHaveLength(6) // All navigation items should be links
  })

  it('has correct href attributes', () => {
    renderWithRouter(<Sidebar />)

    expect(screen.getByRole('link', { name: /dashboard/i })).toHaveAttribute(
      'href',
      '/'
    )
    expect(screen.getByRole('link', { name: /services/i })).toHaveAttribute(
      'href',
      '/services'
    )
    expect(screen.getByRole('link', { name: /monitoring/i })).toHaveAttribute(
      'href',
      '/monitoring'
    )
    expect(screen.getByRole('link', { name: /alerts/i })).toHaveAttribute(
      'href',
      '/alerts'
    )
    expect(screen.getByRole('link', { name: /docker/i })).toHaveAttribute(
      'href',
      '/docker'
    )
    expect(screen.getByRole('link', { name: /settings/i })).toHaveAttribute(
      'href',
      '/settings'
    )
  })
})
