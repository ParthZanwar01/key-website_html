import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './contexts/AuthContext';
import { EventsProvider } from './contexts/EventsContext';
import AppNavigator from './navigation/AppNavigator';

export default function App() {
  return (
    <NavigationContainer>
      <AuthProvider>
        <EventsProvider>
          <StatusBar style="auto" />
          <AppNavigator />
        </EventsProvider>
      </AuthProvider>
    </NavigationContainer>
  );
}