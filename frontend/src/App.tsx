import React, { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useWebSocketIntegration } from '@/hooks/useWebSocket'
import { useAuth } from '@/hooks/useAuth'
import Layout from '@/components/Layout'
import Dashboard from '@/pages/Dashboard'
import Services from '@/pages/Services'
import Monitoring from '@/pages/Monitoring'
import Alerts from '@/pages/Alerts'
import Docker from '@/pages/Docker'
import Settings from '@/pages/Settings'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
})

const AppContent: React.FC = () => {
  const { checkAuth } = useAuth()
  useWebSocketIntegration()

  useEffect(() => {
    // Check if user is already authenticated on app load
    checkAuth()
  }, [checkAuth])

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="services" element={<Services />} />
          <Route path="monitoring" element={<Monitoring />} />
          <Route path="alerts" element={<Alerts />} />
          <Route path="docker" element={<Docker />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </Router>
  )
}

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  )
}

export default App
