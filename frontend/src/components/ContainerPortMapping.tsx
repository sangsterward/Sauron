import React from 'react'
import { Server, ExternalLink, Globe, Lock, Cpu, MemoryStick, Activity } from 'lucide-react'
import { Container, DockerMetrics } from '@/types'

interface ContainerPortMappingProps {
  containers: Container[]
  dockerMetrics?: DockerMetrics[]
}

const ContainerPortMapping: React.FC<ContainerPortMappingProps> = ({ containers, dockerMetrics = [] }) => {
  const runningContainers = containers?.filter(container => 
    container.status === 'running' || container.status.startsWith('up')
  ) || []

  // Helper function to get metrics for a container
  const getContainerMetrics = (containerName: string): DockerMetrics | undefined => {
    return dockerMetrics.find(metric => 
      metric.container_name === containerName || 
      metric.container_name === containerName.replace(/^sauron-/, '').replace(/-1$/, '')
    )
  }

  const getPortIcon = (port: string) => {
    if (port.includes('443')) return <Lock className="h-4 w-4 text-green-600" />
    if (port.includes('80')) return <Globe className="h-4 w-4 text-blue-600" />
    return <ExternalLink className="h-4 w-4 text-gray-600" />
  }

  const formatPorts = (ports: string[]) => {
    if (!ports || ports.length === 0) return []
    
    return ports.map(port => {
      const [hostPort, containerPort] = port.split(':')
      return {
        host: hostPort,
        container: containerPort,
        protocol: hostPort.includes('443') ? 'HTTPS' : hostPort.includes('80') ? 'HTTP' : 'TCP'
      }
    })
  }

  if (runningContainers.length === 0) {
    return (
      <div className="text-center py-8">
        <Server className="h-12 w-12 text-gray-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-white mb-2">No Running Containers</h3>
        <p className="text-gray-400">No containers are currently running.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {runningContainers.map((container) => {
        const ports = formatPorts(container.ports || [])
        const metrics = getContainerMetrics(container.name)
        
        return (
          <div key={container.id} className="border border-gray-600 rounded-lg p-4 bg-gray-600">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Server className="h-5 w-5 text-blue-400" />
                <h4 className="font-medium text-white">{container.name}</h4>
                <span className="px-2 py-1 bg-green-600 text-green-100 text-xs rounded-full">
                  {container.status}
                </span>
              </div>
              <div className="text-sm text-gray-400">
                {container.image}
              </div>
            </div>

            {/* Container Metrics */}
            {metrics && (
              <div className="mb-4 p-3 bg-gray-700 rounded-lg border border-gray-500">
                <h5 className="text-sm font-medium text-white mb-2 flex items-center">
                  <Activity className="h-4 w-4 mr-1" />
                  Resource Usage
                </h5>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="flex items-center space-x-2">
                    <Cpu className="h-4 w-4 text-blue-400" />
                    <div>
                      <div className="text-sm font-medium text-white">
                        {metrics.cpu_percent.toFixed(1)}%
                      </div>
                      <div className="text-xs text-gray-400">CPU</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MemoryStick className="h-4 w-4 text-green-400" />
                    <div>
                      <div className="text-sm font-medium text-white">
                        {metrics.memory_usage_mb.toFixed(1)}MB
                      </div>
                      <div className="text-xs text-gray-400">Memory</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <ExternalLink className="h-4 w-4 text-purple-400" />
                    <div>
                      <div className="text-sm font-medium text-white">
                        {metrics.network_rx_mb.toFixed(1)}MB
                      </div>
                      <div className="text-xs text-gray-400">RX</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <ExternalLink className="h-4 w-4 text-orange-400" />
                    <div>
                      <div className="text-sm font-medium text-white">
                        {metrics.network_tx_mb.toFixed(1)}MB
                      </div>
                      <div className="text-xs text-gray-400">TX</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {ports.length > 0 ? (
              <div className="space-y-2">
                <h5 className="text-sm font-medium text-white">Port Mappings:</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {ports.map((port, index) => (
                    <div key={index} className="flex items-center space-x-2 p-2 bg-gray-700 rounded border border-gray-500">
                      {getPortIcon(port.host)}
                      <div className="flex-1">
                        <div className="text-sm font-medium text-white">
                          {port.host}:{port.container}
                        </div>
                        <div className="text-xs text-gray-400">
                          {port.protocol}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-400 italic">
                No port mappings configured
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default ContainerPortMapping
