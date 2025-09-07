import React, { useState, useEffect } from 'react'
import {
  useServerMetrics,
  useMetricsSummary,
  useLiveMetrics,
  useCollectServerMetrics,
  useCollectDockerMetrics,
} from '@/hooks/useMetrics'
import { MetricsChart } from '@/components/MetricsChart'
import BrainAnimation from '@/components/BrainAnimation'
import { wsClient } from '@/lib/websocket'
import { WebSocketMessage } from '@/types'
import {
  Cpu,
  HardDrive,
  MemoryStick,
  Network,
  RefreshCw,
  Activity,
  Server,
  Container,
  // TrendingUp,
  AlertTriangle,
  Wifi,
  WifiOff,
  Clock,
} from 'lucide-react'

const Monitoring: React.FC = () => {
  const [timeRange, setTimeRange] = useState(1) // hours
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [refreshInterval, setRefreshInterval] = useState(10) // seconds
  const [wsConnected, setWsConnected] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  
  const { data: serverMetrics, isLoading: serverLoading, refetch: refetchServerMetrics } =
    useServerMetrics(timeRange, false) // Disable built-in auto-refresh, we handle it manually
  const { data: summary, isLoading: summaryLoading, refetch: refetchSummary } = useMetricsSummary(false)
  const { data: liveMetrics, isLoading: liveLoading, refetch: refetchLiveMetrics } = useLiveMetrics(false)

  const collectServerMetrics = useCollectServerMetrics()
  const collectDockerMetrics = useCollectDockerMetrics()

  const handleCollectMetrics = () => {
    collectServerMetrics.mutate()
    collectDockerMetrics.mutate()
    setLastUpdate(new Date())
  }

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      refetchServerMetrics()
      refetchSummary()
      refetchLiveMetrics()
      setLastUpdate(new Date())
    }, refreshInterval * 1000)

    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval, refetchServerMetrics, refetchSummary, refetchLiveMetrics])

  // WebSocket connection for real-time updates
  useEffect(() => {
    // Connect to monitoring WebSocket
    const ws = wsClient.connect('/ws/monitoring/', (message: WebSocketMessage) => {
      if (message.type === 'metrics_update') {
        // Refresh data when we receive metrics updates
        refetchServerMetrics()
        refetchSummary()
        refetchLiveMetrics()
        setLastUpdate(new Date())
      } else if (message.type === 'container_update') {
        // Refresh live metrics when containers change
        refetchLiveMetrics()
        setLastUpdate(new Date())
      }
    })

    // Track connection status
    const checkConnection = () => {
      setWsConnected(ws.readyState === WebSocket.OPEN)
    }
    
    ws.addEventListener('open', checkConnection)
    ws.addEventListener('close', checkConnection)
    ws.addEventListener('error', checkConnection)

    return () => {
      wsClient.disconnect('/ws/monitoring/')
    }
  }, [refetchServerMetrics, refetchSummary, refetchLiveMetrics])

  const handleRefresh = () => {
    refetchServerMetrics()
    refetchSummary()
    refetchLiveMetrics()
    setLastUpdate(new Date())
  }

  const isLoading = serverLoading || summaryLoading || liveLoading

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen">
      {/* Brain Animation Background */}
      <BrainAnimation />
      
      {/* Content with backdrop blur for better readability */}
      <div className="relative z-10 backdrop-blur-sm bg-gray-900/95 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold text-white">Server Monitoring</h2>
          <div className="flex items-center space-x-4 mt-2">
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              {wsConnected ? (
                <>
                  <Wifi className="h-4 w-4 text-green-400" />
                  <span>Live Updates</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-4 w-4 text-gray-500" />
                  <span>Polling Mode</span>
                </>
              )}
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <Clock className="h-4 w-4" />
              <span>Last updated: {lastUpdate.toLocaleTimeString()}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-400">Auto-refresh:</label>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded border-gray-600 text-blue-600 focus:ring-blue-500 bg-gray-700"
            />
          </div>
          {autoRefresh && (
            <select
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(Number(e.target.value))}
              className="px-2 py-1 text-sm border border-gray-600 rounded bg-gray-700 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={5}>5s</option>
              <option value={10}>10s</option>
              <option value={30}>30s</option>
              <option value={60}>1m</option>
            </select>
          )}
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(Number(e.target.value))}
            className="px-3 py-2 border border-gray-600 rounded-lg bg-gray-700 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value={1}>Last Hour</option>
            <option value={6}>Last 6 Hours</option>
            <option value={24}>Last 24 Hours</option>
          </select>
          <button
            onClick={handleRefresh}
            className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
          <button
            onClick={handleCollectMetrics}
            disabled={
              collectServerMetrics.isPending || collectDockerMetrics.isPending
            }
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors disabled:opacity-50"
          >
            <Activity
              className={`h-4 w-4 ${
                collectServerMetrics.isPending || collectDockerMetrics.isPending
                  ? 'animate-pulse'
                  : ''
              }`}
            />
            <span>Collect Metrics</span>
          </button>
        </div>
      </div>

      {/* Current Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gray-700 rounded-lg shadow-lg border border-gray-600 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">CPU Usage</p>
              <p className="text-2xl font-bold text-white">
                {summary?.current_cpu.toFixed(1)}%
              </p>
            </div>
            <div className="p-3 bg-blue-600 rounded-lg">
              <Cpu className="h-6 w-6 text-blue-100" />
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-gray-600 rounded-full h-2">
              <div
                className="bg-blue-400 h-2 rounded-full"
                style={{ width: `${summary?.current_cpu || 0}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="bg-gray-700 rounded-lg shadow-lg border border-gray-600 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Memory Usage</p>
              <p className="text-2xl font-bold text-white">
                {summary?.current_memory.toFixed(1)}%
              </p>
            </div>
            <div className="p-3 bg-green-600 rounded-lg">
              <MemoryStick className="h-6 w-6 text-green-100" />
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-gray-600 rounded-full h-2">
              <div
                className="bg-green-400 h-2 rounded-full"
                style={{ width: `${summary?.current_memory || 0}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="bg-gray-700 rounded-lg shadow-lg border border-gray-600 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Disk Usage</p>
              <p className="text-2xl font-bold text-white">
                {summary?.current_disk.toFixed(1)}%
              </p>
            </div>
            <div className="p-3 bg-yellow-600 rounded-lg">
              <HardDrive className="h-6 w-6 text-yellow-100" />
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-gray-600 rounded-full h-2">
              <div
                className="bg-yellow-400 h-2 rounded-full"
                style={{ width: `${summary?.current_disk || 0}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="bg-gray-700 rounded-lg shadow-lg border border-gray-600 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Load Average</p>
              <p className="text-2xl font-bold text-white">
                {summary?.current_load.toFixed(2)}
              </p>
            </div>
            <div className="p-3 bg-purple-600 rounded-lg">
              <Activity className="h-6 w-6 text-purple-100" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-xs text-gray-400">1-minute average</p>
          </div>
        </div>
      </div>

      {/* Docker Containers Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gray-700 rounded-lg shadow-lg border border-gray-600 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">
                Total Containers
              </p>
              <p className="text-2xl font-bold text-white">
                {summary?.total_containers || 0}
              </p>
            </div>
            <div className="p-3 bg-gray-600 rounded-lg">
              <Container className="h-6 w-6 text-gray-200" />
            </div>
          </div>
        </div>

        <div className="bg-gray-700 rounded-lg shadow-lg border border-gray-600 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">
                Running Containers
              </p>
              <p className="text-2xl font-bold text-white">
                {summary?.running_containers || 0}
              </p>
            </div>
            <div className="p-3 bg-green-600 rounded-lg">
              <Server className="h-6 w-6 text-green-100" />
            </div>
          </div>
        </div>

        <div className="bg-gray-700 rounded-lg shadow-lg border border-gray-600 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">
                Healthy Containers
              </p>
              <p className="text-2xl font-bold text-white">
                {summary?.healthy_containers || 0}
              </p>
            </div>
            <div className="p-3 bg-green-600 rounded-lg">
              <Server className="h-6 w-6 text-green-100" />
            </div>
          </div>
        </div>

        <div className="bg-gray-700 rounded-lg shadow-lg border border-gray-600 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">
                Containers with Ports
              </p>
              <p className="text-2xl font-bold text-white">
                {summary?.containers_with_ports || 0}
              </p>
            </div>
            <div className="p-3 bg-blue-600 rounded-lg">
              <Network className="h-6 w-6 text-blue-100" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-gray-700 rounded-lg shadow-lg border border-gray-600 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            CPU Usage Over Time
          </h3>
          {serverMetrics && serverMetrics.length > 0 ? (
            <MetricsChart
              data={serverMetrics}
              type="cpu"
              title=""
              height={300}
            />
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-400">
              <div className="text-center">
                <Cpu className="h-12 w-12 mx-auto mb-2 text-gray-500" />
                <p>No CPU data available</p>
              </div>
            </div>
          )}
        </div>

        <div className="bg-gray-700 rounded-lg shadow-lg border border-gray-600 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Memory Usage Over Time
          </h3>
          {serverMetrics && serverMetrics.length > 0 ? (
            <MetricsChart
              data={serverMetrics}
              type="memory"
              title=""
              height={300}
            />
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-400">
              <div className="text-center">
                <MemoryStick className="h-12 w-12 mx-auto mb-2 text-gray-500" />
                <p>No memory data available</p>
              </div>
            </div>
          )}
        </div>

        <div className="bg-gray-700 rounded-lg shadow-lg border border-gray-600 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Disk Usage Over Time
          </h3>
          {serverMetrics && serverMetrics.length > 0 ? (
            <MetricsChart
              data={serverMetrics}
              type="disk"
              title=""
              height={300}
            />
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-400">
              <div className="text-center">
                <HardDrive className="h-12 w-12 mx-auto mb-2 text-gray-500" />
                <p>No disk data available</p>
              </div>
            </div>
          )}
        </div>

        <div className="bg-gray-700 rounded-lg shadow-lg border border-gray-600 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Network Activity
          </h3>
          {serverMetrics && serverMetrics.length > 0 ? (
            <MetricsChart
              data={serverMetrics}
              type="network"
              title=""
              height={300}
            />
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-400">
              <div className="text-center">
                <Network className="h-12 w-12 mx-auto mb-2 text-gray-500" />
                <p>No network data available</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Docker Container Metrics */}
      {liveMetrics?.containers && liveMetrics.containers.length > 0 && (
        <div className="bg-gray-700 rounded-lg shadow-lg border border-gray-600 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Docker Container Metrics
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {liveMetrics.containers.map((container: any) => (
              <div key={container.id} className="border border-gray-600 rounded-lg p-4 bg-gray-600">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-white">
                    {container.name}
                  </h4>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      container.status === 'running'
                        ? 'bg-green-600 text-green-100'
                        : 'bg-red-600 text-red-100'
                    }`}
                  >
                    {container.status}
                  </span>
                </div>
                <div className="text-sm text-gray-400">
                  <p>Image: {container.image}</p>
                  <p>ID: {container.id.substring(0, 12)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Data State */}
      {(!serverMetrics || serverMetrics.length === 0) && (
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">
            No Metrics Data
          </h3>
          <p className="text-gray-400 mb-4">
            No server metrics have been collected yet. Click "Collect Metrics"
            to start monitoring.
          </p>
          <button onClick={handleCollectMetrics} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
            Collect Initial Metrics
          </button>
        </div>
      )}
      </div>
    </div>
  )
}

export default Monitoring
