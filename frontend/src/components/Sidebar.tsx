import React from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Server,
  Activity,
  AlertTriangle,
  Settings,
  Container,
} from 'lucide-react'

const Sidebar: React.FC = () => {
  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/services', label: 'Services', icon: Server },
    { path: '/monitoring', label: 'Monitoring', icon: Activity },
    { path: '/alerts', label: 'Alerts', icon: AlertTriangle },
    { path: '/docker', label: 'Docker', icon: Container },
    { path: '/settings', label: 'Settings', icon: Settings },
  ]

  return (
    <aside className="w-64 bg-gray-800 shadow-lg border-r border-gray-700">
      <nav className="p-4">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                data-cy={`nav-${item.label.toLowerCase()}`}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white border-r-2 border-blue-400'
                      : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                  }`
                }
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  )
}

export default Sidebar
