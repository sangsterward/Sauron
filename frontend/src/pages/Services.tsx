import React, { useState } from 'react'
import { useServices, useDiscoverServices } from '@/hooks/useServices'
import ServiceCard from '@/components/ServiceCard'
import ServiceDetails from '@/components/ServiceDetails'
import { Service } from '@/types'
import { Plus, RefreshCw, Search, Server } from 'lucide-react'

const Services: React.FC = () => {
  const { data: services, isLoading, error, refetch } = useServices()
  const discoverServices = useDiscoverServices()
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const filteredServices =
    services?.filter((service: Service) => {
      const matchesSearch =
        service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.description?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus =
        statusFilter === 'all' || service.status === statusFilter
      return matchesSearch && matchesStatus
    }) || []

  const handleDiscoverServices = () => {
    discoverServices.mutate(undefined, {
      onSuccess: () => {
        refetch()
      },
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Error loading services</p>
        <button onClick={() => refetch()} className="btn btn-primary mt-4">
          Retry
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold text-gray-900">Services</h2>
        <div className="flex space-x-3">
          <button
            onClick={handleDiscoverServices}
            disabled={discoverServices.isPending}
            className="btn btn-secondary flex items-center space-x-2"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                discoverServices.isPending ? 'animate-spin' : ''
              }`}
            />
            <span>Discover Services</span>
          </button>
          <button className="btn btn-primary flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Add Service</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <div className="flex items-center space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search services..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="healthy">Healthy</option>
            <option value="unhealthy">Unhealthy</option>
            <option value="unknown">Unknown</option>
            <option value="maintenance">Maintenance</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredServices.map((service: Service) => (
          <ServiceCard
            key={service.id}
            service={service}
            onViewDetails={setSelectedService}
          />
        ))}
      </div>

      {filteredServices.length === 0 && (
        <div className="text-center py-12">
          <Server className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No services found
          </h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || statusFilter !== 'all'
              ? 'Try adjusting your search or filter criteria'
              : 'Discover services from Docker containers or add new services manually'}
          </p>
          {!searchTerm && statusFilter === 'all' && (
            <button
              onClick={handleDiscoverServices}
              className="btn btn-primary"
            >
              Discover Services
            </button>
          )}
        </div>
      )}

      {selectedService && (
        <ServiceDetails
          service={selectedService}
          onClose={() => setSelectedService(null)}
        />
      )}
    </div>
  )
}

export default Services
