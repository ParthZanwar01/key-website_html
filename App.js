import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { EventsProvider } from './contexts/EventsContext';
import { HourProvider } from './contexts/HourContext';
import AppNavigator from './navigation/AppNavigator';

function AuthenticatedApp() {
  const { isAuthenticated, isAdmin } = useAuth();
  
  useEffect(() => {
    console.log("Auth state in App:", { isAuthenticated, isAdmin });
  }, [isAuthenticated, isAdmin]);

  return (
    <>
      <StatusBar style="auto" />
      <AppNavigator />
    </>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <AuthProvider>
        <EventsProvider>
          <HourProvider>
            <AuthenticatedApp />
          </HourProvider>
        </EventsProvider>
      </AuthProvider>
    </NavigationContainer>
  );
}