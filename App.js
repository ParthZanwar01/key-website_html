import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Platform, StyleSheet } from 'react-native';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { EventsProvider } from './contexts/EventsContext';
import { HourProvider } from './contexts/HourContext';
import AppNavigator from './navigation/AppNavigator';
import { preventFocusOnHidden } from './utils/AccessibilityHelper';
import { applyChromeOptimizations } from './utils/ChromeCompatibilityHelper';

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
  // Add web-specific styles to override body overflow and fix accessibility
  useEffect(() => {
    if (Platform.OS === 'web') {
      // Override the default Expo web styles that disable body scrolling
      const style = document.createElement('style');
      style.textContent = `
        body {
          overflow: auto !important;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
        html {
          overflow: auto !important;
        }
        #root {
          overflow: auto !important;
        }
        /* Fix ARIA accessibility issues */
        [aria-hidden="true"] {
          pointer-events: none !important;
        }
        [aria-hidden="true"] * {
          pointer-events: none !important;
        }
        /* Ensure focused elements are not hidden */
        [aria-hidden="true"]:focus,
        [aria-hidden="true"] *:focus {
          outline: none !important;
        }
        /* Prevent focus on hidden elements */
        [aria-hidden="true"] {
          tabindex: -1 !important;
        }
        /* Fix Chrome-specific rendering issues */
        * {
          -webkit-transform: translateZ(0);
          transform: translateZ(0);
        }
        /* Prevent layout shifts */
        .scroll-view {
          will-change: auto !important;
        }
        /* Fix for HP Envy Chrome compatibility */
        @media screen and (-webkit-min-device-pixel-ratio: 0) {
          * {
            -webkit-backface-visibility: hidden;
            backface-visibility: hidden;
          }
        }
      `;
      document.head.appendChild(style);
      
      // Apply focus management
      preventFocusOnHidden();
      
      // Apply Chrome-specific optimizations for HP Envy and similar devices
      applyChromeOptimizations();
      
      // Set up a mutation observer to handle dynamically added elements
      const observer = new MutationObserver(() => {
        preventFocusOnHidden();
        applyChromeOptimizations();
      });
      
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['aria-hidden', 'style']
      });
      
      return () => {
        observer.disconnect();
      };
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