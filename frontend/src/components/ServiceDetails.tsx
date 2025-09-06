import React, { useEffect, useState } from 'react'
import { Service, Event } from '@/types'
import { X, Activity, Clock, AlertTriangle, CheckCircle } from 'lucide-react'
import { wsClient } from '@/lib/websocket'

interface ServiceDetailsProps {
  service: Service
  onClose: () => void
}

const ServiceDetails: React.FC<ServiceDetailsProps> = ({
  service,
  onClose,
}) => {
  const [events] = useState<Event[]>([])
  const [logs, setLogs] = useState<string>('')

  useEffect(() => {
    // Connect to service-specific WebSocket
    const ws = wsClient.connect(`/ws/services/${service.id}/`, (message) => {
      if (message.type === 'service_update') {
        // Handle service updates
        console.log('Service updated:', message.service)
      } else if (message.type === 'health_check_result') {
        // Handle health check results
        console.log('Health check result:', message.result)
      } else if (message.type === 'logs') {
        setLogs(message.logs)
      }
    })

    // Request logs
    ws.send(JSON.stringify({ type: 'get_logs' }))

    return () => {
      wsClient.disconnect(`/ws/services/${service.id}/`)
    }
  }, [service.id])

  const statusConfig = {
    healthy: { color: 'text-green-600', bg: 'bg-green-50', icon: CheckCircle },
    unhealthy: { color: 'text-red-600', bg: 'bg-red-50', icon: AlertTriangle },
    unknown: { color: 'text-gray-600', bg: 'bg-gray-50', icon: Clock },
    maintenance: { color: 'text-yellow-600', bg: 'bg-yellow-50', icon: Clock },
  }

  const config =
    statusConfig[service.status as keyof typeof statusConfig] ||
    statusConfig.unknown
  const StatusIcon = config.icon

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${config.bg}`}>
              <StatusIcon className={`h-6 w-6 ${config.color}`} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {service.name}
              </h2>
              <p className="text-gray-600">{service.service_type}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Service Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Service Information
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Description
                  </label>
                  <p className="text-gray-900">
                    {service.description || 'No description'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Status
                  </label>
                  <div
                    className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full ${config.bg}`}
                  >
                    <StatusIcon className={`h-4 w-4 ${config.color}`} />
                    <span className={`text-sm font-medium ${config.color}`}>
                      {service.status}
                    </span>
                  </div>
                </div>
                {service.container_name && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Container Name
                    </label>
                    <p className="text-gray-900">{service.container_name}</p>
                  </div>
                )}
                {service.image_name && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Image
                    </label>
                    <p className="text-gray-900">{service.image_name}</p>
                  </div>
                )}
                {service.endpoint_url && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Endpoint URL
                    </label>
                    <p className="text-gray-900">{service.endpoint_url}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Check Interval
                  </label>
                  <p className="text-gray-900">
                    {service.check_interval} seconds
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Last Checked
                  </label>
                  <p className="text-gray-900">
                    {service.last_checked
                      ? new Date(service.last_checked).toLocaleString()
                      : 'Never'}
                  </p>
                </div>
              </div>
            </div>

            {/* Health Checks */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Health Checks
              </h3>
              <div className="space-y-3">
                {/* Placeholder for health checks */}
                <div className="text-center py-8 text-gray-500">
                  <Activity className="h-8 w-8 mx-auto mb-2" />
                  <p>Health checks will be displayed here</p>
                </div>
              </div>
            </div>

            {/* Recent Events */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Recent Events
              </h3>
              <div className="space-y-3">
                {events.length > 0 ? (
                  events.map((event) => (
                    <div
                      key={event.id}
                      className="border-l-4 border-gray-200 pl-4"
                    >
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-900">
                          {event.title}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(event.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{event.message}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="h-8 w-8 mx-auto mb-2" />
                    <p>No recent events</p>
                  </div>
                )}
              </div>
            </div>

            {/* Logs */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Logs</h3>
              <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm max-h-64 overflow-y-auto">
                {logs || 'No logs available'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ServiceDetails
