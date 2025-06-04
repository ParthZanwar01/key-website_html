// contexts/EventsContext.js
import React, { useContext, useState, useEffect, createContext, useCallback } from 'react';
import SupabaseService from '../services/SupabaseService';

const EventsContext = createContext();

export function useEvents() {
  return useContext(EventsContext);
}

export function EventsProvider({ children }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const loadEvents = useCallback(async () => {
    try {
      console.log('Loading events from Supabase...');
      const eventsData = await SupabaseService.getAllEvents();
      setEvents(eventsData);
      console.log(`Loaded ${eventsData.length} events`);
    } catch (error) {
      console.error('Failed to load events:', error);
    }
  }, []);

  const addEvent = useCallback(async (newEvent) => {
    try {
      await SupabaseService.createEvent(newEvent);
      await loadEvents(); // Refresh events
    } catch (error) {
      console.error('Failed to add event:', error);
      throw error;
    }
  }, [loadEvents]);

  const updateEvent = useCallback(async (updatedEvent) => {
    try {
      await SupabaseService.updateEvent(updatedEvent.id, updatedEvent);
      await loadEvents(); // Refresh events
    } catch (error) {
      console.error('Failed to update event:', error);
      throw error;
    }
  }, [loadEvents]);

  const deleteEvent = useCallback(async (eventId) => {
    try {
      await SupabaseService.deleteEvent(eventId);
      await loadEvents(); // Refresh events
      return true;
    } catch (error) {
      console.error('Failed to delete event:', error);
      throw error;
    }
  }, [loadEvents]);

  const signupForEvent = useCallback(async (eventId, attendee) => {
    try {
      await SupabaseService.signupForEvent(eventId, attendee);
      await loadEvents(); // Refresh events
    } catch (error) {
      console.error('Failed to signup for event:', error);
      throw error;
    }
  }, [loadEvents]);

  const getEventById = useCallback((id) => {
    return events.find(event => event.id === id);
  }, [events]);

  const getUpcomingEvents = useCallback(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return events
      .filter(event => new Date(event.date) >= today)
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [events]);

  const getPastEvents = useCallback(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return events
      .filter(event => new Date(event.date) < today)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [events]);

  useEffect(() => {
    loadEvents().finally(() => {
      setLoading(false);
    });
  }, [loadEvents]);

  const contextValue = {
    events,
    loading,
    addEvent,
    updateEvent,
    deleteEvent,
    signupForEvent,
    getEventById,
    getUpcomingEvents,
    getPastEvents,
    refreshEvents: loadEvents
  };

  return (
    <EventsContext.Provider value={contextValue}>
      {!loading && children}
    </EventsContext.Provider>
  );
}