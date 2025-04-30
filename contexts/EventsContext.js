import React, { useContext, useState, useEffect, createContext, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Create the Events Context
const EventsContext = createContext();

// Custom hook to use the Events Context
export function useEvents() {
  return useContext(EventsContext);
}

// Events Provider Component
export function EventsProvider({ children }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Initial load of events
  useEffect(() => {
    async function loadInitialEvents() {
      try {
        const storedEvents = await AsyncStorage.getItem('events');
        if (storedEvents) {
          setEvents(JSON.parse(storedEvents));
        }
      } catch (error) {
        console.error('Failed to load events from storage', error);
      } finally {
        setLoading(false);
      }
    }
    
    loadInitialEvents();
  }, []);

  // Save events to AsyncStorage
  const saveEventsToStorage = useCallback(async (eventsToSave) => {
    try {
      await AsyncStorage.setItem('events', JSON.stringify(eventsToSave));
      console.log('Events saved to AsyncStorage:', eventsToSave.length);
      return true;
    } catch (error) {
      console.error('Failed to save events to storage', error);
      return false;
    }
  }, []);

  // Add a new event
  const addEvent = useCallback(async (newEvent) => {
    // Ensure default values
    const eventWithDefaults = {
      ...newEvent,
      attendees: newEvent.attendees || [],
      createdAt: newEvent.createdAt || new Date().toISOString()
    };
    
    // Update state first
    const updatedEvents = [...events, eventWithDefaults];
    setEvents(updatedEvents);
    
    // Then save to storage
    await saveEventsToStorage(updatedEvents);
  }, [events, saveEventsToStorage]);

  // Get event by ID
  const getEventById = useCallback((id) => {
    return events.find(event => event.id === id);
  }, [events]);

  // Update an existing event
  const updateEvent = useCallback(async (updatedEvent) => {
    // Update in memory first
    const updatedEvents = events.map(event =>
      event.id === updatedEvent.id 
        ? { 
            ...updatedEvent,
            createdAt: event.createdAt || updatedEvent.createdAt || new Date().toISOString(),
            createdBy: event.createdBy || updatedEvent.createdBy,
            lastUpdated: new Date().toISOString()
          } 
        : event
    );
    
    // Update state
    setEvents(updatedEvents);
    
    // Save to storage
    await saveEventsToStorage(updatedEvents);
  }, [events, saveEventsToStorage]);

  // Delete an event
  const deleteEvent = useCallback(async (id) => {
    console.log('deleteEvent called with id:', id);
    
    try {
      // Filter out the event to delete
      const filteredEvents = events.filter(event => String(event.id) !== String(id));
      
      // Update state
      setEvents(filteredEvents);
      
      // Save to storage
      await saveEventsToStorage(filteredEvents);
      
      return true;
    } catch (error) {
      console.error('Error in deleteEvent function:', error);
      return false;
    }
  }, [events, saveEventsToStorage]);

  // Sign up for an event
  const signupForEvent = useCallback(async (eventId, attendee) => {
    const updatedEvents = events.map(event => {
      if (event.id === eventId) {
        // Check if already registered
        const alreadyRegistered = event.attendees.some(
          existing => existing.email === attendee.email
        );
        
        if (alreadyRegistered) {
          return event;
        }
        
        return {
          ...event,
          attendees: [...event.attendees, attendee]
        };
      }
      return event;
    });
    
    // Update state
    setEvents(updatedEvents);
    
    // Save to storage
    await saveEventsToStorage(updatedEvents);
  }, [events, saveEventsToStorage]);

  // Remove an attendee
  const removeAttendee = useCallback(async (eventId, attendeeEmail) => {
    const updatedEvents = events.map(event => {
      if (event.id === eventId) {
        return {
          ...event,
          attendees: event.attendees.filter(
            attendee => attendee.email !== attendeeEmail
          )
        };
      }
      return event;
    });
    
    // Update state
    setEvents(updatedEvents);
    
    // Save to storage
    await saveEventsToStorage(updatedEvents);
  }, [events, saveEventsToStorage]);

  // Get upcoming events
  const getUpcomingEvents = useCallback(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return events
      .filter(event => new Date(event.date) >= today)
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [events]);

  // Get past events
  const getPastEvents = useCallback(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return events
      .filter(event => new Date(event.date) < today)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [events]);

  // Get event attendees
  const getEventAttendees = useCallback((eventId) => {
    const event = getEventById(eventId);
    return event ? event.attendees : [];
  }, [getEventById]);

  // Refresh events from storage
  const refreshEvents = useCallback(async () => {
    try {
      setLoading(true);
      const storedEvents = await AsyncStorage.getItem('events');
      
      if (storedEvents) {
        setEvents(JSON.parse(storedEvents));
      }
      
      setLoading(false);
      return true;
    } catch (error) {
      console.error('Failed to refresh events from storage', error);
      setLoading(false);
      return false;
    }
  }, []);

  // Direct deletion (for web platform or emergency fixes)
  const deleteEventDirectly = useCallback(async (eventId) => {
    try {
      const storedEvents = await AsyncStorage.getItem('events');
      
      if (storedEvents) {
        const events = JSON.parse(storedEvents);
        const updatedEvents = events.filter(event => String(event.id) !== String(eventId));
        await AsyncStorage.setItem('events', JSON.stringify(updatedEvents));
        
        // Make sure to update our state too
        setEvents(updatedEvents);
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error in direct event deletion:', error);
      return false;
    }
  }, []);

  // Provide value
  const contextValue = {
    events,
    addEvent,
    getEventById,
    updateEvent,
    deleteEvent,
    signupForEvent,
    removeAttendee,
    getUpcomingEvents,
    getPastEvents,
    getEventAttendees,
    refreshEvents,
    deleteEventDirectly
  };

  return (
    <EventsContext.Provider value={contextValue}>
      {!loading && children}
    </EventsContext.Provider>
  );
}