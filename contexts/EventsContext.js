import React, { useContext, useState, useEffect, createContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

  // Load events from AsyncStorage on component mount
  useEffect(() => {
    const loadEvents = async () => {
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
    };
    
    loadEvents();
  }, []);

  // Update AsyncStorage when events change
  useEffect(() => {
    const saveEvents = async () => {
      try {
        await AsyncStorage.setItem('events', JSON.stringify(events));
      } catch (error) {
        console.error('Failed to save events to storage', error);
      }
    };
    
    if (!loading) {
      saveEvents();
    }
  }, [events, loading]);

  // Add a new event
  function addEvent(newEvent) {
    setEvents(prevEvents => [...prevEvents, newEvent]);
  }

  // Get event by ID
  function getEventById(id) {
    return events.find(event => event.id === id);
  }

  // Update an existing event
  function updateEvent(updatedEvent) {
    setEvents(prevEvents =>
      prevEvents.map(event =>
        event.id === updatedEvent.id ? updatedEvent : event
      )
    );
  }

  // Delete an event
  function deleteEvent(id) {
    setEvents(prevEvents => prevEvents.filter(event => event.id !== id));
  }

  // Sign up for an event
  function signupForEvent(eventId, attendee) {
    setEvents(prevEvents =>
      prevEvents.map(event => {
        if (event.id === eventId) {
          return {
            ...event,
            attendees: [...event.attendees, attendee]
          };
        }
        return event;
      })
    );
  }

  const value = {
    events,
    addEvent,
    getEventById,
    updateEvent,
    deleteEvent,
    signupForEvent
  };

  return (
    <EventsContext.Provider value={value}>
      {!loading && children}
    </EventsContext.Provider>
  );
}