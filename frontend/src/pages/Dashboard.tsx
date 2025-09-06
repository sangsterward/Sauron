import React, { useEffect, useState } from 'react'
import { useServiceStats } from '@/hooks/useServices'
import { useServerMetrics, useLiveMetrics, useCollectServerMetrics } from '@/hooks/useMetrics'
import { wsClient } from '@/lib/websocket'
import StatsCard from '@/components/StatsCard'
import ServiceDetails from '@/components/ServiceDetails'
import LiveUsageChart from '@/components/LiveUsageChart'
import ContainerPortMapping from '@/components/ContainerPortMapping'
import { Service, WebSocketMessage } from '@/types'
import { Activity, RefreshCw } from 'lucide-react'

const Dashboard: React.FC = () => {
  const { data: stats, isLoading: statsLoading } = useServiceStats()
  const { data: serverMetrics, isLoading: metricsLoading } = useServerMetrics(1) // Last hour
  const { data: liveMetrics, isLoading: liveLoading } = useLiveMetrics()
  const collectServerMetrics = useCollectServerMetrics()
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

    return () => {
      wsClient.disconnect('/ws/services/')
    }
  }, [])

  if (statsLoading || metricsLoading || liveLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div
          data-testid="loading-spinner"
          className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"
        ></div>
      </div>
    )
  }

  const handleCollectMetrics = () => {
    collectServerMetrics.mutate()
  }

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

      {/* Live Usage Chart */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <Activity className="h-5 w-5 text-blue-600" />
            <span>Live System Usage</span>
          </h3>
          <button
            onClick={handleCollectMetrics}
            disabled={collectServerMetrics.isPending}
            className="btn btn-primary flex items-center space-x-2"
            data-testid="collect-metrics-button"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                collectServerMetrics.isPending ? 'animate-spin' : ''
              }`}
            />
            <span>Refresh</span>
          </button>
        </div>
        <LiveUsageChart 
          data={serverMetrics || []} 
          height={300}
        />
      </div>

      {/* Container Port Mapping */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Active Container Port Mappings
        </h3>
        <ContainerPortMapping containers={liveMetrics?.containers || []} />
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
