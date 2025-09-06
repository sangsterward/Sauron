import { useEffect, useRef } from 'react'
import { wsClient } from '@/lib/websocket'
import { WebSocketMessage } from '@/types'
import { useServicesStore } from '@/store/services'
import { useEventsStore } from '@/store/events'

export const useWebSocketIntegration = () => {
  const { updateService } = useServicesStore()
  const { addEvent } = useEventsStore()
  const connectedRef = useRef(false)

  useEffect(() => {
    if (connectedRef.current) return

    // Connect to services WebSocket
    wsClient.connect('/ws/services/', (message: WebSocketMessage) => {
      switch (message.type) {
        case 'service_update':
          updateService(message.service)
          break
        case 'status_change':
          console.log('Service status changed:', message)
          break
        case 'initial_data':
          // Handle initial data
          break
      }
    })

    // Connect to events WebSocket
    wsClient.connect('/ws/events/', (message: WebSocketMessage) => {
      switch (message.type) {
        case 'new_event':
          addEvent(message.event)
          break
      }
    })

    connectedRef.current = true

    return () => {
      wsClient.disconnect('/ws/services/')
      wsClient.disconnect('/ws/events/')
      connectedRef.current = false
    }
  }, [updateService, addEvent])
}
