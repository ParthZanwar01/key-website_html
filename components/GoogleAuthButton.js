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
      
      // Store current page state
      localStorage.setItem('oauth_return_url', window.location.href);
      localStorage.setItem('oauth_start_time', Date.now().toString());
      
      // Use a simple redirect approach
      Alert.alert(
        'Google Authentication',
        'You will be redirected to Google to complete authentication. After completing authentication, you will be redirected back to this page.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => {
              setIsAuthenticating(false);
            }
          },
          {
            text: 'Continue',
            onPress: () => {
              // Redirect to Google OAuth
              window.location.href = authUrl;
            }
          }
        ]
      );
      
    } catch (error) {
      console.error('❌ Authentication error:', error);
      setIsAuthenticating(false);
      Alert.alert('Error', 'Failed to start authentication process');
    }
  };

  // Check auth status on component mount and handle OAuth callback
  useEffect(() => {
    const handleOAuthCallback = async () => {
      // Check if we're returning from OAuth
      const oauthCode = localStorage.getItem('oauth_code');
      const oauthStartTime = localStorage.getItem('oauth_start_time');
      
      if (oauthCode && oauthStartTime) {
        console.log('🔄 Handling OAuth callback...');
        
        // Clear the stored data immediately to prevent loops
        localStorage.removeItem('oauth_code');
        localStorage.removeItem('oauth_start_time');
        
        // Handle the callback
        const callbackResult = await GoogleOAuthService.handleCallback();
        
        if (callbackResult.success) {
          setIsAuthenticated(true);
          console.log('✅ OAuth callback successful');
          // Don't show alert here to avoid interrupting the flow
        } else {
          console.log('❌ Authentication failed:', callbackResult.error);
          Alert.alert('Authentication Failed', callbackResult.error || 'Failed to complete authentication');
        }
      } else {
        // Just check current auth status
        await checkAuthStatus();
      }
    };
    
    handleOAuthCallback();
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