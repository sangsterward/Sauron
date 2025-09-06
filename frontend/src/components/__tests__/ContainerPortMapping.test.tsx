// import React from 'react'
import { render, screen } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import ContainerPortMapping from '../ContainerPortMapping'
import { Container } from '@/types'

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Server: () => <div data-testid="server-icon" />,
  ExternalLink: () => <div data-testid="external-link-icon" />,
  Globe: () => <div data-testid="globe-icon" />,
  Lock: () => <div data-testid="lock-icon" />,
}))

describe('ContainerPortMapping', () => {
  const mockContainers: Container[] = [
    {
      id: 'container1',
      name: 'web-app',
      image: 'nginx:latest',
      status: 'running',
      ports: ['80:80', '443:443'],
    },
    {
      id: 'container2',
      name: 'database',
      image: 'postgres:13',
      status: 'running',
      ports: ['5432:5432'],
    },
    {
      id: 'container3',
      name: 'stopped-app',
      image: 'redis:6',
      status: 'stopped',
      ports: ['6379:6379'],
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders running containers with port mappings', () => {
    render(<ContainerPortMapping containers={mockContainers} />)
    
    expect(screen.getByText('web-app')).toBeInTheDocument()
    expect(screen.getByText('database')).toBeInTheDocument()
    expect(screen.getByText('nginx:latest')).toBeInTheDocument()
    expect(screen.getByText('postgres:13')).toBeInTheDocument()
  })

  it('does not render stopped containers', () => {
    render(<ContainerPortMapping containers={mockContainers} />)
    
    expect(screen.queryByText('stopped-app')).not.toBeInTheDocument()
    expect(screen.queryByText('redis:6')).not.toBeInTheDocument()
  })

  it('displays port mappings correctly', () => {
    render(<ContainerPortMapping containers={mockContainers} />)
    
    expect(screen.getByText('80:80')).toBeInTheDocument()
    expect(screen.getByText('443:443')).toBeInTheDocument()
    expect(screen.getByText('5432:5432')).toBeInTheDocument()
  })

  it('shows correct protocol labels', () => {
    render(<ContainerPortMapping containers={mockContainers} />)
    
    expect(screen.getByText('HTTP')).toBeInTheDocument()
    expect(screen.getByText('HTTPS')).toBeInTheDocument()
    expect(screen.getByText('TCP')).toBeInTheDocument()
  })

  it('displays container status badges', () => {
    render(<ContainerPortMapping containers={mockContainers} />)
    
    const statusBadges = screen.getAllByText('running')
    expect(statusBadges).toHaveLength(2) // Only running containers
  })

  it('shows no running containers message when empty', () => {
    render(<ContainerPortMapping containers={[]} />)
    
    expect(screen.getByText('No Running Containers')).toBeInTheDocument()
    expect(screen.getByText('No containers are currently running.')).toBeInTheDocument()
  })

  it('shows no running containers message when only stopped containers', () => {
    const stoppedContainers: Container[] = [
      {
        id: 'container1',
        name: 'stopped-app',
        image: 'redis:6',
        status: 'stopped',
        ports: ['6379:6379'],
      },
    ]
    
    render(<ContainerPortMapping containers={stoppedContainers} />)
    
    expect(screen.getByText('No Running Containers')).toBeInTheDocument()
  })

  it('handles containers without port mappings', () => {
    const containersWithoutPorts: Container[] = [
      {
        id: 'container1',
        name: 'no-ports-app',
        image: 'alpine:latest',
        status: 'running',
        ports: [],
      },
    ]
    
    render(<ContainerPortMapping containers={containersWithoutPorts} />)
    
    expect(screen.getByText('no-ports-app')).toBeInTheDocument()
    expect(screen.getByText('No port mappings configured')).toBeInTheDocument()
  })

  it('handles containers with undefined ports', () => {
    const containersWithUndefinedPorts: Container[] = [
      {
        id: 'container1',
        name: 'undefined-ports-app',
        image: 'alpine:latest',
        status: 'running',
      },
    ]
    
    render(<ContainerPortMapping containers={containersWithUndefinedPorts} />)
    
    expect(screen.getByText('undefined-ports-app')).toBeInTheDocument()
    expect(screen.getByText('No port mappings configured')).toBeInTheDocument()
  })

  it('renders correct icons for different port types', () => {
    render(<ContainerPortMapping containers={mockContainers} />)
    
    // Should have server icons for containers
    expect(screen.getAllByTestId('server-icon')).toHaveLength(2)
    
    // Should have globe icon for HTTP (port 80)
    expect(screen.getByTestId('globe-icon')).toBeInTheDocument()
    
    // Should have lock icon for HTTPS (port 443)
    expect(screen.getByTestId('lock-icon')).toBeInTheDocument()
    
    // Should have external link icons for other ports
    expect(screen.getAllByTestId('external-link-icon')).toHaveLength(1)
  })

  it('formats port mappings correctly', () => {
    render(<ContainerPortMapping containers={mockContainers} />)
    
    // Check that port mappings are displayed in the correct format
    const portElements = screen.getAllByText(/\d+:\d+/)
    expect(portElements).toHaveLength(3) // 80:80, 443:443, 5432:5432
  })

  it('displays container images', () => {
    render(<ContainerPortMapping containers={mockContainers} />)
    
    expect(screen.getByText('nginx:latest')).toBeInTheDocument()
    expect(screen.getByText('postgres:13')).toBeInTheDocument()
  })

  it('handles multiple containers with same port types', () => {
    const containersWithSamePorts: Container[] = [
      {
        id: 'container1',
        name: 'web-app-1',
        image: 'nginx:latest',
        status: 'running',
        ports: ['80:80'],
      },
      {
        id: 'container2',
        name: 'web-app-2',
        image: 'nginx:latest',
        status: 'running',
        ports: ['8080:80'],
      },
    ]
    
    render(<ContainerPortMapping containers={containersWithSamePorts} />)
    
    expect(screen.getByText('web-app-1')).toBeInTheDocument()
    expect(screen.getByText('web-app-2')).toBeInTheDocument()
    expect(screen.getByText('80:80')).toBeInTheDocument()
    expect(screen.getByText('8080:80')).toBeInTheDocument()
  })
})
