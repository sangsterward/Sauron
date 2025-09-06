import React from 'react'
import { Server, ExternalLink, Globe, Lock } from 'lucide-react'
import { Container } from '@/types'

interface ContainerPortMappingProps {
  containers: Container[]
}

const ContainerPortMapping: React.FC<ContainerPortMappingProps> = ({ containers }) => {
  const runningContainers = containers?.filter(container => 
    container.status === 'running' || container.status.startsWith('up')
  ) || []

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
        <Server className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Running Containers</h3>
        <p className="text-gray-600">No containers are currently running.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {runningContainers.map((container) => {
        const ports = formatPorts(container.ports || [])
        
        return (
          <div key={container.id} className="border rounded-lg p-4 bg-gray-50">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Server className="h-5 w-5 text-blue-600" />
                <h4 className="font-medium text-gray-900">{container.name}</h4>
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                  {container.status}
                </span>
              </div>
              <div className="text-sm text-gray-500">
                {container.image}
              </div>
            </div>
            
            {ports.length > 0 ? (
              <div className="space-y-2">
                <h5 className="text-sm font-medium text-gray-700">Port Mappings:</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {ports.map((port, index) => (
                    <div key={index} className="flex items-center space-x-2 p-2 bg-white rounded border">
                      {getPortIcon(port.host)}
                      <div className="flex-1">
                        <div className="text-sm font-medium">
                          {port.host}:{port.container}
                        </div>
                        <div className="text-xs text-gray-500">
                          {port.protocol}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-500 italic">
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
