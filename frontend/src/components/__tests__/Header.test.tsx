import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import Header from '../Header'

describe('Header', () => {
  it('renders the application title', () => {
    render(<Header />)

    expect(screen.getByText('Home Hub Monitor')).toBeInTheDocument()
  })

  it('renders navigation icons', () => {
    render(<Header />)

    // Check that the header contains the expected structure
    expect(screen.getByRole('banner')).toBeInTheDocument()

    // Check for the monitor icon (it should be present as an SVG)
    const monitorIcon = document.querySelector('svg')
    expect(monitorIcon).toBeInTheDocument()
  })

  it('renders action buttons', () => {
    render(<Header />)

    // Check for action buttons (Bell, Settings, User)
    const buttons = screen.getAllByRole('button')
    expect(buttons).toHaveLength(3) // Bell, Settings, User buttons
  })
})
