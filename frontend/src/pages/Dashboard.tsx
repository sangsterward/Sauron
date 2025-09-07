import React, { useEffect, useState } from 'react'
import { useServiceStats } from '@/hooks/useServices'
import { useServerMetrics, useLiveMetrics, useCollectServerMetrics } from '@/hooks/useMetrics'
import { wsClient } from '@/lib/websocket'
import StatsCard from '@/components/StatsCard'
import ServiceDetails from '@/components/ServiceDetails'
import LiveUsageChart from '@/components/LiveUsageChart'
import ContainerPortMapping from '@/components/ContainerPortMapping'
import { Service, WebSocketMessage } from '@/types'
import { Activity, Wifi, WifiOff } from 'lucide-react'

const Dashboard: React.FC = () => {
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useServiceStats()
  const { data: serverMetrics, isLoading: metricsLoading, refetch: refetchServerMetrics } = useServerMetrics(1, false) // Disable auto-refresh
  const { data: liveMetrics, isLoading: liveLoading, refetch: refetchLiveMetrics } = useLiveMetrics(false) // Disable auto-refresh
  const collectServerMetrics = useCollectServerMetrics()
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [wsConnected, setWsConnected] = useState(false)

  useEffect(() => {
    // Connect to services WebSocket for real-time updates
    const servicesWs = wsClient.connect('/ws/services/', (message: WebSocketMessage) => {
      if (message.type === 'service_update') {
        // Update service in store
        console.log('Service updated:', message.service)
        refetchStats() // Refresh service stats
      } else if (message.type === 'status_change') {
        // Handle status changes
        console.log('Status changed:', message)
        refetchStats() // Refresh service stats
      }
    })

    // Connect to monitoring WebSocket for real-time metrics
    const monitoringWs = wsClient.connect('/ws/monitoring/', (message: WebSocketMessage) => {
      if (message.type === 'metrics_update') {
        console.log('Metrics updated:', message.data)
        refetchServerMetrics() // Refresh server metrics
      } else if (message.type === 'container_update') {
        console.log('Containers updated:', message.containers)
        refetchLiveMetrics() // Refresh live metrics
      }
    })

    // Check WebSocket connection status
    const checkConnection = () => {
      setWsConnected(servicesWs.readyState === WebSocket.OPEN && monitoringWs.readyState === WebSocket.OPEN)
    }

    servicesWs.addEventListener('open', checkConnection)
    servicesWs.addEventListener('close', checkConnection)
    servicesWs.addEventListener('error', checkConnection)
    monitoringWs.addEventListener('open', checkConnection)
    monitoringWs.addEventListener('close', checkConnection)
    monitoringWs.addEventListener('error', checkConnection)

    return () => {
      wsClient.disconnect('/ws/services/')
      wsClient.disconnect('/ws/monitoring/')
    }
  }, [refetchStats, refetchServerMetrics, refetchLiveMetrics])

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
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            {wsConnected ? (
              <>
                <Wifi className="h-4 w-4 text-green-500" />
                <span>Live Updates</span>
              </>
            ) : (
              <>
                <WifiOff className="h-4 w-4 text-gray-400" />
                <span>Offline Mode</span>
              </>
            )}
          </div>
        </div>
      </div>

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
            {wsConnected && (
              <div className="flex items-center space-x-1 text-xs text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Live</span>
              </div>
            )}
          </h3>
          <button
            onClick={handleCollectMetrics}
            disabled={collectServerMetrics.isPending}
            className="btn btn-primary flex items-center space-x-2"
            data-testid="collect-metrics-button"
          >
            <Activity
              className={`h-4 w-4 ${
                collectServerMetrics.isPending ? 'animate-pulse' : ''
              }`}
            />
            <span>Collect Metrics</span>
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
        <ContainerPortMapping 
          containers={liveMetrics?.containers || []} 
          dockerMetrics={liveMetrics?.docker || []}
        />
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
