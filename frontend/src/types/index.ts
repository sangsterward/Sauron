export interface Service {
  id: number;
  name: string;
  description: string;
  service_type: 'docker' | 'http' | 'tcp' | 'custom';
  status: 'healthy' | 'unhealthy' | 'unknown' | 'maintenance';
  container_name?: string;
  image_name?: string;
  endpoint_url?: string;
  port?: number;
  check_interval: number;
  tags: string[];
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  last_checked?: string;
  created_by: number;
  is_healthy: boolean;
  docker_info?: {
    container_name: string;
    image_name: string;
  };
}

export interface HealthCheck {
  id: number;
  service: number;
  service_name: string;
  name: string;
  check_type: 'http' | 'tcp' | 'docker' | 'custom';
  config: Record<string, any>;
  enabled: boolean;
  interval: number;
  timeout: number;
  last_result?: Record<string, any>;
  last_success?: string;
  last_failure?: string;
  consecutive_failures: number;
  created_at: string;
  updated_at: string;
  is_healthy: boolean;
}

export interface Event {
  id: number;
  service: number;
  service_name: string;
  event_type: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  message: string;
  metadata: Record<string, any>;
  timestamp: string;
}

export interface Alert {
  id: number;
  alert_rule: number;
  alert_rule_name: string;
  service: number;
  service_name: string;
  status: 'triggered' | 'acknowledged' | 'resolved' | 'suppressed';
  title: string;
  message: string;
  metadata: Record<string, any>;
  triggered_at: string;
  acknowledged_at?: string;
  resolved_at?: string;
  acknowledged_by?: number;
}

export interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

export interface ServiceStats {
  total_services: number;
  healthy_services: number;
  unhealthy_services: number;
  service_types: Record<string, number>;
}

export interface ServerMetrics {
  id: number;
  timestamp: string;
  cpu_percent: number;
  memory_percent: number;
  memory_used_mb: number;
  memory_total_mb: number;
  disk_percent: number;
  disk_used_gb: number;
  disk_total_gb: number;
  network_rx_mb: number;
  network_tx_mb: number;
  load_average_1m: number;
  load_average_5m: number;
  load_average_15m: number;
}

export interface DockerMetrics {
  id: number;
  container_id: string;
  container_name: string;
  timestamp: string;
  cpu_percent: number;
  memory_usage_mb: number;
  memory_limit_mb: number;
  network_rx_mb: number;
  network_tx_mb: number;
  block_read_mb: number;
  block_write_mb: number;
}

export interface MetricsSummary {
  current_cpu: number;
  current_memory: number;
  current_disk: number;
  current_load: number;
  total_containers: number;
  running_containers: number;
  healthy_containers: number;
  containers_with_ports: number;
  total_memory_usage: number;
  total_cpu_usage: number;
}

export interface Container {
  id: string;
  name: string;
  image: string;
  status: string;
  ports?: string[];
}

export interface LiveMetrics {
  server: Partial<ServerMetrics>;
  docker: DockerMetrics[];
  containers: Container[];
  timestamp: string;
}
