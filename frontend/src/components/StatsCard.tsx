import React from 'react'
import {
  Server,
  CheckCircle,
  XCircle,
  Layers,
  Activity,
  AlertTriangle,
} from 'lucide-react'

interface StatsCardProps {
  title: string
  value: number
  icon: string
  color: 'blue' | 'green' | 'red' | 'purple' | 'yellow'
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon, color }) => {
  const iconMap = {
    server: Server,
    'check-circle': CheckCircle,
    'x-circle': XCircle,
    layers: Layers,
    activity: Activity,
    'alert-triangle': AlertTriangle,
  }

  const colorClasses = {
    blue: 'bg-blue-600 text-blue-100',
    green: 'bg-green-600 text-green-100',
    red: 'bg-red-600 text-red-100',
    purple: 'bg-purple-600 text-purple-100',
    yellow: 'bg-yellow-600 text-yellow-100',
  }

  const Icon = iconMap[icon as keyof typeof iconMap] || Server

  return (
    <div className="bg-gray-700 rounded-lg shadow-lg border border-gray-600 p-6 hover:bg-gray-600 transition-colors">
      <div className="flex items-center">
        <div className={`p-3 rounded-full ${colorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-400">{title}</p>
          <p className="text-2xl font-semibold text-white">{value}</p>
        </div>
      </div>
    </div>
  )
}

export default StatsCard
