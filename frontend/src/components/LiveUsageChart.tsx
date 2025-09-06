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
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import { ServerMetrics } from '@/types'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

interface LiveUsageChartProps {
  data: ServerMetrics[]
  height?: number
}

const LiveUsageChart: React.FC<LiveUsageChartProps> = ({ 
  data, 
  height = 300 
}) => {
  const getChartData = () => {
    if (data.length === 0) {
      return {
        labels: [],
        datasets: [],
      }
    }

    // Get the last 20 data points for live view
    const recentData = data.slice(-20)
    
    const labels = recentData.map((item) => {
      const date = new Date(item.timestamp)
      return date.toLocaleTimeString()
    })

    return {
      labels,
      datasets: [
        {
          label: 'CPU Usage %',
          data: recentData.map((item) => item.cpu_percent),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.1,
          fill: true,
        },
        {
          label: 'Memory Usage %',
          data: recentData.map((item) => item.memory_percent),
          borderColor: 'rgb(16, 185, 129)',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.1,
          fill: true,
        },
        {
          label: 'Disk Usage %',
          data: recentData.map((item) => item.disk_percent),
          borderColor: 'rgb(245, 158, 11)',
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          tension: 0.1,
          fill: true,
        },
      ],
    }
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
        text: 'Live System Usage',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          callback: function(value: any) {
            return value + '%'
          }
        }
      },
      x: {
        ticks: {
          maxTicksLimit: 10,
        }
      }
    },
    elements: {
      point: {
        radius: 2,
        hoverRadius: 4,
      },
    },
    animation: {
      duration: 0, // Disable animation for live updates
    },
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <div className="text-center">
          <div className="text-lg font-medium mb-2">No Data Available</div>
          <div className="text-sm">Collecting metrics...</div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ height: `${height}px` }}>
      <Line data={getChartData()} options={options} />
    </div>
  )
}

export default LiveUsageChart
