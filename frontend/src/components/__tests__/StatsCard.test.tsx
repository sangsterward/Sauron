import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import StatsCard from '../StatsCard'

describe('StatsCard', () => {
  it('renders with correct title and value', () => {
    render(
      <StatsCard title="Total Services" value={42} icon="server" color="blue" />
    )

    expect(screen.getByText('Total Services')).toBeInTheDocument()
    expect(screen.getByText('42')).toBeInTheDocument()
  })

  it('renders with different colors', () => {
    const { rerender } = render(
      <StatsCard
        title="Healthy Services"
        value={10}
        icon="check-circle"
        color="green"
      />
    )

    expect(screen.getByText('Healthy Services')).toBeInTheDocument()
    expect(screen.getByText('10')).toBeInTheDocument()

    rerender(
      <StatsCard
        title="Unhealthy Services"
        value={2}
        icon="x-circle"
        color="red"
      />
    )

    expect(screen.getByText('Unhealthy Services')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('renders with different icons', () => {
    render(
      <StatsCard title="Service Types" value={5} icon="layers" color="purple" />
    )

    expect(screen.getByText('Service Types')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('handles unknown icon gracefully', () => {
    render(
      <StatsCard title="Test" value={1} icon="unknown-icon" color="blue" />
    )

    expect(screen.getByText('Test')).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()
  })
})
