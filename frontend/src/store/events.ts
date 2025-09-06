import { create } from 'zustand';
import { Event } from '@/types';

interface EventsState {
  events: Event[];
  loading: boolean;
  error: string | null;
  
  addEvent: (event: Event) => void;
  setEvents: (events: Event[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useEventsStore = create<EventsState>((set) => ({
  events: [],
  loading: false,
  error: null,
  
  addEvent: (event) => set((state) => ({
    events: [event, ...state.events].slice(0, 100) // Keep last 100 events
  })),
  setEvents: (events) => set({ events }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}));
