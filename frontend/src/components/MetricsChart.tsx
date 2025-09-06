import React from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js'
import { Line, Doughnut } from 'react-chartjs-2'
import { ServerMetrics, DockerMetrics } from '@/types'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
)

interface MetricsChartProps {
  data: ServerMetrics[] | DockerMetrics[]
  type: 'cpu' | 'memory' | 'disk' | 'network'
  title: string
  height?: number
}

export const MetricsChart: React.FC<MetricsChartProps> = ({
  data,
  type,
  title,
  height = 200,
}) => {
  const getChartData = () => {
    if (data.length === 0) {
      return {
        labels: [],
        datasets: [],
      }
    }

    const labels = data.map((item) => {
      const date = new Date(item.timestamp)
      return date.toLocaleTimeString()
    })

    let datasets: any[] = []

    switch (type) {
      case 'cpu':
        datasets = [
          {
            label: 'CPU Usage %',
            data: data.map((item) => (item as ServerMetrics).cpu_percent),
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.1,
          },
        ]
        break
      case 'memory':
        datasets = [
          {
            label: 'Memory Usage %',
            data: data.map((item) => (item as ServerMetrics).memory_percent),
            borderColor: 'rgb(16, 185, 129)',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            tension: 0.1,
          },
        ]
        break
      case 'disk':
        datasets = [
          {
            label: 'Disk Usage %',
            data: data.map((item) => (item as ServerMetrics).disk_percent),
            borderColor: 'rgb(245, 158, 11)',
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            tension: 0.1,
          },
        ]
        break
      case 'network':
        datasets = [
          {
            label: 'Network RX (MB)',
            data: data.map((item) => (item as ServerMetrics).network_rx_mb),
            borderColor: 'rgb(139, 69, 19)',
            backgroundColor: 'rgba(139, 69, 19, 0.1)',
            tension: 0.1,
          },
          {
            label: 'Network TX (MB)',
            data: data.map((item) => (item as ServerMetrics).network_tx_mb),
            borderColor: 'rgb(75, 0, 130)',
            backgroundColor: 'rgba(75, 0, 130, 0.1)',
            tension: 0.1,
          },
        ]
        break
    }

    return {
      labels,
      datasets,
    }
  }

  const getMaxValue = () => {
    if (data.length === 0) return 100

    let maxValue = 0
    switch (type) {
      case 'cpu':
        maxValue = Math.max(...data.map((item) => (item as ServerMetrics).cpu_percent))
        break
      case 'memory':
        maxValue = Math.max(...data.map((item) => (item as ServerMetrics).memory_percent))
        break
      case 'disk':
        maxValue = Math.max(...data.map((item) => (item as ServerMetrics).disk_percent))
        break
      case 'network':
        const rxMax = Math.max(...data.map((item) => (item as ServerMetrics).network_rx_mb))
        const txMax = Math.max(...data.map((item) => (item as ServerMetrics).network_tx_mb))
        maxValue = Math.max(rxMax, txMax)
        break
    }

    // Add 10% padding above the max value for better visualization
    return Math.ceil(maxValue * 1.1)
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: title,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: getMaxValue(),
        ticks: {
          callback: function(value: any) {
            // Format ticks based on chart type
            if (type === 'cpu' || type === 'memory' || type === 'disk') {
              return value + '%'
            } else if (type === 'network') {
              return value + ' MB'
            }
            return value
          }
        }
      },
    },
  }

  return (
    <div style={{ height: `${height}px` }}>
      <Line data={getChartData()} options={options} />
    </div>
  )
}

interface UsageGaugeProps {
  value: number
  max: number
  label: string
  color?: string
  height?: number
}

export const UsageGauge: React.FC<UsageGaugeProps> = ({
  value,
  max,
  label,
  color = 'rgb(59, 130, 246)',
  height = 150,
}) => {
  const percentage = (value / max) * 100

  const data = {
    datasets: [
      {
        data: [percentage, 100 - percentage],
        backgroundColor: [color, 'rgba(229, 231, 235, 0.3)'],
        borderWidth: 0,
        cutout: '70%',
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
  }

  return (
    <div style={{ height: `${height}px` }} className="relative">
      <Doughnut data={data} options={options} />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold" style={{ color }}>
            {percentage.toFixed(1)}%
          </div>
          <div className="text-sm text-gray-600">{label}</div>
        </div>
      </div>
    </div>
  )
}
