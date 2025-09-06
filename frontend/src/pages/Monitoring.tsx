import React, { useState } from 'react'
import {
  useServerMetrics,
  useMetricsSummary,
  useLiveMetrics,
  useCollectServerMetrics,
  useCollectDockerMetrics,
} from '@/hooks/useMetrics'
import { MetricsChart } from '@/components/MetricsChart'
import {
  Cpu,
  HardDrive,
  MemoryStick,
  Network,
  RefreshCw,
  Activity,
  Server,
  Container,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react'

const Monitoring: React.FC = () => {
  const [timeRange, setTimeRange] = useState(1) // hours
  const { data: serverMetrics, isLoading: serverLoading } =
    useServerMetrics(timeRange)
  const { data: summary, isLoading: summaryLoading } = useMetricsSummary()
  const { data: liveMetrics, isLoading: liveLoading } = useLiveMetrics()

  const collectServerMetrics = useCollectServerMetrics()
  const collectDockerMetrics = useCollectDockerMetrics()

  const handleCollectMetrics = () => {
    collectServerMetrics.mutate()
    collectDockerMetrics.mutate()
  }

  const isLoading = serverLoading || summaryLoading || liveLoading

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold text-gray-900">Server Monitoring</h2>
        <div className="flex items-center space-x-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value={1}>Last Hour</option>
            <option value={6}>Last 6 Hours</option>
            <option value={24}>Last 24 Hours</option>
          </select>
          <button
            onClick={handleCollectMetrics}
            disabled={
              collectServerMetrics.isPending || collectDockerMetrics.isPending
            }
            className="btn btn-primary flex items-center space-x-2"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                collectServerMetrics.isPending || collectDockerMetrics.isPending
                  ? 'animate-spin'
                  : ''
              }`}
            />
            <span>Collect Metrics</span>
          </button>
        </div>
      </div>

      {/* Current Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">CPU Usage</p>
              <p className="text-2xl font-bold text-gray-900">
                {summary?.current_cpu.toFixed(1)}%
              </p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <Cpu className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{ width: `${summary?.current_cpu || 0}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Memory Usage</p>
              <p className="text-2xl font-bold text-gray-900">
                {summary?.current_memory.toFixed(1)}%
              </p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <MemoryStick className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full"
                style={{ width: `${summary?.current_memory || 0}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Disk Usage</p>
              <p className="text-2xl font-bold text-gray-900">
                {summary?.current_disk.toFixed(1)}%
              </p>
            </div>
            <div className="p-3 bg-yellow-50 rounded-lg">
              <HardDrive className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-yellow-600 h-2 rounded-full"
                style={{ width: `${summary?.current_disk || 0}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Load Average</p>
              <p className="text-2xl font-bold text-gray-900">
                {summary?.current_load.toFixed(2)}
              </p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <Activity className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-xs text-gray-500">1-minute average</p>
          </div>
        </div>
      </div>

      {/* Docker Containers Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Total Containers
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {summary?.total_containers || 0}
              </p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <Container className="h-6 w-6 text-gray-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Running Containers
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {summary?.running_containers || 0}
              </p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <Server className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Total CPU Usage
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {summary?.total_cpu_usage.toFixed(1)}%
              </p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
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
            <div className="flex items-center justify-center h-64 text-gray-500">
              <div className="text-center">
                <Cpu className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                <p>No CPU data available</p>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
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
            <div className="flex items-center justify-center h-64 text-gray-500">
              <div className="text-center">
                <MemoryStick className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                <p>No memory data available</p>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
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
            <div className="flex items-center justify-center h-64 text-gray-500">
              <div className="text-center">
                <HardDrive className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                <p>No disk data available</p>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
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
            <div className="flex items-center justify-center h-64 text-gray-500">
              <div className="text-center">
                <Network className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                <p>No network data available</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Docker Container Metrics */}
      {liveMetrics?.containers && liveMetrics.containers.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Docker Container Metrics
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {liveMetrics.containers.map((container: any) => (
              <div key={container.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">
                    {container.name}
                  </h4>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      container.status === 'running'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {container.status}
                  </span>
                </div>
                <div className="text-sm text-gray-600">
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
          <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Metrics Data
          </h3>
          <p className="text-gray-600 mb-4">
            No server metrics have been collected yet. Click "Collect Metrics"
            to start monitoring.
          </p>
          <button onClick={handleCollectMetrics} className="btn btn-primary">
            Collect Initial Metrics
          </button>
        </div>
      )}
    </div>
  )
}

export default Monitoring
