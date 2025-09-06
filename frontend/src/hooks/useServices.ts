import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';

export const useServices = () => {
  return useQuery({
    queryKey: ['services'],
    queryFn: async () => {
      const response = await apiClient.get('/services/');
      return response.data.results || response.data;
    },
  });
};

export const useServiceStats = () => {
  return useQuery({
    queryKey: ['service-stats'],
    queryFn: async () => {
      const response = await apiClient.get('/services/stats/');
      return response.data;
    },
  });
};

export const useDiscoverServices = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.post('/services/discover_services/');
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      queryClient.invalidateQueries({ queryKey: ['service-stats'] });
    },
  });
};

export const useServiceActions = () => {
  const queryClient = useQueryClient();
  
  const startContainer = useMutation({
    mutationFn: async (serviceId: number) => {
      const response = await apiClient.post(`/services/${serviceId}/start_container/`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
    },
  });

  const stopContainer = useMutation({
    mutationFn: async (serviceId: number) => {
      const response = await apiClient.post(`/services/${serviceId}/stop_container/`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
    },
  });

  return { startContainer, stopContainer };
};
