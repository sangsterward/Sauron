import React, { useState, useEffect } from 'react'
import { apiClient } from '@/lib/api'
import { Play, Square, RotateCcw, RefreshCw, Terminal } from 'lucide-react'

interface DockerContainer {
  id: string
  name: string
  image: string
  status: string
  state: any
  labels: Record<string, string>
  ports: any
  created: string
}

const Docker: React.FC = () => {
  const [containers, setContainers] = useState<DockerContainer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchContainers = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get('/services/docker_containers/')
      setContainers(response.data.containers)
      setError(null)
    } catch (err) {
      setError('Failed to fetch Docker containers')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchContainers()
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'text-green-600 bg-green-50'
      case 'exited':
        return 'text-red-600 bg-red-50'
      case 'paused':
        return 'text-yellow-600 bg-yellow-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">{error}</p>
        <button onClick={fetchContainers} className="btn btn-primary">
          Retry
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold text-gray-900">Docker Containers</h2>
        <button
          onClick={fetchContainers}
          className="btn btn-secondary flex items-center space-x-2"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Refresh</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {containers.map((container) => (
          <div
            key={container.id}
            className="bg-white rounded-lg shadow-sm border p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-900">
                  {container.name}
                </h3>
                <p className="text-sm text-gray-500">{container.image}</p>
              </div>
              <div
                className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                  container.status
                )}`}
              >
                {container.status}
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <span className="font-medium">ID:</span>
                <span className="font-mono text-xs">
                  {container.id.substring(0, 12)}
                </span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <span className="font-medium">Created:</span>
                <span>{new Date(container.created).toLocaleDateString()}</span>
              </div>
              {Object.keys(container.ports).length > 0 && (
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <span className="font-medium">Ports:</span>
                  <span>{Object.keys(container.ports).join(', ')}</span>
                </div>
              )}
            </div>

            <div className="flex space-x-2">
              <button
                className="p-1 text-green-600 hover:text-green-700"
                title="Start Container"
              >
                <Play className="h-4 w-4" />
              </button>
              <button
                className="p-1 text-red-600 hover:text-red-700"
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
              <button
                className="p-1 text-gray-600 hover:text-gray-700"
                title="View Logs"
              >
                <Terminal className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {containers.length === 0 && (
        <div className="text-center py-12">
          <Terminal className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No containers found
          </h3>
          <p className="text-gray-600">
            No Docker containers are currently running
          </p>
        </div>
      )}
    </div>
  )
}

export default Docker
