import React, { useEffect, useState } from 'react'
import { useServiceStats, useServices } from '@/hooks/useServices'
import { useEventsStore } from '@/store/events'
import { wsClient } from '@/lib/websocket'
import StatsCard from '@/components/StatsCard'
import ServiceCard from '@/components/ServiceCard'
import EventTimeline from '@/components/EventTimeline'
import ServiceDetails from '@/components/ServiceDetails'
import { Service, WebSocketMessage } from '@/types'

const Dashboard: React.FC = () => {
  const { data: stats, isLoading: statsLoading } = useServiceStats()
  const { data: services, isLoading: servicesLoading } = useServices()
  const { addEvent } = useEventsStore()
  const [selectedService, setSelectedService] = useState<Service | null>(null)

  useEffect(() => {
    // Connect to services WebSocket for real-time updates
    wsClient.connect('/ws/services/', (message: WebSocketMessage) => {
      if (message.type === 'service_update') {
        // Update service in store
        console.log('Service updated:', message.service)
      } else if (message.type === 'status_change') {
        // Handle status changes
        console.log('Status changed:', message)
      }
    })

    // Connect to events WebSocket
    wsClient.connect('/ws/events/', (message: WebSocketMessage) => {
      if (message.type === 'new_event') {
        addEvent(message.event)
      }
    })

    return () => {
      wsClient.disconnect('/ws/services/')
      wsClient.disconnect('/ws/events/')
    }
  }, [addEvent])

  if (statsLoading || servicesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div
          data-cy="loading-spinner"
          className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"
        ></div>
      </div>
    )
  }

  const recentServices = services?.slice(0, 6) || []

  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-900 mb-6">Dashboard</h2>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Total Services"
          value={stats?.total_services || 0}
          icon="server"
          color="blue"
        />
        <StatsCard
          title="Healthy Services"
          value={stats?.healthy_services || 0}
          icon="check-circle"
          color="green"
        />
        <StatsCard
          title="Unhealthy Services"
          value={stats?.unhealthy_services || 0}
          icon="x-circle"
          color="red"
        />
        <StatsCard
          title="Service Types"
          value={Object.keys(stats?.service_types || {}).length}
          icon="layers"
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Services Overview */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Services
          </h3>
          <div className="space-y-4">
            {recentServices.map((service: Service) => (
              <ServiceCard
                key={service.id}
                service={service}
                onViewDetails={setSelectedService}
              />
            ))}
          </div>
        </div>

        {/* Event Timeline */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Events
          </h3>
          <EventTimeline />
        </div>
      </div>

      {selectedService && (
        <ServiceDetails
          service={selectedService}
          onClose={() => setSelectedService(null)}
        />
      )}
    </div>
  )
}

export default Dashboard
