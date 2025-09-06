import React from 'react'
import { render, screen } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import LiveUsageChart from '../LiveUsageChart'
import { ServerMetrics } from '@/types'

// Mock Chart.js
vi.mock('chart.js', () => ({
  Chart: {
    register: vi.fn(),
  },
  CategoryScale: vi.fn(),
  LinearScale: vi.fn(),
  PointElement: vi.fn(),
  LineElement: vi.fn(),
  Title: vi.fn(),
  Tooltip: vi.fn(),
  Legend: vi.fn(),
}))

// Mock react-chartjs-2
vi.mock('react-chartjs-2', () => ({
  Line: ({ data, options }: any) => (
    <div data-testid="line-chart" data-chart-data={JSON.stringify(data)} data-chart-options={JSON.stringify(options)}>
      Live Usage Chart
    </div>
  ),
}))

describe('LiveUsageChart', () => {
  const mockServerMetrics: ServerMetrics[] = [
    {
      id: 1,
      timestamp: '2024-01-01T10:00:00Z',
      cpu_percent: 25.5,
      memory_percent: 60.2,
      memory_used_mb: 1024,
      memory_total_mb: 2048,
      disk_percent: 45.8,
      disk_used_gb: 50,
      disk_total_gb: 100,
      network_rx_mb: 10.5,
      network_tx_mb: 8.2,
      load_average_1m: 1.2,
      load_average_5m: 1.1,
      load_average_15m: 1.0,
    },
    {
      id: 2,
      timestamp: '2024-01-01T10:01:00Z',
      cpu_percent: 30.0,
      memory_percent: 65.0,
      memory_used_mb: 1200,
      memory_total_mb: 2048,
      disk_percent: 50.0,
      disk_used_gb: 55,
      disk_total_gb: 100,
      network_rx_mb: 15.0,
      network_tx_mb: 12.0,
      load_average_1m: 1.5,
      load_average_5m: 1.3,
      load_average_15m: 1.1,
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders chart with data', () => {
    render(<LiveUsageChart data={mockServerMetrics} />)
    
    expect(screen.getByTestId('line-chart')).toBeInTheDocument()
    expect(screen.getByText('Live Usage Chart')).toBeInTheDocument()
  })

  it('renders no data message when data is empty', () => {
    render(<LiveUsageChart data={[]} />)
    
    expect(screen.getByText('No Data Available')).toBeInTheDocument()
    expect(screen.getByText('Collecting metrics...')).toBeInTheDocument()
  })

  it('uses custom height when provided', () => {
    render(<LiveUsageChart data={mockServerMetrics} height={400} />)
    
    const chartContainer = screen.getByTestId('line-chart').parentElement
    expect(chartContainer).toHaveStyle('height: 400px')
  })

  it('uses default height when not provided', () => {
    render(<LiveUsageChart data={mockServerMetrics} />)
    
    const chartContainer = screen.getByTestId('line-chart').parentElement
    expect(chartContainer).toHaveStyle('height: 300px')
  })

  it('shows only recent data points (last 20)', () => {
    // Create 25 data points
    const manyDataPoints = Array.from({ length: 25 }, (_, i) => ({
      ...mockServerMetrics[0],
      id: i + 1,
      timestamp: `2024-01-01T10:${i.toString().padStart(2, '0')}:00Z`,
      cpu_percent: 20 + i,
      memory_percent: 50 + i,
      disk_percent: 40 + i,
    }))

    render(<LiveUsageChart data={manyDataPoints} />)
    
    const chartElement = screen.getByTestId('line-chart')
    const chartData = JSON.parse(chartElement.getAttribute('data-chart-data') || '{}')
    
    // Should only show last 20 data points
    expect(chartData.labels).toHaveLength(20)
    expect(chartData.datasets[0].data).toHaveLength(20)
  })

  it('includes all three metrics in chart data', () => {
    render(<LiveUsageChart data={mockServerMetrics} />)
    
    const chartElement = screen.getByTestId('line-chart')
    const chartData = JSON.parse(chartElement.getAttribute('data-chart-data') || '{}')
    
    expect(chartData.datasets).toHaveLength(3)
    expect(chartData.datasets[0].label).toBe('CPU Usage %')
    expect(chartData.datasets[1].label).toBe('Memory Usage %')
    expect(chartData.datasets[2].label).toBe('Disk Usage %')
  })

  it('formats timestamps correctly', () => {
    render(<LiveUsageChart data={mockServerMetrics} />)
    
    const chartElement = screen.getByTestId('line-chart')
    const chartData = JSON.parse(chartElement.getAttribute('data-chart-data') || '{}')
    
    expect(chartData.labels).toHaveLength(2)
    // Labels should be formatted time strings
    expect(chartData.labels[0]).toMatch(/\d{1,2}:\d{2}:\d{2}/)
  })

  it('sets correct chart options', () => {
    render(<LiveUsageChart data={mockServerMetrics} />)
    
    const chartElement = screen.getByTestId('line-chart')
    const chartOptions = JSON.parse(chartElement.getAttribute('data-chart-options') || '{}')
    
    expect(chartOptions.responsive).toBe(true)
    expect(chartOptions.maintainAspectRatio).toBe(false)
    expect(chartOptions.plugins.title.text).toBe('Live System Usage')
    // Max value should be auto-scaled based on data (65.0 * 1.1 = 72)
    expect(chartOptions.scales.y.max).toBe(72)
  })

  it('disables animation for live updates', () => {
    render(<LiveUsageChart data={mockServerMetrics} />)
    
    const chartElement = screen.getByTestId('line-chart')
    const chartOptions = JSON.parse(chartElement.getAttribute('data-chart-options') || '{}')
    
    expect(chartOptions.animation.duration).toBe(0)
  })

  it('sets correct point styling', () => {
    render(<LiveUsageChart data={mockServerMetrics} />)
    
    const chartElement = screen.getByTestId('line-chart')
    const chartOptions = JSON.parse(chartElement.getAttribute('data-chart-options') || '{}')
    
    expect(chartOptions.elements.point.radius).toBe(2)
    expect(chartOptions.elements.point.hoverRadius).toBe(4)
  })
})
