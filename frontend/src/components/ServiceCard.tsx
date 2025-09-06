import React from 'react'
import { Service } from '@/types'
import {
  Server,
  Play,
  Square,
  RotateCcw,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Wrench,
} from 'lucide-react'
import { useServiceActions } from '@/hooks/useServices'

interface ServiceCardProps {
  service: Service
  onViewDetails: (service: Service) => void
}

const ServiceCard: React.FC<ServiceCardProps> = ({
  service,
  onViewDetails,
}) => {
  const { startContainer, stopContainer } = useServiceActions()

  const statusConfig = {
    healthy: { color: 'text-green-600', bg: 'bg-green-50', icon: CheckCircle },
    unhealthy: { color: 'text-red-600', bg: 'bg-red-50', icon: XCircle },
    unknown: { color: 'text-gray-600', bg: 'bg-gray-50', icon: AlertCircle },
    maintenance: { color: 'text-yellow-600', bg: 'bg-yellow-50', icon: Wrench },
  }

  const config =
    statusConfig[service.status as keyof typeof statusConfig] ||
    statusConfig.unknown
  const StatusIcon = config.icon

  const handleStart = () => {
    startContainer.mutate(service.id)
  }

  const handleStop = () => {
    stopContainer.mutate(service.id)
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${config.bg}`}>
            <Server className={`h-5 w-5 ${config.color}`} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{service.name}</h3>
            <p className="text-sm text-gray-500">{service.service_type}</p>
          </div>
        </div>
        <div
          className={`flex items-center space-x-1 px-2 py-1 rounded-full ${config.bg}`}
        >
          <StatusIcon className={`h-4 w-4 ${config.color}`} />
          <span className={`text-sm font-medium ${config.color}`}>
            {service.status}
          </span>
        </div>
      </div>

      {service.description && (
        <p className="text-sm text-gray-600 mb-4">{service.description}</p>
      )}

      <div className="space-y-2 mb-4">
        {service.container_name && (
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <span className="font-medium">Container:</span>
            <span>{service.container_name}</span>
          </div>
        )}
        {service.image_name && (
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <span className="font-medium">Image:</span>
            <span>{service.image_name}</span>
          </div>
        )}
        {service.endpoint_url && (
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <span className="font-medium">URL:</span>
            <span className="truncate">{service.endpoint_url}</span>
          </div>
        )}
        {service.last_checked && (
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Clock className="h-4 w-4" />
            <span>
              Last checked: {new Date(service.last_checked).toLocaleString()}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={() => onViewDetails(service)}
          className="text-primary-600 hover:text-primary-700 text-sm font-medium"
        >
          View Details
        </button>

        {service.service_type === 'docker' && (
          <div className="flex space-x-2">
            <button
              onClick={handleStart}
              disabled={startContainer.isPending}
              className="p-1 text-green-600 hover:text-green-700 disabled:opacity-50"
              title="Start Container"
            >
              <Play className="h-4 w-4" />
            </button>
            <button
              onClick={handleStop}
              disabled={stopContainer.isPending}
              className="p-1 text-red-600 hover:text-red-700 disabled:opacity-50"
              title="Stop Container"
            >
              <Square className="h-4 w-4" />
            </button>
            <button
              className="p-1 text-blue-600 hover:text-blue-700"
              title="Restart Container"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default ServiceCard
