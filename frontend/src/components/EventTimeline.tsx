import React from 'react'
import { useEventsStore } from '@/store/events'
import { Clock, XCircle, AlertTriangle, Info } from 'lucide-react'

const EventTimeline: React.FC = () => {
  const { events } = useEventsStore()

  const getEventIcon = (severity: string) => {
    switch (severity) {
      case 'info':
        return <Info className="h-4 w-4 text-blue-600" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'critical':
        return <XCircle className="h-4 w-4 text-red-800" />
      default:
        return <Info className="h-4 w-4 text-gray-600" />
    }
  }

  const getEventColor = (severity: string) => {
    switch (severity) {
      case 'info':
        return 'border-blue-200 bg-blue-50'
      case 'warning':
        return 'border-yellow-200 bg-yellow-50'
      case 'error':
        return 'border-red-200 bg-red-50'
      case 'critical':
        return 'border-red-300 bg-red-100'
      default:
        return 'border-gray-200 bg-gray-50'
    }
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Clock className="h-8 w-8 mx-auto mb-2" />
        <p>No recent events</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {events.slice(0, 10).map((event) => (
        <div
          key={event.id}
          className={`border-l-4 pl-4 py-2 ${getEventColor(event.severity)}`}
        >
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 mt-1">
              {getEventIcon(event.severity)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {event.title}
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(event.timestamp).toLocaleTimeString()}
                </p>
              </div>
              <p className="text-sm text-gray-600 mt-1">{event.message}</p>
              <p className="text-xs text-gray-500 mt-1">{event.service_name}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default EventTimeline
