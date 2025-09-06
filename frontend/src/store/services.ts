import { create } from 'zustand';
import { Service, ServiceStats } from '@/types';

interface ServicesState {
  services: Service[];
  stats: ServiceStats | null;
  loading: boolean;
  error: string | null;
  
  setServices: (services: Service[]) => void;
  updateService: (service: Service) => void;
  setStats: (stats: ServiceStats) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useServicesStore = create<ServicesState>((set) => ({
  services: [],
  stats: null,
  loading: false,
  error: null,
  
  setServices: (services) => set({ services }),
  updateService: (service) => set((state) => ({
    services: state.services.map(s => s.id === service.id ? service : s)
  })),
  setStats: (stats) => set({ stats }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}));
