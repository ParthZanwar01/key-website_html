import React, { useContext, useState, useEffect, createContext, useCallback } from 'react';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const EventsContext = createContext();

// Google Sheets API endpoint for events
const EVENTS_API_ENDPOINT = 'https://api.sheetbest.com/sheets/25c69fca-a42a-4e8e-a5a7-0e0a7622f7f0/events';

export function useEvents() {
  return useContext(EventsContext);
}

export function EventsProvider({ children }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Load events from Google Sheets
  const loadEventsFromCloud = useCallback(async () => {
    try {
      console.log('Loading events from Google Sheets...');
      const response = await axios.get(EVENTS_API_ENDPOINT);
      const cloudEvents = response.data || [];
      
      // Parse attendees JSON strings back to arrays
      const parsedEvents = cloudEvents.map(event => ({
        ...event,
        attendees: event.attendees ? JSON.parse(event.attendees) : []
      }));
      
      setEvents(parsedEvents);
      
      // Also save to local storage as backup
      await AsyncStorage.setItem('events', JSON.stringify(parsedEvents));
      
      console.log(`Loaded ${parsedEvents.length} events from cloud`);
      return parsedEvents;
    } catch (error) {
      console.error('Failed to load events from cloud:', error);
      // Fallback to local storage if cloud fails
      try {
        const localEvents = await AsyncStorage.getItem('events');
        if (localEvents) {
          const parsed = JSON.parse(localEvents);
          setEvents(parsed);
          return parsed;
        }
      } catch (localError) {
        console.error('Failed to load local events:', localError);
      }
      return [];
    }
  }, []);

  // Add event to Google Sheets
  const addEvent = useCallback(async (newEvent) => {
    try {
      console.log('Adding event to Google Sheets:', newEvent.title);
      
      const eventData = {
        id: newEvent.id,
        title: newEvent.title,
        description: newEvent.description,
        location: newEvent.location,
        date: newEvent.date,
        startTime: newEvent.startTime,
        endTime: newEvent.endTime,
        capacity: newEvent.capacity,
        color: newEvent.color,
        attendees: JSON.stringify(newEvent.attendees || []),
        createdBy: newEvent.createdBy || 'Admin',
        createdAt: newEvent.createdAt,
        lastUpdated: new Date().toISOString()
      };
      
      await axios.post(EVENTS_API_ENDPOINT, eventData);
      console.log('Event added to Google Sheets successfully');
      
      // Refresh events from cloud
      await loadEventsFromCloud();
      
    } catch (error) {
      console.error('Failed to add event to Google Sheets:', error);
      throw error;
    }
  }, [loadEventsFromCloud]);

  // Update event in Google Sheets
  const updateEvent = useCallback(async (updatedEvent) => {
    try {
      console.log('Updating event in Google Sheets:', updatedEvent.title);
      
      // Find the event index in Google Sheets
      const currentEvents = await loadEventsFromCloud();
      const eventIndex = currentEvents.findIndex(e => e.id === updatedEvent.id);
      
      if (eventIndex === -1) {
        throw new Error('Event not found');
      }
      
      const eventData = {
        id: updatedEvent.id,
        title: updatedEvent.title,
        description: updatedEvent.description,
        location: updatedEvent.location,
        date: updatedEvent.date,
        startTime: updatedEvent.startTime,
        endTime: updatedEvent.endTime,
        capacity: updatedEvent.capacity,
        color: updatedEvent.color,
        attendees: JSON.stringify(updatedEvent.attendees || []),
        createdBy: updatedEvent.createdBy,
        createdAt: updatedEvent.createdAt,
        lastUpdated: new Date().toISOString()
      };
      
      await axios.patch(`${EVENTS_API_ENDPOINT}/${eventIndex}`, eventData);
      console.log('Event updated in Google Sheets successfully');
      
      // Refresh events from cloud
      await loadEventsFromCloud();
      
    } catch (error) {
      console.error('Failed to update event in Google Sheets:', error);
      throw error;
    }
  }, [loadEventsFromCloud]);

  // Delete event from Google Sheets
  const deleteEvent = useCallback(async (eventId) => {
    try {
      console.log('Deleting event from Google Sheets:', eventId);
      
      // Find the event index in Google Sheets
      const currentEvents = await loadEventsFromCloud();
      const eventIndex = currentEvents.findIndex(e => e.id === eventId);
      
      if (eventIndex === -1) {
        console.log('Event not found for deletion');
        return false;
      }
      
      await axios.delete(`${EVENTS_API_ENDPOINT}/${eventIndex}`);
      console.log('Event deleted from Google Sheets successfully');
      
      // Refresh events from cloud
      await loadEventsFromCloud();
      
      return true;
    } catch (error) {
      console.error('Failed to delete event from Google Sheets:', error);
      throw error;
    }
  }, [loadEventsFromCloud]);

  // Sign up for event
  const signupForEvent = useCallback(async (eventId, attendee) => {
    try {
      const event = events.find(e => e.id === eventId);
      if (!event) {
        throw new Error('Event not found');
      }
      
      // Check if already registered
      const alreadyRegistered = event.attendees.some(a => a.email === attendee.email);
      if (alreadyRegistered) {
        return; // Already registered
      }
      
      // Add attendee and update event
      const updatedEvent = {
        ...event,
        attendees: [...event.attendees, attendee]
      };
      
      await updateEvent(updatedEvent);
      
    } catch (error) {
      console.error('Failed to signup for event:', error);
      throw error;
    }
  }, [events, updateEvent]);

  // Get event by ID
  const getEventById = useCallback((id) => {
    return events.find(event => event.id === id);
  }, [events]);

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

  // Initial load
  useEffect(() => {
    loadEventsFromCloud().finally(() => {
      setLoading(false);
    });
  }, [loadEventsFromCloud]);

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
    refreshEvents: loadEventsFromCloud
  };

  return (
    <EventsContext.Provider value={contextValue}>
      {!loading && children}
    </EventsContext.Provider>
  );
}