import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import GoogleOAuthService from '../services/GoogleOAuthService';

const GoogleAuthButton = ({ onAuthSuccess, style }) => {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const checkAuthStatus = async () => {
    try {
      const authStatus = await GoogleOAuthService.getAuthStatus();
      setIsAuthenticated(authStatus.isAuthenticated);
      return authStatus.isAuthenticated;
    } catch (error) {
      console.error('Error checking auth status:', error);
      return false;
    }
  };

  const handleAuthenticate = async () => {
    try {
      setIsAuthenticating(true);
      console.log('🔐 Starting Google authentication...');
      
      // Create auth request
      const { request, redirectUri } = GoogleOAuthService.createAuthRequest();
      
      const discovery = {
        authorizationEndpoint: GoogleOAuthService.AUTH_ENDPOINT,
        tokenEndpoint: GoogleOAuthService.TOKEN_ENDPOINT,
        revocationEndpoint: GoogleOAuthService.REVOKE_ENDPOINT,
      };
      
      // Create the authorization URL
      const authUrl = await request.makeAuthUrlAsync(discovery);
      
      console.log('🔗 Opening OAuth URL:', authUrl);
      
      // Open OAuth in a new window/tab with specific features
      const authWindow = window.open(
        authUrl,
        'google-oauth',
        'width=500,height=600,scrollbars=yes,resizable=yes,menubar=no,toolbar=no,location=no,status=no'
      );
      
      // Check if popup was blocked
      if (!authWindow || authWindow.closed || typeof authWindow.closed === 'undefined') {
        setIsAuthenticating(false);
        Alert.alert(
          'Popup Blocked', 
          'Please allow popups for this site, or try clicking the button again.',
          [
            { text: 'OK' },
            { 
              text: 'Open in New Tab', 
              onPress: () => {
                // Fallback: open in new tab
                window.open(authUrl, '_blank');
                Alert.alert(
                  'Authentication Started',
                  'Please complete authentication in the new tab, then return here and click "Connect Google Drive" again.'
                );
              }
            }
          ]
        );
        return;
      }
      
      // Check for completion
      const checkWindow = setInterval(async () => {
        try {
          if (authWindow.closed) {
            clearInterval(checkWindow);
            setIsAuthenticating(false);
            
            // Handle the OAuth callback
            const callbackResult = await GoogleOAuthService.handleCallback();
            
            if (callbackResult.success) {
              setIsAuthenticated(true);
              Alert.alert('Success', 'Google Drive authentication successful!');
              if (onAuthSuccess) {
                onAuthSuccess(callbackResult);
              }
            } else {
              console.log('Authentication failed:', callbackResult.error);
            }
          }
        } catch (e) {
          // Window might be blocked
          clearInterval(checkWindow);
          setIsAuthenticating(false);
          Alert.alert('Error', 'Please allow popups for this site to authenticate with Google');
        }
      }, 1000);
      
      // Add timeout to prevent hanging
      setTimeout(() => {
        clearInterval(checkWindow);
        if (!authWindow.closed) {
          authWindow.close();
        }
        setIsAuthenticating(false);
        Alert.alert('Timeout', 'Authentication timed out. Please try again.');
      }, 300000); // 5 minutes timeout
      
    } catch (error) {
      console.error('❌ Authentication error:', error);
      setIsAuthenticating(false);
      Alert.alert('Error', 'Failed to start authentication process');
    }
  };

  // Check auth status on component mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  if (isAuthenticated) {
    return (
      <View style={[styles.container, style]}>
        <Text style={styles.authenticatedText}>✅ Connected to Google Drive</Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={checkAuthStatus}
        >
          <Text style={styles.refreshButtonText}>🔄 Refresh Status</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        style={[styles.button, isAuthenticating && styles.buttonDisabled]}
        onPress={handleAuthenticate}
        disabled={isAuthenticating}
      >
        <Text style={styles.buttonText}>
          {isAuthenticating ? 'Connecting...' : '🔐 Connect Google Drive'}
        </Text>
      </TouchableOpacity>
      <Text style={styles.helpText}>
        Connect your Google account to save photos to Google Drive
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#4285F4',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  authenticatedText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: 'bold',
  },
  helpText: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
  },
  refreshButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    marginTop: 8,
  },
  refreshButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default GoogleAuthButton; 