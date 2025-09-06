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
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600',
    yellow: 'bg-yellow-50 text-yellow-600',
  }

  const Icon = iconMap[icon as keyof typeof iconMap] || Server

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center">
        <div className={`p-3 rounded-full ${colorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  )
}

export default StatsCard
