import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import { ServerMetrics, DockerMetrics, MetricsSummary, LiveMetrics } from '@/types'

// Server Metrics
export const useServerMetrics = (hours: number = 1, autoRefresh: boolean = false) => {
  return useQuery({
    queryKey: ['server-metrics', hours],
    queryFn: async () => {
      const response = await apiClient.get(`/monitoring/server_metrics/?hours=${hours}`)
      return response.data as ServerMetrics[]
    },
    refetchInterval: autoRefresh ? 30000 : false, // Refetch every 30 seconds if autoRefresh enabled
  })
}

export const useCollectServerMetrics = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.post('/monitoring/server_metrics/')
      return response.data as ServerMetrics
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['server-metrics'] })
      queryClient.invalidateQueries({ queryKey: ['metrics-summary'] })
    },
  })
}

// Docker Metrics
export const useDockerMetrics = (containerId?: string, hours: number = 1) => {
  return useQuery({
    queryKey: ['docker-metrics', containerId, hours],
    queryFn: async () => {
      const url = containerId 
        ? `/monitoring/docker_metrics/?container_id=${containerId}&hours=${hours}`
        : `/monitoring/docker_metrics/?hours=${hours}`
      const response = await apiClient.get(url)
      return response.data as DockerMetrics[]
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  })
}

export const useCollectDockerMetrics = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.post('/monitoring/docker_metrics/')
      return response.data as DockerMetrics[]
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['docker-metrics'] })
      queryClient.invalidateQueries({ queryKey: ['metrics-summary'] })
    },
  })
}

// Metrics Summary
export const useMetricsSummary = (autoRefresh: boolean = false) => {
  return useQuery({
    queryKey: ['metrics-summary'],
    queryFn: async () => {
      const response = await apiClient.get('/monitoring/summary/')
      return response.data as MetricsSummary
    },
    refetchInterval: autoRefresh ? 10000 : false, // Refetch every 10 seconds if autoRefresh enabled
  })
}

// Live Metrics
export const useLiveMetrics = (autoRefresh: boolean = false) => {
  return useQuery({
    queryKey: ['live-metrics'],
    queryFn: async () => {
      const response = await apiClient.get('/monitoring/live/')
      return response.data as LiveMetrics
    },
    refetchInterval: autoRefresh ? 5000 : false, // Refetch every 5 seconds if autoRefresh enabled
  })
}
