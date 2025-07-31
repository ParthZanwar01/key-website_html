import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Platform, StyleSheet } from 'react-native';
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
  // Add web-specific styles to override body overflow
  useEffect(() => {
    if (Platform.OS === 'web') {
      // Override the default Expo web styles that disable body scrolling
      const style = document.createElement('style');
      style.textContent = `
        body {
          overflow: auto !important;
        }
        html {
          overflow: auto !important;
        }
        #root {
          overflow: auto !important;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <AuthProvider>
          <EventsProvider>
            <HourProvider>
              <AuthenticatedApp />
            </HourProvider>
          </EventsProvider>
        </AuthProvider>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}