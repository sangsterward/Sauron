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
    <aside className="w-64 bg-white shadow-sm">
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
                      ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
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
