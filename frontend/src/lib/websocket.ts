import { WebSocketMessage } from '@/types';

const WS_BASE_URL = import.meta.env.VITE_WS_BASE || 'ws://localhost:8000';

export class WebSocketClient {
  private connections: Map<string, WebSocket> = new Map();
  private reconnectAttempts: Map<string, number> = new Map();
  private maxReconnectAttempts = 5;

  connect(endpoint: string, onMessage: (message: WebSocketMessage) => void): WebSocket {
    const url = `${WS_BASE_URL}${endpoint}`;
    
    if (this.connections.has(endpoint)) {
      return this.connections.get(endpoint)!;
    }

    const ws = new WebSocket(url);
    this.connections.set(endpoint, ws);

    ws.onopen = () => {
      console.log(`WebSocket connected: ${endpoint}`);
      this.reconnectAttempts.set(endpoint, 0);
    };

    ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        onMessage(message);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onclose = () => {
      console.log(`WebSocket disconnected: ${endpoint}`);
      this.connections.delete(endpoint);
      this.reconnect(endpoint, onMessage);
    };

    ws.onerror = (error) => {
      console.error(`WebSocket error for ${endpoint}:`, error);
    };

    return ws;
  }

  private reconnect(endpoint: string, onMessage: (message: WebSocketMessage) => void) {
    const attempts = this.reconnectAttempts.get(endpoint) || 0;
    
    if (attempts < this.maxReconnectAttempts) {
      setTimeout(() => {
        console.log(`Reconnecting WebSocket: ${endpoint} (attempt ${attempts + 1})`);
        this.reconnectAttempts.set(endpoint, attempts + 1);
        this.connect(endpoint, onMessage);
      }, Math.pow(2, attempts) * 1000); // Exponential backoff
    }
  }

  disconnect(endpoint: string) {
    const ws = this.connections.get(endpoint);
    if (ws) {
      ws.close();
      this.connections.delete(endpoint);
      this.reconnectAttempts.delete(endpoint);
    }
  }

  disconnectAll() {
    this.connections.forEach((ws) => {
      ws.close();
    });
    this.connections.clear();
    this.reconnectAttempts.clear();
  }
}

export const wsClient = new WebSocketClient();
